import type { AppRouter } from '@scf/supabase/client-types'
import { DiscoverCard } from '@unicornlove/beyond-ui'
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

type JobListOutput = inferRouterOutputs<AppRouter>['office']['listJobs']
type Job = JobListOutput['jobs'][number]

export interface JobCardProps {
  job: Job
  applicationCount?: number
  onPress?: () => void
  isSelected?: boolean
}

const STATUS_COLORS: Record<string, { backgroundColor: string; text: string; border: string }> = {
  draft: { backgroundColor: '$gray3', text: '$gray11', border: '$gray6' },
  open: { backgroundColor: '$green3', text: '$green11', border: '$green6' },
  paused: { backgroundColor: '$yellow3', text: '$yellow11', border: '$yellow6' },
  closed: { backgroundColor: '$red3', text: '$red11', border: '$red6' },
  reviewing: { backgroundColor: '$blue3', text: '$blue11', border: '$blue6' },
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
  const statusColors = STATUS_COLORS[job.status] || STATUS_COLORS.draft
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
            <Briefcase size={18} color={isSelected ? '$yellow10' : '$color10'} />
            <Text color={isSelected ? '$yellow11' : '$color12'}  flex={1}>
              {job.title}
            </Text>
          </Row>
          {job.organization && (
            <Row align="center" gap={6} marginLeft="$7">
              <Building2 size="md" color="$gray11" />
              <Text color="$gray11" >
                {job.organization.name}
              </Text>
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
            icon={<Users size="md" />}
            label="Applications"
            value={applicationCount.toString()}
          />
        )}
        {teamName && <MetricItem icon={<Briefcase size="md" />} label="Team" value={teamName} />}
        {postedDate && (
          <MetricItem icon={<Calendar size="md" />} label="Posted" value={postedDate} />
        )}
        {job.created_by && (
          <MetricItem
            icon={<User size="md" />}
            label="Created by"
            value={job.created_by.display_name || job.created_by.username || 'Unknown'}
          />
        )}
      </Row>

      {/* Details Row */}
      <Row gap={12} flexWrap="wrap">
        {job.location && (
          <Row align="center" gap={6}>
            <MapPin size="md" color="$gray11" />
            <Text color="$gray11" >
              {job.location}
            </Text>
          </Row>
        )}
        {job.remote_option && (
          <Text
            color="$gray11"
            backgroundColor="$color3"
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
          >
            {job.remote_option.replace('_', ' ').toUpperCase()}
          </Text>
        )}
        {job.employment_type && (
          <Text
            color="$gray11"
            backgroundColor="$color3"
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
          <DollarSign size="md" color="$green10" />
          <Text color="$green10">{payRange}</Text>
        </Row>
      )}

      {/* Footer: Created date if not posted */}
      {!postedDate && createdDate && (
        <Row align="center" gap={6}>
          <Calendar size="sm" color="$gray11" />
          <Text color="$gray11">Created {createdDate}</Text>
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
      borderColor="$borderColor"
      borderRadius={12}
      paddingHorizontal={8}
      paddingVertical={4}
      backgroundColor="$color3"
    >
      {icon}
      <Stack gap={0}>
        <Text color="$gray11" textTransform="uppercase">
          {label}
        </Text>
        <Text color="$gray11">{value}</Text>
      </Stack>
    </Row>
  )
}
