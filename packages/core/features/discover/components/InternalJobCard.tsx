import { RouteBuilder } from '@app/core/constants/routes'
import { Chip, DiscoverCard, extractPlainText } from '@app/ui'
import { Briefcase, Building2, Clock, DollarSign, MapPin } from '@tamagui/lucide-icons'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Text, XStack, YStack } from 'tamagui'

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
  const buttonLabel = hasInquiryLink
    ? 'View Inquiry'
    : hasApplied
      ? 'View Application'
      : 'View Details'

  // Extract plain text from description (handles both string and rich text JSON)
  const descriptionText =
    typeof job.description === 'string'
      ? job.description
      : job.description
        ? extractPlainText(job.description as JSONContent)
        : ''

  return (
    <DiscoverCard onPress={() => router.push(RouteBuilder.discoverJobDetail(job.id))} p="$4">
      <YStack gap="$3">
        {/* Header */}
        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {job.title}
              </Text>
              {job.organization && (
                <XStack gap="$2" items="center">
                  <Building2 size={16} color="$color11" />
                  <Text fontSize="$3" color="$color11" fontWeight="600">
                    {job.organization.name}
                  </Text>
                </XStack>
              )}
            </YStack>
            {hasApplied && (
              <Chip bg="$green9" color="$green1">
                Applied
              </Chip>
            )}
          </XStack>

          {/* Job metadata */}
          <XStack gap="$3" flexWrap="wrap">
            {job.location && (
              <XStack gap="$1.5" items="center">
                <MapPin size={14} color="$color10" />
                <Text fontSize="$2" color="$color10">
                  {job.location}
                </Text>
              </XStack>
            )}
            {employmentType && (
              <XStack gap="$1.5" items="center">
                <Briefcase size={14} color="$color10" />
                <Text fontSize="$2" color="$color10">
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
        </YStack>

        {/* Description preview */}
        {descriptionText && (
          <Text fontSize="$3" color="$color11" numberOfLines={2}>
            {descriptionText}
          </Text>
        )}

        {/* Pay range and certifications */}
        <XStack justify="space-between" items="center" flexWrap="wrap" gap="$2">
          <XStack gap="$3" items="center">
            {payRange && (
              <XStack gap="$1.5" items="center">
                <DollarSign size={16} color="$green10" />
                <Text fontSize="$3" color="$green10" fontWeight="600">
                  {payRange}
                </Text>
              </XStack>
            )}
          </XStack>

          {postedTime && (
            <XStack gap="$1.5" items="center">
              <Clock size={14} color="$color9" />
              <Text fontSize="$2" color="$color9">
                {postedTime}
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Certifications and Skills */}
        {(job.certifications && job.certifications.length > 0) ||
        (job.skills && job.skills.length > 0) ? (
          <XStack gap="$2" flexWrap="wrap">
            {job.certifications?.slice(0, 3).map((cert) => (
              <Chip key={cert.id} bg="$red10" color="$color1" fontSize="$2" px="$2" py="$1">
                {cert.name}
              </Chip>
            ))}
            {job.certifications && job.certifications.length > 3 && (
              <Chip bg="$color3" color="$color11" fontSize="$2" px="$2" py="$1">
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
                <Chip key={skill.id} bg="$blue10" color="$color1" fontSize="$2" px="$2" py="$1">
                  {label}
                </Chip>
              )
            })}
            {job.skills && job.skills.length > 2 && (
              <Chip bg="$color3" color="$color11" fontSize="$2" px="$2" py="$1">
                +{job.skills.length - 2} more
              </Chip>
            )}
          </XStack>
        ) : null}

        {/* Action button */}
        <Button
          size="$3"
          theme="info"
          onPress={() => {
            if (hasInquiryLink && applicationId) {
              router.push(RouteBuilder.dashboardApplicationInquiry(applicationId))
              return
            }
            router.push(RouteBuilder.discoverJobDetail(job.id))
          }}
          mt="$2"
        >
          {buttonLabel}
        </Button>
      </YStack>
    </DiscoverCard>
  )
}
