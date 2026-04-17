import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchDashboardSummary,
  type DashboardSummaryResponse,
} from "../../api/dashboard";
import styles from "./DashboardPage.module.css";

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

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
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

  const summary = data?.summary;

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Warehouse activity, shipment workflow, and inventory overview.
        </p>
      </div>
      {error && <div className="alert-error">Error: {error}</div>}

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

            <div className={styles.statusGrid}>
              <div className={`${styles.statusCard} ${styles.statusDraft}`}>
                <div className={styles.statusLabel}>Draft</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.draft}
                </div>
              </div>

              <div className={`${styles.statusCard} ${styles.statusSubmitted}`}>
                <div className={styles.statusLabel}>Submitted</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.submitted}
                </div>
              </div>

              <div className={`${styles.statusCard} ${styles.statusApproved}`}>
                <div className={styles.statusLabel}>Approved</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.approved}
                </div>
              </div>

              <div className={`${styles.statusCard} ${styles.statusFulfilled}`}>
                <div className={styles.statusLabel}>Fulfilled</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.fulfilled}
                </div>
              </div>

              <div className={`${styles.statusCard} ${styles.statusCancelled}`}>
                <div className={styles.statusLabel}>Cancelled</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.cancelled}
                </div>
              </div>

              <div className={`${styles.statusCard} ${styles.statusRejected}`}>
                <div className={styles.statusLabel}>Rejected</div>
                <div className={styles.statusValue}>
                  {summary.shipments_by_status.rejected}
                </div>
              </div>
            </div>
          </section>

          <div className={styles.twoCol}>
            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <h2>My Active Shipments</h2>
                <Link to="/shipments">View all</Link>
              </div>

              <div className="dashboard-card">
                {summary.my_active_shipments.length === 0 ? (
                  <div className="dashboard-empty">No active shipments.</div>
                ) : (
                  <div className={styles.tableWrap}>
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
                              <span
                                className={`shipment-status status-${normalizeStatus(shipment.status)}`}
                              >
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
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-header">
                <h2 className={styles.title}>Recently Fulfilled</h2>
                <Link to="/shipments" className={styles.link}>
                  View all
                </Link>
              </div>

              <div className="dashboard-card">
                {summary.recent_fulfilled_shipments.length === 0 ? (
                  <div className="dashboard-empty">
                    No recently fulfilled shipments.
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
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
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2 className={styles.title}>Available Inventory by Category</h2>
              <Link to="/inventory" className={styles.link}>
                Open inventory
              </Link>
            </div>

            <div className="dashboard-card">
              {summary.inventory_by_category.length === 0 ? (
                <div className="dashboard-empty">No inventory found.</div>
              ) : (
                <div className={styles.tableWrap}>
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
                </div>
              )}
            </div>
          </section>

          {isPrivileged && (
            <>
              <div className={styles.twoCol}>
                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className={styles.title}>Low Stock Lots</h2>
                  </div>

                  <div className="dashboard-card">
                    {!summary.low_stock_lots ||
                    summary.low_stock_lots.length === 0 ? (
                      <div className="dashboard-empty">No low stock lots.</div>
                    ) : (
                      <div className={styles.tableWrap}>
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
                                  <Link
                                    to={`/inventory/lots/${lot.inventory_lot_id}`}
                                  >
                                    {lot.item_name}
                                  </Link>
                                </td>
                                <td>{lot.location_name}</td>
                                <td>{lot.available_quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>

                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className={styles.title}>Expiring Soon</h2>
                  </div>

                  <div className="dashboard-card">
                    {!summary.expiring_soon_lots ||
                    summary.expiring_soon_lots.length === 0 ? (
                      <div className="dashboard-empty">
                        No expiring lots found.
                      </div>
                    ) : (
                      <div className={styles.tableWrap}>
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
                                  <Link
                                    to={`/inventory/lots/${lot.inventory_lot_id}`}
                                  >
                                    {lot.item_name}
                                  </Link>
                                </td>
                                <td>{formatDate(lot.expiration_date)}</td>
                                <td>{lot.available_quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className={styles.twoCol}>
                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className={styles.title}>Recent Receives</h2>
                  </div>

                  <div className="dashboard-card">
                    {!summary.recent_receives ||
                    summary.recent_receives.length === 0 ? (
                      <div className="dashboard-empty">No recent receives.</div>
                    ) : (
                      <div className={styles.tableWrap}>
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
                      </div>
                    )}
                  </div>
                </section>

                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className={styles.title}>Recent Adjustments</h2>
                  </div>

                  <div className="dashboard-card">
                    {!summary.recent_adjustments ||
                    summary.recent_adjustments.length === 0 ? (
                      <div className="dashboard-empty">
                        No recent adjustments.
                      </div>
                    ) : (
                      <div className={styles.tableWrap}>
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
                      </div>
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
