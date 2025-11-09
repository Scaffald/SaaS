import { useMemo } from 'react'
import { useToastController } from '@tamagui/toast'
import { BellPlus, Briefcase, CheckCircle2, Loader2, Network, UserPlus } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { Separator, Text, XStack, YStack, Button } from 'tamagui'

type OrganizationIdentifier = { organizationId: string }

type FollowStatusSnapshot = {
  isFollowing: boolean
  followId: string | null
  createdAt: string | null
}

type FollowMutationResult = {
  alreadyFollowing: boolean
  follow: { id: string; created_at: string | null }
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

type ClaimMutationResult = {
  alreadyLinked: boolean
  experience: {
    id: string
    source: string | null
    is_current: boolean | null
    claimed_at: string | null
    created_at: string | null
  } | null
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
  const toast = useToastController()
  const utils = api.useContext()

  const { data: employer, isLoading } = api.employers.getEmployerById.useQuery(
    { id: employerId },
    { enabled: Boolean(employerId) }
  )

  const { data: openJobs, isLoading: jobsLoading } = api.organizations.getOpenJobsCount.useQuery(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const {
    data: followStatus,
    isLoading: followStatusLoading,
  } = api.employers.getOrganizationFollowStatus.useQuery(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const {
    data: employmentStatus,
    isLoading: employmentStatusLoading,
  } = api.employers.getOrganizationEmploymentStatus.useQuery(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

  const followMutation = api.employers.followOrganization.useMutation<
    FollowMutationResult,
    MutationError,
    OrganizationIdentifier,
    FollowMutationContext
  >({
    onMutate: async (variables) => {
      await utils.employers.getOrganizationFollowStatus.cancel(variables)
      const previous = utils.employers.getOrganizationFollowStatus.getData(variables)

      utils.employers.getOrganizationFollowStatus.setData(variables, {
        isFollowing: true,
        followId: previous?.followId ?? null,
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      })

      return { previous }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        utils.employers.getOrganizationFollowStatus.setData(variables, context.previous)
      }
      toast.show('Unable to follow', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
    onSuccess: (data, variables) => {
      utils.employers.getOrganizationFollowStatus.setData(variables, {
        isFollowing: true,
        followId: data.follow.id,
        createdAt: data.follow.created_at ?? new Date().toISOString(),
      })

      toast.show(
        data.alreadyFollowing ? 'Already following' : 'Following organization',
        {
          message: data.alreadyFollowing
            ? 'You were already following this organization.'
            : 'We will keep you updated as new activity rolls in.',
        }
      )
    },
  })

  const unfollowMutation = api.employers.unfollowOrganization.useMutation<
    { success: boolean },
    MutationError,
    OrganizationIdentifier,
    FollowMutationContext
  >({
    onMutate: async (variables) => {
      await utils.employers.getOrganizationFollowStatus.cancel(variables)
      const previous = utils.employers.getOrganizationFollowStatus.getData(variables)

      utils.employers.getOrganizationFollowStatus.setData(variables, {
        isFollowing: false,
        followId: null,
        createdAt: null,
      })

      return { previous }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        utils.employers.getOrganizationFollowStatus.setData(variables, context.previous)
      }
      toast.show('Unable to unfollow', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
    onSuccess: (_data, variables) => {
      utils.employers.getOrganizationFollowStatus.setData(variables, {
        isFollowing: false,
        followId: null,
        createdAt: null,
      })

      toast.show('Unfollowed', {
        message: 'We removed this organization from your followed list.',
      })
    },
  })

  const isFollowing = Boolean(followStatus?.isFollowing)
  const isFollowMutating = followMutation.isLoading || unfollowMutation.isLoading
  const isFollowButtonDisabled = isFollowMutating || followStatusLoading
  const followButtonIcon = isFollowButtonDisabled
    ? Loader2
    : isFollowing
      ? CheckCircle2
      : UserPlus
  const followButtonLabel = followStatusLoading
    ? 'Checking status...'
    : isFollowMutating
      ? 'Updating...'
      : isFollowing
        ? 'Following'
        : 'Follow Organization'

  const claimEmploymentMutation = api.employers.claimOrganizationEmployment.useMutation<
    ClaimMutationResult,
    MutationError,
    OrganizationIdentifier,
    EmploymentMutationContext
  >({
    onMutate: async (variables) => {
      await utils.employers.getOrganizationEmploymentStatus.cancel(variables)
      const previous = utils.employers.getOrganizationEmploymentStatus.getData(variables)

      utils.employers.getOrganizationEmploymentStatus.setData(variables, {
        isLinked: true,
        experienceId: previous?.experienceId ?? null,
        source: previous?.source ?? 'claim',
        isCurrent: true,
        claimedAt: previous?.claimedAt ?? new Date().toISOString(),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
      })

      return { previous }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        utils.employers.getOrganizationEmploymentStatus.setData(variables, context.previous)
      }
      toast.show('Unable to link employment', {
        message: error.message ?? 'Please try again shortly.',
      })
    },
    onSuccess: (data, variables) => {
      const experience = data.experience ?? null
      utils.employers.getOrganizationEmploymentStatus.setData(variables, {
        isLinked: true,
        experienceId: experience?.id ?? null,
        source: experience?.source ?? 'claim',
        isCurrent: experience?.is_current ?? true,
        claimedAt: experience?.claimed_at ?? new Date().toISOString(),
        createdAt: experience?.created_at ?? new Date().toISOString(),
      })

      toast.show(
        data.alreadyLinked ? 'Already linked' : 'Employment linked',
        {
          message: data.alreadyLinked
            ? 'Your profile is already connected to this organization.'
            : 'We created a connection to this organization on your profile.',
        }
      )
    },
    onSettled: async (_data, _error, variables) => {
      await utils.employers.getOrganizationEmploymentStatus.invalidate(variables)
    },
  })

  const removeEmploymentMutation = api.employers.removeOrganizationEmployment.useMutation<
    { removed: boolean },
    MutationError,
    OrganizationIdentifier,
    EmploymentMutationContext
  >({
    onMutate: async (variables) => {
      await utils.employers.getOrganizationEmploymentStatus.cancel(variables)
      const previous = utils.employers.getOrganizationEmploymentStatus.getData(variables)

      utils.employers.getOrganizationEmploymentStatus.setData(variables, {
        isLinked: false,
        experienceId: null,
        source: null,
        isCurrent: false,
        claimedAt: null,
        createdAt: null,
      })

      return { previous }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        utils.employers.getOrganizationEmploymentStatus.setData(variables, context.previous)
      }
      toast.show('Unable to remove link', {
        message: error.message ?? 'Please try again shortly.',
      })
    },
    onSuccess: (data, variables) => {
      if (!data.removed) {
        // Nothing to remove, restore to neutral state
        utils.employers.getOrganizationEmploymentStatus.setData(variables, {
          isLinked: false,
          experienceId: null,
          source: null,
          isCurrent: false,
          claimedAt: null,
          createdAt: null,
        })
      }

      toast.show('Employment link removed', {
        message: 'You are no longer connected to this organization.',
      })
    },
    onSettled: async (_data, _error, variables) => {
      await utils.employers.getOrganizationEmploymentStatus.invalidate(variables)
    },
  })

  const isEmploymentLinked = Boolean(employmentStatus?.isLinked)
  const isEmploymentMutating =
    claimEmploymentMutation.isLoading || removeEmploymentMutation.isLoading
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
    <DashboardWidget gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <Network size={18} color="$blue10" />
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Stay Connected
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color11">
          Follow {organizationName} to get updates or claim your role to link your profile to the
          team.
        </Text>
      </YStack>

      <Separator />

      {isLoading ? (
        <XStack gap="$2" items="center">
          <Loader2 size={16} color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Loading organization context...
          </Text>
        </XStack>
      ) : (
        <OrganizationSnapshot
          name={organizationName}
          createdAt={createdAt}
          openJobs={openJobs?.count}
          jobsLoading={jobsLoading}
        />
      )}

      <Separator />

      <YStack gap="$2">
        <Button size="$4" icon={followButtonIcon} onPress={handleFollow} disabled={isFollowButtonDisabled}>
          {followButtonLabel}
        </Button>
        <Button
          size="$4"
          theme="green"
          icon={employmentButtonIcon}
          onPress={handleWorkHere}
          disabled={isEmploymentButtonDisabled}
        >
          {employmentButtonLabel}
        </Button>
      </YStack>

      <Separator />

      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <BellPlus size={16} color="$color10" />
          <Text fontSize="$3" fontWeight="600" color="$color10">
            What happens next?
          </Text>
        </XStack>
        <Text fontSize="$2" color="$color10">
          Following keeps you updated as teams post new opportunities or updates. Linking your
          employment adds the organization to your profile immediately so recruiters can see your
          affiliation right away.
        </Text>
      </YStack>
    </DashboardWidget>
  )
}

type OrganizationSnapshotProps = {
  name: string
  createdAt: string | null
  openJobs?: number | null
  jobsLoading: boolean
}

function OrganizationSnapshot({ name, createdAt, openJobs, jobsLoading }: OrganizationSnapshotProps) {
  return (
    <YStack gap="$2">
      <XStack gap="$2" items="center">
        <CheckCircle2 size={16} color="$green10" />
        <Text fontSize="$3" fontWeight="600" color="$green10">
          {name}
        </Text>
      </XStack>
      {createdAt && (
        <Text fontSize="$2" color="$color10">
          Onboarded {createdAt}
        </Text>
      )}
      <Text fontSize="$3" color="$color11">
        {jobsLoading
          ? 'Checking open roles...'
          : typeof openJobs === 'number'
            ? `${openJobs} active ${openJobs === 1 ? 'role' : 'roles'}`
            : 'Open roles data unavailable'}
      </Text>
    </YStack>
  )
}

