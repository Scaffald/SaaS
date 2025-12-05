import type { AppRouter } from '@scf/supabase/client-types'
import { DiscoverCard } from '@unicornlove/ui'
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Users,
} from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { type GetThemeValueForKey, Text, XStack, YStack } from '@unicornlove/ui'

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
    <DiscoverCard variant="warning" isSelected={isSelected} onPress={onPress} padding="$4" gap="$3">
      {/* Header: Title and Status */}
      <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
        <YStack gap="$2" flex={1}>
          <XStack alignItems="center" gap="$2" flexWrap="wrap">
            <Briefcase size={18} color={isSelected ? '$yellow10' : '$color10'} />
            <Text
              fontSize="$5"
              fontWeight="600"
              color={isSelected ? '$yellow11' : '$color12'}
              numberOfLines={2}
              flex={1}
            >
              {job.title}
            </Text>
          </XStack>
          {job.organization && (
            <XStack alignItems="center" gap="$1.5" marginLeft="$7">
              <Building2 size={14} color="$color10" />
              <Text fontSize="$3" color="$color11" numberOfLines={1}>
                {job.organization.name}
              </Text>
            </XStack>
          )}
        </YStack>
        <XStack
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$3"
          backgroundColor={statusColors.backgroundColor as GetThemeValueForKey<'backgroundColor'>}
          borderWidth={1}
          borderColor={statusColors.border as GetThemeValueForKey<'borderColor'>}
        >
          <Text
            fontSize="$2"
            fontWeight="600"
            color={statusColors.text as GetThemeValueForKey<'color'>}
          >
            {getStatusLabel(job.status)}
          </Text>
        </XStack>
      </XStack>

      {/* Metrics Row */}
      <XStack gap="$3" flexWrap="wrap">
        {applicationCount !== undefined && (
          <MetricItem
            icon={<Users size={14} />}
            label="Applications"
            value={applicationCount.toString()}
          />
        )}
        {teamName && <MetricItem icon={<Briefcase size={14} />} label="Team" value={teamName} />}
        {postedDate && (
          <MetricItem icon={<Calendar size={14} />} label="Posted" value={postedDate} />
        )}
        {job.created_by && (
          <MetricItem
            icon={<User size={14} />}
            label="Created by"
            value={job.created_by.display_name || job.created_by.username || 'Unknown'}
          />
        )}
      </XStack>

      {/* Details Row */}
      <XStack gap="$3" flexWrap="wrap">
        {job.location && (
          <XStack alignItems="center" gap="$1.5">
            <MapPin size={14} color="$color10" />
            <Text fontSize="$3" color="$color11" numberOfLines={1}>
              {job.location}
            </Text>
          </XStack>
        )}
        {job.remote_option && (
          <Text
            fontSize="$2"
            color="$color10"
            backgroundColor="$color3"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            {job.remote_option.replace('_', ' ').toUpperCase()}
          </Text>
        )}
        {job.employment_type && (
          <Text
            fontSize="$2"
            color="$color10"
            backgroundColor="$color3"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            {job.employment_type.replace('_', ' ').toUpperCase()}
          </Text>
        )}
      </XStack>

      {/* Pay Range */}
      {payRange && (
        <XStack alignItems="center" gap="$1.5">
          <DollarSign size={14} color="$green10" />
          <Text fontSize="$3" fontWeight="600" color="$green10">
            {payRange}
          </Text>
        </XStack>
      )}

      {/* Footer: Created date if not posted */}
      {!postedDate && createdDate && (
        <XStack alignItems="center" gap="$1.5">
          <Calendar size={12} color="$color9" />
          <Text fontSize="$2" color="$color10">
            Created {createdDate}
          </Text>
        </XStack>
      )}
    </DiscoverCard>
  )
}

function MetricItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <XStack
      gap="$2"
      alignItems="center"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$3"
      paddingHorizontal="$2"
      paddingVertical="$1"
      backgroundColor="$color3"
    >
      {icon}
      <YStack gap={0}>
        <Text fontSize="$1" color="$color10" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="$2" fontWeight="600" color="$color12">
          {value}
        </Text>
      </YStack>
    </XStack>
  )
}
