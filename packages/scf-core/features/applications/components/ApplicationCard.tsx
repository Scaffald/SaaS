import type { Application } from '@scaffald/sdk/resources/applications'
import { formatDistanceToNow } from 'date-fns'
import { Briefcase, CheckCircle2, Clock, DollarSign, MapPin, Sparkles } from 'lucide-react-native'
import { Link } from 'expo-router'
import { DashboardWidget, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'

/**
 * SC-37: status-driven next-step nudge. Returns `null` for terminal /
 * passive states so the card stays clean — only renders when there's
 * a meaningful action the worker can take.
 */
function getNextStep(status: Application['status']): {
  label: string
  tone: 'primary' | 'success'
} | null {
  switch (status) {
    case 'reviewing':
      return { label: 'Employer is reviewing your application', tone: 'primary' }
    case 'inquired':
      return { label: 'New message from the employer — respond when ready', tone: 'primary' }
    case 'interview':
      return { label: 'Prep for your interview', tone: 'primary' }
    case 'offer':
      return { label: 'Offer received — respond to the employer', tone: 'success' }
    case 'hired':
      return { label: 'You were hired — congrats!', tone: 'success' }
    default:
      return null
  }
}

interface ApplicationCardProps {
  application: Application
}

function formatPayRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  type: string | null | undefined
): string | null {
  if (!minCents && !maxCents) return null
  const suffix = type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''
  const format = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${Math.round(dollars / 1000)}K` : `$${dollars}`
  }
  if (minCents && maxCents) return `${format(minCents)} - ${format(maxCents)}${suffix}`
  if (minCents) return `${format(minCents)}+${suffix}`
  if (maxCents) return `Up to ${format(maxCents)}${suffix}`
  return null
}

function formatEmploymentType(type: string | null | undefined): string | null {
  if (!type) return null
  const map: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }
  return map[type] ?? type
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { theme } = useThemeContext()
  const job = application.job
  const appliedDate = application.created_at ? new Date(application.created_at) : null
  const appliedAgo =
    appliedDate && !Number.isNaN(appliedDate.getTime())
      ? formatDistanceToNow(appliedDate, { addSuffix: true })
      : null
  const payRange = formatPayRange(
    job?.pay_range_min_cents,
    job?.pay_range_max_cents,
    job?.pay_range_type
  )
  const employmentType = formatEmploymentType(job?.employment_type)
  const nextStep = getNextStep(application.status)
  const nextStepColor =
    nextStep?.tone === 'success' ? colors.success[600] : colors.primary[600]
  const NextStepIcon = nextStep?.tone === 'success' ? CheckCircle2 : Sparkles

  return (
    <Link
      href={`/jobs/applications/${application.id}` as never}
      style={{ textDecorationLine: 'none', display: 'flex', width: '100%' } as never}
    >
      <DashboardWidget gap={12}>
        <Row justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text[theme].primary,
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {job?.title ?? 'Job'}
            </Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
              {job?.organization?.name ?? 'Company'}
            </Text>
          </Stack>
          <ApplicationStatusBadge status={application.status} />
        </Row>

        <Row gap={16} wrap>
          {job?.location && (
            <Row gap={4} align="center">
              <MapPin size={14} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                {job.location}
              </Text>
            </Row>
          )}
          {employmentType && (
            <Row gap={4} align="center">
              <Briefcase size={14} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                {employmentType}
              </Text>
            </Row>
          )}
          {payRange && (
            <Row gap={4} align="center">
              <DollarSign size={14} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>{payRange}</Text>
            </Row>
          )}
          {appliedAgo && (
            <Row gap={4} align="center">
              <Clock size={14} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                Applied {appliedAgo}
              </Text>
            </Row>
          )}
        </Row>

        {nextStep && (
          <Row gap={6} align="center">
            <NextStepIcon size={14} color={nextStepColor} />
            <Text style={{ color: nextStepColor, fontSize: 13, fontWeight: '500', flex: 1 }}>
              {nextStep.label}
            </Text>
          </Row>
        )}
      </DashboardWidget>
    </Link>
  )
}
