import type { RequesterProfile } from "../types/inventoryPage.types";

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isProfileComplete(profile: RequesterProfile | null): boolean {
  if (!profile) return false;

  return [
    profile.full_name,
    profile.signing_representative_name,
    profile.edrpou,
    profile.phone,
    profile.email,
    profile.official_address,
    profile.delivery_address,
  ].every(isNonEmptyString);
}