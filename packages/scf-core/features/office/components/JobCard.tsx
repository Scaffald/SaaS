import type { AppRouter } from '@scf/supabase/client-types'
import { DiscoverCard, useThemeContext } from '@unicornlove/beyond-ui'
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Users,
} from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { type GetThemeValueForKey, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

type JobListOutput = inferRouterOutputs<AppRouter>['office']['listJobs']
type Job = JobListOutput['jobs'][number]

export interface JobCardProps {
  job: Job
  applicationCount?: number
  onPress?: () => void
  isSelected?: boolean
}

const getStatusColors = (status: string, theme: 'light' | 'dark') => {
  const STATUS_COLORS: Record<string, { backgroundColor: string; text: string; border: string }> = {
    draft: {
      backgroundColor: colors.bg[theme].muted,
      text: colors.text[theme].secondary,
      border: colors.border[theme].subtle,
    },
    open: {
      backgroundColor: colors.bg[theme].successSubtle,
      text: colors.text[theme].success,
      border: colors.border[theme].success,
    },
    paused: {
      backgroundColor: colors.bg[theme].warningSubtle,
      text: colors.text[theme].warning,
      border: colors.border[theme].warning,
    },
    closed: {
      backgroundColor: colors.bg[theme].errorSubtle,
      text: colors.text[theme].error,
      border: colors.border[theme].error,
    },
    reviewing: {
      backgroundColor: colors.bg[theme].info,
      text: colors.text[theme].info,
      border: colors.border[theme].info,
    },
  }
  return STATUS_COLORS[status] || STATUS_COLORS.draft
}

const formatPayRange = (job: Job) => {
  if (!job.pay_range_min_cents || !job.pay_range_max_cents) {
    return null
  }
  const min = (job.pay_range_min_cents / 100).toFixed(0)
  const max = (job.pay_range_max_cents / 100).toFixed(0)
  const type = job.pay_range_type || 'hourly'
  return `$${min}-$${max} ${type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''}`
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function JobCard({ job, applicationCount, onPress, isSelected = false }: JobCardProps) {
  const { theme } = useThemeContext()
  const statusColors = getStatusColors(job.status, theme)
  const payRange = formatPayRange(job)
  const postedDate = formatDate(job.posted_at)
  const createdDate = formatDate(job.created_at)

  // Get primary team name
  const primaryTeam = job.teamAssignments?.find(
    (assignment: (typeof job.teamAssignments)[0]) => assignment.isPrimary
  )?.team
  const teamName = primaryTeam?.name || job.team?.name || null

  return (
    <DiscoverCard variant="warning" isSelected={isSelected} onPress={onPress} padding="md" gap={12}>
      {/* Header: Title and Status */}
      <Row justify="space-between" align="flex-start" gap={12}>
        <Stack gap={8} flex={1}>
          <Row align="center" gap={8} flexWrap="wrap">
            <Briefcase
              size={18}
              color={isSelected ? colors.text[theme].warning : colors.text[theme].tertiary}
            />
            <Text
              style={{
                color: isSelected ? colors.text[theme].warning : colors.text[theme].primary,
              }}
              flex={1}
            >
              {job.title}
            </Text>
          </Row>
          {job.organization && (
            <Row align="center" gap={6} marginLeft="$7">
              <Building2 size="md" style={{ color: colors.text[theme].secondary }} />
              <Text style={{ color: colors.text[theme].secondary }}>{job.organization.name}</Text>
            </Row>
          )}
        </Stack>
        <Row
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={12}
          backgroundColor={statusColors.backgroundColor as GetThemeValueForKey<'backgroundColor'>}
          borderWidth={1}
          borderColor={statusColors.border as GetThemeValueForKey<'borderColor'>}
        >
          <Text color={statusColors.text as GetThemeValueForKey<'color'>}>
            {getStatusLabel(job.status)}
          </Text>
        </Row>
      </Row>

      {/* Metrics Row */}
      <Row gap={12} flexWrap="wrap">
        {applicationCount !== undefined && (
          <MetricItem
            iconStart={<Users size="md" />}
            label="Applications"
            value={applicationCount.toString()}
          />
        )}
        {teamName && (
          <MetricItem iconStart={<Briefcase size="md" />} label="Team" value={teamName} />
        )}
        {postedDate && (
          <MetricItem iconStart={<Calendar size="md" />} label="Posted" value={postedDate} />
        )}
        {job.created_by && (
          <MetricItem
            iconStart={<User size="md" />}
            label="Created by"
            value={job.created_by.display_name || job.created_by.username || 'Unknown'}
          />
        )}
      </Row>

      {/* Details Row */}
      <Row gap={12} flexWrap="wrap">
        {job.location && (
          <Row align="center" gap={6}>
            <MapPin size="md" style={{ color: colors.text[theme].secondary }} />
            <Text style={{ color: colors.text[theme].secondary }}>{job.location}</Text>
          </Row>
        )}
        {job.remote_option && (
          <Text
            style={{ color: colors.text[theme].secondary, backgroundColor: colors.bg[theme].muted }}
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
          >
            {job.remote_option.replace('_', ' ').toUpperCase()}
          </Text>
        )}
        {job.employment_type && (
          <Text
            style={{ color: colors.text[theme].secondary, backgroundColor: colors.bg[theme].muted }}
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
          >
            {job.employment_type.replace('_', ' ').toUpperCase()}
          </Text>
        )}
      </Row>

      {/* Pay Range */}
      {payRange && (
        <Row align="center" gap={6}>
          <DollarSign size="md" style={{ color: colors.text[theme].success }} />
          <Text style={{ color: colors.text[theme].success }}>{payRange}</Text>
        </Row>
      )}

      {/* Footer: Created date if not posted */}
      {!postedDate && createdDate && (
        <Row align="center" gap={6}>
          <Calendar size="sm" style={{ color: colors.text[theme].secondary }} />
          <Text style={{ color: colors.text[theme].secondary }}>Created {createdDate}</Text>
        </Row>
      )}
    </DiscoverCard>
  )
}

function MetricItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Row
      gap={8}
      align="center"
      borderWidth={1}
      borderColor={colors.border[theme].default}
      borderRadius={12}
      paddingHorizontal={8}
      paddingVertical={4}
      style={{ backgroundColor: colors.bg[theme].muted }}
    >
      {icon}
      <Stack gap={0}>
        <Text style={{ color: colors.text[theme].secondary }} textTransform="uppercase">
          {label}
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>{value}</Text>
      </Stack>
    </Row>
  )
}
