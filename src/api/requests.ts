import { apiFetch } from "./client";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "fulfilled"
  | "rejected"
  | "cancelled";

export type RequestRow = {
  id: string;
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
  requester_email?: string | null;
  requester_name?: string | null;
  line_count?: number;
  total_qty?: number;
};

export type RequestLineRow = {
  id: string;
  quantity: number;
  unit: string;
  status: string;
  item_name: string;
  location_name: string;
  inventory_lot_id: string;
};

export async function listMyRequests(): Promise<{ requests: RequestRow[] }> {
  return apiFetch("/requests");
}

export async function createRequest(): Promise<{ request: RequestRow }> {
  return apiFetch("/requests", { method: "POST" });
}

export async function getActiveRequest(): Promise<{ request: RequestRow | null }> {
  return apiFetch("/requests/active");
}

export async function addLineToActiveRequest(payload: {
  inventory_lot_id: string;
  quantity: number;
}): Promise<{ ok: boolean; request_id: string; request_line_id: string }> {
  return apiFetch("/requests/active/lines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRequestById(
  id: string,
): Promise<{ request: RequestRow; lines: RequestLineRow[] }> {
  return apiFetch(`/requests/${id}`);
}

export async function submitRequest(id: string): Promise<{ ok: boolean; status: string }> {
  return apiFetch(`/requests/${id}/submit`, { method: "POST" });
}
