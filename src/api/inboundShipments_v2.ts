import { apiFetch } from "./client";

export type InboundShipment = {
  id: string;
  shipment_number: string;

  declaration_id: string;
  declaration_number: string;
  declaration_is_undeclared: boolean;

  donor_id: string | null;
  donor_display_name: string | null;

  notes: string | null;
  status: "open" | "closed" | "cancelled";
  received_at: string;

  created_by_account_id: string | null;
  created_at: string;
  updated_at: string;

  line_count: number;
  received_quantity: number;
};

export type FetchInboundShipmentsResponse = {
  shipments: InboundShipment[];
};

export async function fetchInboundShipments() {
  return apiFetch(
    "/v2/inbound-shipments",
  ) as Promise<FetchInboundShipmentsResponse>;
}