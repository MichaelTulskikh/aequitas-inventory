import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/admin-requests.css";

type Request = {
  id: string;
  status: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  line_count: number;
  total_qty: number;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<string>("");

  const load = async () => {
    const q = filter ? `?status=${filter}` : "";
    const r = await apiFetch(`/admin/requests${q}`);
    setRequests(r.requests);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const action = async (id: string, type: string) => {
    await apiFetch(`/admin/requests/${id}/${type}`, { method: "POST" });
    load();
  };

  return (
    <div className="admin-requests">
      <div className="admin-header">
        <h1>All Requests</h1>

        <div className="status-filter">
          {["", "draft", "submitted", "approved", "delivered", "rejected"].map(
            (status) => {
              const label = status === "" ? "All" : status;
              return (
                <button
                  key={status || "all"}
                  className={`status-btn ${filter === status ? "active" : ""}`}
                  onClick={() => setFilter(status)}
                >
                  {label}
                </button>
              );
            },
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Requester</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total Qty</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.id.slice(0, 8)}</td>
              <td>
                <strong>{r.requester_name}</strong>
                <div className="email">{r.requester_email}</div>
              </td>
              <td>
                <span className={`pill pill-${r.status}`}>{r.status}</span>
              </td>
              <td>{r.line_count}</td>
              <td>{r.total_qty}</td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                {r.status === "submitted" && (
                  <>
                    <button onClick={() => action(r.id, "approve")}>
                      Approve
                    </button>
                    <button
                      className="danger"
                      onClick={() => action(r.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {r.status === "approved" && (
                  <button onClick={() => action(r.id, "deliver")}>
                    Mark Delivered
                  </button>
                )}

                {r.status === "draft" && <>Not yet submitted for approval</>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
