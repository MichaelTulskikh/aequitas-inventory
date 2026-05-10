export function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}
