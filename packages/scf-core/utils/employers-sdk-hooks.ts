/**
 * Employers SDK Hooks
 * React Query hooks for employer discovery and interaction
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldClient } from '../hooks/use-scaffald-client'
import type {
  Employer,
  GetEmployersParams,
  GetEmployersResponse,
  GetEmployerByIdParams,
  EmploymentStatus,
  GetEmploymentStatusParams,
  ClaimEmploymentParams,
  ClaimEmploymentResponse,
  RemoveEmploymentParams,
  RemoveEmploymentResponse,
  FollowStatus,
  GetFollowStatusParams,
  FollowOrganizationParams,
  FollowOrganizationResponse,
  UnfollowOrganizationParams,
  UnfollowOrganizationResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get list of employers with optional filtering
 */
export function useEmployers(
  params?: GetEmployersParams,
  options?: Omit<UseQueryOptions<GetEmployersResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'employers', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Get employer by ID
 */
export function useEmployer(
  params: GetEmployerByIdParams,
  options?: Omit<UseQueryOptions<Employer>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'employers', 'detail', params.id],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.getById(params)
    },
    enabled: !!client && !!params.id && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Check if user has linked employment with an organization
 */
export function useEmploymentStatus(
  params: GetEmploymentStatusParams,
  options?: Omit<UseQueryOptions<EmploymentStatus>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'employers', 'employment-status', params.organizationId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.getEmploymentStatus(params)
    },
    enabled: !!client && !!params.organizationId && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Check if user is following an organization
 */
export function useFollowStatus(
  params: GetFollowStatusParams,
  options?: Omit<UseQueryOptions<FollowStatus>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'employers', 'follow-status', params.organizationId],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.getFollowStatus(params)
    },
    enabled: !!client && !!params.organizationId && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Link user to an organization via experience record
 */
export function useClaimEmploymentMutation(
  options?: UseMutationOptions<ClaimEmploymentResponse, Error, ClaimEmploymentParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: ClaimEmploymentParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.claimEmployment(params)
    },
    ...options,
  })
}

/**
 * Remove user's employment link to an organization
 */
export function useRemoveEmploymentMutation(
  options?: UseMutationOptions<RemoveEmploymentResponse, Error, RemoveEmploymentParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: RemoveEmploymentParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.removeEmployment(params)
    },
    ...options,
  })
}

/**
 * Follow an organization
 */
export function useFollowOrganizationMutation(
  options?: UseMutationOptions<FollowOrganizationResponse, Error, FollowOrganizationParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: FollowOrganizationParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.follow(params)
    },
    ...options,
  })
}

/**
 * Unfollow an organization
 */
export function useUnfollowOrganizationMutation(
  options?: UseMutationOptions<UnfollowOrganizationResponse, Error, UnfollowOrganizationParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: UnfollowOrganizationParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.employers.unfollow(params)
    },
    ...options,
  })
}
