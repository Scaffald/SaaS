import { api } from '@scf/core/utils/api'
import { ResponsiveModal } from '@unicornlove/ui'
import { extractPlainText } from '@unicornlove/ui'
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from '@tamagui/lucide-icons'
import { ScrollView, Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

interface JobData {
  id?: string
  title?: string | null
  organization?: {
    id?: string
    name?: string | null
  } | null
  employment_type?: string | null
  position_level?: string | null
  location?: string | null
  remote_option?: string | null
  pay_range_min_cents?: number | null
  pay_range_max_cents?: number | null
  pay_range_type?: string | null
  posted_at?: string | null
  description?: string | null | Record<string, unknown>
  job_skills?: Array<{
    id?: string
    taxonomy?: string
    csi_skill?: { id?: string | number; name?: string } | null
    onet_occupation?: { code?: string; title?: string } | null
  }>
  job_certifications?: Array<{
    id?: string
    name?: string
    is_required?: boolean
    certification?: { id?: string; name?: string } | null
  }>
  status?: string | null
}

interface JobPreviewModalProps {
  jobId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Job Preview Modal for Office/Admin View
 * Shows how the job will appear to candidates
 */
export function JobPreviewModal({ jobId, open, onOpenChange }: JobPreviewModalProps) {
  // Fetch job data using office endpoint
  const { data, isLoading } = api.office.getJob.useQuery(
    { id: jobId || '' },
    { enabled: !!jobId && open }
  )

  const job = (data?.job ?? {}) as JobData

  const formatPayRange = (
    minCents: number | null,
    maxCents: number | null,
    type: string | null
  ) => {
    if (!minCents && !maxCents) return null

    const formatAmount = (cents: number) => {
      const dollars = cents / 100
      if (type === 'hourly') {
        return `$${dollars.toFixed(2)}/hr`
      }
      // For annual, format as K
      if (dollars >= 1000) {
        return `$${(dollars / 1000).toFixed(0)}K`
      }
      return `$${dollars.toFixed(0)}`
    }

    if (minCents && maxCents) {
      return `${formatAmount(minCents)} - ${formatAmount(maxCents)}`
    }
    if (minCents) {
      return `From ${formatAmount(minCents)}`
    }
    if (maxCents) {
      return `Up to ${formatAmount(maxCents)}`
    }
    return null
  }

  const formatEmploymentType = (type: string | null) => {
    if (!type) return null
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  const formatRemoteOption = (option: string | null) => {
    if (!option) return null
    return option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Job Preview" size="large">
      {isLoading ? (
        <YStack paddingVertical="$8" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$4" color="$color11">
            Loading job details...
          </Text>
        </YStack>
      ) : !job ? (
        <YStack paddingVertical="$8" alignItems="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Job not found
          </Text>
        </YStack>
      ) : (
        <ScrollView style={{ maxHeight: 600 }}>
          <YStack gap="$4" padding="$4">
            {/* Job Header */}
            <YStack gap="$3" alignItems="center">
              <YStack
                width={80}
                height={80}
                borderRadius="$6"
                backgroundColor="$blue4"
                alignItems="center"
                justifyContent="center"
              >
                <Briefcase size={40} color="$blue10" />
              </YStack>

              <YStack gap="$2" alignItems="center">
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {job.title}
                </Text>
                {job.organization && (
                  <XStack gap="$2" alignItems="center">
                    <Building2 size={16} color="$color10" />
                    <Text fontSize="$5" color="$color11">
                      {job.organization.name}
                    </Text>
                  </XStack>
                )}
              </YStack>

              {/* Job Type Badge */}
              <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                {formatEmploymentType(job.employment_type ?? null) && (
                  <XStack
                    backgroundColor="$blue3"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$3"
                    gap="$2"
                    alignItems="center"
                  >
                    <Briefcase size={14} color="$blue10" />
                    <Text fontSize="$2" color="$blue11" fontWeight="600">
                      {formatEmploymentType(job.employment_type ?? null)}
                    </Text>
                  </XStack>
                )}
                {formatRemoteOption(job.remote_option ?? null) && (
                  <XStack
                    backgroundColor="$green3"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$3"
                    gap="$2"
                    alignItems="center"
                  >
                    <MapPin size={14} color="$green10" />
                    <Text fontSize="$2" color="$green11" fontWeight="600">
                      {formatRemoteOption(job.remote_option ?? null)}
                    </Text>
                  </XStack>
                )}
              </XStack>
            </YStack>

            <Separator />

            {/* Job Metadata */}
            <YStack gap="$3">
              {job.location && (
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {job.location}
                  </Text>
                </XStack>
              )}

              {formatPayRange(
                job.pay_range_min_cents ?? null,
                job.pay_range_max_cents ?? null,
                job.pay_range_type ?? null
              ) && (
                <XStack gap="$2" alignItems="center">
                  <DollarSign size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {formatPayRange(
                      job.pay_range_min_cents ?? null,
                      job.pay_range_max_cents ?? null,
                      job.pay_range_type ?? null
                    )}
                  </Text>
                </XStack>
              )}

              {job.posted_at && (
                <XStack gap="$2" alignItems="center">
                  <Calendar size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    Posted{' '}
                    {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently'}
                  </Text>
                </XStack>
              )}
            </YStack>

            <Separator />

            {/* Description */}
            {job.description && (
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Job Description
                </Text>
                <Text fontSize="$3" color="$color11" lineHeight="$1">
                  {typeof job.description === 'string'
                    ? job.description
                    : extractPlainText(job.description)}
                </Text>
              </YStack>
            )}

            {/* Skills */}
            {job.job_skills && job.job_skills.length > 0 && (
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Users size={16} color="$color10" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Required Skills
                  </Text>
                </XStack>
                <XStack gap="$2" flexWrap="wrap">
                  {(job.job_skills || []).map((jobSkill, idx: number) => {
                    const skillName =
                      jobSkill?.csi_skill?.name ||
                      jobSkill?.onet_occupation?.title ||
                      'Unknown Skill'
                    const skillKey =
                      jobSkill?.csi_skill?.id?.toString() ||
                      jobSkill?.onet_occupation?.code?.toString() ||
                      `skill-${idx}-${skillName}`
                    return (
                      <XStack
                        key={skillKey}
                        backgroundColor="$blue3"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$3"
                      >
                        <Text fontSize="$2" color="$blue11">
                          {skillName}
                        </Text>
                      </XStack>
                    )
                  })}
                </XStack>
              </YStack>
            )}

            {/* Certifications */}
            {job.job_certifications && job.job_certifications.length > 0 && (
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Award size={16} color="$color10" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Required Certifications
                  </Text>
                </XStack>
                <YStack gap="$2">
                  {job.job_certifications.map(
                    (jobCert: (typeof job.job_certifications)[number], idx: number) => {
                      const certKey =
                        jobCert.certification?.id?.toString() ||
                        jobCert.id?.toString() ||
                        `cert-${idx}-${jobCert.certification?.name || 'unknown'}`
                      return (
                        <XStack key={certKey} gap="$2" alignItems="center">
                          <Text fontSize="$3" color="$color11">
                            {jobCert.certification?.name || 'Unknown Certification'}
                          </Text>
                          {jobCert.is_required && (
                            <Text fontSize="$2" color="$red10">
                              (Required)
                            </Text>
                          )}
                        </XStack>
                      )
                    }
                  )}
                </YStack>
              </YStack>
            )}

            {/* Status Badge */}
            <XStack justifyContent="center">
              <XStack
                backgroundColor={
                  job.status === 'open'
                    ? '$green3'
                    : job.status === 'draft'
                      ? '$gray3'
                      : job.status === 'paused'
                        ? '$yellow3'
                        : '$red3'
                }
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
              >
                <Text
                  fontSize="$2"
                  color={
                    job.status === 'open'
                      ? '$green11'
                      : job.status === 'draft'
                        ? '$gray11'
                        : job.status === 'paused'
                          ? '$yellow11'
                          : '$red11'
                  }
                  fontWeight="600"
                >
                  {job.status
                    ? job.status.charAt(0).toUpperCase() + job.status.slice(1)
                    : 'Unknown'}
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </ScrollView>
      )}
    </ResponsiveModal>
  )
}
