import { apiFetch } from "./client";

export type InventoryValuationLot = {
  inventory_lot_id: string;
  item_id: string;
  item_name: string;
  default_unit: string;
  location_id: string;
  location_path: string[];
  attributes: Record<string, unknown>;
  status: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  available_quantity: number;
  unit_value_uah: number | null;
  total_on_hand_value_uah: number | null;
  value_note: string | null;
  valued_at: string | null;
  valued_by_account_id: string | null;
  valued_by_name: string | null;
  received_at: string | null;
  source_note: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryValuationListResponse = {
  lots: InventoryValuationLot[];
  page: number;
  page_size: number;
  total: number;
};

export async function fetchInventoryValuationLots(params: {
  q?: string;
  value_filter?: "missing" | "valued" | "all";
  page?: number;
  page_size?: number;
} = {}): Promise<InventoryValuationListResponse> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.value_filter) query.set("value_filter", params.value_filter);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const qs = query.toString();
  return apiFetch(`/v2/inventory/valuation-lots${qs ? `?${qs}` : ""}`);
}

export async function updateInventoryLotValue(
  lotId: string,
  body: {
    unit_value_uah: number | null;
    value_note?: string | null;
  },
): Promise<{ lot: InventoryValuationLot }> {
  return apiFetch(`/v2/inventory/lots/${lotId}/value`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchInventoryValueSummary(): Promise<{
  current_inventory_value_uah: string;
  distributed_value_uah: string;
  combined_total_value_uah: string;
  unvalued_lot_count: number;
  unvalued_ship_txn_count: number;
}> {
  return apiFetch(`/v2/inventory/value-summary`);
}

export async function fetchShipmentValueSummary(id: string): Promise<{
  shipment: {
    id: string;
    shipment_number: string;
    status: string;
  };
  allocated_value_uah: string;
  allocated_unvalued_count: number;
  shipped_value_uah: string;
  shipped_unvalued_count: number;
}> {
  return apiFetch(`/v2/shipments/${id}/value-summary`);
}