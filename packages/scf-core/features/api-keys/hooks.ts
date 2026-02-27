/**
 * API Keys Hooks
 * React hooks for managing API keys using Scaffald SDK
 */

import {
  useApiKeys as useApiKeysSDK,
  useApiKeyUsage as useApiKeyUsageSDK,
  useCreateApiKeyMutation,
  useUpdateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '@scf/core/utils/api-keys-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook to list all API keys for the current user's organization
 *
 * @example
 * ```tsx
 * const { data: keys, isLoading } = useAPIKeys()
 * ```
 */
export const useAPIKeys = () => {
  return useApiKeysSDK()
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
  const queryClient = useQueryClient()

  return useCreateApiKeyMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after creating a key
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'apiKeys', 'list'] })
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
 *   params: {
 *     scopes: ['read:jobs', 'write:jobs'],
 *   }
 * })
 * ```
 */
export const useUpdateAPIKey = () => {
  const queryClient = useQueryClient()

  return useUpdateApiKeyMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after updating
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'apiKeys', 'list'] })
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
 * revokeKey.mutate('key-id')
 * ```
 */
export const useRevokeAPIKey = () => {
  const queryClient = useQueryClient()

  return useRevokeApiKeyMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch after revoking
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'apiKeys', 'list'] })
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
  return useApiKeyUsageSDK(keyId, { days })
}
