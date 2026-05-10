import type { IDashboardSummaryResponse } from "../utils/types/dashboard/main";
import { apiFetch } from "./client";

export async function fetchDashboardSummary(): Promise<IDashboardSummaryResponse> {
  const res = await apiFetch(`/v2/dashboard`);

  return res;
}
