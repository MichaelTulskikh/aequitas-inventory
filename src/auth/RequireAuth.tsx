import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "./auth";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getAccessToken();

  // Never guard callback
  if (location.pathname === "/auth/callback") {
    return <>{children}</>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
