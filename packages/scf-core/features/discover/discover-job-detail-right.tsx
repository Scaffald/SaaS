import {
  useCalculateSoftSkillsMatch,
  useExternalJobs,
  useJobDetails,
} from '@scf/core/utils/jobs-sdk-hooks'
import { SoftSkillsMatchIndicator } from '@scf/core/features/profile/components/SoftSkillsMatchIndicator'
import { ROUTES } from '@scf/core/constants/routes'
import { Button, Chip, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check, Clock, ExternalLink, Home, MapPin, Minus, TrendingUp, X } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import type { JSONContent } from '@tiptap/core'
import type { ReactElement, ReactNode } from 'react'
import { useMemo } from 'react'
import { useUser } from '@scf/core/utils/useUser'
import {
  useEducationWidget,
  useExperienceWidget,
  usePreferencesWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { buildJobRequirements, requirementsSummary } from './job-requirements'
import { formatJobLocation } from './job-detail-header'
import {
  H3,
  MetricBlock,
  MetricRow,
  Separator,
  Skeleton,
  SkeletonBox,
  SkeletonText,
  Spinner,
  Text,
  Row,
  Stack,
} from '@scaffald/ui'

/**
 * One section opener for the whole screen: a real heading, optionally with a
 * figure on the right. Every block here used to open with a `<Text>` styled
 * like a heading, which left the screen with no headings in the
 * accessibility tree at all (#860).
 */
function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={12}>
      <Row justify="space-between" align="center" gap={12} wrap>
        {/* React Native defaults flexShrink to 0, so a long heading beside a
            figure pushes the row wider than the column (#858). */}
        <H3 style={{ color: colors.text[t].primary, flex: 1, minWidth: 0 }}>{title}</H3>
        {right}
      </Row>
      {children}
    </Stack>
  )
}

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

  // The viewer's own record, for answering "can I get this one" against the
  // posting's requirements. Signed out, these do not run and every
  // requirement reads as unanswerable — which is the honest state, and what
  // the public job page shows.
  const { user } = useUser()
  const signedIn = !!user

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

  const { data: education } = useEducationWidget(undefined, { enabled: signedIn })
  const { data: experience } = useExperienceWidget(undefined, { enabled: signedIn })
  const { data: preferences } = usePreferencesWidget({ enabled: signedIn })

  // Fetch soft skills match for internal jobs with requirements (SDK)
  const { data: matchData, isLoading: isLoadingMatch } = useCalculateSoftSkillsMatch(jobId, {
    enabled: !!jobId && hasSoftSkillsRequirements && !isExternal,
  })

  const requirements = useMemo(
    () =>
      job
        ? buildJobRequirements({
            job: job as Parameters<typeof buildJobRequirements>[0]['job'],
            profile: signedIn
              ? {
                  education,
                  experience,
                  driversLicenseClasses: preferences?.drivers_license_classes,
                }
              : undefined,
          })
        : [],
    [job, signedIn, education, experience, preferences]
  )
  const summary = useMemo(() => requirementsSummary(requirements), [requirements])

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
        <Text style={{ color: colors.text[t].secondary }}>
          This job may have been removed or is no longer available
        </Text>
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
    const locationLabel = formatJobLocation(job.location as Parameters<typeof formatJobLocation>[0])

    // Pay and schedule as figures, not as four different decorated rows. A
    // block is only built where the posting actually carries the field, so
    // an incomplete posting shows a shorter row rather than "Not listed"
    // four times over.
    const metrics = [
      payRange ? <MetricBlock key="pay" label="Pay" value={payRange} /> : null,
      employmentType ? (
        <MetricBlock
          key="schedule"
          label="Schedule"
          value={employmentType}
          delta={intJob.work_schedule_details ?? undefined}
        />
      ) : null,
      remoteOption || locationLabel ? (
        <MetricBlock
          key="workplace"
          label="Workplace"
          value={remoteOption || locationLabel}
          delta={remoteOption ? locationLabel || undefined : undefined}
        />
      ) : null,
      intJob.application_deadline ? (
        <MetricBlock
          key="deadline"
          label="Apply by"
          value={new Date(intJob.application_deadline).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          emphasis
        />
      ) : null,
    ].filter((block): block is ReactElement => block !== null)

    return (
      <Stack gap={20}>
        {/* Pay and schedule as one figure row, the same block the dashboard
            and the ATS use. These were four separate idioms before: a green
            dollar line, an icon row, a chip, and a yellow deadline card. */}
        {metrics.length > 0 && <MetricRow bordered>{metrics}</MetricRow>}

        {job.benefits_summary && (
          <Section title="Benefits">
            <Text style={{ color: colors.text[t].secondary }}>{job.benefits_summary}</Text>
          </Section>
        )}

        {/* No separator here: the metric row already closes with a hairline,
            and two rules a gap apart read as an empty band. */}
        <Section title="Job description">
          <Text style={{ color: colors.text[t].secondary, lineHeight: 22 }}>
            {typeof job.description === 'string'
              ? job.description
              : job.description
                ? extractPlainText(job.description as JSONContent)
                : ''}
          </Text>
        </Section>

        {/* Requirements — answered against the viewer's own record where
            that can be done honestly, and listed plainly where it cannot.
            The prototype leads this screen with "5 of 7 met" because the
            question a tradesperson has is "can I get this one", not "what
            does this want". */}
        {requirements.length > 0 && (
          <>
            <Separator />
            <Section
              title="Requirements"
              right={
                summary ? (
                  <Text style={{ color: colors.text[t].secondary }}>
                    {summary.met} of {summary.checkable} met
                  </Text>
                ) : null
              }
            >
              <Stack gap={8}>
                {requirements.map((requirement) => {
                  const Icon =
                    requirement.status === 'met'
                      ? Check
                      : requirement.status === 'unmet'
                        ? X
                        : Minus
                  // `success` reads as "good news"; a met requirement is
                  // simply true, so it takes the same emphasis as a link.
                  // `attention` is the token for "act on this", which is
                  // exactly what an unmet requirement is — not an error.
                  const tone =
                    requirement.status === 'met'
                      ? colors.text[t].emphasis
                      : requirement.status === 'unmet'
                        ? colors.text[t].attention
                        : colors.text[t].tertiary
                  return (
                    <Row key={requirement.id} gap={8} align="center">
                      <Icon size={18} color={tone} />
                      <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
                        {requirement.label}
                      </Text>
                    </Row>
                  )
                })}
              </Stack>
              {signedIn && summary === null && (
                <Text style={{ color: colors.text[t].tertiary }}>
                  None of these can be checked against your profile.
                </Text>
              )}
              {!signedIn && (
                <Text style={{ color: colors.text[t].tertiary }}>
                  Sign in to see which of these you already meet.
                </Text>
              )}
            </Section>
          </>
        )}

        {/* Work Schedule & Location */}
        {(intJob.work_schedule_details ||
          intJob.relocation_assistance_offered ||
          intJob.timezone) && (
          <>
            <Separator />
            <Section title="Work details">
              <Stack gap={8}>
                {intJob.work_schedule_details && (
                  <Row gap={8} align="center">
                    <Clock size={18} color={colors.icon[t].muted} />
                    <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
                      {intJob.work_schedule_details}
                    </Text>
                  </Row>
                )}
                {intJob.timezone && (
                  <Row gap={8} align="center">
                    <MapPin size={18} color={colors.icon[t].muted} />
                    <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
                      Timezone: {intJob.timezone}
                    </Text>
                  </Row>
                )}
                {intJob.relocation_assistance_offered && (
                  <Row gap={8} align="center">
                    <Home size={18} color={colors.icon[t].muted} />
                    <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
                      Relocation assistance available
                      {intJob.relocation_assistance_details &&
                        `: ${intJob.relocation_assistance_details}`}
                    </Text>
                  </Row>
                )}
              </Stack>
            </Section>
          </>
        )}

        {/* Required Certifications */}
        {intJob.certifications && intJob.certifications.length > 0 && (
          <>
            <Separator />
            <Section title="Required certifications">
              <Row gap={8} wrap>
                {intJob.certifications.map((cert: { id: string; name: string }) => (
                  <Chip key={cert.id} size="sm">
                    {cert.name}
                  </Chip>
                ))}
              </Row>
            </Section>
          </>
        )}

        {/* Required Skills */}
        {intJob.skills && intJob.skills.length > 0 && (
          <>
            <Separator />
            <Section title="Required skills">
              <Row gap={8} wrap>
                {(intJob.skills ?? []).map((skill) => {
                  const label =
                    skill.name ??
                    (skill.taxonomy ? `${skill.taxonomy.toUpperCase()} ${skill.id}` : skill.id)
                  if (!label) {
                    return null
                  }
                  return (
                    <Chip key={skill.id} size="sm">
                      {label}
                    </Chip>
                  )
                })}
              </Row>
            </Section>
          </>
        )}

        {/* Soft Skills Match Section */}
        {hasSoftSkillsRequirements && (
          <>
            <Separator />
            <Section
              title="Your soft skills match"
              right={
                matchData?.score !== null && matchData?.score !== undefined ? (
                  <Text style={{ color: colors.text[t].secondary }}>
                    {Math.round(matchData.score)}% match
                  </Text>
                ) : null
              }
            >
              {isLoadingMatch ? (
                <Row gap={8} align="center">
                  <Spinner variant="ios" size="sm" color="primary" />
                  <Text style={{ color: colors.text[t].secondary }}>Calculating match…</Text>
                </Row>
              ) : matchData?.needsSelfAssessment ? (
                <Stack
                  gap={12}
                  padding="md"
                  borderRadius={8}
                  borderWidth={1}
                  borderColor={colors.border[t].default}
                  style={{ backgroundColor: colors.bg[t].subtle }}
                  align="flex-start"
                >
                  <Text style={{ color: colors.text[t].secondary }}>
                    Complete your soft skills assessment to see how well you match this job's
                    requirements.
                  </Text>
                  <Button
                    variant="filled"
                    color="primary"
                    size="sm"
                    onPress={() => router.push(ROUTES.PROFILE.SKILLS.path)}
                  >
                    Start assessment
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
                      borderRadius={8}
                      borderWidth={1}
                      borderColor={colors.border[t].default}
                      style={{ backgroundColor: colors.bg[t].subtle }}
                      align="flex-start"
                    >
                      <Row gap={8} align="center">
                        <TrendingUp size={18} color={colors.text[t].attention} />
                        <Text style={{ color: colors.text[t].attention }}>Skills to develop</Text>
                      </Row>
                      <Stack gap={4}>
                        {matchData.details
                          .filter((detail) => !(detail.meetsRequirement ?? false))
                          .map((detail) => (
                            <Text key={detail.skillId} style={{ color: colors.text[t].secondary }}>
                              {detail.skillName ?? ''} — {detail.userRating ?? 0}/5 now, needs{' '}
                              {detail.requiredImportance}/5
                            </Text>
                          ))}
                      </Stack>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => router.push(ROUTES.PROFILE.SKILLS.path)}
                      >
                        Update assessment
                      </Button>
                    </Stack>
                  )}
                </Stack>
              ) : null}
            </Section>
          </>
        )}
      </Stack>
    )
  }

  // External job display
  if (isExternal && 'company_name' in job) {
    const externalMetrics = [
      job.job_type ? (
        <MetricBlock key="schedule" label="Schedule" value={formatEmploymentType(job.job_type)} />
      ) : null,
      job.location ? <MetricBlock key="workplace" label="Location" value={job.location} /> : null,
    ].filter((block): block is ReactElement => block !== null)

    return (
      <Stack gap={20}>
        {/* The posting's own title and employer are in the screen header,
            the same as an internal one. What stays here is what makes this
            listing different: it lives somewhere else. */}
        <Row gap={8} wrap>
          <Chip size="sm">External listing</Chip>
          {job.job_category && <Chip size="sm">{job.job_category}</Chip>}
        </Row>

        {externalMetrics.length > 0 && <MetricRow bordered>{externalMetrics}</MetricRow>}

        {job.description && (
          <>
            <Separator />
            <Section title="Job description">
              <Text style={{ color: colors.text[t].secondary, lineHeight: 22 }}>
                {typeof job.description === 'string'
                  ? job.description
                  : extractPlainText(job.description as JSONContent)}
              </Text>
            </Section>
          </>
        )}

        {job.industries && job.industries.length > 0 && (
          <>
            <Separator />
            <Section title="Industries">
              <Row gap={8} wrap>
                {job.industries.map((industry: { industry_name: string }, idx: number) => (
                  <Chip key={`${industry.industry_name}-${idx}`} size="sm">
                    {industry.industry_name}
                  </Chip>
                ))}
              </Row>
            </Section>
          </>
        )}

        <Row
          gap={8}
          align="center"
          wrap
          padding="sm"
          borderRadius={8}
          borderWidth={1}
          borderColor={colors.border[t].default}
          style={{ backgroundColor: colors.bg[t].subtle }}
        >
          <ExternalLink size={18} color={colors.icon[t].muted} />
          <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 0 }}>
            This job is hosted on an external site. Applying will take you to their own form.
          </Text>
        </Row>
      </Stack>
    )
  }

  return null
}
