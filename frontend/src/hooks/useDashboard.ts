/** React Query hooks for dashboard metrics and health check history. */

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchHistory, fetchAllHealthChecks } from '@/services/api';

/** Fetch dashboard stats with auto-refresh every 10 seconds. Pauses polling on error. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 10_000),
    staleTime: 5_000,
  });
}

/** Fetch health check history for a specific URL. */
export function useHistory(urlId: number | null) {
  return useQuery({
    queryKey: ['history', urlId],
    queryFn: () => fetchHistory(urlId!, 50),
    enabled: urlId !== null,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 15_000),
  });
}

/** Fetch all recent health checks across all URLs. Pauses polling on error. */
export function useAllHealthChecks() {
  return useQuery({
    queryKey: ['healthchecks'],
    queryFn: () => fetchAllHealthChecks(100),
    refetchInterval: (query) => (query.state.status === 'error' ? false : 10_000),
  });
}
