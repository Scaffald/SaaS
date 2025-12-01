import { api } from '@app/core/utils/api'
import { useInquirySubscription } from '@app/core/utils/supabase/useInquirySubscription'
import type { InquirySectionName } from '@app/schemas'
import { ScrollView, Separator, Text, XStack, YStack } from '@unicornlove/ui'
import { Check } from '@tamagui/lucide-icons'
import { type ReactNode, useMemo } from 'react'
import { Card } from '@unicornlove/ui'
import { InquiryCommentThread } from './InquiryCommentThread'

interface InquiryViewOrganizationProps {
  applicationId: string
  inquiryId: string
  candidateName?: string
  jobTitle?: string
}

interface AcceptanceBadgeProps {
  acceptedBy?: string
  acceptedAt?: string
}

function AcceptanceBadge({ acceptedBy, acceptedAt }: AcceptanceBadgeProps) {
  if (!acceptedBy) return null

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <XStack
      backgroundColor="$green9"
      paddingHorizontal="$3"
      paddingVertical="$1.5"
      borderRadius="$6"
      alignItems="center"
      gap="$2"
    >
      <Check size={14} color="white" />
      <Text fontSize="$3" color="white" fontWeight="500">
        Accepted on {formatDate(acceptedAt)}
      </Text>
    </XStack>
  )
}

export function InquiryViewOrganization({
  applicationId,
  inquiryId,
  candidateName: providedCandidateName,
  jobTitle: providedJobTitle,
}: InquiryViewOrganizationProps) {
  // Subscribe to real-time updates for this inquiry
  useInquirySubscription(inquiryId)

  const { data, isLoading, error } = api.inquiries.getByApplication.useQuery({
    applicationId,
  })

  if (isLoading) {
    return (
      <YStack padding="$4" alignItems="center" gap="$4">
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <YStack padding="$4" alignItems="center" gap="$4">
        <Text color="$red10">Failed to load inquiry</Text>
      </YStack>
    )
  }

  const { inquiry, sections, comments } = data

  // Group comments by section
  const commentsBySection = useMemo(() => {
    const grouped: Record<string, typeof comments> = {}
    for (const comment of comments) {
      if (!grouped[comment.section_name]) {
        grouped[comment.section_name] = []
      }
      grouped[comment.section_name].push(comment)
    }
    return grouped
  }, [comments])

  // Format rate for display
  const formatRate = () => {
    if (!inquiry.rate_min_cents) return 'Not specified'
    const min = (inquiry.rate_min_cents / 100).toFixed(2)
    const max = inquiry.rate_max_cents ? (inquiry.rate_max_cents / 100).toFixed(2) : null
    return max ? `$${min} - $${max}` : `$${min}`
  }

  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not specified'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  // Use provided candidate/job names or placeholders
  const candidateName = providedCandidateName || 'Candidate'
  const jobTitle = providedJobTitle || 'Job'

  const NonNegotiableBadge = () => (
    <XStack backgroundColor="$gray3" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
      <Text fontSize="$1" color="$gray11" fontWeight="600">
        Non-negotiable
      </Text>
    </XStack>
  )

  const InquiryField = ({
    label,
    value,
    negotiable,
  }: {
    label: string
    value: string | null | undefined
    negotiable: boolean
  }) => (
    <XStack justifyContent="space-between" alignItems="center">
      <Text fontSize="$3" color="$color11">
        {label}
      </Text>
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$3">{value || 'Not specified'}</Text>
        {!negotiable && <NonNegotiableBadge />}
      </XStack>
    </XStack>
  )

  const InquirySection = ({
    title,
    sectionName,
    children,
  }: {
    title: string
    sectionName: InquirySectionName
    children: ReactNode
  }) => {
    const section = sections.find(
      (s: { section_name: InquirySectionName }) => s.section_name === sectionName
    )
    const sectionComments = commentsBySection[sectionName] || []

    return (
      <Card padding="$4" gap="$3">
        {/* Section Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="600">
            {title}
          </Text>
          {section && (
            <AcceptanceBadge acceptedBy={section.accepted_by} acceptedAt={section.accepted_at} />
          )}
        </XStack>

        <Separator />

        {/* Section Content */}
        <YStack gap="$3">{children}</YStack>

        {/* Comment Thread */}
        <Separator />
        <InquiryCommentThread
          inquiryId={inquiryId}
          sectionName={sectionName}
          comments={sectionComments}
        />
      </Card>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$4" padding="$4" $sm={{ gap: '$6', padding: '$3' }}>
        {/* Header with Edit button */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$8" fontWeight="600">
            Inquiry
          </Text>
        </XStack>
        <Text fontSize="$4" color="$color11">
          {candidateName} - {jobTitle}
        </Text>

        {/* Employment Section */}
        <InquirySection title="Employment" sectionName="employment">
          <InquiryField
            label="Employment type"
            value={
              inquiry.employment_type === 'permanent'
                ? 'Permanent'
                : inquiry.employment_type === 'temporary'
                  ? 'Temporary'
                  : null
            }
            negotiable={inquiry.employment_type_negotiable}
          />
          <InquiryField
            label="Work schedule"
            value={
              inquiry.work_schedule === 'full_time'
                ? 'Full time'
                : inquiry.work_schedule === 'part_time'
                  ? 'Part time'
                  : inquiry.work_schedule === 'day_week'
                    ? 'Day-Week'
                    : null
            }
            negotiable={inquiry.work_schedule_negotiable}
          />
          {inquiry.working_hours_start && inquiry.working_hours_end && (
            <InquiryField
              label="Working hours"
              value={`${inquiry.working_hours_start} - ${inquiry.working_hours_end}${
                inquiry.working_hours_timezone ? ` (${inquiry.working_hours_timezone})` : ''
              }`}
              negotiable={inquiry.working_hours_negotiable}
            />
          )}
          <InquiryField
            label="Workdays"
            value={formatWorkdays()}
            negotiable={inquiry.workdays_negotiable}
          />
          <InquiryField
            label="Start date"
            value={formatDate(inquiry.employment_start_date)}
            negotiable={inquiry.employment_dates_negotiable}
          />
          {inquiry.employment_end_date && (
            <InquiryField
              label="End date"
              value={formatDate(inquiry.employment_end_date)}
              negotiable={inquiry.employment_dates_negotiable}
            />
          )}
        </InquirySection>

        {/* Compensation Section */}
        <InquirySection title="Compensation" sectionName="compensation">
          <InquiryField
            label="Rate"
            value={`${formatRate()} ${inquiry.rate_type === 'hourly' ? '/hr' : '/yr'}`}
            negotiable={inquiry.rate_negotiable}
          />
        </InquirySection>

        {/* Capabilities Section */}
        <InquirySection title="Capabilities" sectionName="capabilities">
          <InquiryField
            label="Endurance required"
            value={inquiry.endurance_required ? 'Required' : 'Not required'}
            negotiable={false}
          />
        </InquirySection>

        {/* Other Section */}
        <InquirySection title="Other" sectionName="other">
          {inquiry.willing_to_travel !== null && (
            <InquiryField
              label="Willing to travel"
              value={
                inquiry.willing_to_travel
                  ? `Yes${inquiry.travel_distance_miles ? `, up to ${inquiry.travel_distance_miles} miles` : ''}`
                  : 'No'
              }
              negotiable={false}
            />
          )}
          {inquiry.willing_to_work_overtime !== null && (
            <InquiryField
              label="Willing to work overtime"
              value={inquiry.willing_to_work_overtime ? 'Yes' : 'No'}
              negotiable={false}
            />
          )}
          {inquiry.has_drivers_license !== null && (
            <InquiryField
              label="Has driver's license"
              value={inquiry.has_drivers_license ? 'Yes' : 'No'}
              negotiable={false}
            />
          )}
          {inquiry.additional_notes && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color11">
                Additional notes
              </Text>
              <Text fontSize="$3" color="$color12">
                {inquiry.additional_notes}
              </Text>
            </YStack>
          )}
        </InquirySection>
      </YStack>
    </ScrollView>
  )
}
