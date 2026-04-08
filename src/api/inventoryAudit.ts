import { apiFetch } from "./client";

export type InventoryAuditRow = {
  inventory_txn_id: string;
  occurred_at: string;
  txn_type: string;
  quantity: number;
  reason: string | null;

  inventory_lot_id: string;
  lot_attributes: Record<string, unknown> | null;

  item_id: string;
  item_name: string;

  location_id: string | null;
  location_name: string | null;
  location_path: string[] | null;

  shipment_id: string | null;
  shipment_number: string | null;
  shipment_line_id: string | null;

  actor_account_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
};

export async function fetchInventoryAudit(params?: {
  q?: string;
  txn_type?: string;
  item_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}): Promise<{
  rows: InventoryAuditRow[];
  page: number;
  page_size: number;
  total: number;
}> {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.txn_type) query.set("txn_type", params.txn_type);
  if (params?.item_id) query.set("item_id", params.item_id);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const qs = query.toString();
  return apiFetch(`/v2/inventory-audit${qs ? `?${qs}` : ""}`);
}