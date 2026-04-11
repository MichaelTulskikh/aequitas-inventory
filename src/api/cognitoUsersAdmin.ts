import { apiFetch } from "./client";

export type AdminCognitoUserAttribute = {
  Name: string;
  Value: string;
};

export type AdminCognitoUser = {
  username: string;
  sub: string | null;
  email: string | null;
  phone_number: string | null;
  name: string | null;
//   given_name: string | null;
//   family_name: string | null;
  enabled: boolean;
  user_status: string;
  email_verified: boolean;
  phone_number_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  mfa_enabled: boolean;
  mfa_methods: string[];
  groups: string[];
};

export type AdminCognitoUserDetail = AdminCognitoUser & {
  attributes: AdminCognitoUserAttribute[];
};

export async function fetchCognitoUsersAdmin(params?: {
  q?: string;
  status?: string;
  enabled?: boolean;
  limit?: number;
  pagination_token?: string;
}): Promise<{ users: AdminCognitoUser[]; pagination_token: string | null }> {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.enabled !== undefined) query.set("enabled", String(params.enabled));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.pagination_token) {
    query.set("pagination_token", params.pagination_token);
  }

  const qs = query.toString();
  return apiFetch(`/v2/cognito-users-admin${qs ? `?${qs}` : ""}`);
}

export async function getCognitoUserAdmin(
  username: string
): Promise<{ user: AdminCognitoUserDetail }> {
  return apiFetch(`/v2/cognito-users-admin/${encodeURIComponent(username)}`);
}

export async function inviteCognitoUserAdmin(body: {
  email: string;
  phone_number?: string | null;
  name?: string | null;
//   given_name?: string | null;
//   family_name?: string | null;
}): Promise<{ user: AdminCognitoUserDetail }> {
  return apiFetch(`/v2/cognito-users-admin`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCognitoUserAdmin(
  username: string,
  body: {
    email?: string | null;
    phone_number?: string | null;
    name?: string | null;
    // given_name?: string | null;
    // family_name?: string | null;
    email_verified?: boolean | null;
    phone_number_verified?: boolean | null;
  }
): Promise<{ user: AdminCognitoUserDetail }> {
  return apiFetch(`/v2/cognito-users-admin/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function resetCognitoUserPasswordAdmin(username: string) {
  return apiFetch(
    `/v2/cognito-users-admin/${encodeURIComponent(username)}/reset-password`,
    { method: "POST" }
  );
}

export async function enableCognitoUserAdmin(username: string) {
  return apiFetch(
    `/v2/cognito-users-admin/${encodeURIComponent(username)}/enable`,
    { method: "POST" }
  );
}

export async function disableCognitoUserAdmin(username: string) {
  return apiFetch(
    `/v2/cognito-users-admin/${encodeURIComponent(username)}/disable`,
    { method: "POST" }
  );
}