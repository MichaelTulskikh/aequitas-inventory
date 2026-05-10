import { Routes, Route, Navigate } from "react-router-dom";
import { getIdToken, handleAuthRedirect, login } from "./auth/auth";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuth } from "./auth/AuthContext";

import AuthCallback from "./pages/AuthCallback";
import AppLayout from "./layout/AppLayout";
import { useEffect } from "react";

// import InventoryPage from "./pages_v2/InventoryPage/InventoryPage";
import ShipmentsPage from "./pages_v2/ShipmentsPage/ShipmentsPage";
import DashboardPage from "./pages_v2/DashboardPage/DashboardPage";
import ShipmentDetailPage from "./pages_v2/ShipmentDetailsPage/ShipmentDetailsPage";
import NewShipmentPage from "./pages_v2/NewShipmentPage/NewShipmentPage";
import MyProfilePage from "./pages_v2/MyProfilePage/MyProfilePage";
import ReceiveInventoryPage from "./pages_v2/ReceiveInventoryPage/ReceiveInventoryPage";
import ItemCatalogPage from "./pages_v2/ItemCatalogPage/ItemCatalogPage";
import CategoriesAndTagsPage from "./pages_v2/CategoriesAndTagsPage/CategoriesAndTagsPage";
import LocationsPage from "./pages_v2/LocationsPage/LocationsPage";
import RequesterProfilesAdminPage from "./pages_v2/RequesterProfilesAdminPage/RequesterProfilesAdminPage";
import InventoryAuditPage from "./pages_v2/InventoryAuditPage/InventoryAuditPage";
import SystemSettingsPage from "./pages_v2/SystemSettingsPage/SystemSettingsPage";
import InboundShipmentsPage from "./pages_v2/InboundShipmentsPage/InboundShipmentsPage";
import InventoryValuationPage from "./pages_v2/InventoryValuationPage/InventoryValuationPage";
import ApiDocsPage from "./pages_v2/ApiDocsPage/ApiDocsPage";
// import { RequireCompleteProfile } from "./auth/RequireCompleteProfile";
import WarehouseMapTab from "./pages_v2/MapPage/MapPage";
import CognitoUsersAdminPage from "./pages_v2/CognitoUsersAdminPage/CognitoUsersAdminPage";
import DeclarationsPage from "./pages_v2/DeclarationsPage/DeclarationsPage";
import DonorsPage from "./pages_v2/DonorsPage/DonorsPage";
import InventoryPageV2 from "./pages_v2/InventoryPageV2/InventoryPageV2";
import ShipmentAllocationPage from "./pages_v2/ShipmentAllocationPage/ShipmentAllocationPage";

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
  }, [setUserFromToken]);

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
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/inventory"
          element={
            // <RequireCompleteProfile>
            <InventoryPageV2 />
            // </RequireCompleteProfile>
          }
        />
        <Route path="/inventory/receive" element={<ReceiveInventoryPage />} />
        <Route
          path="/shipments"
          element={
            // <RequireCompleteProfile>
            <ShipmentsPage />
            // </RequireCompleteProfile>
          }
        />
        <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="/shipments/new" element={<NewShipmentPage />} />
        <Route path="/profile" element={<MyProfilePage />} />
        <Route path="/admin/items" element={<ItemCatalogPage />} />
        <Route path="/admin/categories" element={<CategoriesAndTagsPage />} />
        <Route path="/admin/locations" element={<LocationsPage />} />
        <Route
          path="/admin/requesters"
          element={<RequesterProfilesAdminPage />}
        />
        <Route path="/admin/inventory-audit" element={<InventoryAuditPage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />
        <Route
          path="/admin/inbound-shipments"
          element={<InboundShipmentsPage />}
        />
        <Route
          path="/admin/inventory-valuation"
          element={<InventoryValuationPage />}
        />
        <Route
          path="/admin/cognito-users"
          element={<CognitoUsersAdminPage />}
        />
        <Route path="/admin/declarations" element={<DeclarationsPage />} />
        <Route path="/admin/donors" element={<DonorsPage />} />
        <Route path="/admin/allocation" element={<ShipmentAllocationPage />} />

        <Route path="/admin/docs" element={<ApiDocsPage />} />
        <Route path="/admin/map" element={<WarehouseMapTab />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
