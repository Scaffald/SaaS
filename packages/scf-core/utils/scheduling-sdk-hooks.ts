/**
 * Interview self-scheduling SDK hooks (v1.12.0 / SC-137).
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */
import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { InterviewBooking } from '@scaffald/sdk'

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
  options?: UseMutationOptions<InterviewBooking, Error, string>,
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
