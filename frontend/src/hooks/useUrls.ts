/** React Query hooks for URL CRUD operations. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createURL, deleteURL, fetchURLs, updateURL } from '@/services/api';
import type { URLCreatePayload, URLUpdatePayload } from '@/types';

const URLS_KEY = ['urls'] as const;

/** Fetch all monitored URLs with auto-refresh every 10 seconds. Pauses polling on error. */
export function useURLs() {
  return useQuery({
    queryKey: URLS_KEY,
    queryFn: fetchURLs,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 10_000),
    staleTime: 5_000,
  });
}

/** Create a new monitored URL. */
export function useCreateURL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: URLCreatePayload) => createURL(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Update an existing monitored URL. */
export function useUpdateURL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: URLUpdatePayload }) =>
      updateURL(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Delete a monitored URL. */
export function useDeleteURL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteURL(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
