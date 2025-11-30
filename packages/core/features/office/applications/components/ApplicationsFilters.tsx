import { Button, ResponsiveSelect, Text, XStack, YStack } from '@scaffald/neue-ui'
import type { ApplicationStatus } from '../../mock-data/ats-mock-data'

interface ApplicationsFiltersProps {
  filters: {
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }
  onFiltersChange: (filters: {
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }) => void
  jobs: Array<{
    id: string
    title: string
    company: string
  }>
}

export const ApplicationsFilters = ({
  filters,
  onFiltersChange,
  jobs,
}: ApplicationsFiltersProps) => {
  return (
    <XStack gap="$3" py="$3" px="$4" bg="$color2" rounded="$4" mb="$4" flexWrap="wrap">
      {/* Job Filter */}
      <YStack width={200}>
        <Text fontSize="$2" mb="$2" opacity={0.7}>
          Filter by Job
        </Text>
        <ResponsiveSelect
          value={filters.jobId || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              jobId: value === 'all' ? null : value,
            })
          }}
          placeholder="All Jobs"
          options={[
            { value: 'all', label: 'All Jobs' },
            ...jobs.map((job) => ({
              value: job.id,
              label: job.title,
            })),
          ]}
          triggerProps={{ width: 200 }}
        />
      </YStack>

      {/* Status Filter */}
      <YStack width={200}>
        <Text fontSize="$2" mb="$2" opacity={0.7}>
          Filter by Status
        </Text>
        <ResponsiveSelect
          value={filters.status || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              status: value === 'all' ? null : (value as ApplicationStatus),
            })
          }}
          placeholder="All Statuses"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'new', label: 'New' },
            { value: 'screen', label: 'Screening' },
            { value: 'interview', label: 'Interview' },
            { value: 'offer', label: 'Offer' },
            { value: 'hired', label: 'Hired' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          triggerProps={{ width: 200 }}
        />
      </YStack>

      {/* Clear Filters */}
      {(filters.jobId || filters.status || filters.minScore > 0) && (
        <YStack justify="flex-end">
          <Button
            size="$3"
            chromeless
            onPress={() => {
              onFiltersChange({
                jobId: null,
                status: null,
                minScore: 0,
              })
            }}
          >
            Clear Filters
          </Button>
        </YStack>
      )}
    </XStack>
  )
}
