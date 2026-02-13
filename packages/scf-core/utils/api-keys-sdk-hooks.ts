/**
 * React Query hooks for Scaffald SDK API Keys endpoints
 */

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  ApiKey,
  ApiKeyCreated,
  ApiKeyUsageStats,
  CreateApiKeyParams,
  UpdateApiKeyParams,
  GetUsageParams,
  RevokeApiKeyResponse,
} from '@scaffald/sdk'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to list all API keys for the user's organization
 */
export function useApiKeys(
  options?: Omit<UseQueryOptions<ApiKey[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'apiKeys', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.apiKeys.list()
    },
    enabled: !!client && (options?.enabled !== false),
    ...options,
  })
}

/**
 * Hook to get usage statistics for an API key
 */
export function useApiKeyUsage(
  id: string,
  params?: GetUsageParams,
  options?: Omit<UseQueryOptions<ApiKeyUsageStats, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'apiKeys', 'usage', id, params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.apiKeys.getUsage(id, params)
    },
    enabled: !!client && !!id && (options?.enabled !== false),
    ...options,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new API key
 */
export function useCreateApiKeyMutation(
  options?: UseMutationOptions<ApiKeyCreated, Error, CreateApiKeyParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateApiKeyParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.apiKeys.create(params)
    },
    ...options,
  })
}

/**
 * Hook to update an API key
 */
export function useUpdateApiKeyMutation(
  options?: UseMutationOptions<ApiKey, Error, { id: string; params: UpdateApiKeyParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateApiKeyParams }) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.apiKeys.update(id, params)
    },
    ...options,
  })
}

/**
 * Hook to revoke an API key
 */
export function useRevokeApiKeyMutation(
  options?: UseMutationOptions<RevokeApiKeyResponse, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.apiKeys.revoke(id)
    },
    ...options,
  })
}
