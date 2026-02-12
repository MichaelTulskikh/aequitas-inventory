import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "./AuthContext";

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const loc = useLocation();

  // not logged in at all
  if (!user) {
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }

  // check if ANY user role is allowed
  const isAllowed = user.roles.some((role) => allow.includes(role as Role));

  if (!isAllowed) {
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
