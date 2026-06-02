import { apiFetch } from "./client";

export type DashboardSummaryResponse = {
  me: {
    is_privileged: boolean;
  };
  summary: {
    shipments_by_status: {
      draft: number;
      submitted: number;
      approved: number;
      fulfilled: number;
      cancelled: number;
      rejected: number;
    };
    my_active_shipments: Array<{
      id: string | number;
      shipment_number: string;
      status: string;
      requester_name: string | null;
      created_at: string;
      line_count: number;
    }>;
    recent_fulfilled_shipments: Array<{
      id: string | number;
      shipment_number: string;
      requester_name: string | null;
      fulfilled_at: string | null;
    }>;
    inventory_by_category: Array<{
      category_id: string | number | null;
      category_name: string;
      total_available_quantity: number;
      item_count: number;
    }>;
    low_stock_lots?: Array<{
      inventory_lot_id: string;
      item_id: string;
      item_name: string;
      location_name: string;
      available_quantity: number;
      attributes: Record<string, unknown>;
    }>;
    expiring_soon_lots?: Array<{
      inventory_lot_id: string;
      item_id: string;
      item_name: string;
      expiration_date: string;
      location_name: string;
      available_quantity: number;
      attributes: Record<string, unknown>;
    }>;
    recent_receives?: Array<{
      inventory_txn_id: string;
      occurred_at: string;
      item_name: string;
      quantity: number;
      location_name: string;
      reason: string | null;
    }>;
    recent_adjustments?: Array<{
      inventory_txn_id: string;
      occurred_at: string;
      item_name: string;
      quantity: number;
      location_name: string;
      reason: string | null;
    }>;
  };
};

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const res = await apiFetch(`/v2/dashboard`);

  return res;
}
