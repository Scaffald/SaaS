import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { useInquirySubscription } from '@scf/core/utils/supabase/useInquirySubscription'
import type { InquirySectionName } from '@scf/schemas'
import { ScrollView, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check } from 'lucide-react-native'
import { type ReactNode, useMemo } from 'react'
import { Card } from '@scaffald/ui'
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

interface InquiryRecord {
  rate_min_cents?: number | null
  rate_max_cents?: number | null
  workdays?: string[] | null
  employment_type?: string | null
  employment_type_negotiable?: boolean
  work_schedule?: string | null
  work_schedule_negotiable?: boolean
  working_hours_start?: string | null
  working_hours_end?: string | null
  working_hours_timezone?: string | null
  working_hours_negotiable?: boolean
  workdays_negotiable?: boolean
  employment_start_date?: string | null
  employment_end_date?: string | null
  employment_dates_negotiable?: boolean
  rate_type?: string | null
  rate_negotiable?: boolean
  endurance_required?: boolean
  willing_to_travel?: boolean | null
  travel_distance_miles?: number | null
  willing_to_work_overtime?: boolean | null
  has_drivers_license?: boolean | null
  additional_notes?: string | null
  [key: string]: unknown
}

interface InquirySectionRecord {
  section_name: string
  accepted_by?: string | null
  accepted_at?: string | null
}

function AcceptanceBadge({ acceptedBy, acceptedAt }: AcceptanceBadgeProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

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
    <Row
      style={{ backgroundColor: t === 'dark' ? colors.green[300] : colors.green[600] }}
      paddingHorizontal={12}
      paddingVertical={6}
      borderRadius={24}
      align="center"
      gap={8}
    >
      <Check size="md" color="white" />
      <Text style={{ color: 'white' }}>{`Accepted on ${formatDate(acceptedAt)}`}</Text>
    </Row>
  )
}

export function InquiryViewOrganization({
  applicationId,
  inquiryId,
  candidateName: providedCandidateName,
  jobTitle: providedJobTitle,
}: InquiryViewOrganizationProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Subscribe to real-time updates for this inquiry
  useInquirySubscription(inquiryId)

  const { data, isLoading, error } = useInquiryByApplication(applicationId)

  if (isLoading) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text>Loading inquiry...</Text>
      </Stack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>Failed to load inquiry</Text>
      </Stack>
    )
  }

  const { comments } = data
  const inquiry = data.inquiry as InquiryRecord
  const sections = data.sections as InquirySectionRecord[]

  // Group comments by section
  const commentsBySection = useMemo(() => {
    const grouped: Record<string, typeof comments> = {}
    for (const comment of comments) {
      const sectionName = comment.section_name
      if (sectionName == null) continue
      if (!grouped[sectionName]) {
        grouped[sectionName] = []
      }
      grouped[sectionName].push(comment)
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
    <Row style={{ backgroundColor: colors.bg[t].muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
      <Text style={{ color: colors.text[t].secondary }}>Non-negotiable</Text>
    </Row>
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
    <Row justify="space-between" align="center">
      <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
      <Row align="center" gap={8}>
        <Text>{value || 'Not specified'}</Text>
        {!negotiable && <NonNegotiableBadge />}
      </Row>
    </Row>
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
      (s) => s.section_name === sectionName
    )
    const sectionComments = commentsBySection[sectionName] || []

    return (
      <Card variant="glass" padding="md" style={{ gap: 12 }}>
        {/* Section Header */}
        <Row justify="space-between" align="center">
          <Text>{title}</Text>
          {section && (
            <AcceptanceBadge acceptedBy={section.accepted_by ?? undefined} acceptedAt={section.accepted_at ?? undefined} />
          )}
        </Row>

        <Separator />

        {/* Section Content */}
        <Stack gap={12}>{children}</Stack>

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
      <Stack gap={16} padding="md">
        {/* Header with Edit button */}
        <Row justify="space-between" align="center">
          <Text>Inquiry</Text>
        </Row>
        <Text style={{ color: colors.text[t].secondary }}>
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
            negotiable={inquiry.employment_type_negotiable ?? true}
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
            negotiable={inquiry.work_schedule_negotiable ?? true}
          />
          {inquiry.working_hours_start && inquiry.working_hours_end && (
            <InquiryField
              label="Working hours"
              value={`${inquiry.working_hours_start} - ${inquiry.working_hours_end}${
                inquiry.working_hours_timezone ? ` (${inquiry.working_hours_timezone})` : ''
              }`}
              negotiable={inquiry.working_hours_negotiable ?? true}
            />
          )}
          <InquiryField
            label="Workdays"
            value={formatWorkdays()}
            negotiable={inquiry.workdays_negotiable ?? true}
          />
          <InquiryField
            label="Start date"
            value={formatDate(inquiry.employment_start_date)}
            negotiable={inquiry.employment_dates_negotiable ?? true}
          />
          {inquiry.employment_end_date && (
            <InquiryField
              label="End date"
              value={formatDate(inquiry.employment_end_date)}
              negotiable={inquiry.employment_dates_negotiable ?? true}
            />
          )}
        </InquirySection>

        {/* Compensation Section */}
        <InquirySection title="Compensation" sectionName="compensation">
          <InquiryField
            label="Rate"
            value={`${formatRate()} ${inquiry.rate_type === 'hourly' ? '/hr' : '/yr'}`}
            negotiable={inquiry.rate_negotiable ?? true}
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
            <Stack gap={8}>
              <Text style={{ color: colors.text[t].secondary }}>Additional notes</Text>
              <Text style={{ color: colors.text[t].secondary }}>{inquiry.additional_notes}</Text>
            </Stack>
          )}
        </InquirySection>
      </Stack>
    </ScrollView>
  )
}
