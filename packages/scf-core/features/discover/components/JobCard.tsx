import { Card, Row, Separator, Stack, useThemeContext } from '@scaffald/ui'
import { Briefcase, DollarSign, MapPin } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { View } from 'react-native'
import { jobPalette, CardHeader, MetricRow, Pill } from '@scf/core/components/ui'
import type { JobMapPin } from '../hooks/useJobs'

type JobCardProps = {
  job: JobMapPin
  isSelected?: boolean
  onPress?: () => void
  variant?: 'compact' | 'full'
}

function formatEmploymentType(type?: string): string {
  if (!type) return type ?? ''
  const map: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }
  return map[type] ?? type
}

function formatRemoteOption(option?: string): string {
  if (!option) return option ?? ''
  const map: Record<string, string> = {
    on_site: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
  }
  return map[option] ?? option
}

function formatSalary(minCents?: number, maxCents?: number, type?: string): string | null {
  if (!minCents && !maxCents) return null
  const fmt = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${(dollars / 1000).toFixed(0)}k` : `$${dollars.toFixed(0)}`
  }
  const suffix = type === 'hourly' ? '/hr' : type === 'annual' || type === 'salary' ? '/yr' : ''
  if (minCents && maxCents) return `${fmt(minCents)} – ${fmt(maxCents)}${suffix}`
  if (minCents) return `${fmt(minCents)}+${suffix}`
  if (maxCents) return `Up to ${fmt(maxCents)}${suffix}`
  return null
}

/**
 * Job Card — uses shared card primitives for consistency.
 * Header: icon + title + org name
 * Metrics: location, pay, tags
 */
export const JobCard = memo(
  forwardRef<ComponentRef<typeof View>, JobCardProps>(
    ({ job, isSelected = false, onPress, variant = 'compact' }, ref) => {
      const { theme } = useThemeContext()
      const t = theme === 'dark' ? 'dark' : 'light'
      const pal = jobPalette[t]
      const isCompact = variant === 'compact'
      const salaryRange = formatSalary(
        job.pay_range_min_cents,
        job.pay_range_max_cents,
        job.pay_range_type
      )
      const tags = [formatEmploymentType(job.employment_type), formatRemoteOption(job.remote_option)].filter(Boolean)

      return (
        <View ref={ref}>
          <Card
            pressable={!!onPress}
            onPress={onPress}
            padding="md"
            variant={isSelected ? 'elevated' : 'glass'}
            style={[isSelected && { borderColor: pal.selectedBorder, borderWidth: 1 }]}
          >
            <Stack gap={isCompact ? 10 : 12}>
              <CardHeader
                icon={Briefcase}
                iconBg={pal.iconBg}
                iconColor={pal.iconFg}
                title={job.title}
                subtitle={job.organization_name}
                compact={isCompact}
                theme={t}
              />

              {/* Metrics */}
              {job.location && <MetricRow icon={MapPin} text={job.location} theme={t} flex />}

              {salaryRange && (
                <MetricRow icon={DollarSign} text={salaryRange} color={pal.accent} theme={t} />
              )}

              {/* Tags */}
              {!isCompact && tags.length > 0 && (
                <>
                  <Separator />
                  <Row gap={4} wrap>
                    {tags.map((tag) => (
                      <Pill key={tag} label={tag} bgColor={pal.pillBg} textColor={pal.pillText} />
                    ))}
                    {job.position_level && (
                      <Pill
                        label={job.position_level}
                        bgColor={pal.iconBg}
                        textColor={pal.pillText}
                      />
                    )}
                  </Row>
                </>
              )}

              {isCompact && tags.length > 0 && (
                <Row gap={4} wrap>
                  {tags.map((tag) => (
                    <Pill
                      key={tag}
                      label={tag}
                      bgColor={pal.pillBg}
                      textColor={pal.pillText}
                      compact
                    />
                  ))}
                </Row>
              )}
            </Stack>
          </Card>
        </View>
      )
    }
  )
)

JobCard.displayName = 'JobCard'
