import { InquiryCreateForm } from '@scf/core/features/inquiries/components/InquiryCreateForm'
import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { useSuccessFeeStatus } from '@scf/core/utils/success-fees-sdk-hooks'
import {
  useAssignApplicationMutation,
  useTeamComments,
  useTeamMembers,
} from '@scf/core/utils/teams-sdk-hooks'
import { useContactInfo } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import type { InquiryCreateInput } from '@scf/schemas'
import type { TeamMember } from '@scaffald/sdk'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useApplicationMessages } from '@scf/core/utils/jobs-sdk-hooks'
import {
  Avatar,
  Button,
  H4,
  Spinner,
  Tabs,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import type { ATSApplication } from '../types'
import {
  canReject as canRejectStatus,
  countSuffix,
  initialsOf,
  nextStageFor,
} from '../candidate-actions'
import { useApplicationStatusChange } from '../hooks/useApplicationStatusChange'
import { ApplicationStatusChangeModal } from './ApplicationStatusChangeModal'
import { ApplicationDetailsTab } from './ApplicationDetailsTab'
import { CandidateProfileTab } from './CandidateProfileTab'
import { InquiryTab } from './InquiryTab'
import { MessagesTab } from './MessagesTab'
import { NotesTab } from './NotesTab'
import { ActivityFeedTab } from './ActivityFeedTab'
import { UnionStatusBadge } from './UnionStatusBadge'
import { colors } from '@scaffald/ui/tokens'

// biome-ignore lint/suspicious/noExplicitAny: legacy inquiry record mapping
const mapInquiryToFormValues = (inquiry: Record<string, any>): InquiryCreateInput => ({
  applicationId: inquiry.application_id,
  employmentType: (inquiry.employment_type as InquiryCreateInput['employmentType']) ?? undefined,
  employmentTypeNegotiable: inquiry.employment_type_negotiable ?? true,
  workSchedule: (inquiry.work_schedule as InquiryCreateInput['workSchedule']) ?? undefined,
  workScheduleNegotiable: inquiry.work_schedule_negotiable ?? true,
  scheduleShifts: inquiry.schedule_shifts ?? false,
  workingHoursStart: inquiry.working_hours_start ?? undefined,
  workingHoursEnd: inquiry.working_hours_end ?? undefined,
  workingHoursTimezone: inquiry.working_hours_timezone ?? 'America/New_York',
  workingHoursNegotiable: inquiry.working_hours_negotiable ?? true,
  workdays: inquiry.workdays ?? [],
  workdaysNegotiable: inquiry.workdays_negotiable ?? true,
  employmentStartDate: inquiry.employment_start_date ?? '',
  employmentEndDate: inquiry.employment_end_date ?? undefined,
  employmentDatesNegotiable: inquiry.employment_dates_negotiable ?? true,
  rateType: (inquiry.rate_type as InquiryCreateInput['rateType']) ?? 'hourly',
  rateMinCents: inquiry.rate_min_cents ?? 0,
  rateMaxCents: inquiry.rate_max_cents ?? undefined,
  rateNegotiable: inquiry.rate_negotiable ?? true,
  enduranceRequired: inquiry.endurance_required ?? false,
  willingToTravel: inquiry.willing_to_travel ?? undefined,
  travelDistanceMiles: inquiry.travel_distance_miles ?? undefined,
  willingToWorkOvertime: inquiry.willing_to_work_overtime ?? undefined,
  hasDriversLicense: inquiry.has_drivers_license ?? undefined,
  additionalNotes: inquiry.additional_notes ?? undefined,
})

/**
 * Candidate detail, without a container.
 *
 * Extracted from CandidateDetailModal so the same six tabs render inside the
 * kanban modal *and* at `/office/applications/[applicationId]` (#537). Detail
 * used to exist only as a modal, so a recruiter could not send a colleague a
 * link to a candidate and the back button did nothing.
 *
 * Takes a non-null application: it is only rendered when there is one, so the
 * queries below no longer need an `open` flag to stay idle. Mounting is the
 * gate.
 */
export const CandidateDetailContent = ({ application }: { application: ATSApplication }) => {
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState<
    'profile' | 'application' | 'notes' | 'messages' | 'inquiry' | 'activity'
  >('profile')
  const organizationId = application.organizationId ?? application.job.organizationId ?? ''
  const workerUserId = application.workerUserId ?? application.candidate.id ?? ''
  const applicationId = application.id

  const successFeeStatusQuery = useSuccessFeeStatus(
    {
      organizationId,
      applicationId,
      workerUserId,
    },
    {
      enabled: Boolean(organizationId && applicationId && workerUserId),
      staleTime: 10 * 1000,
    }
  )

  const contactUnlocked = Boolean(successFeeStatusQuery.data?.status === 'upfront_paid')

  const contactInfoQuery = useContactInfo(
    {
      userId: workerUserId,
      applicationId,
    },
    {
      enabled: contactUnlocked,
    }
  )

  const contactLockReason = contactUnlocked
    ? undefined
    : workerUserId
      ? 'Complete the upfront success fee to unlock contact information.'
      : 'This candidate does not have a linked worker account yet.'

  // Check if there's an inquiry for this application
  const { data: inquiryData, isLoading: isInquiryLoading } = useInquiryByApplication(
    application?.id,
    { enabled: !!application.id }
  )
  const hasInquiry = !!inquiryData?.inquiry
  const [inquiryMode, setInquiryMode] = useState<'view' | 'create' | 'edit'>(
    hasInquiry ? 'view' : 'create'
  )

  useEffect(() => {
    setInquiryMode((currentMode) => {
      if (hasInquiry && currentMode === 'create') {
        return 'view'
      }
      if (!hasInquiry && currentMode === 'view') {
        return 'create'
      }
      return currentMode
    })
  }, [hasInquiry])

  const teamId = application.team?.id ?? null
  const teamIdForQuery = teamId ?? '00000000-0000-0000-0000-000000000000'
  const { user: currentUser } = useUser()
  const toast = useToast()
  const queryClient = useQueryClient()

  const membersQuery = useTeamMembers(teamIdForQuery, { enabled: Boolean(teamId) })

  const mentionOptions = useMemo((): Array<{ id: string; label: string }> => {
    if (!membersQuery.data?.members) return []
    return membersQuery.data.members
      .filter((member: TeamMember) => Boolean(member.user?.id))
      .map((member: TeamMember) => ({
        id: member.user?.id as string,
        label:
          member.user?.displayName ??
          member.user?.username ??
          `User ${member.user?.id?.slice(0, 6) ?? ''}`,
      }))
  }, [membersQuery.data?.members])

  const assignMutation = useAssignApplicationMutation({
    onSuccess: async () => {
      toast.show({
        title: 'Application assigned',
        message: 'You are now responsible for follow-up.',
      })
      if (teamId) {
        await queryClient.invalidateQueries({ queryKey: ['teams', 'analytics', 'activity'] })
        await queryClient.invalidateQueries({ queryKey: ['teams', 'analytics', 'comments'] })
      }
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Unable to assign application'
      toast.show({
        title: 'Unable to assign application',
        message: '',
        variant: 'error',
      })
    },
  })

  const scoreColor =
    application.score >= 80
      ? theme === 'light'
        ? colors.green[700]
        : colors.green[300]
      : application.score >= 60
        ? theme === 'light'
          ? colors.blue[700]
          : colors.blue[300]
        : theme === 'light'
          ? colors.error[700]
          : colors.error[300]
  const scoreBg =
    application.score >= 80
      ? theme === 'light'
        ? colors.green[50]
        : colors.green[900]
      : application.score >= 60
        ? theme === 'light'
          ? colors.blue[50]
          : colors.blue[900]
        : theme === 'light'
          ? colors.error[50]
          : colors.error[900]

  const inquiryFormValues = useMemo(() => {
    if (!inquiryData?.inquiry) {
      return null
    }
    return mapInquiryToFormValues(inquiryData.inquiry)
  }, [inquiryData?.inquiry])

  const { changeStatus, isChanging, pendingChange, confirmChange, cancelChange, setPendingChange } =
    useApplicationStatusChange()

  const nextStage = nextStageFor(application.status)
  const canReject = canRejectStatus(application.status)

  // Tab counts (§12 #15). Each tab used to fetch its own data and show no
  // count, so an employer could not tell there were twelve unread messages
  // without opening the tab. These are the SAME query keys the tabs use, so
  // react-query serves both from one cache entry — no extra request.
  const notesCountQuery = useTeamComments(
    teamIdForQuery,
    { applicationId: application.id, limit: 50 },
    { enabled: Boolean(teamId), staleTime: 30_000 },
  )
  const messagesCountQuery = useApplicationMessages(application.id)

  const notesCount = notesCountQuery.data?.comments?.length ?? null
  // `.data`, not `.messages` — GetMessagesResponse nests the array under data,
  // which is how MessagesTab reads it too.
  const messagesCount = messagesCountQuery.data?.data?.length ?? null


  const handleInquirySuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['inquiries', 'detail', application.id] })
    setInquiryMode('view')
  }

  return (
    <>
      {/* Candidate Header.
          The name was missing entirely (§12 #2) — it lived only in the modal
          chrome, so the route version at /office/applications/[id] had no name
          anywhere on the page. The avatar was 24px (§12 #3), smaller than the
          body text beside it. */}
      <Row gap={12} align="center">
        <Avatar
          size={48}
          src={application.candidate.photo}
          initials={initialsOf(application.candidate.name)}
        />

        <Stack flex={1}>
          <H4>{application.candidate.name}</H4>
          <Text style={{ opacity: 0.7 }}>{application.candidate.title}</Text>
          <Text style={{ opacity: 0.6, marginTop: 4 }}>{application.candidate.location}</Text>
        </Stack>
      </Row>

      {/* Score Badge */}
      <Stack
        backgroundColor={scoreBg}
        paddingHorizontal={16}
        paddingVertical={12}
        borderRadius={16}
        align="center"
      >
        <Text color={scoreColor}>{application.score}</Text>
        <Text style={{ opacity: 0.8 }}>Application Score</Text>
      </Stack>

      {/* Union Status Badge (Issue #98) */}
      {application.unionStatus && <UnionStatusBadge unionStatus={application.unionStatus} />}

      {/* Quick Actions.
          All three rendered, pressed, and did nothing (§12 #1) — no handlers
          at all. Advance now names the ACTUAL next stage rather than always
          claiming "Interview", which was wrong for four of the seven stages
          and would have skipped Screening from New. */}
      <Row gap={8}>
        {nextStage ? (
          <Button
            color="success"
            style={{ flex: 1 }}
            size="md"
            disabled={isChanging}
            loading={isChanging}
            onPress={() =>
              changeStatus({
                applicationId: application.id,
                fromStatus: application.status,
                toStatus: nextStage.status,
              })
            }
          >
            {`Advance to ${nextStage.label}`}
          </Button>
        ) : null}
        {canReject ? (
          <Button
            color="error"
            style={{ flex: 1 }}
            size="md"
            disabled={isChanging}
            // Rejection is a critical change: it goes through the confirm
            // modal rather than firing straight at the API.
            onPress={() =>
              setPendingChange({
                applicationId: application.id,
                fromStatus: application.status,
                toStatus: 'rejected',
              })
            }
          >
            Reject
          </Button>
        ) : null}
      </Row>
      <Button style={{ flex: 1 }} size="md" onPress={() => setActiveTab('messages')}>
        Send Message
      </Button>
      {teamId && currentUser?.id ? (
        <Button
          style={{ flex: 1 }}
          size="md"
          variant="outline"
          onPress={() =>
            assignMutation.mutate({
              teamId,
              applicationId: application.id,
              assigneeUserId: currentUser.id,
            })
          }
          disabled={assignMutation.isPending}
          loading={assignMutation.isPending}
        >
          Assign to me
        </Button>
      ) : null}
      {teamId ? (
        <Stack gap={4}>
          <Text style={{ opacity: 0.6 }}>Current assignee</Text>
          <Text>
            {application.team?.assignedUserId
              ? (mentionOptions.find((option) => option.id === application.team?.assignedUserId)
                  ?.label ?? `User ${application.team?.assignedUserId.slice(0, 6)}`)
              : 'Unassigned'}
          </Text>
        </Stack>
      ) : null}

      {/* Application Meta */}
      <Row gap={16} wrap>
        <Stack flex={1} width={150}>
          <Text style={{ opacity: 0.6 }}>Applied</Text>
          <Text>
            {new Date(application.appliedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Stack>
        <Stack flex={1} width={150}>
          <Text style={{ opacity: 0.6 }}>Job</Text>
          <Text>{application.job.title}</Text>
        </Stack>
        <Stack flex={1} width={150}>
          <Text style={{ opacity: 0.6 }}>Experience</Text>
          <Text>{application.candidate.yearsExperience} years</Text>
        </Stack>
      </Row>

      {/* Tabs */}
      <Stack
        gap={8}
        style={{ backgroundColor: colors.bg[theme].subtle }}
        padding={4}
        borderRadius={12}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <Tabs.Item value="profile">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Profile</Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="application">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Application</Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="notes">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>
              {`Notes${countSuffix(notesCount)}`}
            </Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="messages">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>
              {`Messages${countSuffix(messagesCount)}`}
            </Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="activity">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Activity</Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="inquiry">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Inquiry</Tabs.Trigger>
          </Tabs.Item>
        </Tabs>
      </Stack>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <Tabs.Content value="profile">
          <Stack paddingTop={16}>
            <CandidateProfileTab
              candidate={application.candidate}
              contactInfo={contactInfoQuery.data ?? undefined}
              isContactLocked={!contactUnlocked}
              lockReason={contactLockReason}
            />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="application">
          <Stack paddingTop={16}>
            <ApplicationDetailsTab application={application} />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="notes">
          <Stack paddingTop={16}>
            <NotesTab
              applicationId={application.id}
              teamId={teamId}
              mentionOptions={mentionOptions}
            />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="messages">
          <Stack paddingTop={16}>
            <MessagesTab applicationId={application.id} />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="activity">
          <Stack paddingTop={16}>
            <ActivityFeedTab application={application} />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="inquiry">
          <Stack paddingTop={16}>
            {inquiryMode === 'view' && isInquiryLoading && (
              <Stack padding="md" align="center" gap={16}>
                <Spinner variant="ios" size="lg" />
                <Text>Loading inquiry...</Text>
              </Stack>
            )}

            {inquiryMode === 'view' && hasInquiry && inquiryData && (
              <InquiryTab
                applicationId={application.id}
                candidateName={application.candidate.name}
                jobTitle={application.job.title}
                data={inquiryData}
                onEditInquiry={() => setInquiryMode('edit')}
                editLabel={inquiryData.inquiry.status === 'draft' ? 'Finish Draft' : 'Edit Inquiry'}
              />
            )}

            {inquiryMode === 'create' && (
              <InquiryCreateForm
                applicationId={application.id}
                onSuccess={handleInquirySuccess}
                onCancel={() => setInquiryMode(hasInquiry ? 'view' : 'create')}
              />
            )}

            {inquiryMode === 'edit' && hasInquiry && inquiryData?.inquiry && inquiryFormValues ? (
              <InquiryCreateForm
                applicationId={application.id}
                inquiryId={inquiryData.inquiry.id as string}
                mode="edit"
                initialData={inquiryFormValues}
                onSuccess={handleInquirySuccess}
                onCancel={() => setInquiryMode('view')}
              />
            ) : null}

            {inquiryMode === 'view' && !hasInquiry && !isInquiryLoading && (
              <Stack padding="md" gap={12}>
                <Text style={{ color: colors.text[theme].secondary }}>
                  No inquiry has been created for this candidate yet.
                </Text>
                <Button color="primary" onPress={() => setInquiryMode('create')}>
                  Start Inquiry
                </Button>
              </Stack>
            )}

            {inquiryMode === 'edit' && (!inquiryData?.inquiry || !inquiryFormValues) && (
              <Stack padding="md" align="center" gap={16}>
                <Spinner variant="ios" size="lg" />
                <Text>Preparing inquiry for editing...</Text>
              </Stack>
            )}
          </Stack>
        </Tabs.Content>
      </Tabs>

      {/* Confirmation for critical changes. Rejection and hiring never fire
          straight at the API — hiring opens the success-fee checkout, and
          rejection is the one action a candidate sees as final. */}
      {pendingChange ? (
        <ApplicationStatusChangeModal
          open
          onClose={cancelChange}
          onConfirm={confirmChange}
          candidateName={application.candidate.name}
          fromStatus={pendingChange.fromStatus}
          toStatus={pendingChange.toStatus}
          isLoading={isChanging}
          application={application}
        />
      ) : null}
    </>
  )
}
