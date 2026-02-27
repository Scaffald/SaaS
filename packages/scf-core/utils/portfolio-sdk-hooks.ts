/**
 * Portfolio SDK Hooks
 * React Query hooks for portfolio items
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  PortfolioItem,
  ListPortfolioItemsParams,
  CreatePortfolioItemParams,
  UpdatePortfolioItemParams,
  DeletePortfolioItemParams,
  DeletePortfolioItemResponse,
  ReorderPortfolioItemsParams,
  ReorderPortfolioItemsResponse,
  UploadPortfolioImageParams,
  UploadPortfolioImageResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List portfolio items
 */
export function usePortfolioItems(
  params?: ListPortfolioItemsParams,
  options?: Omit<UseQueryOptions<PortfolioItem[]>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'portfolio', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new portfolio item
 */
export function useCreatePortfolioItemMutation(
  options?: UseMutationOptions<PortfolioItem, Error, CreatePortfolioItemParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreatePortfolioItemParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.create(params)
    },
    ...options,
  })
}

/**
 * Update a portfolio item
 */
export function useUpdatePortfolioItemMutation(
  options?: UseMutationOptions<PortfolioItem, Error, UpdatePortfolioItemParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdatePortfolioItemParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.update(params)
    },
    ...options,
  })
}

/**
 * Delete a portfolio item
 */
export function useDeletePortfolioItemMutation(
  options?: UseMutationOptions<DeletePortfolioItemResponse, Error, DeletePortfolioItemParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: DeletePortfolioItemParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.delete(params)
    },
    ...options,
  })
}

/**
 * Reorder portfolio items
 */
export function useReorderPortfolioItemsMutation(
  options?: UseMutationOptions<ReorderPortfolioItemsResponse, Error, ReorderPortfolioItemsParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ReorderPortfolioItemsParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.reorder(params)
    },
    ...options,
  })
}

/**
 * Upload portfolio image
 */
export function useUploadPortfolioImageMutation(
  options?: UseMutationOptions<UploadPortfolioImageResponse, Error, UploadPortfolioImageParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UploadPortfolioImageParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.portfolio.uploadImage(params)
    },
    ...options,
  })
}
