import { DiscoverCard } from '@scaffald/tamagui-ui'
import { Briefcase, Building2, DollarSign, MapPin } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import type { JobMapPin } from '../hooks/useJobs'

type JobCardProps = {
  job: JobMapPin
  isSelected?: boolean
  onPress?: () => void
}

/**
 * Job Card Component for Map Results
 * Displays job information in the results rail
 */
export const JobCard = ({ job, isSelected = false, onPress }: JobCardProps) => {
  // Format salary range
  const formatSalary = (minCents?: number, maxCents?: number, type?: string) => {
    if (!minCents || !maxCents) return null

    const min = (minCents / 100).toLocaleString()
    const max = (maxCents / 100).toLocaleString()
    const typeLabel = type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''

    return `$${min} - $${max}${typeLabel}`
  }

  const salaryRange = formatSalary(
    job.pay_range_min_cents,
    job.pay_range_max_cents,
    job.pay_range_type
  )

  return (
    <DiscoverCard variant="warning" isSelected={isSelected} onPress={onPress}>
      {/* Job Title and Organization */}
      <YStack gap="$1">
        <XStack items="center" gap="$2">
          <Briefcase size={16} color={isSelected ? '$yellow10' : '$color10'} />
          <Text
            fontSize="$4"
            fontWeight="600"
            color={isSelected ? '$yellow11' : '$color12'}
            numberOfLines={2}
          >
            {job.title}
          </Text>
        </XStack>
        {job.organization_name && (
          <XStack items="center" gap="$1.5" ml="$6">
            <Building2 size={14} color="$color10" />
            <Text fontSize="$3" color="$color11" numberOfLines={1}>
              {job.organization_name}
            </Text>
          </XStack>
        )}
      </YStack>

      {/* Location */}
      {job.location && (
        <XStack items="center" gap="$1.5">
          <MapPin size={14} color={isSelected ? '$yellow10' : '$color10'} />
          <Text fontSize="$3" color="$color11" numberOfLines={1}>
            {job.location}
          </Text>
        </XStack>
      )}

      {/* Employment Type and Level */}
      <XStack gap="$2" flexWrap="wrap">
        {job.employment_type && (
          <Text fontSize="$2" color="$color10" bg="$color3" px="$2" py="$1" rounded="$2">
            {job.employment_type.replace('_', ' ').toUpperCase()}
          </Text>
        )}
        {job.remote_option && (
          <Text fontSize="$2" color="$color10" bg="$color3" px="$2" py="$1" rounded="$2">
            {job.remote_option.replace('_', ' ').toUpperCase()}
          </Text>
        )}
        {job.position_level && (
          <Text fontSize="$2" color="$color10" bg="$color3" px="$2" py="$1" rounded="$2">
            {job.position_level}
          </Text>
        )}
      </XStack>

      {/* Salary Range */}
      {salaryRange && (
        <XStack items="center" gap="$1.5">
          <DollarSign size={14} color={isSelected ? '$yellow10' : '$green10'} />
          <Text fontSize="$3" fontWeight="600" color="$green10">
            {salaryRange}
          </Text>
        </XStack>
      )}

      {/* View Details Button */}
      <Button
        size="$2"
        bg={isSelected ? '$yellow8' : '$color4'}
        color={isSelected ? '$yellow12' : '$color11'}
        hoverStyle={{
          bg: isSelected ? '$yellow9' : '$color5',
        }}
        pressStyle={{
          bg: isSelected ? '$yellow10' : '$color6',
        }}
      >
        View Details
      </Button>
    </DiscoverCard>
  )
}
