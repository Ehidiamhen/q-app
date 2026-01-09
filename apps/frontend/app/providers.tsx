'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Create QueryClient with optimized defaults
 * Reference: ENGAGEMENT_AND_FEATURES.md for caching strategy
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes to reduce unnecessary server requests
        staleTime: 1000 * 60 * 5, // 5 minutes

        // Retry once on failure (balance reliability vs UX)
        retry: 1,

        // Don't refetch on window focus (prevents excessive requests)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retry mutations once (network issues)
        retry: 1,
      },
    },
  });
}

// Browser-side QueryClient instance (singleton pattern)
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create new QueryClient
    return makeQueryClient();
  } else {
    // Browser: reuse existing QueryClient
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

/**
 * Providers wrapper component
 * Add new providers here as needed
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient with useState to avoid re-creating on each render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

