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

  // navigate -> home (? maybe add actual not allowed message later) if no user authenticated
  if (!user) {
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }

  const isAllowed = user.roles.some((role) => allow.includes(role as Role));

  if (!isAllowed) {
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
