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
    enabled: !!client && !!jobId && (options?.enabled !== false),
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
    enabled: !!client && (options?.enabled !== false),
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
    enabled: !!client && (options?.enabled !== false),
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
    enabled: !!client && (options?.enabled !== false),
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
    enabled: !!client && !!jobId && (options?.enabled !== false),
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
    enabled: !!client && !!jobId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateJobApplicationMutation() {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: Parameters<typeof client.applications.create>[0]) => {
      if (!client) throw new Error('Missing client')
      return client.applications.create(params)
    },
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
