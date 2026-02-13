import { ROUTES } from '@scf/core/constants/routes'
import type { AppRouter } from '@scf/supabase/client-types'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import { Check, MessageSquare } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useRouter } from 'expo-router'
import { Avatar, Card, type GetThemeValueForKey, Separator } from '@scaffald/ui'
import { ComparisonField } from './ComparisonField'
import { InquiryHistoryTimeline } from './InquiryHistoryTimeline'

export type InquiryComparisonRecord = NonNullable<
  inferRouterOutputs<AppRouter>['inquiries']['getMultiple']
>[number]

type SectionRecord = InquiryComparisonRecord['sections'][number]
type CommentRecord = InquiryComparisonRecord['comments'][number]
type CapabilityResponseRecord = InquiryComparisonRecord['capabilityResponses'][number]

interface ComparisonColumnProps {
  inquiryData: InquiryComparisonRecord
  width: number
  highlightDifferences: Set<string>
  canRemove?: boolean
  onRemove?: (inquiryId: string) => void
}

export function ComparisonColumn({
  inquiryData,
  width,
  highlightDifferences,
  canRemove = false,
  onRemove,
}: ComparisonColumnProps) {
  const router = useRouter()
  const sections: InquiryComparisonRecord['sections'] = inquiryData.sections ?? []
  const comments: InquiryComparisonRecord['comments'] = inquiryData.comments ?? []
  const capabilityResponses: InquiryComparisonRecord['capabilityResponses'] =
    inquiryData.capabilityResponses ?? []
  const { inquiry, application } = inquiryData
  const candidateName =
    application?.candidate?.displayName ||
    application?.candidate?.username ||
    application?.candidate?.name ||
    'Candidate'

  // Format rate for display
  const formatRate = () => {
    if (!inquiry.rate_min_cents) return 'Not specified'
    const min = (inquiry.rate_min_cents / 100).toFixed(2)
    const max = inquiry.rate_max_cents ? (inquiry.rate_max_cents / 100).toFixed(2) : null
    const unit = inquiry.rate_type === 'hourly' ? '/hr' : '/yr'
    return max ? `$${min} - $${max}${unit}` : `$${min}${unit}`
  }

  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not specified'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format workdays
  const formatWorkdays = () => {
    if (!inquiry.workdays || inquiry.workdays.length === 0) return 'Not specified'
    const dayLabels: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    }
    return inquiry.workdays.map((day: string) => dayLabels[day] || day).join(', ')
  }

  // Format employment type
  const formatEmploymentType = () => {
    if (!inquiry.employment_type) return 'Not specified'
    return inquiry.employment_type === 'permanent' ? 'Permanent' : 'Temporary'
  }

  // Format work schedule
  const formatWorkSchedule = () => {
    if (!inquiry.work_schedule) return 'Not specified'
    const labels: Record<string, string> = {
      full_time: 'Full time',
      part_time: 'Part time',
      day_week: 'Day-Week',
    }
    return labels[inquiry.work_schedule] || inquiry.work_schedule
  }

  // Format working hours
  const formatWorkingHours = () => {
    if (!inquiry.working_hours_start || !inquiry.working_hours_end) return 'Not specified'
    const timezone = inquiry.working_hours_timezone ? ` (${inquiry.working_hours_timezone})` : ''
    return `${inquiry.working_hours_start} - ${inquiry.working_hours_end}${timezone}`
  }

  // Get section acceptance status
  const getSectionStatus = (sectionName: string) => {
    const section = sections.find(
      (sectionItem: SectionRecord) => sectionItem.section_name === sectionName
    )
    return {
      accepted: !!section?.accepted_by,
      acceptedAt: section?.accepted_at || null,
    }
  }

  // Get comment count for section
  const getCommentCount = (sectionName: string) => {
    return comments.filter((comment: CommentRecord) => comment.section_name === sectionName).length
  }

  const inquiryStatus = inquiry.status
  const inquiryUpdatedAt = formatDate(inquiry.updated_at)
  const candidateAvatar =
    application?.candidate?.avatarPath || application?.candidate?.avatar || null
  const jobTitle = application?.job?.title ?? application?.jobTitle ?? null

  return (
    <Stack
      width={width}
      gap={12}
      backgroundColor="$background"
      padding="md"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      {/* Candidate Header */}
      <Stack gap={8}>
        <Row gap={8} align="center">
          <Avatar size="md">
            <Avatar.Image src={candidateAvatar || undefined} />
            <Avatar.Fallback backgroundColor="$blue9">
              <Text color="white">{candidateName.charAt(0).toUpperCase()}</Text>
            </Avatar.Fallback>
          </Avatar>
          <Stack flex={1}>
            <Text>{candidateName}</Text>
            {jobTitle && <Text color="$gray11">{jobTitle}</Text>}
          </Stack>
          {canRemove && onRemove && (
            <Button
              size="xs"
              variant="outline"
              color="$red11"
              borderColor="$red8"
              onPress={() => onRemove(inquiry.id)}
            >
              Remove
            </Button>
          )}
        </Row>

        <Row flexWrap="wrap" gap={8}>
          <StatusBadge label={inquiryStatus} />
          <SubtleBadge label={`Updated ${inquiryUpdatedAt}`} />
        </Row>

        {/* Section Status Badges */}
        <Row gap={8} flexWrap="wrap">
          {['employment', 'compensation', 'capabilities', 'other'].map((sectionName) => {
            const status = getSectionStatus(sectionName)
            const commentCount = getCommentCount(sectionName)
            return (
              <Row
                key={sectionName}
                backgroundColor={status.accepted ? '$green3' : '$gray3'}
                paddingHorizontal={8}
                paddingVertical={4}
                borderRadius={8}
                align="center"
                gap={4}
              >
                {status.accepted ? (
                  <Check size="sm" color="$green11" />
                ) : (
                  <Text color="$gray11">○</Text>
                )}
                <Text color={status.accepted ? '$green11' : '$gray11'}>{sectionName}</Text>
                {commentCount > 0 && (
                  <Row align="center" gap={4}>
                    <MessageSquare size={10} color="$blue11" />
                    <Text color="$blue11">{commentCount}</Text>
                  </Row>
                )}
              </Row>
            )
          })}
        </Row>
      </Stack>

      <Separator />

      {/* Employment Section */}
      <Card padding="sm" gap={8}>
        <Text>Employment</Text>
        <ComparisonField
          label="Type"
          value={formatEmploymentType()}
          isDifferent={highlightDifferences.has('employmentType')}
        />
        <ComparisonField
          label="Schedule"
          value={formatWorkSchedule()}
          isDifferent={highlightDifferences.has('workSchedule')}
        />
        <ComparisonField
          label="Hours"
          value={formatWorkingHours()}
          isDifferent={highlightDifferences.has('workingHours')}
        />
        <ComparisonField
          label="Workdays"
          value={formatWorkdays()}
          isDifferent={highlightDifferences.has('workdays')}
        />
        <ComparisonField
          label="Start Date"
          value={formatDate(inquiry.employment_start_date)}
          isDifferent={highlightDifferences.has('employmentStartDate')}
        />
        {inquiry.employment_end_date && (
          <ComparisonField
            label="End Date"
            value={formatDate(inquiry.employment_end_date)}
            isDifferent={false}
          />
        )}
        <ComparisonField
          label="Schedule Negotiable"
          value={inquiry.work_schedule_negotiable ? 'Yes' : 'No'}
          isDifferent={highlightDifferences.has('workScheduleNegotiable')}
        />
        <ComparisonField
          label="Working Hours Negotiable"
          value={inquiry.working_hours_negotiable ? 'Yes' : 'No'}
          isDifferent={highlightDifferences.has('workingHoursNegotiable')}
        />
        <ComparisonField
          label="Dates Negotiable"
          value={inquiry.employment_dates_negotiable ? 'Yes' : 'No'}
          isDifferent={highlightDifferences.has('employmentDatesNegotiable')}
        />
        {getSectionStatus('employment').accepted && (
          <Row align="center" gap={4} marginTop={4}>
            <Check size="md" color="$green11" />
            <Text color="$green11">Accepted</Text>
          </Row>
        )}
        {getCommentCount('employment') > 0 && (
          <Row align="center" gap={4} marginTop={4}>
            <MessageSquare size="md" color="$blue11" />
            <Text color="$blue11">
              {getCommentCount('employment')} comment
              {getCommentCount('employment') !== 1 ? 's' : ''}
            </Text>
          </Row>
        )}
      </Card>

      {/* Compensation Section */}
      <Card padding="sm" gap={8}>
        <Text>Compensation</Text>
        <ComparisonField
          label="Rate"
          value={formatRate()}
          isDifferent={highlightDifferences.has('rate')}
        />
        <ComparisonField
          label="Negotiable"
          value={inquiry.rate_negotiable ? 'Yes' : 'No'}
          isDifferent={highlightDifferences.has('rateNegotiable')}
        />
        {getSectionStatus('compensation').accepted && (
          <Row align="center" gap={4} marginTop={4}>
            <Check size="md" color="$green11" />
            <Text color="$green11">Accepted</Text>
          </Row>
        )}
        {getCommentCount('compensation') > 0 && (
          <Row align="center" gap={4} marginTop={4}>
            <MessageSquare size="md" color="$blue11" />
            <Text color="$blue11">
              {getCommentCount('compensation')} comment
              {getCommentCount('compensation') !== 1 ? 's' : ''}
            </Text>
          </Row>
        )}
      </Card>

      {/* Capabilities Section */}
      {capabilityResponses.length > 0 && (
        <Card padding="sm" gap={8}>
          <Text>Capabilities</Text>
          {capabilityResponses.map((response: CapabilityResponseRecord) => (
            <ComparisonField
              key={response.capability_name}
              label={response.capability_name}
              value={
                response.response_value !== null
                  ? response.response_value.toString()
                  : response.response_text || 'Not answered'
              }
              isDifferent={highlightDifferences.has(`capability:${response.capability_name}`)}
            />
          ))}
          {getSectionStatus('capabilities').accepted && (
            <Row align="center" gap={4} marginTop={4}>
              <Check size="md" color="$green11" />
              <Text color="$green11">Accepted</Text>
            </Row>
          )}
          {getCommentCount('capabilities') > 0 && (
            <Row align="center" gap={4} marginTop={4}>
              <MessageSquare size="md" color="$blue11" />
              <Text color="$blue11">
                {getCommentCount('capabilities')} comment
                {getCommentCount('capabilities') !== 1 ? 's' : ''}
              </Text>
            </Row>
          )}
        </Card>
      )}

      <Card padding="sm" gap={8}>
        <Text>Other Terms</Text>
        <ComparisonField
          label="Travel"
          value={
            inquiry.willing_to_travel === null || inquiry.willing_to_travel === undefined
              ? 'Not specified'
              : inquiry.willing_to_travel
                ? 'Yes'
                : 'No'
          }
          isDifferent={highlightDifferences.has('willingToTravel')}
          description={
            inquiry.travel_distance_miles ? `${inquiry.travel_distance_miles} miles` : undefined
          }
        />
        <ComparisonField
          label="Overtime"
          value={
            inquiry.willing_to_work_overtime === null ||
            inquiry.willing_to_work_overtime === undefined
              ? 'Not specified'
              : inquiry.willing_to_work_overtime
                ? 'Open to overtime'
                : 'No overtime'
          }
          isDifferent={highlightDifferences.has('willingToWorkOvertime')}
        />
        <ComparisonField
          label="Driver's License"
          value={
            inquiry.has_drivers_license === null || inquiry.has_drivers_license === undefined
              ? 'Not specified'
              : inquiry.has_drivers_license
                ? 'Yes'
                : 'No'
          }
          isDifferent={highlightDifferences.has('hasDriversLicense')}
        />
      </Card>

      {/* View Full Inquiry Button */}
      <Button
        size="sm"
        variant="outline"
        onPress={() =>
          router.push(
            ROUTES.OFFICE.APPLICATIONS.INQUIRY.path.replace(
              ':applicationId',
              inquiry.application_id
            )
          )
        }
      >
        View Full Inquiry
      </Button>

      <InquiryHistoryTimeline inquiryId={inquiry.id} />
    </Stack>
  )
}

const statusColors: Record<string, GetThemeValueForKey<'color'>> = {
  draft: '$gray10',
  sent: '$blue10',
  candidate_responded: '$purple10',
  organization_responded: '$yellow10',
  accepted: '$green10',
  rejected: '$red10',
  withdrawn: '$gray10',
}

function StatusBadge({ label }: { label: string }) {
  return (
    <Row
      paddingHorizontal={8}
      paddingVertical={4}
      backgroundColor="$color3"
      borderRadius={12}
      align="center"
      gap={4}
    >
      <Text color={statusColors[label] ?? '$color11'}>{label.replace(/_/g, ' ')}</Text>
    </Row>
  )
}

function SubtleBadge({ label }: { label: string }) {
  return (
    <Row paddingHorizontal={8} paddingVertical={4} backgroundColor="$color2" borderRadius={12}>
      <Text color="$gray11">{label}</Text>
    </Row>
  )
}
