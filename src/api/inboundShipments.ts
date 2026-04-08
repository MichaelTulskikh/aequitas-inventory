import { apiFetch } from "./client";

export type InboundShipment = {
  id: string;
  inbound_code: string;
  source_name: string | null;
  source_reference: string | null;
  notes: string | null;
  status: string;
  created_by_account_id: string | null;
  created_at: string;
  updated_at: string;
  received_lot_count: number;
  received_quantity: number;
};

export type FetchInboundShipmentsQuery = {
  q?: string;
  status?: string;
};

export async function fetchInboundShipments(
  params: FetchInboundShipmentsQuery = {},
): Promise<{ shipments: InboundShipment[] }> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);

  const qs = query.toString();
  return apiFetch(`/v2/inbound-shipments${qs ? `?${qs}` : ""}`);
}

export async function fetchInboundShipment(
  id: string,
): Promise<{ shipment: InboundShipment }> {
  return apiFetch(`/v2/inbound-shipments/${id}`);
}

export async function createInboundShipment(body: {
  inbound_code: string;
  source_name?: string;
  source_reference?: string;
  notes?: string;
  status?: string;
}): Promise<{ shipment: InboundShipment }> {
  return apiFetch(`/v2/inbound-shipments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateInboundShipment(
  id: string,
  body: {
    inbound_code?: string;
    source_name?: string;
    source_reference?: string;
    notes?: string;
    status?: string;
  },
): Promise<{ shipment: InboundShipment }> {
  return apiFetch(`/v2/inbound-shipments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}