import { apiFetch } from "./client";

/* ---------- Shared inventory types ---------- */

export type InventoryItemOption = {
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

export type ItemAttributeDefinition = {
  id: string;
  item_id: string;
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
};

export type LocationNode = {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
};

/* ---------- Inbound shipment line types ---------- */

export type InboundShipmentLine = {
  id: string;
  inbound_shipment_id: string;
  item_id: string;
  item_name: string | null;
  quantity_received: number;
  quantity_assigned: number;
  quantity_remaining: number;
  is_fully_received: boolean;
  attributes: Record<string, unknown>;
  received_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchInboundShipmentLinesResponse = {
  lines: InboundShipmentLine[];
};

/* ---------- Existing fetch helpers ---------- */

export type FetchInventoryItemsResponse = {
  items: InventoryItemOption[];
};

export type FetchInventoryItemAttributeDefinitionsResponse = {
  attributes: ItemAttributeDefinition[];
};

export type FetchInventoryLocationsTreeResponse = {
  locations: LocationNode[];
};

export async function fetchInventoryItems() {
  return apiFetch("/v2/inventory/items") as Promise<FetchInventoryItemsResponse>;
}

export async function fetchInventoryItemAttributeDefinitions(itemId: string) {
  return apiFetch(
    `/v2/inventory/items/${itemId}/attribute-definitions`,
  ) as Promise<FetchInventoryItemAttributeDefinitionsResponse>;
}

export async function fetchInventoryLocationsTree() {
  return apiFetch(
    "/v2/inventory/locations/tree",
  ) as Promise<FetchInventoryLocationsTreeResponse>;
}

/* ---------- New helper: inbound shipment lines ---------- */

export async function fetchInboundShipmentLines(inboundShipmentId: string) {
  return apiFetch(
    `/v2/inbound-shipments/${inboundShipmentId}/lines`,
  ) as Promise<FetchInboundShipmentLinesResponse>;
}

/* ---------- New receive payload ---------- */

export type ReceiveInventoryInput = {
  inbound_shipment_line_id: string;
  location_id: string;
  quantity: number;
  // attributes?: Record<string, unknown>;
  visibility_tier?: 1 | 2 | 3;
  reason?: string;
  received_at?: string;
};

export type ReceiveInventoryResponse = {
  ok: true;
  inventory_lot_id: string;
  inventory_txn_id: string;
};

export async function receiveInventory(input: ReceiveInventoryInput) {
  return apiFetch("/v2/inventory/receive", {
    method: "POST",
    body: JSON.stringify(input),
  }) as Promise<ReceiveInventoryResponse>;
}