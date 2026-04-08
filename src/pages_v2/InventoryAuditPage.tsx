import { useEffect, useState } from "react";
import {
  fetchInventoryAudit,
  type InventoryAuditRow,
} from "../api/inventoryAudit";
import "../styles_new/inventory-audit.css"

const TXN_TYPES = [
  { value: "", label: "All types" },
  { value: "receive", label: "Receive" },
  { value: "reserve", label: "Reserve" },
  { value: "unreserve", label: "Unreserve" },
  { value: "ship", label: "Ship" },
  { value: "adjust", label: "Adjust" },
];

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatAttributes(value: Record<string, unknown> | null | undefined) {
  if (!value || Object.keys(value).length === 0) return "—";
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

export default function InventoryAuditPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<InventoryAuditRow[]>([]);
  const [total, setTotal] = useState(0);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [txnType, setTxnType] = useState("");
  const [itemId, setItemId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchInventoryAudit({
        q: search || undefined,
        txn_type: txnType || undefined,
        item_id: itemId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        page_size: pageSize,
      });

      setRows(res.rows);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || "Failed to load inventory audit");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, txnType, itemId, dateFrom, dateTo, page, pageSize]);

  function clearFilters() {
    setSearchDraft("");
    setSearch("");
    setTxnType("");
    setItemId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="inventory-audit-page">
      <div className="inventory-audit-header">
        <div>
          <h1 className="inventory-audit-title">Inventory Audit</h1>
          <p className="inventory-audit-subtitle">
            Review inventory transactions, reservations, shipments, and adjustments.
          </p>
        </div>
      </div>

      {error && <div className="dashboard-error">Error: {error}</div>}

      <div className="item-catalog-filters">
        <div className="filter-group search">
          <label>Search</label>
          <input
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
            placeholder="Search item, reason, shipment number..."
          />
        </div>

        <div className="filter-group">
          <label>Transaction Type</label>
          <select
            value={txnType}
            onChange={(e) => {
              setTxnType(e.target.value);
              setPage(1);
            }}
          >
            {TXN_TYPES.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Item ID</label>
          <input
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setPage(1);
            }}
            placeholder="Optional exact item UUID"
          />
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group apply">
          <button className="apply-button secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="shipments-summary-bar">
        <div>
          Showing <strong>{rows.length}</strong> rows
        </div>
        <div>
          Total results: <strong>{total}</strong>
        </div>
      </div>

      <section className="shipment-panel">
        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading inventory audit…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="dashboard-empty">No audit rows found.</div>
        ) : (
          <table className="dashboard-table audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Lot Attributes</th>
                <th>Shipment</th>
                <th>Actor</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.inventory_txn_id}>
                  <td>{formatDateTime(row.occurred_at)}</td>
                  <td>{row.txn_type}</td>
                  <td>
                    <div>
                      <div>{row.item_name}</div>
                      <div className="muted">{row.item_id}</div>
                    </div>
                  </td>
                  <td>{row.quantity}</td>
                  <td>
                    <div>
                      <div>{row.location_name || "—"}</div>
                      <div className="muted">{row.location_path?.join(" / ") || "—"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="muted">
                      {formatAttributes(row.lot_attributes)}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{row.shipment_number || "—"}</div>
                      <div className="muted">
                        {row.shipment_line_id || row.shipment_id || "—"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{row.actor_name || "—"}</div>
                      <div className="muted">{row.actor_email || "—"}</div>
                    </div>
                  </td>
                  <td>{row.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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

        <span className="page-status">
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
          <label>Rows Per Page</label>
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