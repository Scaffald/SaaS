import {
  useCalculateSoftSkillsMatch,
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { SoftSkillsMatchIndicator } from '@scf/core/features/profile/components/SoftSkillsMatchIndicator'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, Chip, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Heart,
  Home,
  MapPin,
  Plane,
  Shield,
  TrendingUp,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import type { JSONContent } from '@tiptap/core'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Separator, Skeleton, SkeletonBox, SkeletonText, Spinner, Text, Row, Stack } from '@scaffald/ui'

// Helper function to extract plain text from TipTap JSON content
function extractPlainText(content: JSONContent): string {
  if (!content) return ''
  if (content.text) return content.text
  if (content.content) {
    return content.content.map((node: JSONContent) => extractPlainText(node)).join(' ')
  }
  return ''
}

interface DiscoverJobDetailRightProps {
  jobId: string
}

type InternalJobSkill = {
  id: string
  name?: string | null
  taxonomy?: 'csi' | 'onet'
}

/** Extended Job shape from API (fields beyond SDK Job type) */
type InternalJobExtended = {
  background_check_type?: string
  drivers_license_type?: string
  work_schedule_details?: string
  relocation_assistance_offered?: boolean
  timezone?: string
  relocation_assistance_details?: string
  application_deadline?: string
  certifications?: Array<{ id: string; name: string }>
  skills?: InternalJobSkill[]
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
 * Format education level for display
 */
function formatEducationLevel(level?: string): string {
  if (!level) return ''

  const levelMap: Record<string, string> = {
    none: 'No formal education required',
    high_school: 'High School Diploma',
    associate: "Associate's Degree",
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: 'Ph.D.',
  }

  return levelMap[level] || level
}

/**
 * Discover Job Detail Right Component
 * Displays job information in the right panel
 */
export function DiscoverJobDetailRight({ jobId }: DiscoverJobDetailRightProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Try fetching as internal job first (SDK)
  const { data: internalJob, isLoading: internalLoading } = useJobDetails(jobId, {
    enabled: !!jobId,
  })

  // User's application for this job (to show hasApplied)
  const { data: myApplication } = useMyApplicationForJob(jobId, { enabled: !!jobId })
  const hasApplied = !!myApplication

  // If not found as internal, try external (SDK)
  const { data: externalJobsList, isLoading: externalLoading } = useExternalJobs({
    enabled: !!jobId && !internalJob && !internalLoading,
  })

  const isLoading = internalLoading || externalLoading
  const externalJob = externalJobsList?.find((j: { id: string }) => j.id === jobId)
  const job = internalJob || externalJob
  const isExternal = !!externalJob

  // Check if job has required soft skills
  const hasSoftSkillsRequirements = useMemo(() => {
    if (!internalJob || isExternal) return false
    const rqs = (internalJob as { required_soft_skills?: unknown }).required_soft_skills
    if (!rqs || typeof rqs !== 'object') return false
    const requirements = rqs as Array<{ skill_id: string; importance: number }>
    return Array.isArray(requirements) && requirements.length > 0
  }, [internalJob, isExternal])

  // Fetch soft skills match for internal jobs with requirements (SDK)
  const { data: matchData, isLoading: isLoadingMatch } = useCalculateSoftSkillsMatch(jobId, {
    enabled: !!jobId && hasSoftSkillsRequirements && !isExternal,
  })

  if (isLoading) {
    return (
      <Stack gap={16} padding="md">
        <Skeleton width={220} height={22} shape="text" />
        <Skeleton width={150} height={14} shape="text" />
        <Row gap={8} wrap>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width={90} height={28} borderRadius={99} />
          ))}
        </Row>
        <SkeletonText lines={5} lastLineWidth="65%" />
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack style={{ flex: 1 }} align="center" justify="center" padding="md" gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Job not found</Text>
        <Text style={{ color: colors.text[t].secondary }}>This job may have been removed or is no longer available</Text>
      </Stack>
    )
  }

  // Internal job display
  if (!isExternal && 'organization' in job) {
    const intJob = job as typeof job & InternalJobExtended
    const payRange = formatPayRange(
      job.pay_range_min_cents ?? undefined,
      job.pay_range_max_cents ?? undefined,
      job.pay_range_type ?? undefined
    )
    const employmentType = formatEmploymentType(job.employment_type ?? undefined)
    const remoteOption = formatRemoteOption(job.remote_option ?? undefined)

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={16} padding="md">
          {/* Applied Status Banner */}
          {hasApplied && (
            <Stack
              gap={8}
              padding="sm"
              style={{
                backgroundColor: t === 'dark' ? colors.green[900] : colors.green[50],
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t === 'dark' ? colors.green[700] : colors.green[300],
              }}
            >
              <Row gap={8} align="center">
                <Shield size={20} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>You've Applied</Text>
              </Row>
              <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>
                Your application has been submitted. You can edit your application any time.
              </Text>
            </Stack>
          )}

          <Text style={{ color: colors.text[t].secondary }}>{job.title}</Text>

          {/* Company info */}
          {job.organization && (
            <Row gap={8} align="center">
              <Building2 size={24} color={colors.text[t].tertiary} />
              <Text style={{ color: colors.text[t].secondary }}>{job.organization.name}</Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            {job.location && (
              <Row gap={8} align="center">
                <MapPin size={20} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>
                  {typeof job.location === 'string'
                    ? job.location
                    : job.location &&
                        typeof job.location === 'object' &&
                        'city' in job.location
                      ? [
                          job.location.city,
                          job.location.state,
                          job.location.zip_code,
                          job.location.country,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : ''}
                </Text>
              </Row>
            )}
            {employmentType && (
              <Row gap={8} align="center">
                <Briefcase size={20} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{employmentType}</Text>
              </Row>
            )}
            {remoteOption && (
              <Chip
                style={{
                  backgroundColor: colors.primary[500],
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                {remoteOption}
              </Chip>
            )}
          </Row>

          {/* Pay range */}
          {payRange && (
            <Row gap={8} align="center">
              <DollarSign size={18} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
              <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>{payRange}</Text>
            </Row>
          )}

          {/* Benefits Summary */}
          {job.benefits_summary && (
            <Stack gap={8} padding="sm" style={{ backgroundColor: t === 'dark' ? colors.green[900] : colors.green[50], borderRadius: 16 }}>
              <Row gap={8} align="center">
                <Heart size={20} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>Benefits</Text>
              </Row>
              <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[700] }}>{job.benefits_summary}</Text>
            </Stack>
          )}

          <Separator />

          {/* Description */}
          <Stack gap={8}>
            <Text style={{ color: colors.text[t].secondary }}>Job Description</Text>
            <Text style={{ color: colors.text[t].secondary, lineHeight: 16 }}>
              {typeof job.description === 'string'
                ? job.description
                : job.description
                  ? extractPlainText(job.description as JSONContent)
                  : ''}
            </Text>
          </Stack>

          {/* Requirements Section */}
          {(job.minimum_education_level ||
            job.minimum_years_experience ||
            job.require_background_check ||
            job.require_drug_test ||
            job.require_drivers_license ||
            job.security_clearance_required ||
            job.travel_percentage) && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text style={{ color: colors.text[t].secondary }}>Requirements</Text>
                <Stack gap={8}>
                  {job.minimum_education_level && (
                    <Row gap={8} align="center">
                      <Award size={20} color={t === 'dark' ? colors.rose[300] : colors.rose[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        {formatEducationLevel(job.minimum_education_level)}
                      </Text>
                    </Row>
                  )}
                  {job.minimum_years_experience && (
                    <Row gap={8} align="center">
                      <Clock size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        {job.minimum_years_experience}+ years of experience
                      </Text>
                    </Row>
                  )}
                  {job.require_background_check && (
                    <Row gap={8} align="center">
                      <Shield size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        Background check required
                        {intJob.background_check_type && ` (${intJob.background_check_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.require_drug_test && (
                    <Row gap={8} align="center">
                      <Shield size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>Drug test required</Text>
                    </Row>
                  )}
                  {job.require_drivers_license && (
                    <Row gap={8} align="center">
                      <Briefcase size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        Driver's license required
                        {intJob.drivers_license_type && ` (${intJob.drivers_license_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.security_clearance_required && (
                    <Row gap={8} align="center">
                      <Shield size={20} color={t === 'dark' ? colors.rose[300] : colors.rose[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        Security clearance: {job.security_clearance_required}
                      </Text>
                    </Row>
                  )}
                  {job.travel_percentage && job.travel_percentage > 0 && (
                    <Row gap={8} align="center">
                      <Plane size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>Travel: {job.travel_percentage}%</Text>
                    </Row>
                  )}
                </Stack>
              </Stack>
            </>
          )}

          {/* Work Schedule & Location */}
          {(intJob.work_schedule_details ||
            intJob.relocation_assistance_offered ||
            intJob.timezone) && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text style={{ color: colors.text[t].secondary }}>Work Details</Text>
                <Stack gap={8}>
                  {intJob.work_schedule_details && (
                    <Row gap={8} align="center">
                      <Clock size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>{intJob.work_schedule_details}</Text>
                    </Row>
                  )}
                  {intJob.timezone && (
                    <Row gap={8} align="center">
                      <MapPin size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>Timezone: {intJob.timezone}</Text>
                    </Row>
                  )}
                  {intJob.relocation_assistance_offered && (
                    <Row gap={8} align="center">
                      <Home size={20} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                      <Text style={{ color: colors.text[t].secondary }}>
                        Relocation assistance available
                        {intJob.relocation_assistance_details &&
                          `: ${intJob.relocation_assistance_details}`}
                      </Text>
                    </Row>
                  )}
                </Stack>
              </Stack>
            </>
          )}

          {/* Deadlines */}
          {intJob.application_deadline && (
            <>
              <Separator />
              <Stack gap={8} padding="sm" style={{ backgroundColor: t === 'dark' ? colors.yellow[900] : colors.yellow[50], borderRadius: 16 }}>
                <Row gap={8} align="center">
                  <Calendar size={20} color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]} />
                  <Text style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[700] }}>Application Deadline</Text>
                </Row>
                <Text style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[700] }}>
                  {new Date(intJob.application_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Stack>
            </>
          )}

          {/* Required Certifications */}
          {intJob.certifications && intJob.certifications.length > 0 && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text style={{ color: colors.text[t].secondary }}>Required Certifications</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {intJob.certifications.map((cert: { id: string; name: string }) => (
                    <Chip
                      key={cert.id}
                      style={{
                        backgroundColor: t === 'dark' ? colors.error[800] : colors.error[100],
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      {cert.name}
                    </Chip>
                  ))}
                </Row>
              </Stack>
            </>
          )}

          {/* Required Skills */}
          {intJob.skills && intJob.skills.length > 0 && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text style={{ color: colors.text[t].secondary }}>Required Skills</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {(intJob.skills ?? []).map((skill) => {
                    const label =
                      skill.name ??
                      (skill.taxonomy ? `${skill.taxonomy.toUpperCase()} ${skill.id}` : skill.id)
                    if (!label) {
                      return null
                    }
                    return (
                      <Chip
                        key={skill.id}
                        style={{
                          backgroundColor: colors.primary[500],
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        {label}
                      </Chip>
                    )
                  })}
                </Row>
              </Stack>
            </>
          )}

          {/* Soft Skills Match Section */}
          {hasSoftSkillsRequirements && (
            <>
              <Separator />
              <Stack gap={12}>
                <Row justify="space-between" align="center">
                  <Text style={{ color: colors.text[t].secondary }}>Your Soft Skills Match</Text>
                  {matchData?.score !== null && matchData?.score !== undefined && (
                    <Chip
                      style={{
                        backgroundColor:
                          matchData.score >= 80
                            ? (t === 'dark' ? colors.green[800] : colors.green[100])
                            : matchData.score >= 60
                              ? (t === 'dark' ? colors.yellow[800] : colors.yellow[100])
                              : (t === 'dark' ? colors.error[800] : colors.error[100]),
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      {Math.round(matchData.score)}% Match
                    </Chip>
                  )}
                </Row>

                {isLoadingMatch ? (
                  <Stack gap={8} align="center" style={{ paddingVertical: 16 }}>
                    <Spinner size="sm" color="primary" />
                    <Text style={{ color: colors.text[t].secondary }}>Calculating match...</Text>
                  </Stack>
                ) : matchData?.needsSelfAssessment ? (
                  <Stack
                    gap={12}
                    padding="md"
                    style={{
                      backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50],
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: t === 'dark' ? colors.blue[700] : colors.blue[300],
                    }}
                  >
                    <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>Complete Your Assessment</Text>
                    <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
                      Complete your soft skills assessment to see how well you match this job's
                      requirements.
                    </Text>
                    <Button
                      variant="filled" color="primary"
                      size="sm"
                      onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                    >
                      Start Assessment
                    </Button>
                  </Stack>
                ) : matchData?.details && matchData.details.length > 0 ? (
                  <Stack gap={16}>
                    {/* Skill-by-skill breakdown */}
                    <Stack gap={8}>
                      {matchData.details.map((detail) => (
                        <SoftSkillsMatchIndicator
                          key={detail.skillId}
                          skillName={detail.skillName ?? ''}
                          userRating={detail.userRating}
                          requiredImportance={detail.requiredImportance}
                          meetsRequirement={detail.meetsRequirement ?? false}
                        />
                      ))}
                    </Stack>

                    {/* Skills to Develop */}
                    {matchData.details.some((detail) => !(detail.meetsRequirement ?? false)) && (
                      <Stack
                        gap={8}
                        padding="md"
                        style={{
                          backgroundColor: t === 'dark' ? colors.yellow[900] : colors.yellow[50],
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: t === 'dark' ? colors.yellow[700] : colors.yellow[300],
                        }}
                      >
                        <Row gap={8} align="center">
                          <TrendingUp size={20} color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]} />
                          <Text style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[700] }}>Skills to Develop</Text>
                        </Row>
                        <Stack gap={4}>
                          {matchData.details
                            .filter((detail) => !(detail.meetsRequirement ?? false))
                            .map((detail) => (
                                <Text key={detail.skillId} style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[700] }}>
                                  • {detail.skillName ?? ''} (currently {detail.userRating ?? 0}/5, need{' '}
                                  {detail.requiredImportance}/5)
                                </Text>
                              ))}
                        </Stack>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                        >
                          Update Assessment
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                ) : null}
              </Stack>
            </>
          )}
        </Stack>
      </ScrollView>
    )
  }

  // External job display
  if (isExternal && 'company_name' in job) {
    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={16} padding="md">
          <Stack gap={8}>
            <Row>
              <Chip style={{ backgroundColor: t === 'dark' ? colors.error[800] : colors.error[100], paddingHorizontal: 8, paddingVertical: 4 }}>
                External Job
              </Chip>
            </Row>
            <Text style={{ color: colors.text[t].secondary }}>{job.title}</Text>
          </Stack>

          {/* Company info */}
          {job.company_name && (
            <Row gap={8} align="center">
              <Building2 size={24} color={colors.text[t].tertiary} />
              <Text style={{ color: colors.text[t].secondary }}>{job.company_name}</Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            {job.location && (
              <Row gap={8} align="center">
                <MapPin size={20} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{job.location}</Text>
              </Row>
            )}
            {job.job_type && (
              <Row gap={8} align="center">
                <Briefcase size={20} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>{formatEmploymentType(job.job_type)}</Text>
              </Row>
            )}
          </Row>

          {/* Job Category */}
          {job.job_category && (
            <Row>
              <Chip style={{ backgroundColor: t === 'dark' ? colors.blue[800] : colors.blue[100], paddingHorizontal: 8, paddingVertical: 4 }}>
                {job.job_category}
              </Chip>
            </Row>
          )}

          <Separator />

          {/* Description */}
          {job.description && (
            <Stack gap={8}>
              <Text style={{ color: colors.text[t].secondary }}>Job Description</Text>
              <Text style={{ color: colors.text[t].secondary, lineHeight: 16 }}>
                {typeof job.description === 'string'
                  ? job.description
                  : extractPlainText(job.description as JSONContent)}
              </Text>
            </Stack>
          )}

          {/* Industries */}
          {job.industries && job.industries.length > 0 && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text style={{ color: colors.text[t].secondary }}>Industries</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {job.industries.map((industry: { industry_name: string }, idx: number) => (
                    <Chip
                      key={`${industry.industry_name}-${idx}`}
                      style={{
                        backgroundColor: t === 'dark' ? colors.blue[800] : colors.blue[100],
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      {industry.industry_name}
                    </Chip>
                  ))}
                </Row>
              </Stack>
            </>
          )}

          {/* External Link Notice */}
          <Stack gap={8} padding="sm" style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50], borderRadius: 16 }}>
            <Row gap={8} align="center">
              <ExternalLink size={20} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
              <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>External Application</Text>
            </Row>
            <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>
              This job is hosted on an external site. You'll be directed to apply through their
              application process.
            </Text>
          </Stack>
        </Stack>
      </ScrollView>
    )
  }

  return null
}
