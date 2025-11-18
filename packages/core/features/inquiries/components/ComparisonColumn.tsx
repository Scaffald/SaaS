import { YStack, XStack, Text, Card, Avatar, Button } from '@app/ui'
import { Check, MessageSquare } from '@tamagui/lucide-icons'
import { ComparisonField } from './ComparisonField'

interface ComparisonColumnProps {
  inquiryData: {
    inquiry: {
      id: string
      application_id: string
      employment_type: string | null
      work_schedule: string | null
      working_hours_start: string | null
      working_hours_end: string | null
      working_hours_timezone: string | null
      rate_type: string
      rate_min_cents: number | null
      rate_max_cents: number | null
      employment_start_date: string | null
      employment_end_date: string | null
      workdays: string[] | null
    }
    sections: Array<{
      section_name: string
      accepted_by: string | null
      accepted_at: string | null
    }>
    comments: Array<{
      section_name: string
    }>
    capabilityResponses: Array<{
      capability_name: string
      response_value: boolean | null
      response_text: string | null
    }>
    application: {
      id: string
      jobTitle: string | null
      candidate: {
        id: string | null
        name: string
        avatar: string | null
      }
    }
  }
  width: number
  highlightDifferences: Set<string>
}

export function ComparisonColumn({
  inquiryData,
  width,
  highlightDifferences,
}: ComparisonColumnProps) {
  const { inquiry, sections, comments, capabilityResponses, application } = inquiryData

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
    const timezone = inquiry.working_hours_timezone
      ? ` (${inquiry.working_hours_timezone})`
      : ''
    return `${inquiry.working_hours_start} - ${inquiry.working_hours_end}${timezone}`
  }

  // Get section acceptance status
  const getSectionStatus = (sectionName: string) => {
    const section = sections.find((s) => s.section_name === sectionName)
    return {
      accepted: !!section?.accepted_by,
      acceptedAt: section?.accepted_at || null,
    }
  }

  // Get comment count for section
  const getCommentCount = (sectionName: string) => {
    return comments.filter((c) => c.section_name === sectionName).length
  }

  return (
    <YStack
      width={width}
      gap="$3"
      bg="$background"
      p="$4"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      $sm={{ width: '100%', minWidth: '100%' }}
    >
      {/* Candidate Header */}
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <Avatar circular size="$4">
            <Avatar.Image src={application.candidate.avatar || undefined} />
            <Avatar.Fallback bg="$blue9">
              <Text color="white" fontWeight="600">
                {application.candidate.name.charAt(0).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text fontSize="$5" fontWeight="600">
              {application.candidate.name}
            </Text>
            {application.jobTitle && (
              <Text fontSize="$2" color="$color11">
                {application.jobTitle}
              </Text>
            )}
          </YStack>
        </XStack>

        {/* Section Status Badges */}
        <XStack gap="$2" flexWrap="wrap">
          {['employment', 'compensation', 'capabilities', 'other'].map((sectionName) => {
            const status = getSectionStatus(sectionName)
            const commentCount = getCommentCount(sectionName)
            return (
              <XStack
                key={sectionName}
                bg={status.accepted ? '$green3' : '$gray3'}
                px="$2"
                py="$1"
                rounded="$2"
                items="center"
                gap="$1"
              >
                {status.accepted ? (
                  <Check size={12} color="$green11" />
                ) : (
                  <Text fontSize="$1" color="$gray11">
                    ○
                  </Text>
                )}
                <Text fontSize="$1" color={status.accepted ? '$green11' : '$gray11'} fontWeight="600">
                  {sectionName}
                </Text>
                {commentCount > 0 && (
                  <XStack items="center" gap="$1">
                    <MessageSquare size={10} color="$blue11" />
                    <Text fontSize="$1" color="$blue11">
                      {commentCount}
                    </Text>
                  </XStack>
                )}
              </XStack>
            )
          })}
        </XStack>
      </YStack>

      <Separator />

      {/* Employment Section */}
      <Card p="$3" gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Employment
        </Text>
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
        <ComparisonField label="Workdays" value={formatWorkdays()} isDifferent={false} />
        <ComparisonField
          label="Start Date"
          value={formatDate(inquiry.employment_start_date)}
          isDifferent={false}
        />
        {inquiry.employment_end_date && (
          <ComparisonField
            label="End Date"
            value={formatDate(inquiry.employment_end_date)}
            isDifferent={false}
          />
        )}
        {getSectionStatus('employment').accepted && (
          <XStack items="center" gap="$1" mt="$1">
            <Check size={14} color="$green11" />
            <Text fontSize="$2" color="$green11" fontWeight="600">
              Accepted
            </Text>
          </XStack>
        )}
        {getCommentCount('employment') > 0 && (
          <XStack items="center" gap="$1" mt="$1">
            <MessageSquare size={14} color="$blue11" />
            <Text fontSize="$2" color="$blue11">
              {getCommentCount('employment')} comment{getCommentCount('employment') !== 1 ? 's' : ''}
            </Text>
          </XStack>
        )}
      </Card>

      {/* Compensation Section */}
      <Card p="$3" gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Compensation
        </Text>
        <ComparisonField
          label="Rate"
          value={formatRate()}
          isDifferent={highlightDifferences.has('rate')}
        />
        {getSectionStatus('compensation').accepted && (
          <XStack items="center" gap="$1" mt="$1">
            <Check size={14} color="$green11" />
            <Text fontSize="$2" color="$green11" fontWeight="600">
              Accepted
            </Text>
          </XStack>
        )}
        {getCommentCount('compensation') > 0 && (
          <XStack items="center" gap="$1" mt="$1">
            <MessageSquare size={14} color="$blue11" />
            <Text fontSize="$2" color="$blue11">
              {getCommentCount('compensation')} comment
              {getCommentCount('compensation') !== 1 ? 's' : ''}
            </Text>
          </XStack>
        )}
      </Card>

      {/* Capabilities Section */}
      {capabilityResponses.length > 0 && (
        <Card p="$3" gap="$2">
          <Text fontSize="$4" fontWeight="600">
            Capabilities
          </Text>
          {capabilityResponses.map((response) => (
            <ComparisonField
              key={response.capability_name}
              label={response.capability_name}
              value={
                response.response_value !== null
                  ? response.response_value.toString()
                  : response.response_text || 'Not answered'
              }
              isDifferent={false}
            />
          ))}
          {getSectionStatus('capabilities').accepted && (
            <XStack items="center" gap="$1" mt="$1">
              <Check size={14} color="$green11" />
              <Text fontSize="$2" color="$green11" fontWeight="600">
                Accepted
              </Text>
            </XStack>
          )}
          {getCommentCount('capabilities') > 0 && (
            <XStack items="center" gap="$1" mt="$1">
              <MessageSquare size={14} color="$blue11" />
              <Text fontSize="$2" color="$blue11">
                {getCommentCount('capabilities')} comment
                {getCommentCount('capabilities') !== 1 ? 's' : ''}
              </Text>
            </XStack>
          )}
        </Card>
      )}

      {/* View Full Inquiry Button - navigation handled by parent */}
      <Button size="$3" variant="outlined" disabled>
        View Full Inquiry
      </Button>
    </YStack>
  )
}

