/**
 * Feedback SDK hooks.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 * User must be logged in.
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  FeedbackSubmitParams,
  FeedbackSubmitResponse,
  FeedbackGetUploadUrlParams,
  FeedbackGetUploadUrlResponse,
  GetUserFeedbackParams,
} from '@scaffald/sdk'

const FEEDBACK_KEY = ['feedback'] as const

/** Get current user's feedback history */
export function useUserFeedback(
  params?: GetUserFeedbackParams,
  options?: { staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...FEEDBACK_KEY, 'user', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.feedback.getUserFeedback(params)
    },
    enabled: !!client,
    staleTime: options?.staleTime ?? 60_000,
  })
}

export function useFeedbackSubmitMutation(
  options?: UseMutationOptions<FeedbackSubmitResponse, Error, FeedbackSubmitParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: FeedbackSubmitParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.feedback.submit(params)
    },
    ...options,
  })
}

export function useFeedbackGetUploadUrlMutation(
  options?: UseMutationOptions<
    FeedbackGetUploadUrlResponse,
    Error,
    FeedbackGetUploadUrlParams
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: FeedbackGetUploadUrlParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.feedback.getUploadUrl(params)
    },
    ...options,
  })
}
