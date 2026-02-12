import "../styles/requests.css";
import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from 'react';
import { fetchMyRequests } from '../api/client';

type RequestStatus = "Draft" | "Submitted" | "Approved" | "Fulfilled" | "Delivered" | "Rejected";

type Request = {
  id: string;
  created_at: string;
  status: RequestStatus;
  total_items: number;
};

function statusClass(status: RequestStatus) {
  switch (status) {
    case "Draft":
      return "status-pill status-draft";
    case "Submitted":
      return "status-pill status-submitted";
    case "Approved":
        return "status-pill status-approved";
    case "Fulfilled":
      return "status-pill status-delivered";
    case "Delivered":
        return "status-pill status-delivered";
    case "Rejected":
        return "status-pill status-rejected";
  }
}

export default function ViewerRequestsPage() {

  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return
    }

    fetchMyRequests().then(data => {
      if (data.items) setRequests(data.items);
      else if (data.request_id) {
        setRequests([{
          id: data.request_id,
          status: data.status,
          created_at: new Date().toISOString(),
          total_items: 1
        }]);
      }
    }).catch(e => setError(e.message));
  }, [user])

  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div className="requests-header">
        <h1 className="requests-title">My Requests</h1>
        <button className="app-button">
          New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="requests-empty">
          You don't have any requests yet.
        </div>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Created</th>
              <th>Status</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>{r.id.slice(0, 8)}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={statusClass(r.status)}>
                    {r.status}
                  </span>
                </td>
                <td>{r.total_items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
