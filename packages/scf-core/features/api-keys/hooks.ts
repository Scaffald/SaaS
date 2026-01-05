/**
 * API Keys Hooks
 * React hooks for managing API keys using tRPC
 */

import { api } from '@scf/core/utils/api'

/**
 * Hook to list all API keys for the current user's organization
 *
 * @example
 * ```tsx
 * const { data: keys, isLoading } = useAPIKeys()
 * ```
 */
export const useAPIKeys = () => {
  return api.apiKeys.list.useQuery()
}

/**
 * Hook to create a new API key
 *
 * @example
 * ```tsx
 * const createKey = useCreateAPIKey()
 *
 * createKey.mutate({
 *   name: 'Production API Key',
 *   scopes: ['read:jobs', 'read:applications'],
 *   environment: 'live',
 *   expires_at: '2025-12-31T23:59:59Z',
 *   rate_limit_tier: 'pro',
 * })
 * ```
 */
export const useCreateAPIKey = () => {
  const utils = api.useUtils()

  return api.apiKeys.create.useMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after creating a key
      utils.apiKeys.list.invalidate()
    },
  })
}

/**
 * Hook to update an API key (name, scopes, or active status)
 *
 * @example
 * ```tsx
 * const updateKey = useUpdateAPIKey()
 *
 * updateKey.mutate({
 *   id: 'key-id',
 *   scopes: ['read:jobs', 'write:jobs'],
 * })
 * ```
 */
export const useUpdateAPIKey = () => {
  const utils = api.useUtils()

  return api.apiKeys.update.useMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after updating
      utils.apiKeys.list.invalidate()
    },
  })
}

/**
 * Hook to revoke (soft delete) an API key
 *
 * @example
 * ```tsx
 * const revokeKey = useRevokeAPIKey()
 *
 * revokeKey.mutate({ id: 'key-id' })
 * ```
 */
export const useRevokeAPIKey = () => {
  const utils = api.useUtils()

  return api.apiKeys.revoke.useMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after revoking
      utils.apiKeys.list.invalidate()
    },
  })
}

/**
 * Hook to get usage statistics for an API key
 *
 * @param keyId - The API key ID
 * @param days - Number of days to query (default: 30, max: 90)
 *
 * @example
 * ```tsx
 * const { data: usage, isLoading } = useAPIKeyUsage('key-id', 30)
 * ```
 */
export const useAPIKeyUsage = (keyId: string, days: number = 30) => {
  return api.apiKeys.getUsage.useQuery({
    id: keyId,
    days,
  })
}
