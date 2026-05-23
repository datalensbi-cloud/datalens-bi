import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — most BI data is OK to be slightly stale
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
