import { Link, Outlet } from "react-router-dom";
import { logout, getIdToken } from "../auth/auth";
import "../styles/layout.css";

function parseJwt(token: string | null): any | null {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function AppLayout() {
  const claims = parseJwt(getIdToken());

  const displayName =
    claims?.name || claims?.email || claims?.["cognito:username"] || "User";
  const isAdmin = claims?.["cognito:groups"]?.includes("Admin");

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          Aequitas Warehouse
        </div>

        <nav className="app-header__nav">
          <Link to="/">Home</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/requests">My Requests</Link>
          <Link to="/admin/requests">Admin Requests</Link>
          <Link to="/admin/data">Admin Data</Link>
          <Link to="/admin/items">Admin Item Editing</Link>
        </nav>

        <div className="app-header__user">
        <span className="app-header__name">
            {displayName}
            {isAdmin && (
            <span className="admin-pill">Administrator</span>
            )}
        </span>

        <button className="app-button" onClick={logout}>
            Logout
        </button>
        </div>

      </header>

      {/* Main */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        © {new Date().getFullYear()} Aequitas · Internal Inventory System
      </footer>
    </div>
  );
}
