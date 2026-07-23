// import type { TVisibilityTier } from "./general";

// response:
export interface IInboundShipmentLinesResponse {
  lines: TInboundShipmentLines;
}
// :response

export type TInboundShipmentLines = IInboundShipmentLine[];
export interface IInboundShipmentLine {
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
}

// export interface IReceiveInventoryInput {
//   inbound_shipment_line_id: string;
//   location_id: string;
//   quantity: number;
//   visibility_tier?: TVisibilityTier;
//   reason?: string;
//   received_at?: string;
// }
// export interface IReceiveInventoryResponse {
//   ok: true;
//   inventory_lot_id: string;
//   inventory_txn_id: string;
// }
