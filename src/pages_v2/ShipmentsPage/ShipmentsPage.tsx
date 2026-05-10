import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  fetchShipments,
  type ShipmentListItem,
  type ShipmentListResponse,
} from "../../api/shipments";
import styles from "./ShipmentsPage.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function statusClass(status: ShipmentListItem["status"]) {
  return `shipment-status status-${status}`;
}

export default function ShipmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [response, setResponse] = useState<ShipmentListResponse | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");
  const [mineOnly, setMineOnly] = useState(!isPrivileged);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipments = response?.shipments ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function loadShipments() {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchShipments({
        q: search || undefined,
        status: status || undefined,
        mine_only: mineOnly,
        page,
        page_size: pageSize,
      });

      setResponse(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, [search, status, mineOnly, page, pageSize]);

  useEffect(() => {
    if (!isPrivileged) {
      setMineOnly(true);
    }
  }, [isPrivileged]);

  const summary = useMemo(() => {
    const byStatus = {
      draft: 0,
      submitted: 0,
      approved: 0,
      fulfilled: 0,
      cancelled: 0,
      rejected: 0,
    };

    for (const shipment of shipments) {
      byStatus[shipment.status] += 1;
    }

    return byStatus;
  }, [shipments]);

  function clearFilters() {
    setSearchDraft("");
    setSearch("");
    setStatus("");
    setMineOnly(!isPrivileged);
    setPage(1);
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shipments</h1>
          <p className={styles.subtitle}>
            Manage draft, submitted, approved, and fulfilled shipments.
          </p>
        </div>

        <Link className="app-button" to="/shipments/new">
          New Shipment
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Draft</div>
          <div className={styles.summaryValue}>{summary.draft}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Submitted</div>
          <div className={styles.summaryValue}>{summary.submitted}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Approved</div>
          <div className={styles.summaryValue}>{summary.approved}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Fulfilled</div>
          <div className={styles.summaryValue}>{summary.fulfilled}</div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className="filter-group search">
          <label>Search</label>
          <input
            placeholder="Search shipment number or requester..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => {
              setSearch(searchDraft.trim());
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchDraft.trim());
                setPage(1);
              }
            }}
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isPrivileged && (
          <div className="filter-group small">
            <label>Scope</label>
            <label className="shipment-toggle">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => {
                  setMineOnly(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Mine only</span>
            </label>
          </div>
        )}

        <div className="filter-group apply">
          <button className="apply-button secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className={styles.summaryBar}>
        <div>
          Showing <strong>{shipments.length}</strong> shipments
        </div>
        <div>
          Total results: <strong>{total}</strong>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading && (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading shipments…</span>
          </div>
        )}

        <table className={`shipments-table ${loading ? "blurred" : ""}`}>
          <thead>
            <tr>
              <th>Shipment</th>
              <th>Status</th>
              <th>Requester</th>
              <th>Created By</th>
              <th className="numeric">Lines</th>
              <th className="numeric">Requested Qty</th>
              <th>Created</th>
              <th>Updated Lifecycle</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {shipments.map((shipment) => {
              const lifecycleDate =
                shipment.fulfilled_at ||
                shipment.approved_at ||
                shipment.submitted_at ||
                null;

              return (
                <tr key={shipment.id}>
                  <td>
                    <div className={styles.numberCell}>
                      <div className={styles.number}>
                        {shipment.shipment_number}
                      </div>
                      {shipment.notes && (
                        <div className={styles.notesPreview}>
                          {shipment.notes}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className={statusClass(shipment.status)}>
                      {shipment.status}
                    </span>
                  </td>

                  <td>
                    <div className={styles.requesterCell}>
                      <div>{shipment.requester_profile.full_name || "—"}</div>
                      <div className="muted">
                        {shipment.requester_profile.delivery_address || "—"}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className={styles.createdByCell}>
                      <div>{shipment.created_by.full_name || "—"}</div>
                      <div className="muted">
                        {shipment.created_by.email || "—"}
                      </div>
                    </div>
                  </td>

                  <td className="numeric">{shipment.line_count}</td>
                  <td className="numeric">
                    {shipment.total_requested_quantity}
                  </td>
                  <td>{formatDate(shipment.created_at)}</td>
                  <td>{formatDate(lifecycleDate)}</td>

                  <td className="actions">
                    <Link
                      className="view-button"
                      to={`/shipments/${shipment.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}

            {!loading && shipments.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className={styles.empty}>
                    No shipments match the current filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage(1)}
          >
            First
          </button>

          <button
            className="page-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
        </div>

        <span className={styles.pageStatus}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>

        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>

          <button
            className="page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(totalPages)}
          >
            Last
          </button>
        </div>

        <div className="page-size-control">
          <label>Items Per Page</label>
          <select
            value={pageSize}
            disabled={loading}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
