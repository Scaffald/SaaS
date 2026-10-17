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
import { StyleSheet } from 'react-native'
import {
  Button,
  MetricBlock,
  Row,
  ScreenHeader,
  type ScreenHeaderBack,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import type { ATSApplication } from '../types'
import {
  canReject as canRejectStatus,
  countSuffix,
  formatAppliedAgo,
  nextStageFor,
} from '../candidate-actions'
import { assigneeLabel, formatScore } from '../row-labels'
import { useApplicationStatusChange } from '../hooks/useApplicationStatusChange'
import { ApplicationStatusChangeModal } from './ApplicationStatusChangeModal'
import { ApplicationDetailsTab } from './ApplicationDetailsTab'
import { CandidateDetailTabs, type CandidateTab } from './CandidateDetailTabs'
import { CandidateProfileTab } from './CandidateProfileTab'
import { InquiryTab } from './InquiryTab'
import { MessagesTab } from './MessagesTab'
import { NotesTab } from './NotesTab'
import { ActivityFeedTab } from './ActivityFeedTab'
import { UnionStatusBadge } from './UnionStatusBadge'
import { colors, fontSize, fontWeight } from '@scaffald/ui/tokens'

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
export const CandidateDetailContent = ({
  application,
  back,
}: {
  application: ATSApplication
  /** "← Applications" when this is its own page; the modal leaves it out. */
  back?: ScreenHeaderBack
}) => {
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState<CandidateTab>('profile')
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

  // A paid fee unlocks contact. Since #1257 the whole fee is one payment, so a
  // paid fee is 'completed'; 'upfront_paid' is a fee from the old split.
  const contactUnlocked =
    successFeeStatusQuery.data?.status === 'upfront_paid' ||
    successFeeStatusQuery.data?.status === 'completed'

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

  const score = formatScore(application.score)

  // The assignee by name. The list embeds it (#1198); the team roster is the
  // fallback for a row assigned before that, when this renders inside a team.
  const assignedId = application.team?.assignedUserId ?? null
  const assignee = assigneeLabel(
    assignedId
      ? {
          id: assignedId,
          name:
            application.team?.assignedUserName ??
            mentionOptions.find((option) => option.id === assignedId)?.label,
        }
      : null,
    currentUser?.id
  )
  const years = application.candidate.yearsExperience
  const metaLine = [
    `Assignee — ${assignee}`,
    `Applied ${formatAppliedAgo(application.appliedAt)}`,
    application.candidate.location || null,
    years > 0 ? `${years} yr${years === 1 ? '' : 's'} exp` : null,
  ]
    .filter(Boolean)
    .join(' · ')

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
    { enabled: Boolean(teamId), staleTime: 30_000 }
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
      {/* The header is the shared ScreenHeader (#1200): the name is the page
          title, the job is the kicker, and "← Applications" is the way back
          when this renders as its own page. It used to be an H4 inside the
          content under a breadcrumb that ended in the same name, a tinted
          green/grey/red score box, and four full-width buttons — about six
          stacked rows before the tabs. Now it is two: the title row with the
          score at its trailing edge, and one hairline action row. */}
      <ScreenHeader
        back={back}
        kicker={application.job.title}
        title={application.candidate.name}
        actions={
          <MetricBlock
            label="Application score"
            // The accent, not a traffic light. Green/grey/red read a
            // threshold nobody has set as a verdict; and an unscored
            // candidate says so rather than scoring 0 (#1198).
            value={
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.semibold,
                  fontVariant: ['tabular-nums'],
                  color: score != null ? colors.text[theme].emphasis : colors.text[theme].tertiary,
                }}
              >
                {score ?? 'Not scored'}
              </Text>
            }
          />
        }
      >
        <Row
          align="center"
          justify="space-between"
          wrap
          gap={12}
          rowGap={8}
          style={{
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border[theme].default,
          }}
        >
          {/* No success/error fills (#1200). Advance is the one outlined
              action; closing out is a text button that still confirms in the
              modal, because rejection is the one move a candidate reads as
              final. Advance names the ACTUAL next stage (§12 #1). */}
          <Row gap={4} align="center" wrap>
            {nextStage ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isChanging}
                loading={isChanging}
                onPress={() =>
                  changeStatus({
                    applicationId: application.id,
                    fromStatus: application.status,
                    toStatus: nextStage.status,
                    candidateName: application.candidate?.name,
                  })
                }
              >
                {`Advance to ${nextStage.label}`}
              </Button>
            ) : null}
            {canReject ? (
              <Button
                variant="text"
                size="sm"
                disabled={isChanging}
                onPress={() =>
                  setPendingChange({
                    applicationId: application.id,
                    fromStatus: application.status,
                    toStatus: 'rejected',
                  })
                }
              >
                Close out…
              </Button>
            ) : null}
            <Button variant="text" size="sm" onPress={() => setActiveTab('messages')}>
              Message
            </Button>
            {teamId && currentUser?.id && application.team?.assignedUserId !== currentUser.id ? (
              <Button
                variant="text"
                size="sm"
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
          </Row>

          {/* Assignee, applied and experience as one line, not three
              labelled blocks. */}
          <Row gap={8} align="center" wrap>
            {application.unionStatus?.isUnionMember ? (
              <UnionStatusBadge unionStatus={application.unionStatus} compact />
            ) : null}
            <Text style={{ fontSize: fontSize.sm, color: colors.text[theme].secondary }}>
              {metaLine}
            </Text>
          </Row>
        </Row>
      </ScreenHeader>

      <CandidateDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          {
            value: 'profile',
            label: 'Profile',
            panel: (
              <Stack gap={16}>
                {/* Union detail (Issue #98) moved here from above the tabs
                    (#1200); the header carries the compact badge. */}
                {application.unionStatus ? (
                  <UnionStatusBadge unionStatus={application.unionStatus} />
                ) : null}
                <CandidateProfileTab
                  candidate={application.candidate}
                  contactInfo={contactInfoQuery.data ?? undefined}
                  isContactLocked={!contactUnlocked}
                  lockReason={contactLockReason}
                />
              </Stack>
            ),
          },
          {
            value: 'application',
            label: 'Application',
            panel: <ApplicationDetailsTab application={application} />,
          },
          {
            value: 'notes',
            label: `Notes${countSuffix(notesCount)}`,
            panel: (
              <NotesTab
                applicationId={application.id}
                teamId={teamId}
                mentionOptions={mentionOptions}
              />
            ),
          },
          {
            value: 'messages',
            label: `Messages${countSuffix(messagesCount)}`,
            panel: <MessagesTab applicationId={application.id} />,
          },
          {
            value: 'activity',
            label: 'Activity',
            panel: <ActivityFeedTab application={application} />,
          },
          {
            value: 'inquiry',
            label: 'Inquiry',
            panel: (
              <>
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
                    editLabel={
                      inquiryData.inquiry.status === 'draft' ? 'Finish Draft' : 'Edit Inquiry'
                    }
                  />
                )}

                {inquiryMode === 'create' && (
                  <InquiryCreateForm
                    applicationId={application.id}
                    onSuccess={handleInquirySuccess}
                    onCancel={() => setInquiryMode(hasInquiry ? 'view' : 'create')}
                  />
                )}

                {inquiryMode === 'edit' &&
                hasInquiry &&
                inquiryData?.inquiry &&
                inquiryFormValues ? (
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
              </>
            ),
          },
        ]}
      />

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
        />
      ) : null}
    </>
  )
}
