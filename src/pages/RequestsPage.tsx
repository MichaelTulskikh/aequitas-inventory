import { useEffect, useMemo, useState } from "react";
import "../styles/requests.css";
import {
  createRequest,
  getActiveRequest,
  listMyRequests,
  submitRequest,
  getRequestById,
  type RequestRow,
  type RequestLineRow,
} from "../api/requests";

function pillClass(status: string) {
  switch (status) {
    case "draft":
      return "status-pill status-draft";
    case "submitted":
      return "status-pill status-submitted";
    case "approved":
      return "status-pill status-approved";
    case "fulfilled":
      return "status-pill status-delivered";
    case "rejected":
      return "status-pill status-rejected";
    case "cancelled":
      return "status-pill status-cancelled";
    default:
      return "status-pill";
  }
}

export default function RequestsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [active, setActive] = useState<RequestRow | null>(null);

  const [openRequest, setOpenRequest] = useState<{ req: RequestRow; lines: RequestLineRow[] } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const hasOpen = useMemo(() => !!active && ["draft", "submitted", "approved"].includes(active.status), [active]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [list, act] = await Promise.all([listMyRequests(), getActiveRequest()]);
      setRequests(list.requests);
      setActive(act.request);
    } catch (e: any) {
      setErr(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (r: RequestRow) => {
    setDetailsLoading(true);
    setErr(null);
    try {
      const d = await getRequestById(r.id);
      setOpenRequest({ req: d.request, lines: d.lines });
    } catch (e: any) {
      setErr(e?.message || "Failed to load request");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="requests-page">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">My Requests</h1>
          <div className="requests-subtitle">
            {active ? (
              <>
                Open request: <strong>{active.id.slice(0, 8)}</strong>{" "}
                <span className={pillClass(active.status)}>{active.status}</span>
              </>
            ) : (
              <>No open request</>
            )}
          </div>
        </div>

        <div className="requests-actions">
          <button
            className="app-button"
            disabled={loading || hasOpen}
            title={hasOpen ? "You already have an open request" : ""}
            onClick={async () => {
              try {
                setLoading(true);
                setErr(null);
                await createRequest();
                await load();
              } catch (e: any) {
                setErr(e?.message || "Failed to create request");
              } finally {
                setLoading(false);
              }
            }}
          >
            Create Request
          </button>

          {active && (
            <button
              className="app-button secondary"
              disabled={loading}
              onClick={() => openDetails(active)}
            >
              Open Request
            </button>
          )}
        </div>
      </div>

      {err && <div className="requests-error">{err}</div>}

      <div className="requests-help">
        Tip: Add items from the Inventory page using the <strong>Add</strong> button.
      </div>

      {loading ? (
        <div className="requests-loading">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="requests-empty">You don’t have any requests yet.</div>
      ) : (
        <div className="requests-table-wrap">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Created</th>
                <th>Status</th>
                <th className="numeric">Lines</th>
                <th className="numeric">Total Qty</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id.slice(0, 8)}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <span className={pillClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="numeric">{r.line_count ?? 0}</td>
                  <td className="numeric">{r.total_qty ?? 0}</td>
                  <td className="actions">
                    <button className="small-btn" onClick={() => openDetails(r)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request details drawer/modal */}
      {openRequest && (
        <div className="req-overlay" onClick={() => setOpenRequest(null)}>
          <div className="req-modal" onClick={(e) => e.stopPropagation()}>
            <div className="req-head">
              <div>
                <div className="req-title">
                  Request <span className="mono">{openRequest.req.id.slice(0, 8)}</span>
                </div>
                <div className="req-meta">
                  <span className={pillClass(openRequest.req.status)}>{openRequest.req.status}</span>
                  <span>Created {new Date(openRequest.req.created_at).toLocaleString()}</span>
                </div>
              </div>

              <button className="req-close" onClick={() => setOpenRequest(null)}>
                ✕
              </button>
            </div>

            <div className="req-body">
              {detailsLoading ? (
                <div>Loading…</div>
              ) : openRequest.lines.length === 0 ? (
                <div className="req-empty">No items yet. Add from Inventory.</div>
              ) : (
                <table className="req-lines">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Location</th>
                      <th className="numeric">Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRequest.lines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.item_name}</td>
                        <td>{l.location_name}</td>
                        <td className="numeric">{l.quantity}</td>
                        <td>
                          <span className={pillClass(l.status)}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="req-actions">
              <div className="req-summary">
                Total:{" "}
                <strong>
                  {openRequest.lines.reduce((a, b) => a + Number(b.quantity || 0), 0)}
                </strong>
              </div>

              {openRequest.req.status === "draft" ? (
                <button
                  className="app-button"
                  disabled={openRequest.lines.length === 0}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setErr(null);
                      await submitRequest(openRequest.req.id);
                      setOpenRequest(null);
                      await load();
                    } catch (e: any) {
                      setErr(e?.message || "Failed to submit");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Submit Request
                </button>
              ) : (
                <div className="req-note">This request is read-only.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
