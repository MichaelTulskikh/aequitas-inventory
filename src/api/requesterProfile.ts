import { apiFetch } from "./client";

export type MyRequesterProfileResponse = {
  profile: {
    id: string;
    full_name: string | null;
    signing_representative_name: string | null;
    edrpou: string | null;
    phone: string | null;
    email: string | null;
    official_address: string | null;
    delivery_address: string | null;
  } | null;
};

export async function getMyRequesterProfile(): Promise<MyRequesterProfileResponse> {
  return apiFetch(`/v2/requester-profile/me`);
}

export async function upsertMyRequesterProfile(body: {
  full_name?: string | null;
  signing_representative_name?: string | null;
  edrpou?: string | null;
  phone?: string | null;
  email?: string | null;
  official_address?: string | null;
  delivery_address?: string | null;
}) {
  return apiFetch(`/v2/requester-profile/me`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}