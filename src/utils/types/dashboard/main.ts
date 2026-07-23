// response:
export interface IDashboardSummaryResponse {
  me: {
    is_privileged: boolean;
  }; // #tf is this
  summary: IDashboardSummary;
}
// :response

export interface IDashboardSummary {
  shipments_by_status: IShipmentsByStatus;
  my_active_shipments: Array<IActiveShipments>;
  recent_fulfilled_shipments: Array<IRecentlyFulfilledShipments>;
  inventory_by_category: Array<IInventoryByCategory>;
  low_stock_lots?: Array<ILowStockLots>;
  expiring_soon_lots?: Array<IExpiringSoonLots>;
  recent_receives?: Array<IRecentReceivals>;
  recent_adjustments?: Array<IRecentAdjustments>;
}

export interface IShipmentsByStatus {
  draft: number;
  submitted: number;
  approved: number;
  fulfilled: number;
  cancelled: number;
  rejected: number;
}

export interface IActiveShipments {
  id: string;
  shipment_number: string;
  status: string;
  requester_name: string | null;
  created_at: string;
  line_count: number;
}

export interface IRecentlyFulfilledShipments {
  id: string;
  shipment_number: string;
  requester_name: string | null;
  fulfilled_at: string | null;
}

export interface IInventoryByCategory {
  category_id: string | null;
  category_name: string;
  total_available_quantity: number;
  item_count: number;
}

export interface ILowStockLots {
  inventory_lot_id: string;
  item_id: string;
  item_name: string;
  location_name: string;
  available_quantity: number;
  attributes: Record<string, unknown>;
}

export interface IExpiringSoonLots {
  inventory_lot_id: string;
  item_id: string;
  item_name: string;
  expiration_date: string;
  location_name: string;
  available_quantity: number;
  attributes: Record<string, unknown>;
}

export interface IRecentReceivals {
  inventory_txn_id: string;
  occurred_at: string;
  item_name: string;
  quantity: number;
  location_name: string;
  reason: string | null;
}

export interface IRecentAdjustments {
  inventory_txn_id: string;
  occurred_at: string;
  item_name: string;
  quantity: number;
  location_name: string;
  reason: string | null;
}
