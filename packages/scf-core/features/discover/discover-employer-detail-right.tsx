import {
  useEmployer,
  useEmploymentStatus,
  useClaimEmploymentMutation,
  useRemoveEmploymentMutation,
} from '@scf/core/utils/employers-sdk-hooks'
import type { ClaimEmploymentResponse, RemoveEmploymentResponse } from '@scaffald/sdk'
import { useOrganizationOpenJobsCount } from '@scf/core/utils/organizations-sdk-hooks'
import { Briefcase, CheckCircle2, Loader2 } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Button, H3, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type OrganizationIdentifier = { organizationId: string }

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
 * The "Stay connected" rail: the open-role count and "I work here".
 *
 * Follow moved to the screen header (FollowEmployerButton, #1186): in this
 * rail it stacked below About and every open role on a phone. "On Scaffald
 * since" moved to the header's descriptor line as a year, replacing the
 * toLocaleDateString() "10/5/2026" printed here.
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

  const { data: employmentStatus, isLoading: employmentStatusLoading } = useEmploymentStatus(
    { organizationId: employerId },
    { enabled: Boolean(employerId) }
  )

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
        ? 'You work here'
        : 'I work here'

  const organizationName = employer?.name ?? 'this organization'
  const handleWorkHere = () => {
    if (isEmploymentLinked) {
      removeEmploymentMutation.mutate({ organizationId: employerId })
    } else {
      claimEmploymentMutation.mutate({ organizationId: employerId })
    }
  }

  return (
    <Stack gap={16}>
      <H3 style={{ color: colors.text[t].primary }}>Stay connected</H3>

      {isLoading ? (
        <Row gap={8} align="center">
          <Loader2 size={18} color={colors.icon[t].muted} />
          <Text style={{ color: colors.text[t].secondary }}>Loading…</Text>
        </Row>
      ) : (
        <OrganizationSnapshot openJobs={openJobs?.count} jobsLoading={jobsLoading} />
      )}

      <Stack gap={8} align="stretch">
        <Button
          size="md"
          variant="outline"
          iconStart={employmentButtonIcon}
          onPress={handleWorkHere}
          disabled={isEmploymentButtonDisabled}
        >
          {employmentButtonLabel}
        </Button>
      </Stack>

      <Separator />

      {/* One line each, not two paragraphs. The old copy explained both
          actions twice — once above the buttons and once below them. */}
      <Text style={{ color: colors.text[t].secondary }}>
        Following {organizationName} tells you when they post. Saying you work here adds them to
        your profile straight away.
      </Text>
    </Stack>
  )
}

type OrganizationSnapshotProps = {
  openJobs?: number | null
  jobsLoading: boolean
}

/**
 * The organisation's name is in the screen header; repeating it here in
 * green beside a tick read as a verification badge, which it never was.
 */
function OrganizationSnapshot({ openJobs, jobsLoading }: OrganizationSnapshotProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={4}>
      <Text style={{ color: colors.text[t].secondary }}>
        {jobsLoading
          ? 'Checking open roles…'
          : typeof openJobs === 'number'
            ? `${openJobs} open ${openJobs === 1 ? 'role' : 'roles'}`
            : 'Open roles unavailable'}
      </Text>
    </Stack>
  )
}
