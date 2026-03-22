import { useCalculateSoftSkillsMatch } from '@scf/core/utils/jobs-sdk-hooks'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Card, extractPlainText, useThemeContext } from '@scaffald/ui'
import { Briefcase, Building2, Clock, DollarSign, MapPin } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  jobPalette,
  workerPalette,
  textSmall,
  MetricRow,
  Pill,
} from '@scf/core/components/ui'

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
  require_current_location?: boolean
  require_relocation_willingness?: boolean
  minimum_years_experience?: number
  require_work_authorization?: boolean
  require_earliest_start_date?: boolean
  application_deadline?: string
  minimum_education_level?: 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
  require_background_check?: boolean
  background_check_type?: string
  require_drug_test?: boolean
  require_drivers_license?: boolean
  drivers_license_type?: string
  security_clearance_required?: string
  travel_percentage?: number
  benefits_summary?: string
  relocation_assistance_offered?: boolean
  relocation_assistance_details?: string
  work_schedule_details?: string
  timezone?: string
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

function formatPayRange(minCents?: number, maxCents?: number, type?: string): string {
  if (!minCents || !maxCents || !type) return ''
  const min = (minCents / 100).toFixed(2)
  const max = (maxCents / 100).toFixed(2)
  const formatCurrency = (value: string) =>
    `$${Number.parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
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

function formatRemoteOption(option?: string): string {
  if (!option) return ''
  const optionMap: Record<string, string> = {
    on_site: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
  }
  return optionMap[option] || option
}

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
 * Internal Job Card — uses shared card primitives for consistency.
 * Header: title + org, metadata chips
 * Body: description, pay range, certs/skills pills
 */
export function InternalJobCard({ job, hasApplied, applicationId }: InternalJobCardProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const jPal = jobPalette[t]
  const wPal = workerPalette[t]

  const payRange = formatPayRange(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type)
  const employmentType = formatEmploymentType(job.employment_type)
  const remoteOption = formatRemoteOption(job.remote_option)
  const postedTime = formatRelativeTime(job.posted_at || job.created_at)
  const hasInquiryLink = Boolean(hasApplied && applicationId)

  const hasSoftSkillsRequirements = useMemo(() => {
    if (!job.required_soft_skills || typeof job.required_soft_skills !== 'object') return false
    const requirements = job.required_soft_skills as Array<{ skill_id: string; importance: number }>
    return Array.isArray(requirements) && requirements.length > 0
  }, [job.required_soft_skills])

  const { data: matchData } = useCalculateSoftSkillsMatch(job.id, {
    enabled: hasSoftSkillsRequirements,
  })

  const descriptionText =
    typeof job.description === 'string'
      ? job.description
      : job.description
        ? extractPlainText(job.description as JSONContent)
        : ''

  const handleCardPress = () => {
    if (hasInquiryLink && applicationId) {
      router.push(
        buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.INQUIRY, { applicationId })
      )
      return
    }
    router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id }))
  }

  return (
    <Card pressable onPress={handleCardPress} padding="md" variant="glass" glassMaterial="thin">
      <Stack gap={12}>
        {/* Header */}
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Stack flex={1} gap={4}>
              <Text style={{ fontWeight: '600', fontSize: 15 }}>{job.title}</Text>
              {job.organization && (
                <MetricRow icon={Building2} text={job.organization.name} theme={t} />
              )}
            </Stack>
            <Row gap={8} align="center">
              {hasApplied && (
                <Pill label="Applied" bgColor={colors.success[100]} textColor={colors.success[600]} />
              )}
              {matchData?.score !== null && matchData?.score !== undefined && (
                <Pill
                  label={`${Math.round(matchData.score)}% Match`}
                  bgColor={
                    matchData.score >= 80
                      ? colors.success[100]
                      : matchData.score >= 60
                        ? colors.yellow[100]
                        : colors.error[100]
                  }
                  textColor={
                    matchData.score >= 80
                      ? colors.success[600]
                      : matchData.score >= 60
                        ? colors.yellow[600]
                        : colors.error[600]
                  }
                />
              )}
            </Row>
          </Row>

          {/* Job metadata chips */}
          <Row gap={8} wrap>
            {job.location && <MetricRow icon={MapPin} text={job.location} theme={t} />}
            {employmentType && <MetricRow icon={Briefcase} text={employmentType} theme={t} />}
            {remoteOption && (
              <Pill label={remoteOption} bgColor={colors.primary[50]} textColor={colors.primary[700]} />
            )}
          </Row>
        </Stack>

        {/* Description preview */}
        {descriptionText && (
          <Text style={{ ...textSmall, color: colors.text[t].secondary }} numberOfLines={3}>
            {descriptionText}
          </Text>
        )}

        {/* Pay range and posted time */}
        <Row justify="space-between" align="center" wrap gap={8}>
          {payRange ? (
            <MetricRow icon={DollarSign} text={payRange} color={colors.success[500]} theme={t} />
          ) : (
            <Stack />
          )}
          {postedTime && <MetricRow icon={Clock} text={postedTime} theme={t} />}
        </Row>

        {/* Certifications and Skills */}
        {((job.certifications && job.certifications.length > 0) ||
          (job.skills && job.skills.length > 0)) && (
          <Row gap={6} wrap>
            {job.certifications?.slice(0, 3).map((cert) => (
              <Pill
                key={cert.id}
                label={cert.name}
                bgColor={wPal.pillBg}
                textColor={wPal.pillText}
              />
            ))}
            {job.certifications && job.certifications.length > 3 && (
              <Pill
                label={`+${job.certifications.length - 3} more`}
                bgColor={colors.bg[t].muted}
                textColor={colors.text[t].tertiary}
              />
            )}
            {job.skills?.slice(0, 2).map((skill) => {
              const label =
                skill.name ??
                (skill.taxonomy ? `${skill.taxonomy.toUpperCase()} ${skill.id}` : skill.id)
              if (!label) return null
              return (
                <Pill
                  key={skill.id}
                  label={label}
                  bgColor={jPal.pillBg}
                  textColor={jPal.pillText}
                />
              )
            })}
            {job.skills && job.skills.length > 2 && (
              <Pill
                label={`+${job.skills.length - 2} more`}
                bgColor={colors.bg[t].muted}
                textColor={colors.text[t].tertiary}
              />
            )}
          </Row>
        )}
      </Stack>
    </Card>
  )
}
