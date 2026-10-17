import {
  useFollowStatus,
  useFollowOrganizationMutation,
  useUnfollowOrganizationMutation,
} from '@scf/core/utils/employers-sdk-hooks'
import type { FollowOrganizationResponse, UnfollowOrganizationResponse } from '@scaffald/sdk'
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { Button, useToast } from '@scaffald/ui'

type OrganizationIdentifier = { organizationId: string }

type FollowStatusSnapshot = {
  isFollowing: boolean
  followId: string | null
  createdAt: string | null
}

type FollowMutationContext = { previous?: FollowStatusSnapshot }

type MutationError = { message?: string }

const followStatusKey = (organizationId: string) => [
  'scaffald',
  'employers',
  'follow-status',
  organizationId,
]

/**
 * Follow / unfollow an employer, as a header action on /employers/<id>.
 *
 * It lived in the "Stay connected" rail, which on a phone stacks below About
 * and every open role — the one action the page asks of a worker was the last
 * thing on it (#1186). The header puts it beside the name at every width.
 */
export function FollowEmployerButton({ employerId }: { employerId: string }) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: followStatus, isLoading: followStatusLoading } = useFollowStatus(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const followMutation = useFollowOrganizationMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = followStatusKey(variables.organizationId)
      await queryClient.cancelQueries({ queryKey })
      const previous: FollowStatusSnapshot | undefined = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, {
        isFollowing: true,
        followedAt: previous?.createdAt ?? new Date().toISOString(),
      })

      return { previous } as FollowMutationContext
    },
    onError: (error: MutationError, variables: OrganizationIdentifier, context?: unknown) => {
      const ctx = context as FollowMutationContext | undefined
      if (ctx?.previous) {
        queryClient.setQueryData(followStatusKey(variables.organizationId), ctx.previous)
      }
      toast.show({
        title: 'Unable to follow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
    onSuccess: (data: FollowOrganizationResponse, variables: OrganizationIdentifier) => {
      queryClient.setQueryData(followStatusKey(variables.organizationId), {
        isFollowing: true,
        followedAt: data.followedAt ?? new Date().toISOString(),
      })

      toast.show({
        title: 'Following employer',
        message: 'We will tell you when they post.',
        variant: 'success',
      })
    },
  })

  const unfollowMutation = useUnfollowOrganizationMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = followStatusKey(variables.organizationId)
      await queryClient.cancelQueries({ queryKey })
      const previous: FollowStatusSnapshot | undefined = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, {
        isFollowing: false,
        followedAt: null,
      })

      return { previous } as FollowMutationContext
    },
    onError: (error: MutationError, variables: OrganizationIdentifier, context?: unknown) => {
      const ctx = context as FollowMutationContext | undefined
      if (ctx?.previous) {
        queryClient.setQueryData(followStatusKey(variables.organizationId), ctx.previous)
      }
      toast.show({
        title: 'Unable to unfollow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
    onSuccess: (_data: UnfollowOrganizationResponse, variables: OrganizationIdentifier) => {
      queryClient.setQueryData(followStatusKey(variables.organizationId), {
        isFollowing: false,
        followedAt: null,
      })

      toast.show({
        title: 'Unfollowed',
        message: 'We removed this employer from the ones you follow.',
      })
    },
  })

  const isFollowing = Boolean(followStatus?.isFollowing)
  const isMutating = followMutation.isPending || unfollowMutation.isPending
  const isDisabled = isMutating || followStatusLoading
  const icon = isDisabled ? Loader2 : isFollowing ? CheckCircle2 : UserPlus
  const label = followStatusLoading
    ? 'Checking…'
    : isMutating
      ? 'Updating…'
      : isFollowing
        ? 'Following'
        : 'Follow employer'

  const handlePress = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ organizationId: employerId })
    } else {
      followMutation.mutate({ organizationId: employerId })
    }
  }

  return (
    <Button
      size="md"
      variant={isFollowing ? 'outline' : 'filled'}
      iconStart={icon}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {label}
    </Button>
  )
}
