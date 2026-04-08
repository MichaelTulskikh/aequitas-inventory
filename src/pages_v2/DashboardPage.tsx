import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchDashboardSummary,
  type DashboardSummaryResponse,
} from "../api/dashboard";
import "../styles_new/dashboard.css"

/*
Expected API response shape:

type DashboardSummaryResponse = {
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
      id: string;
      shipment_number: string;
      status: string;
      requester_name: string | null;
      created_at: string;
      line_count: number;
    }>;
    recent_fulfilled_shipments: Array<{
      id: string;
      shipment_number: string;
      requester_name: string | null;
      fulfilled_at: string | null;
    }>;
    inventory_by_category: Array<{
      category_id: string | null;
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
*/

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function statusClass(status: string) {
  return `dashboard-status status-${status}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboardSummary();
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  console.log(data)
  console.log(data?.summary);

  const summary = data?.summary;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Warehouse activity, shipment workflow, and inventory overview.
          </p>
        </div>
      </div>

      {error && <div className="dashboard-error">Error: {error}</div>}

      {loading && (
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading dashboard…</span>
        </div>
      )}

      {!loading && summary && (
        <>
          <section className="dashboard-section">
            <h2>Shipment Status Overview</h2>
            <div className="dashboard-card-grid six">
              <div className="dashboard-card stat-card">
                <div className="stat-label">Draft</div>
                <div className="stat-value">
                  {summary.shipments_by_status.draft}
                </div>
              </div>
              <div className="dashboard-card stat-card">
                <div className="stat-label">Submitted</div>
                <div className="stat-value">
                  {summary.shipments_by_status.submitted}
                </div>
              </div>
              <div className="dashboard-card stat-card">
                <div className="stat-label">Approved</div>
                <div className="stat-value">
                  {summary.shipments_by_status.approved}
                </div>
              </div>
              <div className="dashboard-card stat-card">
                <div className="stat-label">Fulfilled</div>
                <div className="stat-value">
                  {summary.shipments_by_status.fulfilled}
                </div>
              </div>
              <div className="dashboard-card stat-card">
                <div className="stat-label">Cancelled</div>
                <div className="stat-value">
                  {summary.shipments_by_status.cancelled}
                </div>
              </div>
              <div className="dashboard-card stat-card">
                <div className="stat-label">Rejected</div>
                <div className="stat-value">
                  {summary.shipments_by_status.rejected}
                </div>
              </div>
            </div>
          </section>

          <div className="dashboard-two-col">
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <h2>My Active Shipments</h2>
                <Link to="/shipments" className="dashboard-link">
                  View all
                </Link>
              </div>

              <div className="dashboard-card">
                {summary.my_active_shipments.length === 0 ? (
                  <div className="dashboard-empty">No active shipments.</div>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Shipment</th>
                        <th>Status</th>
                        <th>Requester</th>
                        <th>Lines</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.my_active_shipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td>
                            <Link to={`/shipments/${shipment.id}`}>
                              {shipment.shipment_number}
                            </Link>
                          </td>
                          <td>
                            <span className={statusClass(shipment.status)}>
                              {shipment.status}
                            </span>
                          </td>
                          <td>{shipment.requester_name || "—"}</td>
                          <td>{shipment.line_count}</td>
                          <td>{formatDate(shipment.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <h2>Recently Fulfilled</h2>
                <Link to="/shipments" className="dashboard-link">
                  View all
                </Link>
              </div>

              <div className="dashboard-card">
                {summary.recent_fulfilled_shipments.length === 0 ? (
                  <div className="dashboard-empty">
                    No recently fulfilled shipments.
                  </div>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Shipment</th>
                        <th>Requester</th>
                        <th>Fulfilled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent_fulfilled_shipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td>
                            <Link to={`/shipments/${shipment.id}`}>
                              {shipment.shipment_number}
                            </Link>
                          </td>
                          <td>{shipment.requester_name || "—"}</td>
                          <td>{formatDate(shipment.fulfilled_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Available Inventory by Category</h2>
              <Link to="/inventory" className="dashboard-link">
                Open inventory
              </Link>
            </div>

            <div className="dashboard-card">
              {summary.inventory_by_category.length === 0 ? (
                <div className="dashboard-empty">No inventory found.</div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Items</th>
                      <th>Available Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.inventory_by_category.map((row) => (
                      <tr key={row.category_id || row.category_name}>
                        <td>{row.category_name}</td>
                        <td>{row.item_count}</td>
                        <td>{row.total_available_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {isPrivileged && (
            <>
              <div className="dashboard-two-col">
                <section className="dashboard-section">
                  <h2>Low Stock Lots</h2>
                  <div className="dashboard-card">
                    {!summary.low_stock_lots ||
                    summary.low_stock_lots.length === 0 ? (
                      <div className="dashboard-empty">
                        No low stock lots.
                      </div>
                    ) : (
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Location</th>
                            <th>Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.low_stock_lots.map((lot) => (
                            <tr key={lot.inventory_lot_id}>
                              <td>
                                <Link to={`/inventory/lots/${lot.inventory_lot_id}`}>
                                  {lot.item_name}
                                </Link>
                              </td>
                              <td>{lot.location_name}</td>
                              <td>{lot.available_quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                <section className="dashboard-section">
                  <h2>Expiring Soon</h2>
                  <div className="dashboard-card">
                    {!summary.expiring_soon_lots ||
                    summary.expiring_soon_lots.length === 0 ? (
                      <div className="dashboard-empty">
                        No expiring lots found.
                      </div>
                    ) : (
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Expiration</th>
                            <th>Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.expiring_soon_lots.map((lot) => (
                            <tr key={lot.inventory_lot_id}>
                              <td>
                                <Link to={`/inventory/lots/${lot.inventory_lot_id}`}>
                                  {lot.item_name}
                                </Link>
                              </td>
                              <td>{formatDate(lot.expiration_date)}</td>
                              <td>{lot.available_quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>

              <div className="dashboard-two-col">
                <section className="dashboard-section">
                  <h2>Recent Receives</h2>
                  <div className="dashboard-card">
                    {!summary.recent_receives ||
                    summary.recent_receives.length === 0 ? (
                      <div className="dashboard-empty">
                        No recent receives.
                      </div>
                    ) : (
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recent_receives.map((row) => (
                            <tr key={row.inventory_txn_id}>
                              <td>{formatDateTime(row.occurred_at)}</td>
                              <td>{row.item_name}</td>
                              <td>{row.quantity}</td>
                              <td>{row.location_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                <section className="dashboard-section">
                  <h2>Recent Adjustments</h2>
                  <div className="dashboard-card">
                    {!summary.recent_adjustments ||
                    summary.recent_adjustments.length === 0 ? (
                      <div className="dashboard-empty">
                        No recent adjustments.
                      </div>
                    ) : (
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Item</th>
                            <th>Delta</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recent_adjustments.map((row) => (
                            <tr key={row.inventory_txn_id}>
                              <td>{formatDateTime(row.occurred_at)}</td>
                              <td>{row.item_name}</td>
                              <td>{row.quantity}</td>
                              <td>{row.location_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}