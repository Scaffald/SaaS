/**
 * tRPC Custom Hooks
 * REQ-286: tRPC Client Setup
 *
 * Provides convenient hooks for common tRPC patterns.
 */

import { trpc } from '../lib/trpc';

/**
 * Hook to access tRPC utilities
 *
 * Provides access to tRPC utilities like invalidation, prefetching, etc.
 *
 * @example
 * ```tsx
 * const utils = useTRPCUtils();
 * // Invalidate organization queries
 * utils.organization.get.invalidate();
 * ```
 */
export function useTRPCUtils() {
  return trpc.useUtils();
}

/**
 * Hook to get the current user's organization
 *
 * Convenience hook that combines Supabase auth with organization data.
 *
 * @example
 * ```tsx
 * const { organization, isLoading } = useCurrentOrganization();
 * ```
 */
export function useCurrentOrganization() {
  // This will be implemented once we have the user context
  // For now, return a placeholder
  return {
    organization: null,
    isLoading: false,
    error: null,
  };
}

/**
 * Re-export tRPC hooks for convenience
 */
export { trpc };
