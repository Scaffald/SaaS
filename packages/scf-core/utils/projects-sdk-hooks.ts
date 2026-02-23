/**
 * Projects SDK Hooks
 * React Query hooks for project management operations
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  Project,
  ProjectWithRelations,
  ProjectWorker,
  CreateProjectParams,
  UpdateProjectParams,
  ListProjectsParams,
  ListProjectsResponse,
  AddSiteParams,
  AddSiteResponse,
  AddAddressParams,
  AddAddressResponse,
  AddWorkerParams,
  ClaimWorkParams,
  ApproveWorkerParams,
  RejectWorkerParams,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get a project by ID with related data
 */
export function useProject(
  projectId: string | undefined,
  options?: Omit<UseQueryOptions<ProjectWithRelations>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'projects', 'detail', projectId],
    queryFn: async () => {
      if (!client || !projectId) throw new Error('Scaffald client or project ID not available')
      return client.projects.getById({ id: projectId })
    },
    enabled: !!client && !!projectId && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * List projects with pagination and filters
 */
export function useProjects(
  params?: ListProjectsParams,
  options?: Omit<UseQueryOptions<ListProjectsResponse>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['scaffald', 'projects', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new project
 */
export function useCreateProjectMutation(
  options?: UseMutationOptions<Project, Error, CreateProjectParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: CreateProjectParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.create(params)
    },
    ...options,
  })
}

/**
 * Update a project
 */
export function useUpdateProjectMutation(
  options?: UseMutationOptions<Project, Error, UpdateProjectParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateProjectParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.update(params)
    },
    ...options,
  })
}

/**
 * Add a site to a project
 */
export function useAddSiteMutation(
  options?: UseMutationOptions<AddSiteResponse, Error, AddSiteParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddSiteParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.addSite(params)
    },
    ...options,
  })
}

/**
 * Add an address to a project
 */
export function useAddAddressMutation(
  options?: UseMutationOptions<AddAddressResponse, Error, AddAddressParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddAddressParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.addAddress(params)
    },
    ...options,
  })
}

/**
 * Manager assigns a worker to a project
 */
export function useAddWorkerMutation(
  options?: UseMutationOptions<ProjectWorker, Error, AddWorkerParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: AddWorkerParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.addWorker(params)
    },
    ...options,
  })
}

/**
 * Worker claims they worked on a project
 */
export function useClaimWorkMutation(
  options?: UseMutationOptions<ProjectWorker, Error, ClaimWorkParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ClaimWorkParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.claimWork(params)
    },
    ...options,
  })
}

/**
 * Manager approves a worker claim
 */
export function useApproveWorkerMutation(
  options?: UseMutationOptions<ProjectWorker, Error, ApproveWorkerParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: ApproveWorkerParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.approveWorker(params)
    },
    ...options,
  })
}

/**
 * Manager rejects a worker claim
 */
export function useRejectWorkerMutation(
  options?: UseMutationOptions<ProjectWorker, Error, RejectWorkerParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: RejectWorkerParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.projects.rejectWorker(params)
    },
    ...options,
  })
}
