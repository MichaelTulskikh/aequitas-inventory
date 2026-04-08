import { apiFetch } from "./client";

export type AdminLocation = {
  id: string;
  parent_location_id: string | null;
  name: string;
  code: string | null;
  type: string;
  is_active: boolean;
  path: string[];
};

export async function fetchLocations(): Promise<{ locations: AdminLocation[] }> {
  return apiFetch(`/v2/locations-admin`);
}

export async function createLocation(body: {
  name: string;
  code?: string | null;
  parent_location_id?: string | null;
  type: string;
  is_active?: boolean;
}) {
  return apiFetch(`/v2/locations-admin`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateLocation(
  id: string,
  body: {
    name?: string;
    code?: string | null;
    parent_location_id?: string | null;
    type?: string;
    is_active?: boolean;
  },
) {
  return apiFetch(`/v2/locations-admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}