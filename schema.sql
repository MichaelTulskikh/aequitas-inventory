BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM ('warehouse', 'pallet', 'box');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_type') THEN
    CREATE TYPE partner_type AS ENUM ('donor', 'recipient', 'both');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_direction') THEN
    CREATE TYPE shipment_direction AS ENUM ('IN', 'OUT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
    CREATE TYPE shipment_status AS ENUM ('draft', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_txn_type') THEN
    CREATE TYPE inventory_txn_type AS ENUM ('RECEIVE','DISTRIBUTE','ADJUST','MOVE','CORRECTION');
  END IF;
END$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS item_type (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  code       TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type_id    UUID NOT NULL REFERENCES item_type(id),
  name            TEXT NOT NULL,
  default_unit    TEXT NOT NULL DEFAULT 'each',
  search_keywords TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_item_type_name UNIQUE (item_type_id, name)
);

CREATE INDEX IF NOT EXISTS idx_item_name ON item (name);
CREATE INDEX IF NOT EXISTS idx_item_type ON item (item_type_id);

DROP TRIGGER IF EXISTS trg_item_updated_at ON item;
CREATE TRIGGER trg_item_updated_at
BEFORE UPDATE ON item
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS location (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT NOT NULL,
  type               location_type NOT NULL,
  parent_location_id UUID REFERENCES location(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_location_parent_name UNIQUE (parent_location_id, name)
);

CREATE INDEX IF NOT EXISTS idx_location_type ON location (type);
CREATE INDEX IF NOT EXISTS idx_location_parent ON location (parent_location_id);

DROP TRIGGER IF EXISTS trg_location_updated_at ON location;
CREATE TRIGGER trg_location_updated_at
BEFORE UPDATE ON location
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_lot (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES item(id),
  location_id UUID NOT NULL REFERENCES location(id),
  quantity    NUMERIC NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'each',
  attributes  JSONB NOT NULL DEFAULT '{}'::jsonb,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_inventory_lot_quantity_nonneg CHECK (quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lot_item ON inventory_lot (item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_location ON inventory_lot (location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_attributes_gin ON inventory_lot USING GIN (attributes);

DROP TRIGGER IF EXISTS trg_inventory_lot_updated_at ON inventory_lot;
CREATE TRIGGER trg_inventory_lot_updated_at
BEFORE UPDATE ON inventory_lot
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_lot_image (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_lot_id UUID NOT NULL REFERENCES inventory_lot(id) ON DELETE CASCADE,
  s3_key           TEXT NOT NULL,
  caption          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_lot_image_lot ON inventory_lot_image (inventory_lot_id);

CREATE TABLE IF NOT EXISTS partner (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        partner_type NOT NULL,
  name        TEXT NOT NULL,
  external_id TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  notes       TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_type ON partner(type);
CREATE INDEX IF NOT EXISTS idx_partner_name ON partner(name);

DROP TRIGGER IF EXISTS trg_partner_updated_at ON partner;
CREATE TRIGGER trg_partner_updated_at
BEFORE UPDATE ON partner
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS shipment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  direction       shipment_direction NOT NULL,
  shipment_number TEXT NOT NULL UNIQUE,
  partner_id      UUID REFERENCES partner(id),
  status          shipment_status NOT NULL DEFAULT 'draft',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shipment_direction ON shipment(direction);
CREATE INDEX IF NOT EXISTS idx_shipment_partner ON shipment(partner_id);

CREATE TABLE IF NOT EXISTS shipment_line (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id         UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  item_id             UUID NOT NULL REFERENCES item(id),
  requested_quantity  NUMERIC,
  unit               TEXT NOT NULL DEFAULT 'each',
  attributes_hint     JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes              TEXT
);

CREATE INDEX IF NOT EXISTS idx_shipment_line_shipment ON shipment_line (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_line_item ON shipment_line (item_id);

CREATE TABLE IF NOT EXISTS inventory_txn (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_lot_id UUID NOT NULL REFERENCES inventory_lot(id),
  txn_type         inventory_txn_type NOT NULL,
  quantity_delta   NUMERIC NOT NULL,
  unit             TEXT NOT NULL DEFAULT 'each',
  shipment_id      UUID REFERENCES shipment(id),
  shipment_line_id UUID REFERENCES shipment_line(id),
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason           TEXT,
  snapshot         JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_inventory_txn_lot ON inventory_txn (inventory_lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_type ON inventory_txn (txn_type);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_shipment ON inventory_txn (shipment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_performed_at ON inventory_txn (performed_at);

CREATE OR REPLACE FUNCTION apply_inventory_txn(
  p_inventory_lot_id UUID,
  p_txn_type inventory_txn_type,
  p_quantity_delta NUMERIC,
  p_unit TEXT,
  p_shipment_id UUID DEFAULT NULL,
  p_shipment_line_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_snapshot JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_txn_id UUID;
  v_new_qty NUMERIC;
BEGIN
  SELECT quantity + p_quantity_delta
    INTO v_new_qty
  FROM inventory_lot
  WHERE id = p_inventory_lot_id
  FOR UPDATE;

  IF v_new_qty IS NULL THEN
    RAISE EXCEPTION 'inventory_lot % not found', p_inventory_lot_id;
  END IF;

  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'insufficient inventory in lot %, would become %', p_inventory_lot_id, v_new_qty;
  END IF;

  UPDATE inventory_lot
  SET quantity = v_new_qty,
      status = CASE WHEN v_new_qty = 0 THEN 'empty' ELSE status END
  WHERE id = p_inventory_lot_id;

  INSERT INTO inventory_txn (
    inventory_lot_id, txn_type, quantity_delta, unit,
    shipment_id, shipment_line_id,
    reason, snapshot
  ) VALUES (
    p_inventory_lot_id, p_txn_type, p_quantity_delta, COALESCE(p_unit, 'each'),
    p_shipment_id, p_shipment_line_id,
    p_reason, p_snapshot
  ) RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
