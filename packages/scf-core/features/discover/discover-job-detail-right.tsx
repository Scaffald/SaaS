import {
  useCalculateSoftSkillsMatch,
  useExternalJobs,
  useJobDetails,
  useMyApplicationForJob,
} from '@scf/core/utils/jobs-sdk-hooks'
import { SoftSkillsMatchIndicator } from '@scf/core/features/profile/components/SoftSkillsMatchIndicator'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, Chip, extractPlainText } from '@unicornlove/ui'
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
} from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import type { JSONContent } from '@tiptap/core'
import { useMemo } from 'react'
import { ScrollView, Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

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
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$2" color="$color11">
          Loading job details...
        </Text>
      </YStack>
    )
  }

  if (!job) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Job not found
        </Text>
        <Text fontSize="$4" color="$color11">
          This job may have been removed or is no longer available
        </Text>
      </YStack>
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
        <YStack gap="$4" padding="$4">
          {/* Applied Status Banner */}
          {hasApplied && (
            <YStack
              gap="$2"
              backgroundColor="$green2"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$green7"
            >
              <XStack gap="$2" alignItems="center">
                <Shield size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="600" color="$green11">
                  You've Applied
                </Text>
              </XStack>
              <Text fontSize="$3" color="$green11">
                Your application has been submitted. You can edit your application any time.
              </Text>
            </YStack>
          )}

          <Text fontSize="$8" fontWeight="700" color="$color12">
            {job.title}
          </Text>

          {/* Company info */}
          {job.organization && (
            <XStack gap="$2" alignItems="center">
              <Building2 size={20} color="$color11" />
              <Text fontSize="$5" color="$color11" fontWeight="600">
                {job.organization.name}
              </Text>
            </XStack>
          )}

          {/* Job metadata */}
          <XStack gap="$3" flexWrap="wrap">
            {job.location && (
              <XStack gap="$2" alignItems="center">
                <MapPin size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {job.location}
                </Text>
              </XStack>
            )}
            {employmentType && (
              <XStack gap="$2" alignItems="center">
                <Briefcase size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {employmentType}
                </Text>
              </XStack>
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
          </XStack>

          {/* Pay range */}
          {payRange && (
            <XStack gap="$2" alignItems="center">
              <DollarSign size={18} color="$green10" />
              <Text fontSize="$4" color="$green10" fontWeight="600">
                {payRange}
              </Text>
            </XStack>
          )}

          {/* Benefits Summary */}
          {job.benefits_summary && (
            <YStack gap="$2" backgroundColor="$green2" padding="$3" borderRadius="$4">
              <XStack gap="$2" alignItems="center">
                <Heart size={16} color="$green10" />
                <Text fontSize="$4" fontWeight="600" color="$green11">
                  Benefits
                </Text>
              </XStack>
              <Text fontSize="$3" color="$green11">
                {job.benefits_summary}
              </Text>
            </YStack>
          )}

          <Separator />

          {/* Description */}
          <YStack gap="$2">
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
          </YStack>

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
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Requirements
                </Text>
                <YStack gap="$2">
                  {job.minimum_education_level && (
                    <XStack gap="$2" alignItems="center">
                      <Award size={16} color="$red10" />
                      <Text fontSize="$3" color="$color11">
                        {formatEducationLevel(job.minimum_education_level)}
                      </Text>
                    </XStack>
                  )}
                  {job.minimum_years_experience && (
                    <XStack gap="$2" alignItems="center">
                      <Clock size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        {job.minimum_years_experience}+ years of experience
                      </Text>
                    </XStack>
                  )}
                  {job.require_background_check && (
                    <XStack gap="$2" alignItems="center">
                      <Shield size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Background check required
                        {job.background_check_type && ` (${job.background_check_type})`}
                      </Text>
                    </XStack>
                  )}
                  {job.require_drug_test && (
                    <XStack gap="$2" alignItems="center">
                      <Shield size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Drug test required
                      </Text>
                    </XStack>
                  )}
                  {job.require_drivers_license && (
                    <XStack gap="$2" alignItems="center">
                      <Briefcase size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Driver's license required
                        {job.drivers_license_type && ` (${job.drivers_license_type})`}
                      </Text>
                    </XStack>
                  )}
                  {job.security_clearance_required && (
                    <XStack gap="$2" alignItems="center">
                      <Shield size={16} color="$red10" />
                      <Text fontSize="$3" color="$color11">
                        Security clearance: {job.security_clearance_required}
                      </Text>
                    </XStack>
                  )}
                  {job.travel_percentage && job.travel_percentage > 0 && (
                    <XStack gap="$2" alignItems="center">
                      <Plane size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Travel: {job.travel_percentage}%
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </>
          )}

          {/* Work Schedule & Location */}
          {(job.work_schedule_details || job.relocation_assistance_offered || job.timezone) && (
            <>
              <Separator />
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Work Details
                </Text>
                <YStack gap="$2">
                  {job.work_schedule_details && (
                    <XStack gap="$2" alignItems="center">
                      <Clock size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        {job.work_schedule_details}
                      </Text>
                    </XStack>
                  )}
                  {job.timezone && (
                    <XStack gap="$2" alignItems="center">
                      <MapPin size={16} color="$blue10" />
                      <Text fontSize="$3" color="$color11">
                        Timezone: {job.timezone}
                      </Text>
                    </XStack>
                  )}
                  {job.relocation_assistance_offered && (
                    <XStack gap="$2" alignItems="center">
                      <Home size={16} color="$green10" />
                      <Text fontSize="$3" color="$color11">
                        Relocation assistance available
                        {job.relocation_assistance_details &&
                          `: ${job.relocation_assistance_details}`}
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </>
          )}

          {/* Deadlines */}
          {job.application_deadline && (
            <>
              <Separator />
              <YStack gap="$2" backgroundColor="$yellow2" padding="$3" borderRadius="$4">
                <XStack gap="$2" alignItems="center">
                  <Calendar size={16} color="$yellow10" />
                  <Text fontSize="$4" fontWeight="600" color="$yellow11">
                    Application Deadline
                  </Text>
                </XStack>
                <Text fontSize="$3" color="$yellow11">
                  {new Date(job.application_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </YStack>
            </>
          )}

          {/* Required Certifications */}
          {job.certifications && job.certifications.length > 0 && (
            <>
              <Separator />
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Required Certifications
                </Text>
                <XStack gap="$2" flexWrap="wrap">
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
                </XStack>
              </YStack>
            </>
          )}

          {/* Soft Skills Match Section */}
          {hasSoftSkillsRequirements && (
            <>
              <Separator />
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
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
                </XStack>

                {isLoadingMatch ? (
                  <YStack gap="$2" alignItems="center" paddingVertical="$4">
                    <Spinner size="small" color="$blue10" />
                    <Text fontSize="$3" color="$color11">
                      Calculating match...
                    </Text>
                  </YStack>
                ) : matchData?.needsSelfAssessment ? (
                  <YStack
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
                  </YStack>
                ) : matchData?.details && matchData.details.length > 0 ? (
                  <YStack gap="$4">
                    {/* Skill-by-skill breakdown */}
                    <YStack gap="$2">
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
                    </YStack>

                    {/* Skills to Develop */}
                    {matchData.details.some(
                      (detail: { meetsRequirement: boolean }) => !detail.meetsRequirement
                    ) && (
                      <YStack
                        gap="$2"
                        backgroundColor="$yellow2"
                        padding="$4"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$yellow7"
                      >
                        <XStack gap="$2" alignItems="center">
                          <TrendingUp size={16} color="$yellow10" />
                          <Text fontSize="$4" fontWeight="600" color="$yellow11">
                            Skills to Develop
                          </Text>
                        </XStack>
                        <YStack gap="$1">
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
                        </YStack>
                        <Button
                          variant="outlined"
                          size="$3"
                          onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                        >
                          Update Assessment
                        </Button>
                      </YStack>
                    )}
                  </YStack>
                ) : null}
              </YStack>
            </>
          )}
        </YStack>
      </ScrollView>
    )
  }

  // External job display
  if (isExternal && 'company_name' in job) {
    return (
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" padding="$4">
          <YStack gap="$2">
            <XStack>
              <Chip
                backgroundColor="$red9"
                fontSize="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                External Job
              </Chip>
            </XStack>
            <Text fontSize="$8" fontWeight="700" color="$color12">
              {job.title}
            </Text>
          </YStack>

          {/* Company info */}
          {job.company_name && (
            <XStack gap="$2" alignItems="center">
              <Building2 size={20} color="$color11" />
              <Text fontSize="$5" color="$color11" fontWeight="600">
                {job.company_name}
              </Text>
            </XStack>
          )}

          {/* Job metadata */}
          <XStack gap="$3" flexWrap="wrap">
            {job.location && (
              <XStack gap="$2" alignItems="center">
                <MapPin size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {job.location}
                </Text>
              </XStack>
            )}
            {job.job_type && (
              <XStack gap="$2" alignItems="center">
                <Briefcase size={16} color="$color10" />
                <Text fontSize="$3" color="$color10">
                  {formatEmploymentType(job.job_type)}
                </Text>
              </XStack>
            )}
          </XStack>

          {/* Job Category */}
          {job.job_category && (
            <XStack>
              <Chip
                backgroundColor="$blue9"
                fontSize="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
              >
                {job.job_category}
              </Chip>
            </XStack>
          )}

          <Separator />

          {/* Description */}
          {job.description && (
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Job Description
              </Text>
              <Text fontSize="$3" color="$color11" lineHeight="$4">
                {typeof job.description === 'string'
                  ? job.description
                  : extractPlainText(job.description as JSONContent)}
              </Text>
            </YStack>
          )}

          {/* Industries */}
          {job.industries && job.industries.length > 0 && (
            <>
              <Separator />
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Industries
                </Text>
                <XStack gap="$2" flexWrap="wrap">
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
                </XStack>
              </YStack>
            </>
          )}

          {/* External Link Notice */}
          <YStack gap="$2" backgroundColor="$blue2" padding="$3" borderRadius="$4">
            <XStack gap="$2" alignItems="center">
              <ExternalLink size={16} color="$blue10" />
              <Text fontSize="$4" fontWeight="600" color="$blue11">
                External Application
              </Text>
            </XStack>
            <Text fontSize="$3" color="$blue11">
              This job is hosted on an external site. You'll be directed to apply through their
              application process.
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    )
  }

  return null
}
