import { useQuery, useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { VerificationQueueParams } from '@scaffald/sdk/resources/office-communities'

export function useVerificationQueue(params?: VerificationQueueParams) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'communities', 'verification-queue', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeCommunities.getVerificationQueue(params)
    },
    enabled: !!client,
  })
}

export function useApproveVerificationMutation(
  options?: UseMutationOptions<{ success: boolean; message: string }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (membershipId: string) => {
      if (!client) throw new Error('Missing client')
      return client.officeCommunities.approveVerification(membershipId)
    },
    ...options,
  })
}

export function useRejectVerificationMutation(
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    { membershipId: string; reason?: string }
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: { membershipId: string; reason?: string }) => {
      if (!client) throw new Error('Missing client')
      return client.officeCommunities.rejectVerification(params.membershipId, params.reason)
    },
    ...options,
  })
}
