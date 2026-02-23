/**
 * Office Organizations SDK Hooks
 * Hooks for office organization management. Requires office/platform role.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  ListOfficeOrganizationsParams,
  ListOrganizationRequestsParams,
  ReviewOrganizationRequestParams,
  CreateOfficeOrganizationParams,
  UpdateOfficeOrganizationParams,
} from '@scaffald/sdk'

/** Get all organizations (simple list for dropdowns) */
export function useOfficeOrganizations(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'organizations', 'all'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.getAll()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

/** List organizations with pagination */
export function useOfficeOrganizationsList(
  params?: ListOfficeOrganizationsParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'organizations', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

/** List organization requests */
export function useOfficeOrganizationRequests(
  params?: ListOrganizationRequestsParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'organizations', 'requests', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.listRequests(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

/** Check organization slug availability */
export function useCheckOrganizationSlug(
  slug: string | undefined,
  organizationId?: string,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'organizations', 'check-slug', slug, organizationId],
    queryFn: async () => {
      if (!client || !slug) throw new Error('Missing client or slug')
      return client.officeOrganizations.checkSlug(slug, organizationId)
    },
    enabled: !!client && !!slug && options?.enabled !== false,
    staleTime: 10 * 1000,
  })
}

/** Review an organization request (approve/reject) */
export function useReviewOrganizationRequestMutation(
  options?: UseMutationOptions<
    { request: unknown; organization: unknown | null },
    Error,
    { id: string; params: ReviewOrganizationRequestParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: ReviewOrganizationRequestParams }) => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.reviewRequest(id, params)
    },
    ...options,
  })
}

/** Create an organization */
export function useCreateOfficeOrganizationMutation(
  options?: UseMutationOptions<{ organization: unknown }, Error, CreateOfficeOrganizationParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateOfficeOrganizationParams) => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.create(params)
    },
    ...options,
  })
}

/** Update an organization */
export function useUpdateOfficeOrganizationMutation(
  options?: UseMutationOptions<
    { organization: unknown },
    Error,
    { id: string; params: UpdateOfficeOrganizationParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateOfficeOrganizationParams }) => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.update(id, params)
    },
    ...options,
  })
}

/** Delete an organization */
export function useDeleteOfficeOrganizationMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.officeOrganizations.delete(id)
    },
    ...options,
  })
}
