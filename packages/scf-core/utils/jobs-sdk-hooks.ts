/**
 * Jobs (and job-applications) SDK hooks. Use these instead of api.jobs.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

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
      return client.jobs.list({ status: 'open', ...params })
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
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
    mutationFn: async (params: Parameters<typeof client.applications.create>[0]) => {
      if (!client) throw new Error('Missing client')
      return client.applications.create(params)
    },
    ...options,
  })
}

export function useUpdateJobApplicationMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async ({
      id,
      params,
    }: {
      id: string
      params: {
        status?: string
        current_location?: string
        willing_to_relocate?: boolean
        years_experience?: number
        is_authorized_to_work?: boolean
        earliest_start_date?: string
        custom_question_answers?: unknown[]
        attachments?: Record<string, unknown>
        completed_steps?: string[]
        is_complete?: boolean
      }
    }) => {
      if (!client) throw new Error('Missing client')
      return client.applications.update(id, params)
    },
  })
}

export function useUserApplications(
  params?: { status?: string; limit?: number; offset?: number },
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
    mutationFn: async (params: Parameters<typeof client.applications.getUploadUrl>[0]) => {
      if (!client) throw new Error('Missing client')
      return client.applications.getUploadUrl(params)
    },
  })
}

export function useConfirmUploadMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: Parameters<typeof client.applications.confirmUpload>[0]) => {
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
    mutationFn: async (params: Parameters<typeof client.applications.sendMessage>[0]) => {
      if (!client) throw new Error('Missing client')
      return client.applications.sendMessage(params)
    },
  })
}
