import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../utils/queryKeys";
import { fetchDashboardSummary } from "../api/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard.summary],
    queryFn: ({ signal }) => fetchDashboardSummary(signal),
    staleTime: 5 * 60 * 1000,
  });
}
