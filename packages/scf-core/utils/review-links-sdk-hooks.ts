/**
 * React Query hooks for the SC-38 shareable review link API.
 *
 * Three modes:
 *   - Worker-authed: create/list/revoke their own links.
 *   - Anon-by-token: look up a link by token (for the public form).
 *   - Anon-by-token: submit a review.
 */

import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  CreateReviewLinkParams,
  ReviewLink,
  ReviewLinkLookup,
  SubmitReviewByTokenParams,
  SubmitReviewByTokenResponse,
} from '@scaffald/sdk/resources/review-links'
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

const REVIEW_LINKS_QUERY_KEY = ['reviewLinks'] as const

/** List the current worker's review links. Auth required. */
export function useMyReviewLinks(
  options?: Omit<UseQueryOptions<ReviewLink[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...REVIEW_LINKS_QUERY_KEY, 'mine'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.reviewLinks.list()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
    ...options,
  })
}

/** Create a new shareable review link. */
export function useCreateReviewLinkMutation(
  options?: UseMutationOptions<ReviewLink, Error, CreateReviewLinkParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateReviewLinkParams) => {
      if (!client) throw new Error('Missing client')
      return client.reviewLinks.create(params)
    },
    ...options,
  })
}

/** Revoke a review link. */
export function useRevokeReviewLinkMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.reviewLinks.revoke(id)
    },
    ...options,
  })
}

/**
 * Look up a review link by token. Anon-safe — used by the public
 * review submission route to display the worker's name/photo before
 * the reviewer fills out the form.
 */
export function useReviewLinkByToken(
  token: string | undefined,
  options?: Omit<UseQueryOptions<ReviewLinkLookup, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: [...REVIEW_LINKS_QUERY_KEY, 'byToken', token],
    queryFn: async () => {
      if (!client || !token) throw new Error('Missing client or token')
      return client.reviewLinks.getByToken(token)
    },
    enabled: !!client && !!token && options?.enabled !== false,
    retry: false,
    staleTime: 60 * 1000,
    ...options,
  })
}

/** Submit a review via a shared token. Anon. */
export function useSubmitReviewByTokenMutation(
  token: string,
  options?: UseMutationOptions<
    SubmitReviewByTokenResponse,
    Error,
    SubmitReviewByTokenParams
  >
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SubmitReviewByTokenParams) => {
      if (!client) throw new Error('Missing client')
      return client.reviewLinks.submitByToken(token, params)
    },
    ...options,
  })
}
