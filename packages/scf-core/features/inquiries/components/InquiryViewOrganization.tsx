import { useInquiryByApplication } from '@scf/core/utils/inquiries-sdk-hooks'
import { useInquirySubscription } from '@scf/core/utils/supabase/useInquirySubscription'
import type { InquirySectionName } from '@scf/schemas'
import { ScreenHeader, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check } from 'lucide-react-native'
import { type ReactNode, useMemo } from 'react'
import { Card } from '@scaffald/ui'
import { InquiryCommentThread } from './InquiryCommentThread'
import { InquiryFieldRow } from './InquiryFieldRow'
import {
  formatEmploymentType,
  formatRateRange,
  formatTermDate,
  formatTermTimestamp,
  formatWorkSchedule,
  formatWorkdays,
  formatWorkingHours,
} from '../inquiry-format'

interface InquiryViewOrganizationProps {
  applicationId: string
  inquiryId: string
  candidateName?: string
  jobTitle?: string
  /** Header actions — "Edit inquiry" when the caller can offer it. */
  actions?: ReactNode
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

  return (
    <Row
      style={{ backgroundColor: t === 'dark' ? colors.green[300] : colors.green[600] }}
      paddingHorizontal={12}
      paddingVertical={6}
      borderRadius={24}
      align="center"
      gap={8}
    >
      <Check size={20} color="white" />
      <Text style={{ color: 'white' }}>{`Accepted on ${formatTermTimestamp(acceptedAt)}`}</Text>
    </Row>
  )
}

export function InquiryViewOrganization({
  applicationId,
  inquiryId,
  candidateName: providedCandidateName,
  jobTitle: providedJobTitle,
  actions,
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
        <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>
          Failed to load inquiry
        </Text>
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

  // Use provided candidate/job names or placeholders
  const candidateName = providedCandidateName || 'Candidate'
  const jobTitle = providedJobTitle || 'Job'

  /**
   * Shared with compose and with the candidate's view, so the same term reads
   * the same way to whoever is looking at it (#837).
   */
  const InquiryField = ({
    label,
    value,
    negotiable,
  }: {
    label: string
    value: string | null | undefined
    negotiable?: boolean
  }) => (
    <InquiryFieldRow
      label={label}
      value={value}
      negotiable={negotiable === undefined ? undefined : { value: negotiable }}
    />
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
    const section = sections.find((s) => s.section_name === sectionName)
    const sectionComments = commentsBySection[sectionName] || []

    return (
      <Card variant="glass" padding="md" style={{ gap: 12 }}>
        {/* Section Header */}
        <Row justify="space-between" align="center">
          <Text>{title}</Text>
          {section && (
            <AcceptanceBadge
              acceptedBy={section.accepted_by ?? undefined}
              acceptedAt={section.accepted_at ?? undefined}
            />
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
    <Stack gap={16}>
      <ScreenHeader
        kicker={`${candidateName} · ${jobTitle}`}
        title="Inquiry"
        tip="Each term says whether it is open to negotiation. Comment on a section to reply to it."
        actions={actions}
      />

      {/* Employment Section */}
      <InquirySection title="Employment" sectionName="employment">
        <InquiryField
          label="Employment type"
          value={formatEmploymentType(inquiry.employment_type)}
          negotiable={inquiry.employment_type_negotiable ?? true}
        />
        <InquiryField
          label="Work schedule"
          value={formatWorkSchedule(inquiry.work_schedule)}
          negotiable={inquiry.work_schedule_negotiable ?? true}
        />
        {inquiry.working_hours_start && inquiry.working_hours_end && (
          <InquiryField
            label="Working hours"
            value={formatWorkingHours(
              inquiry.working_hours_start,
              inquiry.working_hours_end,
              inquiry.working_hours_timezone
            )}
            negotiable={inquiry.working_hours_negotiable ?? true}
          />
        )}
        <InquiryField
          label="Workdays"
          value={formatWorkdays(inquiry.workdays)}
          negotiable={inquiry.workdays_negotiable ?? true}
        />
        <InquiryField
          label="Start date"
          value={formatTermDate(inquiry.employment_start_date)}
          negotiable={inquiry.employment_dates_negotiable ?? true}
        />
        {inquiry.employment_end_date && (
          <InquiryField
            label="End date"
            value={formatTermDate(inquiry.employment_end_date)}
            negotiable={inquiry.employment_dates_negotiable ?? true}
          />
        )}
      </InquirySection>

      {/* Compensation Section */}
      <InquirySection title="Compensation" sectionName="compensation">
        <InquiryField
          label="Rate"
          value={formatRateRange(inquiry.rate_min_cents, inquiry.rate_max_cents, inquiry.rate_type)}
          negotiable={inquiry.rate_negotiable ?? true}
        />
      </InquirySection>

      {/* Capabilities Section */}
      <InquirySection title="Capabilities" sectionName="capabilities">
        <InquiryField
          label="Endurance required"
          value={inquiry.endurance_required ? 'Required' : 'Not required'}
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
          />
        )}
        {inquiry.willing_to_work_overtime !== null && (
          <InquiryField
            label="Willing to work overtime"
            value={inquiry.willing_to_work_overtime ? 'Yes' : 'No'}
          />
        )}
        {inquiry.has_drivers_license !== null && (
          <InquiryField
            label="Has driver's license"
            value={inquiry.has_drivers_license ? 'Yes' : 'No'}
          />
        )}
        {inquiry.additional_notes && (
          <InquiryFieldRow label="Additional notes" value={inquiry.additional_notes} last />
        )}
      </InquirySection>
    </Stack>
  )
}
