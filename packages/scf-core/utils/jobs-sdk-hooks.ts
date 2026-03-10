/**
 * Jobs (and job-applications) SDK hooks. Use these instead of api.jobs.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { OfficeListJobsParams, OfficeCreateJobParams, OfficeUpdateJobParams, ListApplicationsParams, OfficeJob, GetUploadUrlParams, ConfirmUploadParams, SendMessageParams, CreateApplicationParams, UpdateApplicationParams } from '@scaffald/sdk'
import type { Job } from '@scaffald/sdk/resources/jobs'

/** Office list jobs (office role). Organization/team filtering. */
export function useOfficeListJobs(
  params?: OfficeListJobsParams,
  options?: { enabled?: boolean; staleTime?: number; retry?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['jobs', 'office', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.jobs.officeListJobs(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 60 * 1000,
    retry: options?.retry ?? true,
  })
}

export function useJobDetails(jobId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['job', 'details', jobId],
    queryFn: async () => {
      if (!client || !jobId) throw new Error('Missing client or jobId')
      return client.jobs.retrieve(jobId)
    },
    enabled: !!client && !!jobId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useExternalJobs(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['jobs', 'external'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.jobs.listExternal()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePublishedJobs(
  params?: { search?: string; limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['jobs', 'published', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.jobs.list({ status: 'published', ...params })
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

/** External job filter options (industries, job types, locations) - for discover filters. */
export function useFilterOptions() {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['jobs', 'filterOptions', 'external'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.jobs.externalFilterOptions()
    },
    enabled: !!client,
    staleTime: 5 * 60 * 1000,
  })
}

export function useJobsWithSoftSkillsMatch(
  params?: {
    minMatchScore?: number
    sortBy?: 'match_score'
    limit?: number
    offset?: number
  },
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['jobs', 'softSkillsMatch', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.jobs.getJobsWithSoftSkillsMatch(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCalculateSoftSkillsMatch(
  jobId: string | undefined,
  options?: { userId?: string; enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['job', 'softSkillsMatch', jobId, options?.userId],
    queryFn: async () => {
      if (!client || !jobId) throw new Error('Missing client or jobId')
      return client.jobs.calculateSoftSkillsMatch(jobId, options?.userId)
    },
    enabled: !!client && !!jobId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyApplicationForJob(jobId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['application', 'my', jobId],
    queryFn: async () => {
      if (!client || !jobId) throw new Error('Missing client or jobId')
      return client.applications.getMyForJob(jobId)
    },
    enabled: !!client && !!jobId && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateJobApplicationMutation(
  options?: Partial<{
    onSuccess: (data: { id: string }) => void
    onError: (error: { message?: string }) => void
  }>
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

export function useUpdateJobApplicationMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, params }: { id: string; params: UpdateApplicationParams }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.update(id, params)
    },
  })
}

export function useUserApplications(
  params?: ListApplicationsParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['applications', 'user', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.applications.list(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useApplicationById(id: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      if (!client || !id) throw new Error('Missing client or id')
      return client.applications.retrieve(id)
    },
    enabled: !!client && !!id && options?.enabled !== false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useWithdrawApplicationMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.withdraw(id, { reason })
    },
  })
}

export function useGetUploadUrlMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: GetUploadUrlParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.getUploadUrl(params)
    },
  })
}

export function useConfirmUploadMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: ConfirmUploadParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.confirmUpload(params)
    },
  })
}

export function useApplicationMessages(
  applicationId: string | undefined,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['application', applicationId, 'messages'],
    queryFn: async () => {
      if (!client || !applicationId) throw new Error('Missing client or applicationId')
      return client.applications.getMessages(applicationId)
    },
    enabled: !!client && !!applicationId && options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds for messages
  })
}

export function useSendApplicationMessageMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!client) throw new Error('Missing client')
      return client.applications.sendMessage(params)
    },
  })
}

/** Office: Create a new job (admin role required) */
export function useOfficeCreateJobMutation(
  options?: UseMutationOptions<Job, Error, OfficeCreateJobParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<Job, Error, OfficeCreateJobParams>({
    mutationFn: async (params: OfficeCreateJobParams) => {
      if (!client) throw new Error('Missing client')
      return client.jobs.officeCreateJob(params)
    },
    ...options,
  })
}

/** Office: Delete a job (admin role required) */
export function useOfficeDeleteJobMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.jobs.officeDeleteJob(id)
    },
    ...options,
  })
}

/** Office: Duplicate a job (admin role required) */
export function useOfficeDuplicateJobMutation(
  options?: UseMutationOptions<{ job: OfficeJob }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ job: OfficeJob }, Error, string>({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.jobs.officeDuplicateJob(id)
    },
    ...options,
  })
}

/** Office: Update an existing job (admin role required) */
export function useOfficeUpdateJobMutation(
  options?: UseMutationOptions<Job, Error, { id: string; params: OfficeUpdateJobParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<Job, Error, { id: string; params: OfficeUpdateJobParams }>({
    mutationFn: async ({ id, params }: { id: string; params: OfficeUpdateJobParams }) => {
      if (!client) throw new Error('Missing client')
      return client.jobs.officeUpdateJob(id, params)
    },
    ...options,
  })
}
