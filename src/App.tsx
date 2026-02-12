import { Routes, Route, Navigate } from "react-router-dom";
import { getIdToken, handleAuthRedirect, login } from "./auth/auth";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuth } from "./auth/AuthContext";

import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";
import AuthCallback from "./pages/AuthCallback";
import AppLayout from "./layout/AppLayout";
import "./styles/login.css";
import { useEffect } from "react";
// import { RequireRole } from "./auth/RequireRole";
import AdminDataPage from "./pages/AdminDataPage";
import ItemCreationPage from "./pages/ItemCreationPage";
import RequestsPage from "./pages/RequestsPage";
import AdminRequestsPage from "./pages/AdminRequestsPage";

/* Simple login page */
function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Aequitas Inventory</h1>
        <p className="login-subtitle">
          Sign in to access the warehouse inventory
        </p>

        <button className="login-button" onClick={login}>
          Sign in
        </button>

        <div className="login-footer"></div>
      </div>
    </div>
  );
}

export default function App() {
  const { setUserFromToken } = useAuth();
  useEffect(() => {
    async function initAuth() {
      await handleAuthRedirect();

      const idToken = getIdToken();
      if (idToken) {
        setUserFromToken(idToken);
      }
    }

    initAuth();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected + Layout */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route
          path="/admin/data"
          element={
            <AdminDataPage />
            // <RequireRole allow={["[Admin]"]}>
            //   <AdminDataPage />
            // </RequireRole>
          }
        />
        <Route path="/admin/items" element={<ItemCreationPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
