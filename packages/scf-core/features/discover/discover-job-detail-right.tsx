import {
  useCalculateSoftSkillsMatch,
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { SoftSkillsMatchIndicator } from '@scf/core/features/profile/components/SoftSkillsMatchIndicator'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, Chip, extractPlainText } from '@unicornlove/beyond-ui'
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
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$2" color="$color11">
          Loading job details...
        </Text>
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Job not found
        </Text>
        <Text fontSize="$4" color="$color11">
          This job may have been removed or is no longer available
        </Text>
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
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <Stack gap="$4" padding="$4">
          {/* Applied Status Banner */}
          {hasApplied && (
            <Stack
              gap="$2"
              backgroundColor="$green2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$green7"
            >
              <Row gap="$2" alignItems="center">
                <Shield size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="600" color="$green11">
                  You've Applied
                </Text>
              </Row>
              <Text fontSize="$3" color="$green11">
                Your application has been submitted. You can edit your application any time.
              </Text>
            </Stack>
          )}

          <Text fontSize="$8" fontWeight="700" color="$color12">
            {job.title}
          </Text>

          {/* Company info */}
          {job.organization && (
            <Row gap="$2" alignItems="center">
              <Building2 size={20} color="$color11" />
              <Text fontSize="$5" color="$color11" fontWeight="600">
                {job.organization.name}
              </Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap="$3" flexWrap="wrap">
            {job.location && (
              <Row gap="$2" alignItems="center">
                <MapPin size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {job.location}
                </Text>
              </Row>
            )}
            {employmentType && (
              <Row gap="$2" alignItems="center">
                <Briefcase size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {employmentType}
                </Text>
              </Row>
            )}
            {remoteOption && (
              <Chip
                backgroundColor="$blue9"
                color="$blue1"
                fontSize="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                {remoteOption}
              </Chip>
            )}
          </Row>

          {/* Pay range */}
          {payRange && (
            <Row gap="$2" alignItems="center">
              <DollarSign size={18} color="$green10" />
              <Text fontSize="$4" color="$green10" fontWeight="600">
                {payRange}
              </Text>
            </Row>
          )}

          {/* Benefits Summary */}
          {job.benefits_summary && (
            <Stack gap="$2" backgroundColor="$green2" padding="$3" borderRadius="$4">
              <Row gap="$2" alignItems="center">
                <Heart size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="600" color="$green11">
                  Benefits
                </Text>
              </Row>
              <Text fontSize="$3" color="$green11">
                {job.benefits_summary}
              </Text>
            </Stack>
          )}

          <Separator />

          {/* Description */}
          <Stack gap="$2">
            <Text fontSize="$5" fontWeight="600" color="$color12">
              Job Description
            </Text>
            <Text fontSize="$3" color="$color11" lineHeight="$4">
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
              <Stack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Requirements
                </Text>
                <Stack gap="$2">
                  {job.minimum_education_level && (
                    <Row gap="$2" alignItems="center">
                      <Award size={16} color="$red10" />
                      <Text fontSize="$3" color="$color11">
                        {formatEducationLevel(job.minimum_education_level)}
                      </Text>
                    </Row>
                  )}
                  {job.minimum_years_experience && (
                    <Row gap="$2" alignItems="center">
                      <Clock size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        {job.minimum_years_experience}+ years of experience
                      </Text>
                    </Row>
                  )}
                  {job.require_background_check && (
                    <Row gap="$2" alignItems="center">
                      <Shield size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Background check required
                        {job.background_check_type && ` (${job.background_check_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.require_drug_test && (
                    <Row gap="$2" alignItems="center">
                      <Shield size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Drug test required
                      </Text>
                    </Row>
                  )}
                  {job.require_drivers_license && (
                    <Row gap="$2" alignItems="center">
                      <Briefcase size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Driver's license required
                        {job.drivers_license_type && ` (${job.drivers_license_type})`}
                      </Text>
                    </Row>
                  )}
                  {job.security_clearance_required && (
                    <Row gap="$2" alignItems="center">
                      <Shield size={16} color="$red10" />
                      <Text fontSize="$3" color="$color11">
                        Security clearance: {job.security_clearance_required}
                      </Text>
                    </Row>
                  )}
                  {job.travel_percentage && job.travel_percentage > 0 && (
                    <Row gap="$2" alignItems="center">
                      <Plane size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Travel: {job.travel_percentage}%
                      </Text>
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
              <Stack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Work Details
                </Text>
                <Stack gap="$2">
                  {job.work_schedule_details && (
                    <Row gap="$2" alignItems="center">
                      <Clock size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        {job.work_schedule_details}
                      </Text>
                    </Row>
                  )}
                  {job.timezone && (
                    <Row gap="$2" alignItems="center">
                      <MapPin size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Timezone: {job.timezone}
                      </Text>
                    </Row>
                  )}
                  {job.relocation_assistance_offered && (
                    <Row gap="$2" alignItems="center">
                      <Home size={16} color="$green10" />
                      <Text fontSize="$3" color="$color11">
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
              <Stack gap="$2" backgroundColor="$yellow2" padding="$3" borderRadius="$4">
                <Row gap="$2" alignItems="center">
                  <Calendar size={16} color="$yellow10" />
                  <Text fontSize="$4" fontWeight="600" color="$yellow11">
                    Application Deadline
                  </Text>
                </Row>
                <Text fontSize="$3" color="$yellow11">
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
              <Stack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Required Certifications
                </Text>
                <Row gap="$2" flexWrap="wrap">
                  {job.certifications.map((cert: { id: string; name: string }) => (
                    <Chip
                      key={cert.id}
                      backgroundColor="$red10"
                      color="$color1"
                      fontSize="$3"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
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
              <Stack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Required Skills
                </Text>
                <Row gap="$2" flexWrap="wrap">
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
                        backgroundColor="$blue10"
                        color="$color1"
                        fontSize="$3"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
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
              <Stack gap="$3">
                <Row justifyContent="space-between" alignItems="center">
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Your Soft Skills Match
                  </Text>
                  {matchData?.score !== null && matchData?.score !== undefined && (
                    <Chip
                      backgroundColor={
                        matchData.score >= 80
                          ? '$green9'
                          : matchData.score >= 60
                            ? '$yellow9'
                            : '$red9'
                      }
                      color="$color1"
                      fontSize="$3"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                    >
                      {Math.round(matchData.score)}% Match
                    </Chip>
                  )}
                </Row>

                {isLoadingMatch ? (
                  <Stack gap="$2" alignItems="center" paddingVertical="$4">
                    <Spinner size="small" color="$blue10" />
                    <Text fontSize="$3" color="$color11">
                      Calculating match...
                    </Text>
                  </Stack>
                ) : matchData?.needsSelfAssessment ? (
                  <Stack
                    gap="$3"
                    backgroundColor="$blue2"
                    padding="$4"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$blue7"
                  >
                    <Text fontSize="$4" fontWeight="600" color="$blue11">
                      Complete Your Assessment
                    </Text>
                    <Text fontSize="$3" color="$blue11">
                      Complete your soft skills assessment to see how well you match this job's
                      requirements.
                    </Text>
                    <Button
                      variant="primary"
                      size="$3"
                      onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                    >
                      Start Assessment
                    </Button>
                  </Stack>
                ) : matchData?.details && matchData.details.length > 0 ? (
                  <Stack gap="$4">
                    {/* Skill-by-skill breakdown */}
                    <Stack gap="$2">
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
                        gap="$2"
                        backgroundColor="$yellow2"
                        padding="$4"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$yellow7"
                      >
                        <Row gap="$2" alignItems="center">
                          <TrendingUp size={16} color="$yellow10" />
                          <Text fontSize="$4" fontWeight="600" color="$yellow11">
                            Skills to Develop
                          </Text>
                        </Row>
                        <Stack gap="$1">
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
                                <Text key={detail.skillId} fontSize="$3" color="$yellow11">
                                  • {detail.skillName} (currently {detail.userRating || 0}/5, need{' '}
                                  {detail.requiredImportance}/5)
                                </Text>
                              )
                            )}
                        </Stack>
                        <Button
                          variant="outlined"
                          size="$3"
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
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <Stack gap="$4" padding="$4">
          <Stack gap="$2">
            <Row>
              <Chip
                backgroundColor="$red9"
                fontSize="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                External Job
              </Chip>
            </Row>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              {job.title}
            </Text>
          </Stack>

          {/* Company info */}
          {job.company_name && (
            <Row gap="$2" alignItems="center">
              <Building2 size={20} color="$color11" />
              <Text fontSize="$5" color="$color11" fontWeight="600">
                {job.company_name}
              </Text>
            </Row>
          )}

          {/* Job metadata */}
          <Row gap="$3" flexWrap="wrap">
            {job.location && (
              <Row gap="$2" alignItems="center">
                <MapPin size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {job.location}
                </Text>
              </Row>
            )}
            {job.job_type && (
              <Row gap="$2" alignItems="center">
                <Briefcase size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {formatEmploymentType(job.job_type)}
                </Text>
              </Row>
            )}
          </Row>

          {/* Job Category */}
          {job.job_category && (
            <Row>
              <Chip
                backgroundColor="$blue9"
                fontSize="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                {job.job_category}
              </Chip>
            </Row>
          )}

          <Separator />

          {/* Description */}
          {job.description && (
            <Stack gap="$2">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Job Description
              </Text>
              <Text fontSize="$3" color="$color11" lineHeight="$4">
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
              <Stack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Industries
                </Text>
                <Row gap="$2" flexWrap="wrap">
                  {job.industries.map((industry: { industry_name: string }, idx: number) => (
                    <Chip
                      key={`${industry.industry_name}-${idx}`}
                      backgroundColor="$blue9"
                      fontSize="$3"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                    >
                      {industry.industry_name}
                    </Chip>
                  ))}
                </Row>
              </Stack>
            </>
          )}

          {/* External Link Notice */}
          <Stack gap="$2" backgroundColor="$blue2" padding="$3" borderRadius="$4">
            <Row gap="$2" alignItems="center">
              <ExternalLink size={16} color="$blue10" />
              <Text fontSize="$4" fontWeight="600" color="$blue11">
                External Application
              </Text>
            </Row>
            <Text fontSize="$3" color="$blue11">
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
