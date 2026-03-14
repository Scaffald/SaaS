import type { AppRouter } from '@scf/supabase/client-types'
import { Card, useThemeContext } from '@scaffald/ui'
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
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  jobPalette,
  textSmall,
  textCaption,
  MetricRow,
  Pill,
} from '@scf/core/components/ui'

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
      backgroundColor: theme === "light" ? colors.green[50] : colors.green[900],
      text: theme === "light" ? colors.green[700] : colors.green[300],
      border: theme === "light" ? colors.green[300] : colors.green[700],
    },
    paused: {
      backgroundColor: theme === "light" ? colors.yellow[50] : colors.yellow[900],
      text: theme === "light" ? colors.yellow[700] : colors.yellow[300],
      border: theme === "light" ? colors.yellow[300] : colors.yellow[700],
    },
    closed: {
      backgroundColor: theme === "light" ? colors.error[50] : colors.error[900],
      text: theme === "light" ? colors.error[700] : colors.error[300],
      border: theme === "light" ? colors.error[300] : colors.error[700],
    },
    reviewing: {
      backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900],
      text: theme === "light" ? colors.blue[700] : colors.blue[300],
      border: theme === "light" ? colors.blue[300] : colors.blue[700],
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

  const pal = jobPalette[theme]

  return (
    <Card
      pressable={!!onPress}
      onPress={onPress}
      padding="md"
      variant={isSelected ? 'elevated' : 'surface'}
      style={[isSelected && { borderColor: pal.selectedBorder, borderWidth: 1 }]}
    >
      <Stack gap={12}>
        {/* Header: Title and Status */}
        <Row justify="space-between" align="flex-start" gap={12}>
          <Stack gap={8} flex={1}>
            <Row align="center" gap={8} wrap>
              <Briefcase
                size={18}
                color={isSelected ? pal.accent : colors.text[theme].tertiary}
              />
              <Text
                style={{
                  flex: 1,
                  fontWeight: '600',
                  fontSize: 15,
                  color: isSelected ? pal.accent : colors.text[theme].primary,
                }}
              >
                {job.title}
              </Text>
            </Row>
            {job.organization && (
              <MetricRow icon={Building2} text={job.organization.name} theme={theme} />
            )}
          </Stack>
          <Pill
            label={getStatusLabel(job.status)}
            bgColor={statusColors.backgroundColor}
            textColor={statusColors.text}
          />
        </Row>

        {/* Metrics Row */}
        <Row gap={8} wrap>
          {applicationCount !== undefined && (
            <MetricItem
              icon={<Users size={16} />}
              label="Applications"
              value={applicationCount.toString()}
            />
          )}
          {teamName && (
            <MetricItem icon={<Briefcase size={16} />} label="Team" value={teamName} />
          )}
          {postedDate && (
            <MetricItem icon={<Calendar size={16} />} label="Posted" value={postedDate} />
          )}
          {job.created_by && (
            <MetricItem
              icon={<User size={16} />}
              label="Created by"
              value={job.created_by.display_name || job.created_by.username || 'Unknown'}
            />
          )}
        </Row>

        {/* Details Row */}
        <Row gap={8} wrap>
          {job.location && <MetricRow icon={MapPin} text={job.location} theme={theme} />}
          {job.remote_option && (
            <Pill
              label={job.remote_option.replace('_', ' ').toUpperCase()}
              bgColor={colors.bg[theme].muted}
              textColor={colors.text[theme].secondary}
            />
          )}
          {job.employment_type && (
            <Pill
              label={job.employment_type.replace('_', ' ').toUpperCase()}
              bgColor={colors.bg[theme].muted}
              textColor={colors.text[theme].secondary}
            />
          )}
        </Row>

        {/* Pay Range */}
        {payRange && (
          <MetricRow icon={DollarSign} text={payRange} color={colors.success[500]} theme={theme} />
        )}

        {/* Footer: Created date if not posted */}
        {!postedDate && createdDate && (
          <MetricRow icon={Calendar} text={`Created ${createdDate}`} theme={theme} />
        )}
      </Stack>
    </Card>
  )
}

function MetricItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  const { theme } = useThemeContext()
  return (
    <Row
      gap={6}
      align="center"
      style={{
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: colors.bg[theme].muted,
      }}
    >
      {icon}
      <Stack gap={0}>
        <Text style={{ ...textCaption, color: colors.text[theme].tertiary, textTransform: 'uppercase' }}>
          {label}
        </Text>
        <Text style={{ ...textSmall, color: colors.text[theme].secondary }}>{value}</Text>
      </Stack>
    </Row>
  )
}
