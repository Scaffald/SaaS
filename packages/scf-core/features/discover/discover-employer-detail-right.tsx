import {
  useEmployer,
  useEmploymentStatus,
  useFollowStatus,
  useFollowOrganizationMutation,
  useUnfollowOrganizationMutation,
  useClaimEmploymentMutation,
  useRemoveEmploymentMutation,
} from '@scf/core/utils/employers-sdk-hooks'
import type {
  FollowOrganizationResponse,
  UnfollowOrganizationResponse,
  ClaimEmploymentResponse,
  RemoveEmploymentResponse,
} from '@scaffald/sdk'
import { useOrganizationOpenJobsCount } from '@scf/core/utils/organizations-sdk-hooks'
import { DashboardWidget } from '@scaffald/ui'
import { BellPlus, Briefcase, CheckCircle2, Loader2, Network, UserPlus } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type OrganizationIdentifier = { organizationId: string }

type FollowStatusSnapshot = {
  isFollowing: boolean
  followId: string | null
  createdAt: string | null
}

type FollowMutationContext = { previous?: FollowStatusSnapshot }

type EmploymentStatusSnapshot = {
  isLinked: boolean
  experienceId: string | null
  source: string | null
  isCurrent: boolean
  claimedAt: string | null
  createdAt: string | null
}

type EmploymentMutationContext = { previous?: EmploymentStatusSnapshot }

type MutationError = { message?: string }

type DiscoverEmployerDetailRightProps = {
  employerId: string
}

/**
 * DiscoverEmployerDetailRight
 * Renders engagement CTAs for an employer, including follow and employment claim actions.
 */
export function DiscoverEmployerDetailRight({ employerId }: DiscoverEmployerDetailRightProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: employer, isLoading } = useEmployer(
    { id: employerId },
    { enabled: Boolean(employerId) }
  )

  const { data: openJobs, isLoading: jobsLoading } = useOrganizationOpenJobsCount(
    employerId || undefined,
    { enabled: Boolean(employerId) }
  )

  const { data: followStatus, isLoading: followStatusLoading } = useFollowStatus(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const { data: employmentStatus, isLoading: employmentStatusLoading } = useEmploymentStatus(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const followMutation = useFollowOrganizationMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
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
        const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
        queryClient.setQueryData(queryKey, ctx.previous)
      }
      toast.show({
        title: 'Unable to follow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
    onSuccess: (data: FollowOrganizationResponse, variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
      queryClient.setQueryData(queryKey, {
        isFollowing: true,
        followedAt: data.followedAt ?? new Date().toISOString(),
      })

      toast.show({
        title: 'Following organization',
        message: 'We will keep you updated as new activity rolls in.',
        variant: 'success',
      })
    },
  })

  const unfollowMutation = useUnfollowOrganizationMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
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
        const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
        queryClient.setQueryData(queryKey, ctx.previous)
      }
      toast.show({
        title: 'Unable to unfollow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
    onSuccess: (_data: UnfollowOrganizationResponse, variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'follow-status', variables.organizationId]
      queryClient.setQueryData(queryKey, {
        isFollowing: false,
        followedAt: null,
      })

      toast.show({
        title: 'Unfollowed',
        message: 'We removed this organization from your followed list.',
      })
    },
  })

  const isFollowing = Boolean(followStatus?.isFollowing)
  const isFollowMutating = followMutation.isPending || unfollowMutation.isPending
  const isFollowButtonDisabled = isFollowMutating || followStatusLoading
  const followButtonIcon = isFollowButtonDisabled ? Loader2 : isFollowing ? CheckCircle2 : UserPlus
  const followButtonLabel = followStatusLoading
    ? 'Checking status...'
    : isFollowMutating
      ? 'Updating...'
      : isFollowing
        ? 'Following'
        : 'Follow Organization'

  const claimEmploymentMutation = useClaimEmploymentMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      await queryClient.cancelQueries({ queryKey })
      const previous: EmploymentStatusSnapshot | undefined = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, {
        isLinked: true,
        experienceId: previous?.experienceId ?? null,
        source: previous?.source ?? 'claim',
        isCurrent: true,
        claimedAt: previous?.claimedAt ?? new Date().toISOString(),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      })

      return { previous } as EmploymentMutationContext
    },
    onError: (error: MutationError, variables: OrganizationIdentifier, context?: unknown) => {
      const ctx = context as EmploymentMutationContext | undefined
      if (ctx?.previous) {
        const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
        queryClient.setQueryData(queryKey, ctx.previous)
      }
      toast.show({
        title: 'Unable to link employment',
        message: error.message ?? 'Please try again shortly.',
        variant: 'error',
      })
    },
    onSuccess: (data: ClaimEmploymentResponse, variables: OrganizationIdentifier) => {
      const experience = data.experience ?? null
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      queryClient.setQueryData(queryKey, {
        isLinked: true,
        experienceId: experience?.id ?? null,
        source: experience?.source ?? 'claim',
        isCurrent: experience?.is_current ?? true,
        claimedAt: experience?.claimed_at ?? new Date().toISOString(),
        createdAt: experience?.created_at ?? new Date().toISOString(),
      })

      toast.show({
        title: data.alreadyLinked ? 'Already linked' : 'Employment linked',
        message: data.alreadyLinked
          ? 'Your profile is already connected to this organization.'
          : 'We created a connection to this organization on your profile.',
        variant: 'success',
      })
    },
    onSettled: async (
      _data: ClaimEmploymentResponse | undefined,
      _error: MutationError | null,
      variables: OrganizationIdentifier
    ) => {
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const removeEmploymentMutation = useRemoveEmploymentMutation({
    onMutate: async (variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      await queryClient.cancelQueries({ queryKey })
      const previous: EmploymentStatusSnapshot | undefined = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, {
        isLinked: false,
        experienceId: null,
        source: null,
        isCurrent: false,
        claimedAt: null,
        createdAt: null,
      })

      return { previous } as EmploymentMutationContext
    },
    onError: (error: MutationError, variables: OrganizationIdentifier, context?: unknown) => {
      const ctx = context as EmploymentMutationContext | undefined
      if (ctx?.previous) {
        const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
        queryClient.setQueryData(queryKey, ctx.previous)
      }
      toast.show({
        title: 'Unable to remove link',
        message: error.message ?? 'Please try again shortly.',
        variant: 'error',
      })
    },
    onSuccess: (_data: RemoveEmploymentResponse, variables: OrganizationIdentifier) => {
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      queryClient.setQueryData(queryKey, {
        isLinked: false,
        experienceId: null,
        source: null,
        isCurrent: false,
        claimedAt: null,
        createdAt: null,
      })

      toast.show({
        title: 'Employment link removed',
        message: 'You are no longer connected to this organization.',
      })
    },
    onSettled: async (
      _data: RemoveEmploymentResponse | undefined,
      _error: MutationError | null,
      variables: OrganizationIdentifier
    ) => {
      const queryKey = ['scaffald', 'employers', 'employment-status', variables.organizationId]
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const isEmploymentLinked = Boolean(employmentStatus?.isLinked)
  const isEmploymentMutating =
    claimEmploymentMutation.isPending || removeEmploymentMutation.isPending
  const isEmploymentButtonDisabled = isEmploymentMutating || employmentStatusLoading
  const employmentButtonIcon = isEmploymentButtonDisabled
    ? Loader2
    : isEmploymentLinked
      ? CheckCircle2
      : Briefcase
  const employmentButtonLabel = employmentStatusLoading
    ? 'Checking status...'
    : isEmploymentMutating
      ? 'Updating...'
      : isEmploymentLinked
        ? 'Linked to Organization'
        : 'I Work Here'

  const organizationName = employer?.name ?? 'this organization'
  const createdAt = useMemo(() => {
    if (!employer?.created_at) return null
    return new Date(employer.created_at).toLocaleDateString()
  }, [employer?.created_at])

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ organizationId: employerId })
    } else {
      followMutation.mutate({ organizationId: employerId })
    }
  }

  const handleWorkHere = () => {
    if (isEmploymentLinked) {
      removeEmploymentMutation.mutate({ organizationId: employerId })
    } else {
      claimEmploymentMutation.mutate({ organizationId: employerId })
    }
  }

  return (
    <DashboardWidget gap={16}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <Network size={18} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
          <Text style={{ color: colors.text[t].secondary }}>Stay Connected</Text>
        </Row>
        <Text style={{ color: colors.text[t].secondary }}>
          Follow {organizationName} to get updates or claim your role to link your profile to the
          team.
        </Text>
      </Stack>

      <Separator />

      {isLoading ? (
        <Row gap={8} align="center">
          <Loader2 size="md" color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
          <Text style={{ color: colors.text[t].secondary }}>Loading organization context...</Text>
        </Row>
      ) : (
        <OrganizationSnapshot
          name={organizationName}
          createdAt={createdAt}
          openJobs={openJobs?.count}
          jobsLoading={jobsLoading}
        />
      )}

      <Separator />

      <Stack gap={8}>
        <Button
          size="md"
          iconStart={followButtonIcon}
          onPress={handleFollow}
          disabled={isFollowButtonDisabled}
        >
          {followButtonLabel}
        </Button>
        <Button
          size="md"
          color="success"
          iconStart={employmentButtonIcon}
          onPress={handleWorkHere}
          disabled={isEmploymentButtonDisabled}
        >
          {employmentButtonLabel}
        </Button>
      </Stack>

      <Separator />

      <Stack gap={8}>
        <Row gap={8} align="center">
          <BellPlus size={20} color={colors.text[t].tertiary} />
          <Text color="secondary">What happens next?</Text>
        </Row>
        <Text color="secondary">
          Following keeps you updated as teams post new opportunities or updates. Linking your
          employment adds the organization to your profile immediately so recruiters can see your
          affiliation right away.
        </Text>
      </Stack>
    </DashboardWidget>
  )
}

type OrganizationSnapshotProps = {
  name: string
  createdAt: string | null
  openJobs?: number | null
  jobsLoading: boolean
}

function OrganizationSnapshot({
  name,
  createdAt,
  openJobs,
  jobsLoading,
}: OrganizationSnapshotProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={8}>
      <Row gap={8} align="center">
        <CheckCircle2 size="md" color={t === 'dark' ? colors.green[300] : colors.green[600]} />
        <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>{name}</Text>
      </Row>
      {createdAt && <Text style={{ color: colors.text[t].secondary }}>Onboarded {createdAt}</Text>}
      <Text style={{ color: colors.text[t].secondary }}>
        {jobsLoading
          ? 'Checking open roles...'
          : typeof openJobs === 'number'
            ? `${openJobs} active ${openJobs === 1 ? 'role' : 'roles'}`
            : 'Open roles data unavailable'}
      </Text>
    </Stack>
  )
}
