import { apiFetch } from "./client";

const ENDPOINT = "requester-profile";

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
  return apiFetch(`/v2/${ENDPOINT}/me`);
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
  return apiFetch(`/v2/${ENDPOINT}/me`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
