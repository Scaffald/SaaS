/**
 * Interview self-scheduling SDK hooks (v1.12.0 / SC-137).
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  CreateInterviewSlotParams,
  CreateSchedulingLinkParams,
  EmployerInterviewSlot,
  EmployerSchedulingLink,
  InterviewBooking,
  ListEmployerSchedulingParams,
} from '@scaffald/sdk'

/** Resolve a scheduling link (proposed slots + org/job context) by token. */
export function useSchedulingLink(token: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scheduling', 'link', token],
    queryFn: async () => {
      if (!client || !token) throw new Error('Missing client or token')
      return client.scheduling.getLink(token)
    },
    enabled: !!client && !!token && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Book a proposed slot via the scheduling link token. mutate(slotId). */
export function useBookSlotMutation(
  token: string,
  options?: UseMutationOptions<InterviewBooking, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (slotId: string) => {
      if (!client) throw new Error('Missing client')
      return client.scheduling.bookSlot(token, slotId)
    },
    ...options,
  })
}

// ============================================================================
// EMPLOYER SIDE
//
// The hooks above are the candidate's: they address a single application
// through a link token. The office scheduling screen is organisation-wide, so
// these take an optional `application_id` and otherwise span every
// organisation the caller can act for.
// ============================================================================

/** Interview slots from the hiring side. Omit params for the org-wide schedule. */
export function useEmployerInterviewSlots(
  params?: ListEmployerSchedulingParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scheduling', 'employer-slots', params ?? null],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.scheduling.listSlots(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Self-scheduling links from the hiring side. */
export function useEmployerSchedulingLinks(
  params?: ListEmployerSchedulingParams,
  options?: { enabled?: boolean }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scheduling', 'employer-links', params ?? null],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.scheduling.listLinks(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Propose an interview slot to a candidate. */
export function useCreateInterviewSlotMutation(
  options?: UseMutationOptions<EmployerInterviewSlot, Error, CreateInterviewSlotParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateInterviewSlotParams) => {
      if (!client) throw new Error('Missing client')
      return client.scheduling.createSlot(params)
    },
    ...options,
    onSuccess: (...args) => {
      // Invalidate every scoping of the slot list — the org-wide query and any
      // per-application one both now hold a stale result.
      void queryClient.invalidateQueries({ queryKey: ['scheduling', 'employer-slots'] })
      options?.onSuccess?.(...args)
    },
  })
}

/** Mint a self-scheduling link. The token is generated server-side. */
export function useCreateSchedulingLinkMutation(
  options?: UseMutationOptions<EmployerSchedulingLink, Error, CreateSchedulingLinkParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateSchedulingLinkParams) => {
      if (!client) throw new Error('Missing client')
      return client.scheduling.createLink(params)
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['scheduling', 'employer-links'] })
      options?.onSuccess?.(...args)
    },
  })
}
