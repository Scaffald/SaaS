/**
 * Applications SDK hooks. Use these instead of api.applications.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  Application,
  CreateApplicationParams,
  UpdateApplicationParams,
  WithdrawApplicationParams,
  ListApplicationsParams,
  ListEmployerApplicationsParams,
  UpdateEmployerApplicationParams,
  EmployerApplication,
  GetUploadUrlParams,
  GetUploadUrlResponse,
  ConfirmUploadParams,
  SendMessageParams,
  ApplicationMessage,
} from '@scaffald/sdk/resources/applications'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** Get a specific application by ID */
export function useApplication(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'retrieve', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.applications.retrieve(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get current user's application for a specific job */
export function useMyApplicationForJob(jobId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'my-for-job', jobId],
    queryFn: async () => {
      if (!client || !jobId) throw new Error('Missing client or jobId')
      return client.applications.getMyForJob(jobId)
    },
    enabled: !!client && !!jobId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * List applications to jobs posted by organizations the caller can act for.
 *
 * The employer-side counterpart to `useApplications` — that one is the
 * candidate's own applications, which is what a recruiter calling it would get
 * (normally none). This is what the office pipeline needs.
 */
export function useEmployerApplications(
  params?: ListEmployerApplicationsParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'employer-list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.applications.listForOrganization(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** List current user's applications */
export function useApplications(params?: ListApplicationsParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.applications.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get activity feed for an application */
export function useApplicationActivity(
  applicationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'activity', applicationId],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return client.applications.getActivity(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

/** Get messages for an application */
export function useApplicationMessages(
  applicationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'messages', applicationId],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return client.applications.getMessages(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute - messages are more real-time
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Create a new job application */
export function useCreateApplicationMutation(
  options?: UseMutationOptions<Application, Error, CreateApplicationParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateApplicationParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.create(params)
    },
    ...options,
  })
}

/** Update an application */
export function useUpdateApplicationMutation(
  options?: UseMutationOptions<Application, Error, { id: string; params: UpdateApplicationParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateApplicationParams }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.update(id, params)
    },
    ...options,
  })
}

/**
 * Move an application through the pipeline, or reassign it.
 *
 * The employer-side counterpart to `useUpdateApplicationMutation`, which is the
 * applicant's and can no longer change status — the server strips it, because
 * while it did not an applicant could promote themselves to `hired`.
 */
export function useUpdateEmployerApplicationMutation(
  options?: UseMutationOptions<
    EmployerApplication,
    Error,
    { id: string; params: UpdateEmployerApplicationParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateEmployerApplicationParams }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.updateForOrganization(id, params)
    },
    ...options,
  })
}

/** Withdraw an application */
export function useWithdrawApplicationMutation(
  options?: UseMutationOptions<
    Application,
    Error,
    { id: string; params?: WithdrawApplicationParams }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params?: WithdrawApplicationParams }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.withdraw(id, params)
    },
    ...options,
  })
}

/** Get presigned upload URL for application attachment */
export function useGetUploadUrlMutation(
  options?: UseMutationOptions<GetUploadUrlResponse, Error, GetUploadUrlParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: GetUploadUrlParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.getUploadUrl(params)
    },
    ...options,
  })
}

/** Confirm successful file upload */
export function useConfirmUploadMutation(
  options?: UseMutationOptions<Application, Error, ConfirmUploadParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: ConfirmUploadParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.confirmUpload(params)
    },
    ...options,
  })
}

/** Send a message on an application */
export function useSendMessageMutation(
  options?: UseMutationOptions<ApplicationMessage, Error, SendMessageParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.sendMessage(params)
    },
    ...options,
  })
}
