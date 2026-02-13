import { api } from '@scf/core/utils/api'
import { ResponsiveModal } from '@unicornlove/beyond-ui'
import { extractPlainText } from '@unicornlove/beyond-ui'
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from 'lucide-react-native'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Job Preview" size="lg">
      {isLoading ? (
        <Stack paddingVertical={32} align="center" justify="center">
          <Spinner size="lg" color="$blue10" />
          <Text marginTop={16} color="gray">
            Loading job details...
          </Text>
        </Stack>
      ) : !job ? (
        <Stack paddingVertical={32} align="center">
          <Text color="$red10">
            Job not found
          </Text>
        </Stack>
      ) : (
        <ScrollView style={{ maxHeight: 600 }}>
          <Stack gap={16} padding={16}>
            {/* Job Header */}
            <Stack gap={12} align="center">
              <Stack
                width={80}
                height={80}
                borderRadius={24}
                backgroundColor="$blue4"
                align="center"
                justify="center"
              >
                <Briefcase size={40} color="$blue10" />
              </Stack>

              <Stack gap={8} align="center">
                <Text color="gray">
                  {job.title}
                </Text>
                {job.organization && (
                  <Row gap={8} align="center">
                    <Building2 size={16} color="gray" />
                    <Text color="gray">
                      {job.organization.name}
                    </Text>
                  </Row>
                )}
              </Stack>

              {/* Job Type Badge */}
              <Row gap={8} flexWrap="wrap" justify="center">
                {formatEmploymentType(job.employment_type ?? null) && (
                  <Row
                    backgroundColor="$blue3"
                    paddingHorizontal={12}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={8}
                    align="center"
                  >
                    <Briefcase size={14} color="$blue10" />
                    <Text color="$blue11">
                      {formatEmploymentType(job.employment_type ?? null)}
                    </Text>
                  </Row>
                )}
                {formatRemoteOption(job.remote_option ?? null) && (
                  <Row
                    backgroundColor="$green3"
                    paddingHorizontal={12}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={8}
                    align="center"
                  >
                    <MapPin size={14} color="$green10" />
                    <Text color="$green11">
                      {formatRemoteOption(job.remote_option ?? null)}
                    </Text>
                  </Row>
                )}
              </Row>
            </Stack>

            <Separator />

            {/* Job Metadata */}
            <Stack gap={12}>
              {job.location && (
                <Row gap={8} align="center">
                  <MapPin size={16} color="gray" />
                  <Text color="gray">
                    {job.location}
                  </Text>
                </Row>
              )}

              {formatPayRange(
                job.pay_range_min_cents ?? null,
                job.pay_range_max_cents ?? null,
                job.pay_range_type ?? null
              ) && (
                <Row gap={8} align="center">
                  <DollarSign size={16} color="gray" />
                  <Text color="gray">
                    {formatPayRange(
                      job.pay_range_min_cents ?? null,
                      job.pay_range_max_cents ?? null,
                      job.pay_range_type ?? null
                    )}
                  </Text>
                </Row>
              )}

              {job.posted_at && (
                <Row gap={8} align="center">
                  <Calendar size={16} color="gray" />
                  <Text color="gray">
                    Posted{' '}
                    {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently'}
                  </Text>
                </Row>
              )}
            </Stack>

            <Separator />

            {/* Description */}
            {job.description && (
              <Stack gap={8}>
                <Text color="gray">
                  Job Description
                </Text>
                <Text color="gray" lineHeight={4}>
                  {typeof job.description === 'string'
                    ? job.description
                    : extractPlainText(job.description)}
                </Text>
              </Stack>
            )}

            {/* Skills */}
            {job.job_skills && job.job_skills.length > 0 && (
              <Stack gap={8}>
                <Row gap={8} align="center">
                  <Users size={16} color="gray" />
                  <Text color="gray">
                    Required Skills
                  </Text>
                </Row>
                <Row gap={8} flexWrap="wrap">
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
                      <Row
                        key={skillKey}
                        backgroundColor="$blue3"
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={12}
                      >
                        <Text color="$blue11">
                          {skillName}
                        </Text>
                      </Row>
                    )
                  })}
                </Row>
              </Stack>
            )}

            {/* Certifications */}
            {job.job_certifications && job.job_certifications.length > 0 && (
              <Stack gap={8}>
                <Row gap={8} align="center">
                  <Award size={16} color="gray" />
                  <Text color="gray">
                    Required Certifications
                  </Text>
                </Row>
                <Stack gap={8}>
                  {job.job_certifications.map(
                    (jobCert: (typeof job.job_certifications)[number], idx: number) => {
                      const certKey =
                        jobCert.certification?.id?.toString() ||
                        jobCert.id?.toString() ||
                        `cert-${idx}-${jobCert.certification?.name || 'unknown'}`
                      return (
                        <Row key={certKey} gap={8} align="center">
                          <Text color="gray">
                            {jobCert.certification?.name || 'Unknown Certification'}
                          </Text>
                          {jobCert.is_required && (
                            <Text color="$red10">
                              (Required)
                            </Text>
                          )}
                        </Row>
                      )
                    }
                  )}
                </Stack>
              </Stack>
            )}

            {/* Status Badge */}
            <Row justify="center">
              <Row
                backgroundColor={
                  job.status === 'open'
                    ? '$green3'
                    : job.status === 'draft'
                      ? '$gray3'
                      : job.status === 'paused'
                        ? '$yellow3'
                        : '$red3'
                }
                paddingHorizontal={12}
                paddingVertical={4}
                borderRadius={12}
              >
                <Text
                  color={
                    job.status === 'open'
                      ? '$green11'
                      : job.status === 'draft'
                        ? '$gray11'
                        : job.status === 'paused'
                          ? '$yellow11'
                          : '$red11'
                  }
                >
                  {job.status
                    ? job.status.charAt(0).toUpperCase() + job.status.slice(1)
                    : 'Unknown'}
                </Text>
              </Row>
            </Row>
          </Stack>
        </ScrollView>
      )}
    </ResponsiveModal>
  )
}
