import { apiFetch } from "./client";

export type AdminRequesterProfile = {
  id: string;
  account_id: string;
  full_name: string | null;
  signing_representative_name: string | null;
  edrpou: string | null;
  phone: string | null;
  email: string | null;
  official_address: string | null;
  delivery_address: string | null;
  is_complete: boolean;
  shipment_count: number;
  last_shipment_at: string | null;
  account: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

export type AdminRequesterProfileDetail = AdminRequesterProfile;

export async function fetchRequesterProfilesAdmin(params?: {
  q?: string;
  only_incomplete?: boolean;
}): Promise<{ profiles: AdminRequesterProfile[] }> {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.only_incomplete !== undefined) {
    query.set("only_incomplete", String(params.only_incomplete));
  }

  const qs = query.toString();
  return apiFetch(`/v2/requester-profiles-admin${qs ? `?${qs}` : ""}`);
}

export async function getRequesterProfileAdmin(
  id: string,
): Promise<{ profile: AdminRequesterProfileDetail }> {
  return apiFetch(`/v2/requester-profiles-admin/${id}`);
}

export async function updateRequesterProfileAdmin(
  id: string,
  body: {
    full_name?: string | null;
    signing_representative_name?: string | null;
    edrpou?: string | null;
    phone?: string | null;
    email?: string | null;
    official_address?: string | null;
    delivery_address?: string | null;
  },
) {
  return apiFetch(`/v2/requester-profiles-admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}