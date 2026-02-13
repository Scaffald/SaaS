import { DiscoverCard } from '@scaffald/ui'
import { Briefcase, Building2, DollarSign, MapPin } from 'lucide-react-native'
import { Button, Text, Row, Stack } from '@scaffald/ui'
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
      <Stack gap={4}>
        <Row align="center" gap={8}>
          <Briefcase size="md" color={isSelected ? '$yellow10' : '$color10'} />
          <Text color={isSelected ? '$yellow11' : '$color12'}>{job.title}</Text>
        </Row>
        {job.organization_name && (
          <Row align="center" gap={6} marginLeft={24}>
            <Building2 size="md" color="$gray11" />
            <Text color="$gray11">{job.organization_name}</Text>
          </Row>
        )}
      </Stack>

      {/* Location */}
      {job.location && (
        <Row align="center" gap={6}>
          <MapPin size="md" color={isSelected ? '$yellow10' : '$color10'} />
          <Text color="$gray11">{job.location}</Text>
        </Row>
      )}

      {/* Employment Type and Level */}
      <Row gap={8} flexWrap="wrap">
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
        {job.position_level && (
          <Text
            color="$gray11"
            backgroundColor="$color3"
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
          >
            {job.position_level}
          </Text>
        )}
      </Row>

      {/* Salary Range */}
      {salaryRange && (
        <Row align="center" gap={6}>
          <DollarSign size="md" color={isSelected ? '$yellow10' : '$green10'} />
          <Text color="$green10">{salaryRange}</Text>
        </Row>
      )}

      {/* View Details Button */}
      <Button
        size="xs"
        backgroundColor={isSelected ? '$yellow8' : '$color4'}
        color={isSelected ? '$yellow12' : '$color11'}
        hoverStyle={{
          backgroundColor: isSelected ? '$yellow9' : '$color5',
        }}
        pressStyle={{
          backgroundColor: isSelected ? '$yellow10' : '$color6',
        }}
      >
        View Details
      </Button>
    </DiscoverCard>
  )
}
