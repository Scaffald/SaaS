import { useCalculateSoftSkillsMatch } from '@scf/core/utils/jobs-sdk-hooks'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Chip, DiscoverCard, extractPlainText } from '@scaffald/ui'
import { Briefcase, Building2, Clock, DollarSign, MapPin } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'

/**
 * Internal job type definition with all enhanced fields
 */
export interface InternalJob {
  id: string
  title: string
  description: string | JSONContent
  employment_type?: string
  remote_option?: string
  location?: string
  pay_range_min_cents?: number
  pay_range_max_cents?: number
  pay_range_type?: string
  posted_at?: string
  created_at: string
  organization?: {
    id: string
    name: string
    slug: string
  } | null
  certifications?: Array<{
    id: string
    name: string
    slug: string
  }>
  skills?: Array<{
    id: string
    name?: string | null
    taxonomy?: 'csi' | 'onet'
  }>

  // Application Screening (Migration 067)
  require_current_location?: boolean
  require_relocation_willingness?: boolean
  minimum_years_experience?: number
  require_work_authorization?: boolean
  require_earliest_start_date?: boolean

  // Job Metadata (Migration 068)
  application_deadline?: string

  // Enhanced Requirements (Migration 069)
  minimum_education_level?: 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
  require_background_check?: boolean
  background_check_type?: string
  require_drug_test?: boolean
  require_drivers_license?: boolean
  drivers_license_type?: string
  security_clearance_required?: string
  travel_percentage?: number

  // Compensation & Benefits (Migration 070)
  benefits_summary?: string

  // Location & Scheduling (Migration 072)
  relocation_assistance_offered?: boolean
  relocation_assistance_details?: string
  work_schedule_details?: string
  timezone?: string

  // Application process configuration (Migration 071)
  custom_application_questions?: Array<{
    id: string
    question: string
    type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
    required: boolean
    options?: string[]
  }>
  required_attachments?: Record<
    string,
    {
      required: boolean
      max_size_mb?: number
    }
  >

  // Soft Skills Requirements
  required_soft_skills?: Array<{
    skill_id: string
    importance: number
  }> | null
}

interface InternalJobCardProps {
  job: InternalJob
  hasApplied?: boolean
  applicationId?: string | null
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
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Internal Job Card Component
 * Displays a job posting from internal organizations
 */
export function InternalJobCard({ job, hasApplied, applicationId }: InternalJobCardProps) {
  const router = useRouter()
  const payRange = formatPayRange(
    job.pay_range_min_cents,
    job.pay_range_max_cents,
    job.pay_range_type
  )
  const employmentType = formatEmploymentType(job.employment_type)
  const remoteOption = formatRemoteOption(job.remote_option)
  const postedTime = formatRelativeTime(job.posted_at || job.created_at)
  const hasInquiryLink = Boolean(hasApplied && applicationId)

  // Check if job has required soft skills
  const hasSoftSkillsRequirements = useMemo(() => {
    if (!job.required_soft_skills || typeof job.required_soft_skills !== 'object') return false
    const requirements = job.required_soft_skills as Array<{ skill_id: string; importance: number }>
    return Array.isArray(requirements) && requirements.length > 0
  }, [job.required_soft_skills])

  // Fetch soft skills match if job has requirements (SDK)
  const { data: matchData } = useCalculateSoftSkillsMatch(job.id, {
    enabled: hasSoftSkillsRequirements,
  })

  // Extract plain text from description (handles both string and rich text JSON)
  const descriptionText =
    typeof job.description === 'string'
      ? job.description
      : job.description
        ? extractPlainText(job.description as JSONContent)
        : ''

  const handleCardPress = () => {
    if (hasInquiryLink && applicationId) {
      router.push(buildPath(ROUTES.DASHBOARD.APPLICATIONS.INQUIRY, { applicationId }))
      return
    }
    router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id }))
  }

  return (
    <DiscoverCard onPress={handleCardPress} padding="md">
      <Stack gap={12}>
        {/* Header */}
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Stack flex={1} gap={4}>
              <Text color="$gray11">{job.title}</Text>
              {job.organization && (
                <Row gap={8} align="center">
                  <Building2 size="md" color="$gray11" />
                  <Text color="$gray11">{job.organization.name}</Text>
                </Row>
              )}
            </Stack>
            <Row gap={8} align="center">
              {hasApplied && (
                <Chip backgroundColor="$green9" color="$green1">
                  Applied
                </Chip>
              )}
              {matchData?.score !== null && matchData?.score !== undefined && (
                <Chip
                  backgroundColor={
                    matchData.score >= 80 ? '$green9' : matchData.score >= 60 ? '$yellow9' : '$red9'
                  }
                  color="$gray11"
                >
                  {Math.round(matchData.score)}% Match
                </Chip>
              )}
            </Row>
          </Row>

          {/* Job metadata */}
          <Row gap={12} flexWrap="wrap">
            {job.location && (
              <Row gap={6} align="center">
                <MapPin size="md" color="$gray11" />
                <Text color="$gray11">{job.location}</Text>
              </Row>
            )}
            {employmentType && (
              <Row gap={6} align="center">
                <Briefcase size="md" color="$gray11" />
                <Text color="$gray11">{employmentType}</Text>
              </Row>
            )}
            {remoteOption && (
              <Chip
                backgroundColor="$blue9"
                color="$blue1"
                paddingHorizontal={8}
                paddingVertical={4}
              >
                {remoteOption}
              </Chip>
            )}
          </Row>
        </Stack>

        {/* Description preview */}
        {descriptionText && <Text color="$gray11">{descriptionText}</Text>}

        {/* Pay range and certifications */}
        <Row justify="space-between" align="center" flexWrap="wrap" gap={8}>
          <Row gap={12} align="center">
            {payRange && (
              <Row gap={6} align="center">
                <DollarSign size="md" color="$green10" />
                <Text color="$green10">{payRange}</Text>
              </Row>
            )}
          </Row>

          {postedTime && (
            <Row gap={6} align="center">
              <Clock size="md" color="$gray11" />
              <Text color="$gray11">{postedTime}</Text>
            </Row>
          )}
        </Row>

        {/* Certifications and Skills */}
        {(job.certifications && job.certifications.length > 0) ||
        (job.skills && job.skills.length > 0) ? (
          <Row gap={8} flexWrap="wrap">
            {job.certifications?.slice(0, 3).map((cert) => (
              <Chip
                key={cert.id}
                backgroundColor="$red10"
                color="$gray11"
                paddingHorizontal={8}
                paddingVertical={4}
              >
                {cert.name}
              </Chip>
            ))}
            {job.certifications && job.certifications.length > 3 && (
              <Chip
                backgroundColor="$color3"
                color="$gray11"
                paddingHorizontal={8}
                paddingVertical={4}
              >
                +{job.certifications.length - 3} more
              </Chip>
            )}
            {job.skills?.slice(0, 2).map((skill) => {
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
                  color="$gray11"
                  paddingHorizontal={8}
                  paddingVertical={4}
                >
                  {label}
                </Chip>
              )
            })}
            {job.skills && job.skills.length > 2 && (
              <Chip
                backgroundColor="$color3"
                color="$gray11"
                paddingHorizontal={8}
                paddingVertical={4}
              >
                +{job.skills.length - 2} more
              </Chip>
            )}
          </Row>
        ) : null}
      </Stack>
    </DiscoverCard>
  )
}
