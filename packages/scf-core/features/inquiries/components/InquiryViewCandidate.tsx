import {
  useInquiryByApplication,
  useAcceptInquirySectionMutation,
  useSubmitCapabilityResponseMutation,
} from '@scf/core/utils/inquiries-sdk-hooks'
import { useInquirySubscription } from '@scf/core/utils/supabase/useInquirySubscription'
import type { InquirySectionName } from '@scf/schemas'
import { Button, Input, ScrollView, Separator, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { CapabilityQuestionInput } from './CapabilityQuestionInput'
import { InquiryCommentThread } from './InquiryCommentThread'
import { InquiryHistoryTimeline } from './InquiryHistoryTimeline'

interface InquirySectionStatus {
  section_name: InquirySectionName
  accepted_by: string | null
  accepted_at: string | null
}

interface CapabilityQuestionDefinition {
  name: string
  label: string
  type: string
  unit?: string
  required: boolean
}

interface InquiryViewCandidateProps {
  applicationId: string
  inquiryId: string
}

export function InquiryViewCandidate({ applicationId, inquiryId }: InquiryViewCandidateProps) {
  const { theme } = useThemeContext()
  const toast = useToast()

  // Subscribe to real-time updates for this inquiry
  useInquirySubscription(inquiryId)

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([
      'employment',
      'compensation',
      'capabilities',
      'other',
      'job_details',
      'application_data',
    ])
  )
  const [capabilityResponseState, setCapabilityResponseState] = useState<
    Record<string, { responseValue?: boolean; responseText?: string }>
  >({})
  const { data, isLoading, error } = useInquiryByApplication(applicationId)

  useEffect(() => {
    if (!data?.capabilityResponses) {
      return
    }

    const nextState: Record<string, { responseValue?: boolean; responseText?: string }> = {}
    for (const response of data.capabilityResponses) {
      nextState[response.capability_name] = {
        responseValue: response.response_value ?? undefined,
        responseText: response.response_text ?? undefined,
      }
    }
    setCapabilityResponseState(nextState)
  }, [data?.capabilityResponses])

  const acceptSectionMutation = useAcceptInquirySectionMutation({
    onSuccess: () => {
      toast.show({
        title: 'Section accepted',
        message: 'You have accepted this section of the inv.',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to accept section',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const submitCapabilityResponseMutation = useSubmitCapabilityResponseMutation({
    onSuccess: () => {
      toast.show({
        title: 'Response saved',
        message: 'Your capability response has been saved.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast.show({
        title: 'Failed to save response',
        message: error.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionName)) {
        next.delete(sectionName)
      } else {
        next.add(sectionName)
      }
      return next
    })
  }

  const handleAcceptSection = async (sectionName: InquirySectionName) => {
    try {
      await acceptSectionMutation.mutateAsync({
        inquiryId,
        sectionName,
      })
    } catch (error) {
      console.error('Failed to accept section:', error)
    }
  }

  const handleCapabilityResponse = async (
    capabilityName: string,
    responseValue?: boolean,
    responseText?: string
  ) => {
    try {
      await submitCapabilityResponseMutation.mutateAsync({
        inquiryId,
        capabilityName,
        responseValue,
        responseText,
      })
      setCapabilityResponseState((prev) => ({
        ...prev,
        [capabilityName]: { responseValue, responseText },
      }))
    } catch (error) {
      console.error('Failed to submit capability response:', error)
    }
  }

  if (isLoading) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text>Loading inv...</Text>
      </Stack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text style={{ color: colors.error[500] }}>Failed to load inquiry</Text>
      </Stack>
    )
  }

  // Format rate for display
  const formatRate = () => {
    const minCents = Number((inquiry as Record<string, unknown>).rate_min_cents)
    if (!minCents || Number.isNaN(minCents)) return 'Not specified'
    const min = (minCents / 100).toFixed(2)
    const maxCents = Number((inquiry as Record<string, unknown>).rate_max_cents)
    const max = maxCents && !Number.isNaN(maxCents) ? (maxCents / 100).toFixed(2) : null
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

  const formatEmploymentTypeLabel = (value?: string | null) => {
    if (!value) return null
    const map: Record<string, string> = {
      permanent: 'Permanent',
      temporary: 'Temporary',
      full_time: 'Full time',
      part_time: 'Part time',
      contract: 'Contract',
      temp: 'Temporary',
      intern: 'Internship',
    }
    return map[value] ?? value
  }

  // Format workdays
  const formatWorkdays = () => {
    const workdays = (inquiry as Record<string, unknown>).workdays
    if (!Array.isArray(workdays) || workdays.length === 0) return 'Not specified'
    const dayLabels: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    }
    return workdays.map((day: string) => dayLabels[day] || day).join(', ')
  }

  type JobPayRangeSource = {
    payRangeMinCents?: number | null
    payRangeMaxCents?: number | null
    payRangeType?: string | null
  }

  const formatJobPayRange = (job?: JobPayRangeSource | null) => {
    if (!job) return null
    const { payRangeMinCents: min, payRangeMaxCents: max, payRangeType: type } = job
    if (!min && !max) {
      return null
    }

    const formatCurrency = (value: number) =>
      `$${(value / 100).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`

    let range: string
    if (min && max) {
      range = `${formatCurrency(min)} - ${formatCurrency(max)}`
    } else if (min) {
      range = formatCurrency(min)
    } else if (max) {
      range = formatCurrency(max)
    } else {
      range = ''
    }

    if (!range) {
      return null
    }

    if (!type) {
      return range
    }

    switch (type) {
      case 'hourly':
        return `${range}/hr`
      case 'salary':
        return `${range}/yr`
      case 'contract':
        return `${range} contract`
      case 'project':
        return `${range} project`
      default:
        return range
    }
  }

  const formatRemoteOptionLabel = (value?: string | null) => {
    if (!value) return null
    const map: Record<string, string> = {
      remote: 'Remote',
      on_site: 'On-site',
      hybrid: 'Hybrid',
    }
    return map[value] ?? value
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not specified'
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatStatus = (status?: string | null) => {
    if (!status) return 'Not specified'
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const { sections: rawSections, comments } = data
  const inquiry = data.inquiry as Record<string, unknown>
  const inv = inquiry as Record<string, string | boolean | number | string[] | undefined>
  const sections = rawSections as InquirySectionStatus[]
  type JobInfoSource = {
    title?: string
    location?: string
    organizationName?: string
    organization?: { name?: string }
    employmentType?: string
    remoteOption?: string
    payRangeMinCents?: number | null
    payRangeMaxCents?: number | null
    payRangeType?: string | null
  }
  type ApplicationInfoSource = {
    job?: JobInfoSource
    status?: string
    createdAt?: string
    updatedAt?: string
    stageChangedAt?: string
    jobTitle?: string
    applicationScore?: number | null
  }
  const jobInfo = (data.job ?? (data.application as ApplicationInfoSource | undefined)?.job ?? null) as JobInfoSource | null
  const applicationInfo = (data.application ?? null) as ApplicationInfoSource | null
  const capabilityQuestions =
    (data.capabilityQuestions as CapabilityQuestionDefinition[] | undefined) ?? []
  const jobTitleDisplay =
    jobInfo?.title ??
    applicationInfo?.job?.title ??
    data.application?.jobTitle ??
    inv.job_title ??
    'Job'
  const jobOrganizationName =
    jobInfo?.organizationName ??
    jobInfo?.organization?.name ??
    applicationInfo?.job?.organization?.name ??
    null
  const jobLocation =
    jobInfo?.location ?? applicationInfo?.job?.location ?? inv.working_hours_timezone ?? null
  const jobEmploymentType = formatEmploymentTypeLabel(
    (jobInfo?.employmentType ?? applicationInfo?.job?.employmentType ?? inv.employment_type) as string | null | undefined
  )
  const jobRemoteOption = formatRemoteOptionLabel(
    jobInfo?.remoteOption ?? applicationInfo?.job?.remoteOption ?? null
  )
  const jobPayRange =
    formatJobPayRange(jobInfo) ?? formatJobPayRange(applicationInfo?.job ?? null) ?? null
  const applicationStatus = formatStatus(applicationInfo?.status ?? null)
  const submittedAtDisplay = formatDateTime(applicationInfo?.createdAt ?? null)
  const updatedAtDisplay = formatDateTime(applicationInfo?.updatedAt ?? null)
  const stageChangedDisplay = formatDateTime(applicationInfo?.stageChangedAt ?? null)

  // Calculate progress
  const acceptedSections = sections.filter((s) => s.accepted_by).length
  const totalSections = sections.length
  const progress = totalSections > 0 ? (acceptedSections / totalSections) * 100 : 0

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

  const DetailRow = ({ label, value }: { label: string; value?: unknown }) => {
    const display =
      value == null
        ? 'Not specified'
        : typeof value === 'object' && !Array.isArray(value)
          ? 'Not specified'
          : Array.isArray(value)
            ? value.join(', ')
            : String(value)
    const text = display.length > 0 ? display : 'Not specified'
    return (
      <Row justify="space-between" align="center">
        <Text>{label}</Text>
        <Text style={{ color: colors.text[theme].tertiary }}>{text}</Text>
      </Row>
    )
  }

  const SectionHeader = ({
    title,
    sectionName,
    isAccepted,
    commentCount,
  }: {
    title: string
    sectionName: string
    isAccepted: boolean
    commentCount: number
  }) => {
    const isExpanded = expandedSections.has(sectionName)
    return (
      <Pressable onPress={() => toggleSection(sectionName)}>
        <Row
          align="center"
          justify="space-between"
          padding="sm"
          style={{ backgroundColor: colors.bg[theme].subtle }}
          borderRadius={12}
        >
        <Row align="center" gap={8} style={{ flex: 1 }}>
          {isExpanded ? (
            <ChevronUp size="md" color={colors.text[theme].tertiary} />
          ) : (
            <ChevronDown size="md" color={colors.text[theme].tertiary} />
          )}
          <Text>{title}</Text>
          {isAccepted && (
            <Row
              style={{ backgroundColor: colors.success[100] }}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={8}
              align="center"
              gap={4}
            >
              <Check size="sm" color={colors.success[700]} />
              <Text style={{ color: colors.success[700] }}>Accepted</Text>
            </Row>
          )}
          {commentCount > 0 && (
            <Row align="center" gap={4}>
              <MessageSquare size="md" color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary }}>{commentCount}</Text>
            </Row>
          )}
          </Row>
        </Row>
      </Pressable>
    )
  }

  const NonNegotiableBadge = () => (
    <Row style={{ backgroundColor: colors.bg[theme].muted }} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
      <Text style={{ color: colors.text[theme].tertiary }}>Non-negotiable</Text>
    </Row>
  )

  return (
    <ScrollView>
      <Stack gap={16} padding="md">
        {/* Progress Indicator */}
          <Stack gap={8} padding="md" style={{ backgroundColor: colors.info[50] }} borderRadius={16}>
          <Row justify="space-between" align="center">
            <Text>Inquiry Progress</Text>
            <Text style={{ color: colors.info[600] }}>
              {acceptedSections}/{totalSections}
            </Text>
          </Row>
          <Stack style={{ height: 8, overflow: 'hidden', borderRadius: 10, backgroundColor: colors.bg[theme].muted }}>
            <Stack
              style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.info[500] }}
            />
          </Stack>
        </Stack>

        {/* Job Details (Collapsible) */}
        <Stack gap={8}>
          <SectionHeader
            title="Job Details"
            sectionName="job_details"
            isAccepted={false}
            commentCount={0}
          />
          {expandedSections.has('job_details') && (
            <Stack
              gap={8}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              <DetailRow label="Role" value={jobTitleDisplay} />
              <DetailRow label="Organization" value={jobOrganizationName} />
              <DetailRow label="Location" value={jobLocation} />
              <DetailRow label="Employment type" value={jobEmploymentType} />
              <DetailRow label="Remote option" value={jobRemoteOption} />
              <DetailRow label="Pay range" value={jobPayRange} />
            </Stack>
          )}
        </Stack>

        {/* Application Data (Collapsible) */}
        <Stack gap={8}>
          <SectionHeader
            title="Application Data"
            sectionName="application_data"
            isAccepted={false}
            commentCount={0}
          />
          {expandedSections.has('application_data') && (
            <Stack
              gap={8}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              {applicationInfo ? (
                <Stack gap={8}>
                  <DetailRow label="Status" value={applicationStatus} />
                  <DetailRow
                    label="Application score"
                    value={
                      typeof applicationInfo.applicationScore === 'number'
                        ? applicationInfo.applicationScore.toString()
                        : null
                    }
                  />
                  <DetailRow label="Submitted" value={submittedAtDisplay} />
                  <DetailRow label="Last updated" value={updatedAtDisplay} />
                  <DetailRow label="Stage changed" value={stageChangedDisplay} />
                </Stack>
              ) : (
                <Text style={{ color: colors.text[theme].tertiary }}>Application metadata is unavailable.</Text>
              )}
            </Stack>
          )}
        </Stack>

        {/* Employment Section */}
        <Stack gap={8}>
          <SectionHeader
            title="Employment"
            sectionName="employment"
            isAccepted={
              sections.find(
                (s: { section_name: string; accepted_by: string | null }) =>
                  s.section_name === 'employment'
              )?.accepted_by !== null
            }
            commentCount={commentsBySection.employment?.length || 0}
          />
          {expandedSections.has('employment') && (
            <Stack
              gap={12}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              {/* Employment Terms */}
              <Stack gap={8}>
                {inv.employment_type && (
                  <Row justify="space-between" align="center">
                    <Text>Employment type</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inv.employment_type === 'permanent' ? 'Permanent' : 'Temporary'}
                      </Text>
                      {!inv.employment_type_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inv.work_schedule && (
                  <Row justify="space-between" align="center">
                    <Text>Work schedule</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inv.work_schedule === 'full_time'
                          ? 'Full time'
                          : inv.work_schedule === 'part_time'
                            ? 'Part time'
                            : 'Day-Week'}
                      </Text>
                      {!inv.work_schedule_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inv.working_hours_start && inv.working_hours_end && (
                  <Row justify="space-between" align="center">
                    <Text>Working hours</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inv.working_hours_start} - {inv.working_hours_end}
                        {inv.working_hours_timezone && ` (${inv.working_hours_timezone})`}
                      </Text>
                      {!inv.working_hours_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {Array.isArray(inv.workdays) && inv.workdays.length > 0 && (
                  <Row justify="space-between" align="center">
                    <Text>Workdays</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatWorkdays()}</Text>
                      {!inv.workdays_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inv.employment_start_date && (
                  <Row justify="space-between" align="center">
                    <Text>Start date</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatDate(typeof inv.employment_start_date === 'string' ? inv.employment_start_date : null)}</Text>
                      {!inv.employment_dates_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inv.employment_end_date && (
                  <Row justify="space-between" align="center">
                    <Text>End date</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatDate(typeof inv.employment_end_date === 'string' ? inv.employment_end_date : null)}</Text>
                      {!inv.employment_dates_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
              </Stack>

              <Separator />

              {/* Comments */}
              <InquiryCommentThread
                inquiryId={inquiryId}
                sectionName="employment"
                comments={commentsBySection.employment || []}
              />

              {/* Accept Button */}
              {!sections.find((s) => s.section_name === 'employment')?.accepted_by && (
                <Button
                  onPress={() => handleAcceptSection('employment')}
                  disabled={acceptSectionMutation.isPending}
                  color="primary"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Employment Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'employment')?.accepted_by && (
                <Stack
                  padding="sm"
                  style={{ backgroundColor: colors.success[50], borderColor: colors.border[theme].success }}
                  borderRadius={12}
                  borderWidth={1}
                >
                  <Text style={{ color: colors.success[700] }}>
                    ✓ You accepted the employment terms on{' '}
                    {formatDate(sections.find((s) => s.section_name === 'employment')?.accepted_at)}
                  </Text>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>

        {/* Compensation Section */}
        <Stack gap={8}>
          <SectionHeader
            title="Compensation"
            sectionName="compensation"
            isAccepted={
              sections.find((s) => s.section_name === 'compensation')?.accepted_by !== null
            }
            commentCount={commentsBySection.compensation?.length || 0}
          />
          {expandedSections.has('compensation') && (
            <Stack
              gap={12}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              {/* Rate Display */}
              <Row justify="space-between" align="center">
                <Text>Rate</Text>
                <Row align="center" gap={8}>
                  <Text>
                    {formatRate()} {inv.rate_type === 'hourly' ? '/hr' : '/yr'}
                  </Text>
                  {!inv.rate_negotiable && <NonNegotiableBadge />}
                </Row>
              </Row>

              <Separator />

              {/* Comments */}
              <InquiryCommentThread
                inquiryId={inquiryId}
                sectionName="compensation"
                comments={commentsBySection.compensation || []}
              />

              {/* Accept Button */}
              {!sections.find((s) => s.section_name === 'compensation')?.accepted_by && (
                <Button
                  onPress={() => handleAcceptSection('compensation')}
                  disabled={acceptSectionMutation.isPending}
                  color="primary"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Compensation Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'compensation')?.accepted_by && (
                <Stack
                  padding="sm"
                  style={{ backgroundColor: colors.success[50], borderColor: colors.border[theme].success }}
                  borderRadius={12}
                  borderWidth={1}
                >
                  <Text style={{ color: colors.success[700] }}>
                    ✓ You accepted the compensation terms on{' '}
                    {formatDate(
                      sections.find((s) => s.section_name === 'compensation')?.accepted_at
                    )}
                  </Text>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>

        {/* Capabilities Section */}
        <Stack gap={8}>
          <SectionHeader
            title="Capabilities"
            sectionName="capabilities"
            isAccepted={
              sections.find((s) => s.section_name === 'capabilities')?.accepted_by !== null
            }
            commentCount={commentsBySection.capabilities?.length || 0}
          />
          {expandedSections.has('capabilities') && (
            <Stack
              gap={12}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              {/* Endurance Requirement */}
              {inv.endurance_required && (
                <Stack gap={8}>
                  <Text>Endurance Required</Text>
                  <CapabilityQuestionInput
                    question="Can you meet the endurance requirements for this role?"
                    value={capabilityResponseState.endurance?.responseValue}
                    onChange={(value) => handleCapabilityResponse('endurance', value, undefined)}
                  />
                </Stack>
              )}

              {capabilityQuestions.length > 0 && (
                <Stack gap={12}>
                  {capabilityQuestions.map((question) => {
                    const response = capabilityResponseState[question.name]
                    const normalizedType = question.type?.toLowerCase()

                    if (normalizedType === 'boolean') {
                      return (
                        <CapabilityQuestionInput
                          key={question.name}
                          question={question.label}
                          value={response?.responseValue}
                          onChange={(value) =>
                            handleCapabilityResponse(question.name, value, undefined)
                          }
                        />
                      )
                    }

                    const isNumeric =
                      normalizedType === 'number' ||
                      normalizedType === 'numeric' ||
                      normalizedType === 'integer'

                    const placeholder = question.unit
                      ? `Add response (${question.unit})`
                      : 'Add response'

                    return (
                      <Stack key={question.name} gap={4}>
                        <Text>
                          {question.label}
                          {question.required ? ' *' : ''}
                        </Text>
                        <Input
                          value={response?.responseText ?? ''}
                          onChangeText={(value) =>
                            handleCapabilityResponse(
                              question.name,
                              undefined,
                              value?.trim().length ? value : undefined
                            )
                          }
                          inputMode={isNumeric ? 'numeric' : 'text'}
                          keyboardType={isNumeric ? 'numeric' : undefined}
                          placeholder={placeholder}
                          multiline={!isNumeric}
                          numberOfLines={!isNumeric ? 3 : 1}
                        />
                      </Stack>
                    )
                  })}
                </Stack>
              )}

              <Separator />

              {/* Comments */}
              <InquiryCommentThread
                inquiryId={inquiryId}
                sectionName="capabilities"
                comments={commentsBySection.capabilities || []}
              />

              {/* Accept Button */}
              {!sections.find((s) => s.section_name === 'capabilities')?.accepted_by && (
                <Button
                  onPress={() => handleAcceptSection('capabilities')}
                  disabled={acceptSectionMutation.isPending}
                  color="primary"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Capabilities Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'capabilities')?.accepted_by && (
                <Stack
                  padding="sm"
                  style={{ backgroundColor: colors.success[50], borderColor: colors.border[theme].success }}
                  borderRadius={12}
                  borderWidth={1}
                >
                  <Text style={{ color: colors.success[700] }}>
                    ✓ You accepted the capabilities terms on{' '}
                    {formatDate(
                      sections.find((s) => s.section_name === 'capabilities')?.accepted_at
                    )}
                  </Text>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>

        {/* Other Section */}
        <Stack gap={8}>
          <SectionHeader
            title="Other"
            sectionName="other"
            isAccepted={sections.find((s) => s.section_name === 'other')?.accepted_by !== null}
            commentCount={commentsBySection.other?.length || 0}
          />
          {expandedSections.has('other') && (
            <Stack
              gap={12}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default, borderColor: colors.border[theme].default }}
              borderRadius={12}
              borderWidth={1}
            >
              {/* Other Terms */}
              <Stack gap={8}>
                {inv.willing_to_travel !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Willing to travel</Text>
                    <Text>
                      {inv.willing_to_travel ? 'Yes' : 'No'}
                      {inv.travel_distance_miles &&
                        ` (up to ${inv.travel_distance_miles} miles)`}
                    </Text>
                  </Row>
                )}
                {inv.willing_to_work_overtime !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Willing to work overtime</Text>
                    <Text>{inv.willing_to_work_overtime ? 'Yes' : 'No'}</Text>
                  </Row>
                )}
                {inv.has_drivers_license !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Has driver's license</Text>
                    <Text>{inv.has_drivers_license ? 'Yes' : 'No'}</Text>
                  </Row>
                )}
                {inv.additional_notes && (
                  <Stack gap={8}>
                    <Text>Additional notes</Text>
                    <Text style={{ color: colors.text[theme].tertiary }}>{inv.additional_notes}</Text>
                  </Stack>
                )}
              </Stack>

              <Separator />

              {/* Comments */}
              <InquiryCommentThread
                inquiryId={inquiryId}
                sectionName="other"
                comments={commentsBySection.other || []}
              />

              {/* Accept Button */}
              {!sections.find((s) => s.section_name === 'other')?.accepted_by && (
                <Button
                  onPress={() => handleAcceptSection('other')}
                  disabled={acceptSectionMutation.isPending}
                  color="primary"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Other Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'other')?.accepted_by && (
                <Stack
                  padding="sm"
                  style={{ backgroundColor: colors.success[50], borderColor: colors.border[theme].success }}
                  borderRadius={12}
                  borderWidth={1}
                >
                  <Text style={{ color: colors.success[700] }}>
                    ✓ You accepted the other terms on{' '}
                    {formatDate(sections.find((s) => s.section_name === 'other')?.accepted_at)}
                  </Text>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>

        <InquiryHistoryTimeline inquiryId={inquiryId} />
      </Stack>
    </ScrollView>
  )
}
