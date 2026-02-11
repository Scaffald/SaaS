import { InquiryCreateForm } from '@scf/core/features/inquiries/components/InquiryCreateForm'
import { api } from '@scf/core/utils/api'
import { useContactInfo } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import type { InquiryCreateInput } from '@scf/schemas'
import type { AppRouter } from '@scf/supabase/client-types'
import { ResponsiveModal } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Spinner, Tabs, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { ApplicationDetailsTab } from './ApplicationDetailsTab'
import { CandidateProfileTab } from './CandidateProfileTab'
import { InquiryTab } from './InquiryTab'
import { MessagesTab } from './MessagesTab'
import { NotesTab } from './NotesTab'

type MembersListOutput = inferRouterOutputs<AppRouter>['teams']['members']['list']
type MemberRecord = NonNullable<MembersListOutput['members']>[number]
type InquiryQueryOutput = inferRouterOutputs<AppRouter>['inquiries']['getByApplication']

const mapInquiryToFormValues = (
  inquiry: NonNullable<InquiryQueryOutput>['inquiry']
): InquiryCreateInput => ({
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

interface CandidateDetailModalProps {
  application: MockApplication | null
  open: boolean
  onClose: () => void
}

export const CandidateDetailModal = ({ application, open, onClose }: CandidateDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'application' | 'notes' | 'messages' | 'inquiry'
  >('profile')
  const organizationId = application?.organizationId ?? application?.job.organizationId ?? ''
  const workerUserId = application?.workerUserId ?? application?.candidate.id ?? ''
  const applicationId = application?.id ?? ''

  const successFeeStatusQuery = api.successFees.getStatusByApplication.useQuery(
    {
      organizationId,
      applicationId,
      workerUserId,
    },
    {
      enabled: Boolean(open && organizationId && applicationId && workerUserId),
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
  const { data: inquiryData, isLoading: isInquiryLoading } =
    api.inquiries.getByApplication.useQuery(
      { applicationId: application?.id || '' },
      { enabled: !!application?.id && open }
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

  if (!application) return null

  const teamId = application.team?.id ?? null
  const teamIdForQuery = teamId ?? '00000000-0000-0000-0000-000000000000'
  const { user: currentUser } = useUser()
  const toast = useToast()
  const utils = api.useUtils()

  const membersQuery = api.teams.members.list.useQuery(
    { teamId: teamIdForQuery },
    { enabled: Boolean(teamId) }
  )

  const mentionOptions = useMemo((): Array<{ id: string; label: string }> => {
    if (!membersQuery.data?.members) return []
    return (membersQuery.data.members as MemberRecord[])
      .filter((member: MemberRecord) => Boolean(member.user?.id))
      .map((member: MemberRecord) => ({
        id: member.user?.id as string,
        label:
          member.user?.displayName ??
          member.user?.username ??
          `User ${member.user?.id?.slice(0, 6) ?? ''}`,
      }))
  }, [membersQuery.data?.members])

  const assignMutation = api.teams.applications.assign.useMutation({
    onSuccess: async () => {
      toast.show({
          title: 'Application assigned',
          message: 'You are now responsible for follow-up.',
        })
      if (teamId) {
        await utils.teams.analytics.activity.invalidate({ teamId, pageSize: 20 })
        await utils.teams.analytics.comments.invalidate({
          teamId,
          applicationId: application.id,
          limit: 50,
        })
      }
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Unable to assign application'
      toast.show({
          title: 'Unable to assign application',
          variant: 'error',
        })
    },
  })

  const scoreColor =
    application.score >= 80 ? '$green10' : application.score >= 60 ? '$blue10' : '$red10'
  const scoreBg = application.score >= 80 ? '$green3' : application.score >= 60 ? '$blue3' : '$red3'

  const inquiryFormValues = useMemo(() => {
    if (!inquiryData?.inquiry) {
      return null
    }
    return mapInquiryToFormValues(inquiryData.inquiry)
  }, [inquiryData?.inquiry])

  const handleInquirySuccess = async () => {
    await utils.inquiries.getByApplication.invalidate({ applicationId: application.id })
    setInquiryMode('view')
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={application.candidate.name}
      size="large"
    >
      {/* Candidate Header */}
      <Row gap="$3" alignItems="center">
        <Avatar circular size="$6">
          <Avatar.Image src={application.candidate.photo} />
          <Avatar.Fallback backgroundColor="$blue9">
            <Text color="white" fontWeight="600" fontSize="$6">
              {application.candidate.name.charAt(0)}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <Stack flex={1}>
          <Text fontSize="$4" opacity={0.7}>
            {application.candidate.title}
          </Text>
          <Text fontSize="$2" opacity={0.6} marginTop="$1">
            {application.candidate.location}
          </Text>
        </Stack>
      </Row>

      {/* Score Badge */}
      <Stack
        backgroundColor={scoreBg}
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$4"
        alignItems="center"
      >
        <Text fontSize="$8" fontWeight="700" color={scoreColor}>
          {application.score}
        </Text>
        <Text fontSize="$3" fontWeight="600" opacity={0.8}>
          Application Score
        </Text>
      </Stack>

      {/* Quick Actions */}
      <Row gap="$2">
        <Button theme="success" flex={1} size="$4">
          Advance to Interview
        </Button>
        <Button theme="error" flex={1} size="$4">
          Reject
        </Button>
      </Row>
      <Button flex={1} size="$4">
        Send Message
      </Button>
      {teamId && currentUser?.id ? (
        <Button
          flex={1}
          size="$4"
          variant="outlined"
          onPress={() =>
            assignMutation.mutate({
              teamId,
              applicationId: application.id,
              assigneeUserId: currentUser.id,
            })
          }
          disabled={assignMutation.isPending}
        >
          {assignMutation.isPending ? <Spinner size="small" /> : 'Assign to me'}
        </Button>
      ) : null}
      {teamId ? (
        <Stack gap="$1">
          <Text fontSize="$3" opacity={0.6}>
            Current assignee
          </Text>
          <Text fontSize="$4" fontWeight="600">
            {application.team?.assignedUserId
              ? (mentionOptions.find((option) => option.id === application.team?.assignedUserId)
                  ?.label ?? `User ${application.team?.assignedUserId.slice(0, 6)}`)
              : 'Unassigned'}
          </Text>
        </Stack>
      ) : null}

      {/* Application Meta */}
      <Row gap="$4" flexWrap="wrap">
        <Stack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Applied
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {new Date(application.appliedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Stack>
        <Stack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Job
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {application.job.title}
          </Text>
        </Stack>
        <Stack flex={1} width={150}>
          <Text fontSize="$2" opacity={0.6}>
            Experience
          </Text>
          <Text fontSize="$3" fontWeight="600">
            {application.candidate.yearsExperience} years
          </Text>
        </Stack>
      </Row>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        orientation="horizontal"
        flexDirection="column"
        flex={1}
      >
        <Tabs.List gap="$2" backgroundColor="$color2" padding="$1" borderRadius="$3">
          <Tabs.Tab value="profile" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Profile
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="application" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Application
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="notes" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Notes ({application.notes.length})
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="messages" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Messages
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="inquiry" flex={1}>
            <Text fontSize="$3" fontWeight="600">
              Inquiry
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="profile" paddingTop="$4">
          <CandidateProfileTab
            candidate={application.candidate}
            contactInfo={contactInfoQuery.data ?? undefined}
            isContactLocked={!contactUnlocked}
            lockReason={contactLockReason}
          />
        </Tabs.Content>

        <Tabs.Content value="application" paddingTop="$4">
          <ApplicationDetailsTab application={application} />
        </Tabs.Content>

        <Tabs.Content value="notes" paddingTop="$4">
          <NotesTab
            applicationId={application.id}
            teamId={teamId}
            mentionOptions={mentionOptions}
          />
        </Tabs.Content>

        <Tabs.Content value="messages" paddingTop="$4">
          <MessagesTab applicationId={application.id} />
        </Tabs.Content>

        <Tabs.Content value="inquiry" paddingTop="$4">
          {inquiryMode === 'view' && isInquiryLoading && (
            <Stack padding="$4" alignItems="center" gap="$4">
              <Spinner size="large" />
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
              inquiryId={inquiryData.inquiry.id}
              mode="edit"
              initialData={inquiryFormValues}
              onSuccess={handleInquirySuccess}
              onCancel={() => setInquiryMode('view')}
            />
          ) : null}

          {inquiryMode === 'view' && !hasInquiry && !isInquiryLoading && (
            <Stack padding="$4" gap="$3">
              <Text color="$color11">No inquiry has been created for this candidate yet.</Text>
              <Button theme="blue" onPress={() => setInquiryMode('create')}>
                Start Inquiry
              </Button>
            </Stack>
          )}

          {inquiryMode === 'edit' && (!inquiryData?.inquiry || !inquiryFormValues) && (
            <Stack padding="$4" alignItems="center" gap="$4">
              <Spinner size="large" />
              <Text>Preparing inquiry for editing...</Text>
            </Stack>
          )}
        </Tabs.Content>
      </Tabs>
    </ResponsiveModal>
  )
}
