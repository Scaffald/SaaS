/**
 * Invites (#1398): React Query hooks over the SDK's `invites` resource.
 * See .radium/scaffald-sdk.md for the pattern.
 */
import type {
  CreateInvitesParams,
  CreateInvitesResponse,
  InviteLink,
  InvitesListResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export const invitesKeys = {
  all: ['invites'] as const,
  list: () => ['invites', 'list'] as const,
  link: () => ['invites', 'link'] as const,
}

/** The caller's invites with joined / onboarded counts. */
export function useInvites(options: { enabled?: boolean } = {}) {
  const client = useScaffaldJobsClient()
  return useQuery<InvitesListResponse>({
    queryKey: invitesKeys.list(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.invites.list()
    },
    enabled: !!client && (options.enabled ?? true),
  })
}

/** The caller's personal invite link (`/i/<referral_code>`) and share text. */
export function useInviteLink(options: { enabled?: boolean } = {}) {
  const client = useScaffaldJobsClient()
  return useQuery<InviteLink>({
    queryKey: invitesKeys.link(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.invites.link()
    },
    enabled: !!client && (options.enabled ?? true),
    // The code never changes.
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useCreateInvitesMutation(
  options?: UseMutationOptions<CreateInvitesResponse, Error, CreateInvitesParams>
) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateInvitesParams) => {
      if (!client) throw new Error('Missing client')
      return client.invites.create(params)
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: invitesKeys.list() })
      return options?.onSuccess?.(...args)
    },
  })
}
