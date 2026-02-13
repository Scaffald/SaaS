import {
  useCalculateSoftSkillsMatch,
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { SoftSkillsMatchIndicator } from '@scf/core/features/profile/components/SoftSkillsMatchIndicator'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, Chip } from '@scaffald/ui'
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
import { Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'

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
      <Stack style={{ flex: 1 }} align="center" justify="center" padding="md">
        <Spinner size="lg" color="$blue10" />
        <Text color="$gray11" style={{ marginTop: 8 }}>
          Loading job details...
        </Text>
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack style={{ flex: 1 }} align="center" justify="center" padding="md" gap={8}>
        <Text color="$gray11">Job not found</Text>
        <Text color="$gray11">This job may have been removed or is no longer available</Text>
      </Stack>
    )
  }

  // Internal job display
  if (!isExternal && 'organization' in job) {
    const payRange = formatPayRange(
      job.pay_range_min_cents,
      job.pay_range_max_cents,
      job.pay_range_type
    )
    const employmentType = formatEmploymentType(job.employment_type)
    const remoteOption = formatRemoteOption(job.remote_option)

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={16} padding="md">
          {/* Applied Status Banner */}
          {hasApplied && (
            <Stack
              gap={8}
              padding="sm"
              style={{
                backgroundColor: '$green2',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '$green7',
              }}
            >
              <Row gap={8} align="center">
                <Shield size={20} color="$green10" />
                <Text color="$green11">You've Applied</Text>
              </Row>
              <Text color="$green11">
                Your application has been submitted. You can edit your application any time.
              </Text>
            </Stack>
          )}

          <Text color="$gray11">{job.title}</Text>

          {/* Company info */}
          {job.organization && (
            <Row gap={8} align="center">
              <Building2 size={24} color="$gray11" />
              <Text color="$gray11">{job.organization.name}</Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            {job.location && (
              <Row gap={8} align="center">
                <MapPin size={20} color="$gray11" />
                <Text color="$gray11">{job.location}</Text>
              </Row>
            )}
            {employmentType && (
              <Row gap={8} align="center">
                <Briefcase size={20} color="$gray11" />
                <Text color="$gray11">{employmentType}</Text>
              </Row>
            )}
            {remoteOption && (
              <Chip
                color="$blue1"
                style={{
                  backgroundColor: '$blue9',
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
              <DollarSign size={18} color="$green10" />
              <Text color="$green10">{payRange}</Text>
            </Row>
          )}

          {/* Benefits Summary */}
          {job.benefits_summary && (
            <Stack gap={8} padding="sm" style={{ backgroundColor: '$green2', borderRadius: 16 }}>
              <Row gap={8} align="center">
                <Heart size={20} color="$green10" />
                <Text color="$green11">Benefits</Text>
              </Row>
              <Text color="$green11">{job.benefits_summary}</Text>
            </Stack>
          )}

          <Separator />

          {/* Description */}
          <Stack gap={8}>
            <Text color="$gray11">Job Description</Text>
            <Text color="$gray11" style={{ lineHeight: 16 }}>
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
                <Text color="$gray11">Requirements</Text>
                <Stack gap={8}>
                  {job.minimum_education_level && (
                    <Row gap={8} align="center">
                      <Award size={20} color="$red10" />
                      <Text color="$gray11">
                        {formatEducationLevel(job.minimum_education_level)}
                      </Text>
                    </Row>
                  )}
                  {job.minimum_years_experience && (
                    <Row gap={8} align="center">
                      <Clock size={20} color="$blue10" />
                      <Text color="$gray11">
                        {job.minimum_years_experience}+ years of experience
                      </Text>
                    </Row>
                  )}
                  {job.require_background_check && (
                    <Row gap={8} align="center">
                      <Shield size={20} color="$blue10" />
                      <Text color="$gray11">
                        Background check required
                        {job.background_check_type && ` (${job.background_check_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.require_drug_test && (
                    <Row gap={8} align="center">
                      <Shield size={20} color="$blue10" />
                      <Text color="$gray11">Drug test required</Text>
                    </Row>
                  )}
                  {job.require_drivers_license && (
                    <Row gap={8} align="center">
                      <Briefcase size={20} color="$blue10" />
                      <Text color="$gray11">
                        Driver's license required
                        {job.drivers_license_type && ` (${job.drivers_license_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.security_clearance_required && (
                    <Row gap={8} align="center">
                      <Shield size={20} color="$red10" />
                      <Text color="$gray11">
                        Security clearance: {job.security_clearance_required}
                      </Text>
                    </Row>
                  )}
                  {job.travel_percentage && job.travel_percentage > 0 && (
                    <Row gap={8} align="center">
                      <Plane size={20} color="$blue10" />
                      <Text color="$gray11">Travel: {job.travel_percentage}%</Text>
                    </Row>
                  )}
                </Stack>
              </Stack>
            </>
          )}

          {/* Work Schedule & Location */}
          {(job.work_schedule_details || job.relocation_assistance_offered || job.timezone) && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text color="$gray11">Work Details</Text>
                <Stack gap={8}>
                  {job.work_schedule_details && (
                    <Row gap={8} align="center">
                      <Clock size={20} color="$blue10" />
                      <Text color="$gray11">{job.work_schedule_details}</Text>
                    </Row>
                  )}
                  {job.timezone && (
                    <Row gap={8} align="center">
                      <MapPin size={20} color="$blue10" />
                      <Text color="$gray11">Timezone: {job.timezone}</Text>
                    </Row>
                  )}
                  {job.relocation_assistance_offered && (
                    <Row gap={8} align="center">
                      <Home size={20} color="$green10" />
                      <Text color="$gray11">
                        Relocation assistance available
                        {job.relocation_assistance_details &&
                          `: ${job.relocation_assistance_details}`}
                      </Text>
                    </Row>
                  )}
                </Stack>
              </Stack>
            </>
          )}

          {/* Deadlines */}
          {job.application_deadline && (
            <>
              <Separator />
              <Stack gap={8} padding="sm" style={{ backgroundColor: '$yellow2', borderRadius: 16 }}>
                <Row gap={8} align="center">
                  <Calendar size={20} color="$yellow10" />
                  <Text color="$yellow11">Application Deadline</Text>
                </Row>
                <Text color="$yellow11">
                  {new Date(job.application_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Stack>
            </>
          )}

          {/* Required Certifications */}
          {job.certifications && job.certifications.length > 0 && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text color="$gray11">Required Certifications</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {job.certifications.map((cert: { id: string; name: string }) => (
                    <Chip
                      key={cert.id}
                      color="$gray11"
                      style={{
                        backgroundColor: '$red10',
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
          {job.skills && job.skills.length > 0 && (
            <>
              <Separator />
              <Stack gap={12}>
                <Text color="$gray11">Required Skills</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {((job.skills ?? []) as InternalJobSkill[]).map((skill) => {
                    const label =
                      skill.name ??
                      (skill.taxonomy ? `${skill.taxonomy.toUpperCase()} ${skill.id}` : skill.id)
                    if (!label) {
                      return null
                    }
                    return (
                      <Chip
                        key={skill.id}
                        color="$gray11"
                        style={{
                          backgroundColor: '$blue10',
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
                  <Text color="$gray11">Your Soft Skills Match</Text>
                  {matchData?.score !== null && matchData?.score !== undefined && (
                    <Chip
                      color="$gray11"
                      style={{
                        backgroundColor:
                          matchData.score >= 80
                            ? '$green9'
                            : matchData.score >= 60
                              ? '$yellow9'
                              : '$red9',
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
                    <Spinner size="sm" color="$blue10" />
                    <Text color="$gray11">Calculating match...</Text>
                  </Stack>
                ) : matchData?.needsSelfAssessment ? (
                  <Stack
                    gap={12}
                    padding="md"
                    style={{
                      backgroundColor: '$blue2',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '$blue7',
                    }}
                  >
                    <Text color="$blue11">Complete Your Assessment</Text>
                    <Text color="$blue11">
                      Complete your soft skills assessment to see how well you match this job's
                      requirements.
                    </Text>
                    <Button
                      variant="primary"
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
                      {matchData.details.map(
                        (detail: {
                          skillId: string
                          skillName: string
                          userRating: number | null
                          requiredImportance: number
                          meetsRequirement: boolean
                        }) => (
                          <SoftSkillsMatchIndicator
                            key={detail.skillId}
                            skillName={detail.skillName}
                            userRating={detail.userRating}
                            requiredImportance={detail.requiredImportance}
                            meetsRequirement={detail.meetsRequirement}
                          />
                        )
                      )}
                    </Stack>

                    {/* Skills to Develop */}
                    {matchData.details.some(
                      (detail: { meetsRequirement: boolean }) => !detail.meetsRequirement
                    ) && (
                      <Stack
                        gap={8}
                        padding="md"
                        style={{
                          backgroundColor: '$yellow2',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '$yellow7',
                        }}
                      >
                        <Row gap={8} align="center">
                          <TrendingUp size={20} color="$yellow10" />
                          <Text color="$yellow11">Skills to Develop</Text>
                        </Row>
                        <Stack gap={4}>
                          {matchData.details
                            .filter(
                              (detail: { meetsRequirement: boolean }) => !detail.meetsRequirement
                            )
                            .map(
                              (detail: {
                                skillId: string
                                skillName: string
                                userRating: number | null
                                requiredImportance: number
                              }) => (
                                <Text key={detail.skillId} color="$yellow11">
                                  • {detail.skillName} (currently {detail.userRating || 0}/5, need{' '}
                                  {detail.requiredImportance}/5)
                                </Text>
                              )
                            )}
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
              <Chip style={{ backgroundColor: '$red9', paddingHorizontal: 8, paddingVertical: 4 }}>
                External Job
              </Chip>
            </Row>
            <Text color="$gray11">{job.title}</Text>
          </Stack>

          {/* Company info */}
          {job.company_name && (
            <Row gap={8} align="center">
              <Building2 size={24} color="$gray11" />
              <Text color="$gray11">{job.company_name}</Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            {job.location && (
              <Row gap={8} align="center">
                <MapPin size={20} color="$gray11" />
                <Text color="$gray11">{job.location}</Text>
              </Row>
            )}
            {job.job_type && (
              <Row gap={8} align="center">
                <Briefcase size={20} color="$gray11" />
                <Text color="$gray11">{formatEmploymentType(job.job_type)}</Text>
              </Row>
            )}
          </Row>

          {/* Job Category */}
          {job.job_category && (
            <Row>
              <Chip style={{ backgroundColor: '$blue9', paddingHorizontal: 8, paddingVertical: 4 }}>
                {job.job_category}
              </Chip>
            </Row>
          )}

          <Separator />

          {/* Description */}
          {job.description && (
            <Stack gap={8}>
              <Text color="$gray11">Job Description</Text>
              <Text color="$gray11" style={{ lineHeight: 16 }}>
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
                <Text color="$gray11">Industries</Text>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {job.industries.map((industry: { industry_name: string }, idx: number) => (
                    <Chip
                      key={`${industry.industry_name}-${idx}`}
                      style={{
                        backgroundColor: '$blue9',
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
          <Stack gap={8} padding="sm" style={{ backgroundColor: '$blue2', borderRadius: 16 }}>
            <Row gap={8} align="center">
              <ExternalLink size={20} color="$blue10" />
              <Text color="$blue11">External Application</Text>
            </Row>
            <Text color="$blue11">
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
