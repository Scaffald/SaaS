/**
 * tRPC Client Configuration
 * REQ-286: tRPC Client Setup
 *
 * Provides type-safe API client for React frontend.
 * Integrates with React Query for data fetching, caching, and state management.
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/api/root';
import superjson from 'superjson';

/**
 * tRPC React hooks
 *
 * Provides type-safe hooks for calling API procedures.
 * Usage:
 * ```tsx
 * const { data, isLoading } = trpc.organization.get.useQuery({
 *   organizationId: '...'
 * });
 * ```
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get API URL based on environment
 *
 * Development: Use Vite dev server proxy or standalone server
 * Production: Use deployed API endpoint
 */
function getBaseUrl() {
  // Browser should use relative path
  if (typeof window !== 'undefined') {
    return '';
  }

  // SSR should use absolute URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Development default
  return 'http://localhost:5173';
}

/**
 * Create tRPC client
 *
 * Configures the tRPC client with:
 * - HTTP batch link for request batching
 * - SuperJSON transformer for proper type serialization
 * - Authentication headers from Supabase
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,

        // Add authentication headers
        async headers() {
          const headers: Record<string, string> = {
            'content-type': 'application/json',
          };

          // Get Supabase session token if available
          if (typeof window !== 'undefined') {
            try {
              // Import dynamically to avoid SSR issues
              const { supabase } = await import('./supabase');
              const { data: { session } } = await supabase.auth.getSession();

              if (session?.access_token) {
                headers.authorization = `Bearer ${session.access_token}`;
              }
            } catch (error) {
              console.error('Error getting auth headers:', error);
            }
          }

          return headers;
        },
      }),
    ],

    // Use SuperJSON for proper Date, Map, Set serialization
    transformer: superjson,
  });
}
