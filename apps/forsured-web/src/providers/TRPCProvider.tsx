/**
 * tRPC Provider Component
 * REQ-286: tRPC Client Setup
 *
 * Wraps the app with tRPC and React Query providers.
 * Enables type-safe API calls throughout the application.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc, createTRPCClient } from '../lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

/**
 * TRPCProvider Component
 *
 * Provides tRPC client and React Query client to the app.
 * Must wrap the entire application to enable tRPC hooks.
 *
 * @example
 * ```tsx
 * <TRPCProvider>
 *   <App />
 * </TRPCProvider>
 * ```
 */
export function TRPCProvider({ children }: TRPCProviderProps) {
  // Create stable instances (don't recreate on every render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus in development
            refetchOnWindowFocus: import.meta.env.PROD,
            // Retry failed requests
            retry: 1,
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
