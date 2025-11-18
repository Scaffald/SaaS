import { useState, useMemo } from 'react'
import { YStack, XStack, Text, Button, ScrollView, Separator } from '@app/ui'
import { ChevronDown, ChevronUp, Check, MessageSquare } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useInquirySubscription } from '@app/core/utils/supabase/useInquirySubscription'
import { InquiryCommentThread } from './InquiryCommentThread'
import { CapabilityQuestionInput } from './CapabilityQuestionInput'
import type { InquirySectionName } from '@app/schemas'

interface InquirySectionStatus {
  section_name: InquirySectionName
  accepted_by: string | null
  accepted_at: string | null
}

interface InquiryViewCandidateProps {
  applicationId: string
  inquiryId: string
}

export function InquiryViewCandidate({
  applicationId,
  inquiryId,
}: InquiryViewCandidateProps) {
  const toast = useToastController()

  // Subscribe to real-time updates for this inquiry
  useInquirySubscription(inquiryId)

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['employment', 'compensation', 'capabilities', 'other'])
  )
  const [capabilityResponses, setCapabilityResponses] = useState<
    Record<string, { responseValue?: boolean; responseText?: string }>
  >({})

  const { data, isLoading, error } = api.inquiries.getByApplication.useQuery({
    applicationId,
  })

  const acceptSectionMutation = api.inquiries.acceptSection.useMutation({
    onSuccess: () => {
      toast.show('Section accepted', {
        message: 'You have accepted this section of the inquiry.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Failed to accept section', {
        message: error.message ?? 'Please try again.',
      })
    },
  })

  const submitCapabilityResponseMutation =
    api.inquiries.submitCapabilityResponse.useMutation({
      onSuccess: () => {
        toast.show('Response saved', {
          message: 'Your capability response has been saved.',
        })
      },
      onError: (error: { message?: string }) => {
        toast.show('Failed to save response', {
          message: error.message ?? 'Please try again.',
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
      setCapabilityResponses((prev) => ({
        ...prev,
        [capabilityName]: { responseValue, responseText },
      }))
    } catch (error) {
      console.error('Failed to submit capability response:', error)
    }
  }

  if (isLoading) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text>Loading inquiry...</Text>
      </YStack>
    )
  }

  if (error || !data || !data.inquiry) {
    return (
      <YStack p="$4" items="center" gap="$4">
        <Text color="$red10">Failed to load inquiry</Text>
      </YStack>
    )
  }

  const { inquiry, sections: rawSections, comments } = data
  const sections = rawSections as InquirySectionStatus[]

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

  // Format rate for display
  const formatRate = () => {
    if (!inquiry.rate_min_cents) return 'Not specified'
    const min = (inquiry.rate_min_cents / 100).toFixed(2)
    const max = inquiry.rate_max_cents
      ? (inquiry.rate_max_cents / 100).toFixed(2)
      : null
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
      <XStack
        items="center"
        justify="space-between"
        p="$3"
        bg="$color2"
        rounded="$3"
        cursor="pointer"
        onPress={() => toggleSection(sectionName)}
        $sm={{ p: '$4', height: 48 }}
      >
        <XStack items="center" gap="$2" flex={1}>
          {isExpanded ? (
            <ChevronUp size={16} color="$color11" />
          ) : (
            <ChevronDown size={16} color="$color11" />
          )}
          <Text fontWeight="600" fontSize="$4">
            {title}
          </Text>
          {isAccepted && (
            <XStack bg="$green3" px="$2" py="$1" rounded="$2" items="center" gap="$1">
              <Check size={12} color="$green11" />
              <Text fontSize="$1" color="$green11" fontWeight="600">
                Accepted
              </Text>
            </XStack>
          )}
          {commentCount > 0 && (
            <XStack items="center" gap="$1">
              <MessageSquare size={14} color="$color11" />
              <Text fontSize="$2" color="$color11">
                {commentCount}
              </Text>
            </XStack>
          )}
        </XStack>
      </XStack>
    )
  }

  const NonNegotiableBadge = () => (
    <XStack bg="$gray3" px="$2" py="$1" rounded="$2">
      <Text fontSize="$1" color="$gray11" fontWeight="600">
        Non-negotiable
      </Text>
    </XStack>
  )

  return (
    <ScrollView>
      <YStack gap="$4" p="$4" $sm={{ gap: '$6', p: '$3' }}>
        {/* Progress Indicator */}
        <YStack gap="$2" p="$4" bg="$blue2" rounded="$4">
          <XStack justify="space-between" items="center">
            <Text fontWeight="600" fontSize="$5">
              Inquiry Progress
            </Text>
            <Text fontWeight="600" fontSize="$4" color="$blue11">
              {acceptedSections}/{totalSections}
            </Text>
          </XStack>
          <YStack height={8} bg="$color3" rounded="$10" overflow="hidden">
            <YStack
              height="100%"
              bg="$blue9"
              width={`${progress}%`}
              animation="quick"
            />
          </YStack>
        </YStack>

        {/* Job Details (Collapsible) */}
        <YStack gap="$2">
          <SectionHeader
            title="Job Details"
            sectionName="job_details"
            isAccepted={false}
            commentCount={0}
          />
          {expandedSections.has('job_details') && (
            <YStack gap="$2" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              <Text fontSize="$3" color="$color11">
                Job details will be loaded here
              </Text>
              {/* TODO: Load and display job details */}
            </YStack>
          )}
        </YStack>

        {/* Application Data (Collapsible) */}
        <YStack gap="$2">
          <SectionHeader
            title="Application Data"
            sectionName="application_data"
            isAccepted={false}
            commentCount={0}
          />
          {expandedSections.has('application_data') && (
            <YStack gap="$2" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              <Text fontSize="$3" color="$color11">
                Application data will be loaded here
              </Text>
              {/* TODO: Load and display application data */}
            </YStack>
          )}
        </YStack>

        {/* Employment Section */}
        <YStack gap="$2">
          <SectionHeader
            title="Employment"
            sectionName="employment"
            isAccepted={sections.find((s: { section_name: string; accepted_by: string | null }) => s.section_name === 'employment')?.accepted_by !== null}
            commentCount={commentsBySection.employment?.length || 0}
          />
          {expandedSections.has('employment') && (
            <YStack gap="$3" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              {/* Employment Terms */}
              <YStack gap="$2">
                {inquiry.employment_type && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Employment type</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {inquiry.employment_type === 'permanent' ? 'Permanent' : 'Temporary'}
                      </Text>
                      {!inquiry.employment_type_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
                {inquiry.work_schedule && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Work schedule</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {inquiry.work_schedule === 'full_time'
                          ? 'Full time'
                          : inquiry.work_schedule === 'part_time'
                            ? 'Part time'
                            : 'Day-Week'}
                      </Text>
                      {!inquiry.work_schedule_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
                {inquiry.working_hours_start && inquiry.working_hours_end && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Working hours</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {inquiry.working_hours_start} - {inquiry.working_hours_end}
                        {inquiry.working_hours_timezone && ` (${inquiry.working_hours_timezone})`}
                      </Text>
                      {!inquiry.working_hours_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
                {inquiry.workdays && inquiry.workdays.length > 0 && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Workdays</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {formatWorkdays()}
                      </Text>
                      {!inquiry.workdays_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
                {inquiry.employment_start_date && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Start date</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {formatDate(inquiry.employment_start_date)}
                      </Text>
                      {!inquiry.employment_dates_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
                {inquiry.employment_end_date && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">End date</Text>
                    <XStack items="center" gap="$2">
                      <Text fontWeight="600" fontSize="$3">
                        {formatDate(inquiry.employment_end_date)}
                      </Text>
                      {!inquiry.employment_dates_negotiable && <NonNegotiableBadge />}
                    </XStack>
                  </XStack>
                )}
              </YStack>

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
                  disabled={acceptSectionMutation.isLoading}
                  theme="success"
                  $sm={{ height: 48 }}
                >
                  {acceptSectionMutation.isLoading ? 'Accepting...' : 'Accept Employment Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'employment')?.accepted_by && (
                <YStack p="$3" bg="$green2" rounded="$3" borderWidth={1} borderColor="$green9">
                  <Text fontSize="$3" color="$green11" fontWeight="600">
                    ✓ You accepted the employment terms on{' '}
                    {formatDate(
                      sections.find((s) => s.section_name === 'employment')?.accepted_at
                    )}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Compensation Section */}
        <YStack gap="$2">
          <SectionHeader
            title="Compensation"
            sectionName="compensation"
            isAccepted={sections.find((s) => s.section_name === 'compensation')?.accepted_by !== null}
            commentCount={commentsBySection.compensation?.length || 0}
          />
          {expandedSections.has('compensation') && (
            <YStack gap="$3" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              {/* Rate Display */}
              <XStack justify="space-between" items="center">
                <Text fontSize="$3">Rate</Text>
                <XStack items="center" gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    {formatRate()} {inquiry.rate_type === 'hourly' ? '/hr' : '/yr'}
                  </Text>
                  {!inquiry.rate_negotiable && <NonNegotiableBadge />}
                </XStack>
              </XStack>

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
                  disabled={acceptSectionMutation.isLoading}
                  theme="success"
                  $sm={{ height: 48 }}
                >
                  {acceptSectionMutation.isLoading ? 'Accepting...' : 'Accept Compensation Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'compensation')?.accepted_by && (
                <YStack p="$3" bg="$green2" rounded="$3" borderWidth={1} borderColor="$green9">
                  <Text fontSize="$3" color="$green11" fontWeight="600">
                    ✓ You accepted the compensation terms on{' '}
                    {formatDate(
                      sections.find((s) => s.section_name === 'compensation')?.accepted_at
                    )}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Capabilities Section */}
        <YStack gap="$2">
          <SectionHeader
            title="Capabilities"
            sectionName="capabilities"
            isAccepted={sections.find((s) => s.section_name === 'capabilities')?.accepted_by !== null}
            commentCount={commentsBySection.capabilities?.length || 0}
          />
          {expandedSections.has('capabilities') && (
            <YStack gap="$3" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              {/* Endurance Requirement */}
              {inquiry.endurance_required && (
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$4">
                    Endurance Required
                  </Text>
                  <CapabilityQuestionInput
                    question="Can you meet the endurance requirements for this role?"
                    value={capabilityResponses.endurance?.responseValue}
                    onChange={(value) =>
                      handleCapabilityResponse('endurance', value, undefined)
                    }
                  />
                </YStack>
              )}

              {/* Additional Capability Questions */}
              {/* TODO: Load capability questions from job requirements */}
              <Text fontSize="$3" color="$color11">
                Additional capability questions will be displayed here
              </Text>

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
                  disabled={acceptSectionMutation.isLoading}
                  theme="success"
                  $sm={{ height: 48 }}
                >
                  {acceptSectionMutation.isLoading ? 'Accepting...' : 'Accept Capabilities Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'capabilities')?.accepted_by && (
                <YStack p="$3" bg="$green2" rounded="$3" borderWidth={1} borderColor="$green9">
                  <Text fontSize="$3" color="$green11" fontWeight="600">
                    ✓ You accepted the capabilities terms on{' '}
                    {formatDate(
                      sections.find((s) => s.section_name === 'capabilities')?.accepted_at
                    )}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>

        {/* Other Section */}
        <YStack gap="$2">
          <SectionHeader
            title="Other"
            sectionName="other"
            isAccepted={sections.find((s) => s.section_name === 'other')?.accepted_by !== null}
            commentCount={commentsBySection.other?.length || 0}
          />
          {expandedSections.has('other') && (
            <YStack gap="$3" p="$3" bg="$background" rounded="$3" borderWidth={1} borderColor="$borderColor">
              {/* Other Terms */}
              <YStack gap="$2">
                {inquiry.willing_to_travel !== null && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Willing to travel</Text>
                    <Text fontWeight="600" fontSize="$3">
                      {inquiry.willing_to_travel ? 'Yes' : 'No'}
                      {inquiry.travel_distance_miles &&
                        ` (up to ${inquiry.travel_distance_miles} miles)`}
                    </Text>
                  </XStack>
                )}
                {inquiry.willing_to_work_overtime !== null && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Willing to work overtime</Text>
                    <Text fontWeight="600" fontSize="$3">
                      {inquiry.willing_to_work_overtime ? 'Yes' : 'No'}
                    </Text>
                  </XStack>
                )}
                {inquiry.has_drivers_license !== null && (
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3">Has driver's license</Text>
                    <Text fontWeight="600" fontSize="$3">
                      {inquiry.has_drivers_license ? 'Yes' : 'No'}
                    </Text>
                  </XStack>
                )}
                {inquiry.additional_notes && (
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="600">
                      Additional notes
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {inquiry.additional_notes}
                    </Text>
                  </YStack>
                )}
              </YStack>

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
                  disabled={acceptSectionMutation.isLoading}
                  theme="success"
                  $sm={{ height: 48 }}
                >
                  {acceptSectionMutation.isLoading ? 'Accepting...' : 'Accept Other Terms'}
                </Button>
              )}

              {/* Acceptance Badge */}
              {sections.find((s) => s.section_name === 'other')?.accepted_by && (
                <YStack p="$3" bg="$green2" rounded="$3" borderWidth={1} borderColor="$green9">
                  <Text fontSize="$3" color="$green11" fontWeight="600">
                    ✓ You accepted the other terms on{' '}
                    {formatDate(sections.find((s) => s.section_name === 'other')?.accepted_at)}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  )
}

