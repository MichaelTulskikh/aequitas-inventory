import { apiFetch } from "./client";

export type ShipmentListItem = {
  id: string;
  shipment_number: string;
  status:
    | "draft"
    | "submitted"
    | "approved"
    | "fulfilled"
    | "cancelled"
    | "rejected";
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
  requester_profile: {
    id: string;
    full_name: string | null;
    delivery_address: string | null;
  };
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  line_count: number;
  total_requested_quantity: number;
};

export type ShipmentListResponse = {
  shipments: ShipmentListItem[];
  page: number;
  page_size: number;
  total: number;
};

export type FetchShipmentsQuery = {
  q?: string;
  status?: string;
  mine_only?: boolean;
  page?: number;
  page_size?: number;
};

export type ShipmentAllocation = {
  id: string;
  inventory_lot_id: string;
  quantity: number;
};

export type ShipmentLine = {
  id: string;
  shipment_id: string;
  item_id: string;
  item_name: string;
  default_unit: string;
  requested_quantity: number;
  requested_attributes: Record<string, unknown>;
  notes: string | null;
  allocated_quantity: number;
  allocations: ShipmentAllocation[];
};

export type ShipmentDetail = {
  id: string;
  shipment_number: string;
  status:
    | "draft"
    | "submitted"
    | "approved"
    | "fulfilled"
    | "cancelled"
    | "rejected";
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
  requester_profile: {
    id: string;
    account_id: string;
    full_name: string | null;
    signing_representative_name: string | null;
    edrpou: string | null;
    phone: string | null;
    email: string | null;
    official_address: string | null;
    delivery_address: string | null;
  };
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  lines: ShipmentLine[];
};

export async function fetchShipments(
  params: FetchShipmentsQuery = {},
): Promise<ShipmentListResponse> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.mine_only !== undefined) {
    query.set("mine_only", String(params.mine_only));
  }
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const qs = query.toString();
  return apiFetch(`/v2/shipments${qs ? `?${qs}` : ""}`);
}

export async function getShipment(
  id: string,
): Promise<{ shipment: ShipmentDetail }> {
  return apiFetch(`/v2/shipments/${id}`);
}

export async function updateShipment(
  id: string,
  body: {
    notes?: string;
    requester_profile_id?: string;
  },
) {
  return apiFetch(`/v2/shipments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createShipmentLine(
  shipmentId: string,
  body: {
    item_id: string;
    requested_quantity: number;
    requested_attributes?: Record<string, unknown>;
    notes?: string;
  },
): Promise<{ line: ShipmentLine }> {
  return apiFetch(`/v2/shipments/${shipmentId}/lines`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateShipmentLine(
  lineId: string,
  body: {
    requested_quantity?: number;
    requested_attributes?: Record<string, unknown>;
    notes?: string;
  },
): Promise<{ line: ShipmentLine }> {
  return apiFetch(`/v2/shipment-lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteShipmentLine(lineId: string) {
  return apiFetch(`/v2/shipment-lines/${lineId}`, {
    method: "DELETE",
  });
}

export async function reserveShipmentLine(
  lineId: string,
  body: {
    inventory_lot_id: string;
    quantity: number;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return apiFetch(`/v2/shipment-lines/${lineId}/reserve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function unreserveShipmentLine(
  lineId: string,
  body: {
    inventory_lot_id: string;
    quantity: number;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return apiFetch(`/v2/shipment-lines/${lineId}/unreserve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function submitShipment(id: string) {
  return apiFetch(`/v2/shipments/${id}/submit`, {
    method: "POST",
  });
}

export async function approveShipment(id: string) {
  return apiFetch(`/v2/shipments/${id}/approve`, {
    method: "POST",
  });
}

export async function fulfillShipment(
  id: string,
  body?: { reason?: string; metadata?: Record<string, unknown> },
) {
  return apiFetch(`/v2/shipments/${id}/fulfill`, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });
}

export async function createShipment(body: {
  requester_profile_id: string;
  notes?: string;
  shipment_number?: string;
}) {
  return apiFetch(`/v2/shipments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}