import { apiFetch } from "../client";

//   router.get("/api/v2/requester-profile/me", getMyRequesterProfile);
//   router.put("/api/v2/requester-profile/me", upsertMyRequesterProfile);

//   // Admin Routes
//   router.get("/api/v2/requester-profiles-admin", listRequesterProfiles);
//   router.get("/api/v2/requester-profiles-admin/:id", getRequesterProfile);
//   router.patch("/api/v2/requester-profiles-admin/:id", updateRequesterProfile);

export type GetRequesterProfileRequest = {
    id: string;
}

export type RequesterProfile = {
  id: string;
  full_name: string | null;
  signing_representative_name: string | null;
  edrpou: string | null;
  phone: string | null;
  email: string | null;
  official_address: string | null;
  delivery_address: string | null;
};

export async function getMyRequesterProfile(): Promise<{profile: RequesterProfile}> {
    return apiFetch('/v2/requester-profile/me');
}