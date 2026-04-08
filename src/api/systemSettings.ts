import { apiFetch } from "./client";

export type SystemSettingsResponse = {
  environment: {
    name: string | null;
    region: string | null;
    version: string | null;
  };
  roles: string[];
  settings: Record<string, unknown>;
};

export async function fetchSystemSettings(): Promise<SystemSettingsResponse> {
  return apiFetch(`/v2/system-settings`);
}

export async function updateSystemSettings(
  settings: Record<string, unknown>,
): Promise<SystemSettingsResponse> {
  return apiFetch(`/v2/system-settings`, {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}