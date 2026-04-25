import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchInventoryItems,
  fetchInventoryItemAttributeDefinitions,
  fetchInventoryLocationsTree,
  fetchInboundShipmentLines,
  receiveInventory,
  type InboundShipmentLine,
  type ReceiveInventoryInput,
} from "../../api/inventory_v2";
import {
  fetchInboundShipments,
  type InboundShipment,
} from "../../api/inboundShipments_v2";
import styles from "./ReceiveInventoryPage.module.css";

type InventoryItemOption = {
  id: string;
  name: string;
  description?: string | null;
  default_unit: string;
  is_internal_only?: boolean;
  category?: {
    id: string;
    name: string;
    path: string[];
  } | null;
};

type ItemAttributeDefinition = {
  id: string;
  item_id: string;
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
};

type LocationNode = {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
};

function formatPath(path?: string[]) {
  return path?.length ? path.join(" / ") : "—";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getCurrentIso() {
  return new Date().toISOString();
}

function buildAttributeInitialValue(
  def: ItemAttributeDefinition,
  existing?: unknown,
) {
  if (existing !== undefined) return existing;
  if (def.data_type === "boolean") return false;
  return "";
}

function normalizeAttributeValue(
  def: ItemAttributeDefinition,
  value: unknown,
): unknown {
  if (def.data_type === "boolean") {
    return Boolean(value);
  }

  if (def.data_type === "number") {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }

  if (value === "") return null;
  return value;
}

function renderInput(
  def: ItemAttributeDefinition,
  value: unknown,
  onChange: (next: unknown) => void,
) {
  switch (def.data_type) {
    case "boolean":
      return (
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>Yes</span>
        </label>
      );

    case "number":
      return (
        <input
          type="number"
          step="any"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "enum":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select</option>
          {(Array.isArray(def.allowed_values) ? def.allowed_values : []).map(
            (option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ),
          )}
        </select>
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

console.log(renderInput, normalizeAttributeValue) // TODO - REMOVE TEMPORARY FIX 3am i want sleep

export default function ReceiveInventoryPage() {
  const [searchParams] = useSearchParams();

  const shipmentIdFromUrl = searchParams.get("inbound_shipment_id") || "";
  const lineIdFromUrl = searchParams.get("inbound_shipment_line_id") || "";
  const itemIdFromUrl = searchParams.get("item_id") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>(
    [],
  );
  const [inboundShipmentLines, setInboundShipmentLines] = useState<
    InboundShipmentLine[]
  >([]);
  const [attributeDefs, setAttributeDefs] = useState<ItemAttributeDefinition[]>(
    [],
  );

  const [inboundShipmentId, setInboundShipmentId] = useState(shipmentIdFromUrl);
  const [inboundShipmentLineId, setInboundShipmentLineId] =
    useState(lineIdFromUrl);
  const [itemId, setItemId] = useState(itemIdFromUrl);
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [visibilityTier, setVisibilityTier] = useState<1 | 2 | 3>(3);
  const [reason, setReason] = useState("");
  const [attributeValues, setAttributeValues] = useState<
    Record<string, unknown>
  >({});

  const selectedShipment = useMemo(
    () => inboundShipments.find((s) => s.id === inboundShipmentId) || null,
    [inboundShipments, inboundShipmentId],
  );

  const selectedLine = useMemo(
    () =>
      inboundShipmentLines.find((line) => line.id === inboundShipmentLineId) ||
      null,
    [inboundShipmentLines, inboundShipmentLineId],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) || null,
    [items, itemId],
  );

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) || null,
    [locations, locationId],
  );

  const shipmentHasNoLines =
    Boolean(inboundShipmentId) && inboundShipmentLines.length === 0;

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);

        const [itemsRes, locationsRes, shipmentsRes] = await Promise.all([
          fetchInventoryItems(),
          fetchInventoryLocationsTree(),
          fetchInboundShipments(),
        ]);

        if (cancelled) return;

        setItems(itemsRes.items || []);
        setLocations(locationsRes.locations || []);
        setInboundShipments(shipmentsRes.shipments || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load receive inventory page");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLines() {
      if (!inboundShipmentId) {
        setInboundShipmentLines([]);
        setInboundShipmentLineId("");
        return;
      }

      try {
        const res = await fetchInboundShipmentLines(inboundShipmentId);
        if (cancelled) return;

        const nextLines = res.lines || [];
        setInboundShipmentLines(nextLines);

        const stillExists = nextLines.some(
          (line) => line.id === inboundShipmentLineId,
        );
        if (!stillExists) {
          if (
            lineIdFromUrl &&
            nextLines.some((line) => line.id === lineIdFromUrl)
          ) {
            setInboundShipmentLineId(lineIdFromUrl);
          } else {
            setInboundShipmentLineId("");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load inbound shipment lines");
          setInboundShipmentLines([]);
          setInboundShipmentLineId("");
        }
      }
    }

    loadLines();

    return () => {
      cancelled = true;
    };
  }, [inboundShipmentId, lineIdFromUrl]);

  useEffect(() => {
    if (!selectedLine) {
      if (!lineIdFromUrl) {
        setItemId("");
      }
      return;
    }

    setItemId(selectedLine.item_id);

    if (!quantity) {
      setQuantity(String(selectedLine.quantity_remaining));
    }
  }, [selectedLine, lineIdFromUrl, quantity]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttributes() {
      if (!itemId) {
        setAttributeDefs([]);
        setAttributeValues({});
        return;
      }

      try {
        const res = await fetchInventoryItemAttributeDefinitions(itemId);
        if (cancelled) return;

        const defs = res.attributes || [];
        setAttributeDefs(defs);

        const sourceAttrs = selectedLine?.attributes || {};
        const nextValues: Record<string, unknown> = {};

        for (const def of defs) {
          nextValues[def.attribute_key] = buildAttributeInitialValue(
            def,
            sourceAttrs[def.attribute_key],
          );
        }

        setAttributeValues(nextValues);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load item attributes");
          setAttributeDefs([]);
          setAttributeValues({});
        }
      }
    }

    loadAttributes();

    return () => {
      cancelled = true;
    };
  }, [itemId, selectedLine]);

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];

    if (!inboundShipmentId) {
      missing.push("Inbound Shipment");
      return missing;
    }

    if (shipmentHasNoLines) {
      return missing;
    }

    if (!inboundShipmentLineId) missing.push("Inbound Shipment Line");
    if (!itemId) missing.push("Item");
    if (!locationId) missing.push("Location");

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) missing.push("Quantity");

    // for (const def of attributeDefs) {
    //   if (!def.is_required) continue;

    //   const raw = attributeValues[def.attribute_key];

    //   if (def.data_type === "boolean") {
    //     if (raw !== true) {
    //       missing.push(def.label);
    //     }
    //     continue;
    //   }

    //   if (raw === null || raw === undefined || String(raw).trim() === "") {
    //     missing.push(def.label);
    //   }
    // }

    return missing;
  }, [
    inboundShipmentId,
    inboundShipmentLineId,
    shipmentHasNoLines,
    itemId,
    locationId,
    quantity,
    attributeDefs,
    attributeValues,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (shipmentHasNoLines) {
      setError(
        "This inbound shipment has no lines yet. Add a line first before receiving inventory.",
      );
      return;
    }

    if (requiredMissing.length > 0) {
      setError(`Missing required fields: ${requiredMissing.join(", ")}`);
      return;
    }

    const qty = Number(quantity);

    // const attributes: Record<string, unknown> = {};
    // for (const def of attributeDefs) {
    //   const normalized = normalizeAttributeValue(
    //     def,
    //     attributeValues[def.attribute_key],
    //   );

    //   if (normalized !== null && normalized !== undefined && normalized !== "") {
    //     attributes[def.attribute_key] = normalized;
    //   }
    // }

    try {
      setSaving(true);

      const payload: ReceiveInventoryInput = {
        inbound_shipment_line_id: inboundShipmentLineId,
        location_id: locationId,
        quantity: qty,
        // attributes,
        visibility_tier: visibilityTier,
        reason: reason || undefined,
        received_at: getCurrentIso(),
        // ...(Object.keys(attributes).length > 0 ? { attributes } : {})
      };

      const result = await receiveInventory(payload);

      setSuccess(
        `Inventory received successfully. Lot: ${result.inventory_lot_id}`,
      );

      setQuantity("");
      setReason("");
      setLocationId("");
      setInboundShipmentId("");
      setInboundShipmentLineId("");
      setInboundShipmentLines([]);
      setItemId("");
      setAttributeDefs([]);
      setAttributeValues({});
      setVisibilityTier(3);
    } catch (err: any) {
      setError(err?.message || "Failed to receive inventory");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`page-shell ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading receive inventory form…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Receive Inventory
          </div>
          <h1 className={styles.title}>Receive Inventory</h1>
          <p className={styles.subtitle}>
            Put discovered inbound shipment lines into inventory lots.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form className={styles.layout} onSubmit={handleSubmit}>
        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Inbound Source</h2>
          </div>

          <div className="my-profile-grid">
            <div className="form-group span-2">
              <label>Inbound Shipment *</label>
              <select
                value={inboundShipmentId}
                onChange={(e) => {
                  setInboundShipmentId(e.target.value);
                  setInboundShipmentLineId("");
                  setItemId("");
                  setAttributeDefs([]);
                  setAttributeValues({});
                  setQuantity("");
                }}
                disabled={saving}
              >
                <option value="">Select inbound shipment</option>
                {inboundShipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.shipment_number}
                    {shipment.donor_display_name
                      ? ` — ${shipment.donor_display_name}`
                      : ""}
                    {shipment.status ? ` (${shipment.status})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group span-2">
              <label>Inbound Shipment Line *</label>
              <select
                value={inboundShipmentLineId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setInboundShipmentLineId(nextId);

                  const line =
                    inboundShipmentLines.find((entry) => entry.id === nextId) ||
                    null;

                  if (line) {
                    setItemId(line.item_id);
                    setQuantity(String(line.quantity_remaining));
                  } else {
                    setItemId("");
                    setQuantity("");
                  }
                }}
                disabled={
                  saving ||
                  !inboundShipmentId ||
                  inboundShipmentLines.length === 0
                }
              >
                <option value="">
                  {shipmentHasNoLines
                    ? "No inbound lines on this shipment"
                    : "Select inbound shipment line"}
                </option>

                {inboundShipmentLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {`${line.item_name || line.item_id} -- Total ${line.quantity_received}, Remaining ${line.quantity_remaining}`}
                  </option>
                ))}
              </select>

              {shipmentHasNoLines && (
                <div className="form-help">
                  This shipment has no inbound lines yet. Add at least one line
                  on the Inbound Shipments page before receiving inventory.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Item</label>
              <input
                value={selectedItem?.name || selectedLine?.item_name || ""}
                disabled
              />
              <div className="form-help">
                Item is determined by the selected inbound shipment line.
              </div>
            </div>

            <div className="form-group">
              <label>Default Unit</label>
              <input value={selectedItem?.default_unit || ""} disabled />
            </div>

            <div className="form-group">
              <label>Discovered Quantity</label>
              <input
                value={
                  selectedLine ? String(selectedLine.quantity_received) : ""
                }
                disabled
              />
            </div>

            <div className="form-group">
              <label>Line Received At</label>
              <input
                value={
                  selectedLine ? formatDateTime(selectedLine.received_at) : ""
                }
                disabled
              />
            </div>
          </div>
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Putaway Details</h2>
          </div>

          <div className="my-profile-grid">
            <div className="form-group span-2">
              <label>Location *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={saving}
              >
                <option value="">Select location</option>
                {locations
                  .filter((loc) => loc.is_active !== false)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {formatPath(loc.path)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity to Receive *</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Visibility Tier</label>
              <select
                value={String(visibilityTier)}
                onChange={(e) =>
                  setVisibilityTier(Number(e.target.value) as 1 | 2 | 3)
                }
                disabled={saving}
              >
                <option value="1">1 — Aequitas only</option>
                <option value="2">2 — Trusted people</option>
                <option value="3">3 — Everyone</option>
              </select>
            </div>

            <div className="form-group span-2">
              <label>Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                placeholder="Initial sort, shelf placement, etc."
              />
            </div>
          </div>
        </section>

        {/* <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Lot Attributes</h2>
          </div>

          {attributeDefs.length === 0 ? (
            <div className="dashboard-empty">
              No item-specific attributes for this item.
            </div>
          ) : (
            <div className="my-profile-grid">
              {attributeDefs.map((def) => (
                <div className="form-group" key={def.id}>
                  <label>
                    {def.label}
                    {def.is_required ? " *" : ""}
                  </label>

                  {renderInput(
                    def,
                    attributeValues[def.attribute_key],
                    (next) =>
                      setAttributeValues((prev) => ({
                        ...prev,
                        [def.attribute_key]: next,
                      })),
                  )}
                </div>
              ))}
            </div>
          )}
        </section> */}

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Inbound Line Attributes</h2>
          </div>

          {!selectedLine?.attributes ||
          Object.keys(selectedLine.attributes).length === 0 ? (
            <div className="dashboard-empty">
              No attributes on this inbound line.
            </div>
          ) : (
            <pre className={styles.jsonBlock}>
              {JSON.stringify(selectedLine.attributes, null, 2)}
            </pre>
          )}

          <div className="form-help">
            Attributes come from the inbound shipment line and cannot be edited
            during putaway.
          </div>
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Review</h2>
          </div>

          <div className={styles.review}>
            <div>
              <strong>Inbound Shipment:</strong>{" "}
              {selectedShipment
                ? `${selectedShipment.shipment_number}${
                    selectedShipment.donor_display_name
                      ? ` — ${selectedShipment.donor_display_name}`
                      : ""
                  }`
                : "—"}
            </div>

            <div>
              <strong>Inbound Line:</strong>{" "}
              {selectedLine
                ? `${selectedLine.item_name || selectedLine.item_id} — qty ${selectedLine.quantity_received}`
                : "—"}
            </div>

            <div>
              <strong>Item:</strong>{" "}
              {selectedItem?.name || selectedLine?.item_name || "—"}
            </div>

            <div>
              <strong>Quantity:</strong> {quantity || "—"}{" "}
              {selectedItem?.default_unit || ""}
            </div>

            <div>
              <strong>Location:</strong>{" "}
              {selectedLocation ? formatPath(selectedLocation.path) : "—"}
            </div>

            <div>
              <strong>Visibility Tier:</strong> {visibilityTier}
            </div>
          </div>

          {requiredMissing.length > 0 && !shipmentHasNoLines && (
            <div className="form-help">
              Missing required fields: {requiredMissing.join(", ")}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="app-button"
              disabled={
                saving ||
                shipmentHasNoLines ||
                requiredMissing.length > 0 ||
                selectedLine?.is_fully_received
              }
            >
              {saving ? "Receiving..." : "Receive Inventory"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
