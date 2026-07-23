import type { IDashboardSummaryResponse } from "../utils/types/dashboard/main";
import { apiFetch } from "./client";

const ENDPOINT = "dashboard";

export async function fetchDashboardSummary(
  signal?: AbortSignal,
): Promise<IDashboardSummaryResponse> {
  return apiFetch<IDashboardSummaryResponse>(`/v2/${ENDPOINT}`, { signal });
}
