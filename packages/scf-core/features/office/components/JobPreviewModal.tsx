import { api } from '@scf/core/utils/api'
import { ResponsiveModal, useThemeContext } from '@scaffald/ui'
import { extractPlainText } from '@scaffald/ui'
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from 'lucide-react-native'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
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
          <Spinner size="lg" style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }} />
          <Text marginTop={16} style={{ color: colors.text[theme].secondary }}>
            Loading job details...
          </Text>
        </Stack>
      ) : !job ? (
        <Stack paddingVertical={32} align="center">
          <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>Job not found</Text>
        </Stack>
      ) : (
        <ScrollView style={{ maxHeight: 600 }}>
          <Stack gap={16} padding="md">
            {/* Job Header */}
            <Stack gap={12} align="center">
              <Stack
                width={80}
                height={80}
                borderRadius={24}
                style={{ backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900] }}
                align="center"
                justify="center"
              >
                <Briefcase size={40} style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }} />
              </Stack>

              <Stack gap={8} align="center">
                <Text style={{ color: colors.text[theme].secondary }}>{job.title}</Text>
                {job.organization && (
                  <Row gap={8} align="center">
                    <Building2 size="md" style={{ color: colors.text[theme].secondary }} />
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {job.organization.name}
                    </Text>
                  </Row>
                )}
              </Stack>

              {/* Job Type Badge */}
              <Row gap={8} flexWrap="wrap" justify="center">
                {formatEmploymentType(job.employment_type ?? null) && (
                  <Row
                    style={{ backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900] }}
                    paddingHorizontal={12}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={8}
                    align="center"
                  >
                    <Briefcase size="md" style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }} />
                    <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>
                      {formatEmploymentType(job.employment_type ?? null)}
                    </Text>
                  </Row>
                )}
                {formatRemoteOption(job.remote_option ?? null) && (
                  <Row
                    style={{ backgroundColor: theme === "light" ? colors.green[50] : colors.green[900]Subtle }}
                    paddingHorizontal={12}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={8}
                    align="center"
                  >
                    <MapPin size="md" style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }} />
                    <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300] }}>
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
                  <MapPin size="md" style={{ color: colors.text[theme].secondary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>{job.location}</Text>
                </Row>
              )}

              {formatPayRange(
                job.pay_range_min_cents ?? null,
                job.pay_range_max_cents ?? null,
                job.pay_range_type ?? null
              ) && (
                <Row gap={8} align="center">
                  <DollarSign size="md" style={{ color: colors.text[theme].secondary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>
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
                  <Calendar size="md" style={{ color: colors.text[theme].secondary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>
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
                <Text style={{ color: colors.text[theme].secondary }}>Job Description</Text>
                <Text style={{ color: colors.text[theme].secondary }} lineHeight={4}>
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
                  <Users size="md" style={{ color: colors.text[theme].secondary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>Required Skills</Text>
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
                        style={{ backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900] }}
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={12}
                      >
                        <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{skillName}</Text>
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
                  <Award size="md" style={{ color: colors.text[theme].secondary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>
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
                          <Text style={{ color: colors.text[theme].secondary }}>
                            {jobCert.certification?.name || 'Unknown Certification'}
                          </Text>
                          {jobCert.is_required && (
                            <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>(Required)</Text>
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
                    ? theme === "light" ? colors.green[50] : colors.green[900]Subtle
                    : job.status === 'draft'
                      ? colors.bg[theme].muted
                      : job.status === 'paused'
                        ? theme === "light" ? colors.yellow[50] : colors.yellow[900]Subtle
                        : theme === "light" ? colors.error[50] : colors.error[900]Subtle
                }
                paddingHorizontal={12}
                paddingVertical={4}
                borderRadius={12}
              >
                <Text
                  color={
                    job.status === 'open'
                      ? theme === "light" ? colors.green[700] : colors.green[300]
                      : job.status === 'draft'
                        ? colors.text[theme].secondary
                        : job.status === 'paused'
                          ? theme === "light" ? colors.yellow[700] : colors.yellow[300]
                          : theme === "light" ? colors.error[700] : colors.error[300]
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
