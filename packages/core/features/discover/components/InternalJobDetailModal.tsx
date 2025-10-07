import { useState } from 'react'
import {
  Dialog,
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Separator,
  TextArea,
  Spinner,
} from 'tamagui'
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  X,
  CheckCircle2,
} from '@tamagui/lucide-icons'
import { Chip } from '@app/ui'
import type { InternalJob } from './InternalJobCard'
import { api } from '@app/core/utils/api'

interface InternalJobDetailModalProps {
  job: InternalJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  hasApplied?: boolean
  onApplySuccess?: () => void
}

/**
 * Format pay range for display
 */
function formatPayRange(minCents?: number, maxCents?: number, type?: string): string {
  if (!minCents || !maxCents || !type) return ''

  const min = (minCents / 100).toFixed(2)
  const max = (maxCents / 100).toFixed(2)

  const formatCurrency = (value: string) => {
    return `$${Number.parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const range = `${formatCurrency(min)} - ${formatCurrency(max)}`

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

/**
 * Format employment type for display
 */
function formatEmploymentType(type?: string): string {
  if (!type) return ''

  const typeMap: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }

  return typeMap[type] || type
}

/**
 * Format remote option for display
 */
function formatRemoteOption(option?: string): string {
  if (!option) return ''

  const optionMap: Record<string, string> = {
    on_site: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
  }

  return optionMap[option] || option
}

/**
 * Internal Job Detail Modal Component
 * Displays full job details with apply functionality
 */
export function InternalJobDetailModal({
  job,
  open,
  onOpenChange,
  hasApplied = false,
  onApplySuccess,
}: InternalJobDetailModalProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(false)

  const applyMutation = api.jobs.createApplication.useMutation({
    onSuccess: () => {
      setApplicationSuccess(true)
      setCoverLetter('')
      setTimeout(() => {
        setShowApplicationForm(false)
        setApplicationSuccess(false)
        onApplySuccess?.()
      }, 2000)
    },
  })

  if (!job) return null

  const payRange = formatPayRange(
    job.pay_range_min_cents,
    job.pay_range_max_cents,
    job.pay_range_type
  )
  const employmentType = formatEmploymentType(job.employment_type)
  const remoteOption = formatRemoteOption(job.remote_option)

  const handleApply = () => {
    if (hasApplied) return

    applyMutation.mutate({
      job_id: job.id,
      cover_letter: coverLetter || undefined,
    })
  }

  const handleClose = () => {
    setShowApplicationForm(false)
    setApplicationSuccess(false)
    setCoverLetter('')
    onOpenChange(false)
  }

  return (
    <Dialog modal open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width="90%"
        >
          <Dialog.Title fontSize="$7" fontWeight="700">
            {job.title}
          </Dialog.Title>

          <Dialog.Close asChild>
            <Button size="$3" circular icon={X} chromeless />
          </Dialog.Close>

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$4" pb="$4">
              {/* Company info */}
              {job.organization && (
                <XStack gap="$2" items="center">
                  <Building2 size={20} color="$color11" />
                  <Text fontSize="$5" color="$color11" fontWeight="600">
                    {job.organization.name}
                  </Text>
                </XStack>
              )}

              {/* Job metadata */}
              <XStack gap="$3" flexWrap="wrap">
                {job.location && (
                  <XStack gap="$2" items="center">
                    <MapPin size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {job.location}
                    </Text>
                  </XStack>
                )}
                {employmentType && (
                  <XStack gap="$2" items="center">
                    <Briefcase size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {employmentType}
                    </Text>
                  </XStack>
                )}
                {remoteOption && (
                  <Chip bg="$blue9" color="$blue1" fontSize="$2" px="$2" py="$1">
                    {remoteOption}
                  </Chip>
                )}
              </XStack>

              {/* Pay range */}
              {payRange && (
                <XStack gap="$2" items="center">
                  <DollarSign size={18} color="$green10" />
                  <Text fontSize="$4" color="$green10" fontWeight="600">
                    {payRange}
                  </Text>
                </XStack>
              )}

              <Separator />

              {/* Description */}
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Job Description
                </Text>
                <Text fontSize="$3" color="$color11" lineHeight="$4">
                  {job.description}
                </Text>
              </YStack>

              {/* Required Certifications */}
              {job.certifications && job.certifications.length > 0 && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Required Certifications
                    </Text>
                    <XStack gap="$2" flexWrap="wrap">
                      {job.certifications.map((cert) => (
                        <Chip
                          key={cert.id}
                          bg="$red10"
                          color="$color1"
                          fontSize="$3"
                          px="$3"
                          py="$2"
                        >
                          {cert.name}
                        </Chip>
                      ))}
                    </XStack>
                  </YStack>
                </>
              )}

              {/* Required Skills */}
              {job.skills && job.skills.length > 0 && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Required Skills
                    </Text>
                    <XStack gap="$2" flexWrap="wrap">
                      {job.skills.map((skill) => (
                        <Chip
                          key={skill.id}
                          bg="$blue10"
                          color="$color1"
                          fontSize="$3"
                          px="$3"
                          py="$2"
                        >
                          {skill.name}
                        </Chip>
                      ))}
                    </XStack>
                  </YStack>
                </>
              )}

              {/* Application Section */}
              {!hasApplied && !showApplicationForm && (
                <>
                  <Separator />
                  <Button
                    size="$4"
                    theme="blue"
                    onPress={() => setShowApplicationForm(true)}
                    mt="$2"
                  >
                    Apply for this Position
                  </Button>
                </>
              )}

              {/* Application Form */}
              {!hasApplied && showApplicationForm && !applicationSuccess && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Submit Application
                    </Text>
                    <YStack gap="$2">
                      <Text fontSize="$3" color="$color11">
                        Cover Letter (Optional)
                      </Text>
                      <TextArea
                        placeholder="Tell us why you're a great fit for this position..."
                        value={coverLetter}
                        onChangeText={setCoverLetter}
                        height={120}
                        maxLength={2000}
                      />
                      <Text fontSize="$2" color="$color9">
                        {coverLetter.length}/2000 characters
                      </Text>
                    </YStack>

                    <XStack gap="$2" mt="$2">
                      <Button
                        flex={1}
                        size="$4"
                        theme="blue"
                        onPress={handleApply}
                        disabled={applyMutation.isPending}
                        icon={applyMutation.isPending ? <Spinner /> : undefined}
                      >
                        {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                      </Button>
                      <Button
                        size="$4"
                        chromeless
                        onPress={() => setShowApplicationForm(false)}
                        disabled={applyMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </XStack>

                    {applyMutation.isError && (
                      <Text fontSize="$3" color="$red10" mt="$2">
                        {applyMutation.error?.message || 'Failed to submit application'}
                      </Text>
                    )}
                  </YStack>
                </>
              )}

              {/* Application Success */}
              {applicationSuccess && (
                <YStack gap="$3" items="center" py="$4">
                  <CheckCircle2 size={48} color="$green10" />
                  <Text fontSize="$5" fontWeight="600" color="$green10">
                    Application Submitted!
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    Your application has been submitted successfully. The employer will review your
                    application and contact you if you're a good fit.
                  </Text>
                </YStack>
              )}

              {/* Already Applied */}
              {hasApplied && (
                <>
                  <Separator />
                  <YStack gap="$3" items="center" py="$3">
                    <Chip bg="$green9" color="$green1" fontSize="$4" px="$4" py="$3">
                      ✓ Applied
                    </Chip>
                    <Text fontSize="$3" color="$color11">
                      You have already applied to this position
                    </Text>
                  </YStack>
                </>
              )}
            </YStack>
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
