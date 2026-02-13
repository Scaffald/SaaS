import {
  useInquiryByApplication,
  useAcceptInquirySectionMutation,
  useSubmitCapabilityResponseMutation,
} from '@scf/core/utils/inquiries-sdk-hooks'
import { useInquirySubscription } from '@scf/core/utils/supabase/useInquirySubscription'
import type { InquirySectionName } from '@scf/schemas'
import { Button, Input, ScrollView, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
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
        message: 'You have accepted this section of the inquiry.',
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
        <Text>Loading inquiry...</Text>
      </Stack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <Stack padding="md" align="center" gap={16}>
        <Text color="$red10">Failed to load inquiry</Text>
      </Stack>
    )
  }

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

  const { inquiry, sections: rawSections, comments } = data
  const sections = rawSections as InquirySectionStatus[]
  const jobInfo = data.job ?? data.application?.job ?? null
  const applicationInfo = data.application ?? null
  const capabilityQuestions =
    (data.capabilityQuestions as CapabilityQuestionDefinition[] | undefined) ?? []
  const jobTitleDisplay =
    jobInfo?.title ??
    applicationInfo?.job?.title ??
    data.application?.jobTitle ??
    inquiry.job_title ??
    'Job'
  const jobOrganizationName =
    jobInfo?.organizationName ??
    jobInfo?.organization?.name ??
    applicationInfo?.job?.organization?.name ??
    null
  const jobLocation =
    jobInfo?.location ?? applicationInfo?.job?.location ?? inquiry.working_hours_timezone ?? null
  const jobEmploymentType = formatEmploymentTypeLabel(
    jobInfo?.employmentType ?? applicationInfo?.job?.employmentType ?? inquiry.employment_type
  )
  const jobRemoteOption = formatRemoteOptionLabel(
    jobInfo?.remoteOption ?? applicationInfo?.job?.remoteOption ?? null
  )
  const jobPayRange =
    formatJobPayRange(jobInfo) ?? formatJobPayRange(applicationInfo?.job ?? null) ?? null
  const applicationStatus = formatStatus(applicationInfo?.status)
  const submittedAtDisplay = formatDateTime(applicationInfo?.createdAt)
  const updatedAtDisplay = formatDateTime(applicationInfo?.updatedAt)
  const stageChangedDisplay = formatDateTime(applicationInfo?.stageChangedAt)

  // Calculate progress
  const acceptedSections = sections.filter((s) => s.accepted_by).length
  const totalSections = sections.length
  const progress = totalSections > 0 ? (acceptedSections / totalSections) * 100 : 0

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

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Row justify="space-between" align="center">
      <Text>{label}</Text>
      <Text color="$gray11">{value && value.length > 0 ? value : 'Not specified'}</Text>
    </Row>
  )

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
      <Row
        align="center"
        justify="space-between"
        padding="sm"
        backgroundColor="$color2"
        borderRadius={12}
        cursor="pointer"
        onPress={() => toggleSection(sectionName)}
      >
        <Row align="center" gap={8} flex={1}>
          {isExpanded ? (
            <ChevronUp size="md" color="$gray11" />
          ) : (
            <ChevronDown size="md" color="$gray11" />
          )}
          <Text>{title}</Text>
          {isAccepted && (
            <Row
              backgroundColor="$green3"
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={8}
              align="center"
              gap={4}
            >
              <Check size="sm" color="$green11" />
              <Text color="$green11">Accepted</Text>
            </Row>
          )}
          {commentCount > 0 && (
            <Row align="center" gap={4}>
              <MessageSquare size={14} color="$gray11" />
              <Text color="$gray11">{commentCount}</Text>
            </Row>
          )}
        </Row>
      </Row>
    )
  }

  const NonNegotiableBadge = () => (
    <Row backgroundColor="$gray3" paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
      <Text color="$gray11">Non-negotiable</Text>
    </Row>
  )

  return (
    <ScrollView>
      <Stack gap={16} padding="md">
        {/* Progress Indicator */}
        <Stack gap={8} padding="md" backgroundColor="$blue2" borderRadius={16}>
          <Row justify="space-between" align="center">
            <Text>Inquiry Progress</Text>
            <Text color="$blue11">
              {acceptedSections}/{totalSections}
            </Text>
          </Row>
          <Stack height={8} backgroundColor="$color3" borderRadius="$10" overflow="hidden">
            <Stack
              height="100%"
              backgroundColor="$blue9"
              width={`${progress}%`}
              animation="quick"
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
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
                <Text color="$gray11">Application metadata is unavailable.</Text>
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              {/* Employment Terms */}
              <Stack gap={8}>
                {inquiry.employment_type && (
                  <Row justify="space-between" align="center">
                    <Text>Employment type</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inquiry.employment_type === 'permanent' ? 'Permanent' : 'Temporary'}
                      </Text>
                      {!inquiry.employment_type_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inquiry.work_schedule && (
                  <Row justify="space-between" align="center">
                    <Text>Work schedule</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inquiry.work_schedule === 'full_time'
                          ? 'Full time'
                          : inquiry.work_schedule === 'part_time'
                            ? 'Part time'
                            : 'Day-Week'}
                      </Text>
                      {!inquiry.work_schedule_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inquiry.working_hours_start && inquiry.working_hours_end && (
                  <Row justify="space-between" align="center">
                    <Text>Working hours</Text>
                    <Row align="center" gap={8}>
                      <Text>
                        {inquiry.working_hours_start} - {inquiry.working_hours_end}
                        {inquiry.working_hours_timezone && ` (${inquiry.working_hours_timezone})`}
                      </Text>
                      {!inquiry.working_hours_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inquiry.workdays && inquiry.workdays.length > 0 && (
                  <Row justify="space-between" align="center">
                    <Text>Workdays</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatWorkdays()}</Text>
                      {!inquiry.workdays_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inquiry.employment_start_date && (
                  <Row justify="space-between" align="center">
                    <Text>Start date</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatDate(inquiry.employment_start_date)}</Text>
                      {!inquiry.employment_dates_negotiable && <NonNegotiableBadge />}
                    </Row>
                  </Row>
                )}
                {inquiry.employment_end_date && (
                  <Row justify="space-between" align="center">
                    <Text>End date</Text>
                    <Row align="center" gap={8}>
                      <Text>{formatDate(inquiry.employment_end_date)}</Text>
                      {!inquiry.employment_dates_negotiable && <NonNegotiableBadge />}
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
                  theme="success"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Employment Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'employment')?.accepted_by && (
                <Stack
                  padding="sm"
                  backgroundColor="$green2"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$green9"
                >
                  <Text color="$green11">
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              {/* Rate Display */}
              <Row justify="space-between" align="center">
                <Text>Rate</Text>
                <Row align="center" gap={8}>
                  <Text>
                    {formatRate()} {inquiry.rate_type === 'hourly' ? '/hr' : '/yr'}
                  </Text>
                  {!inquiry.rate_negotiable && <NonNegotiableBadge />}
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
                  theme="success"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Compensation Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'compensation')?.accepted_by && (
                <Stack
                  padding="sm"
                  backgroundColor="$green2"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$green9"
                >
                  <Text color="$green11">
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              {/* Endurance Requirement */}
              {inquiry.endurance_required && (
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
                  theme="success"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Capabilities Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'capabilities')?.accepted_by && (
                <Stack
                  padding="sm"
                  backgroundColor="$green2"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$green9"
                >
                  <Text color="$green11">
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
              backgroundColor="$background"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
            >
              {/* Other Terms */}
              <Stack gap={8}>
                {inquiry.willing_to_travel !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Willing to travel</Text>
                    <Text>
                      {inquiry.willing_to_travel ? 'Yes' : 'No'}
                      {inquiry.travel_distance_miles &&
                        ` (up to ${inquiry.travel_distance_miles} miles)`}
                    </Text>
                  </Row>
                )}
                {inquiry.willing_to_work_overtime !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Willing to work overtime</Text>
                    <Text>{inquiry.willing_to_work_overtime ? 'Yes' : 'No'}</Text>
                  </Row>
                )}
                {inquiry.has_drivers_license !== null && (
                  <Row justify="space-between" align="center">
                    <Text>Has driver's license</Text>
                    <Text>{inquiry.has_drivers_license ? 'Yes' : 'No'}</Text>
                  </Row>
                )}
                {inquiry.additional_notes && (
                  <Stack gap={8}>
                    <Text>Additional notes</Text>
                    <Text color="$gray11">{inquiry.additional_notes}</Text>
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
                  theme="success"
                >
                  {acceptSectionMutation.isPending ? 'Accepting...' : 'Accept Other Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'other')?.accepted_by && (
                <Stack
                  padding="sm"
                  backgroundColor="$green2"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$green9"
                >
                  <Text color="$green11">
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
