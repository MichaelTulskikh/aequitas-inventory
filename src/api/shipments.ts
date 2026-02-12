import { apiFetch } from "./client";

export type Shipment = {
  id: string;
  shipment_number: string;
  status: string;
};

export async function fetchInboundShipments(): Promise<{
  shipments: Shipment[];
}> {
  return apiFetch("/shipments?direction=IN");
}
