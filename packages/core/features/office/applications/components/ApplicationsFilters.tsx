import { XStack, YStack, Text, Button } from '@app/ui'
import { Select } from 'tamagui'
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
      <YStack minWidth={200}>
        <Text fontSize="$2" mb="$2" opacity={0.7}>
          Filter by Job
        </Text>
        <Select
          value={filters.jobId || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              jobId: value === 'all' ? null : value,
            })
          }}
        >
          <Select.Trigger width={200}>
            <Select.Value placeholder="All Jobs" />
          </Select.Trigger>

          <Select.Content>
            <Select.Viewport>
              <Select.Item value="all">
                <Select.ItemText>All Jobs</Select.ItemText>
              </Select.Item>
              {jobs.map((job) => (
                <Select.Item key={job.id} value={job.id}>
                  <Select.ItemText>{job.title}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
      </YStack>

      {/* Status Filter */}
      <YStack minWidth={200}>
        <Text fontSize="$2" mb="$2" opacity={0.7}>
          Filter by Status
        </Text>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              status: value === 'all' ? null : (value as ApplicationStatus),
            })
          }}
        >
          <Select.Trigger width={200}>
            <Select.Value placeholder="All Statuses" />
          </Select.Trigger>

          <Select.Content>
            <Select.Viewport>
              <Select.Item value="all">
                <Select.ItemText>All Statuses</Select.ItemText>
              </Select.Item>
              <Select.Item value="new">
                <Select.ItemText>New</Select.ItemText>
              </Select.Item>
              <Select.Item value="screen">
                <Select.ItemText>Screening</Select.ItemText>
              </Select.Item>
              <Select.Item value="interview">
                <Select.ItemText>Interview</Select.ItemText>
              </Select.Item>
              <Select.Item value="offer">
                <Select.ItemText>Offer</Select.ItemText>
              </Select.Item>
              <Select.Item value="hired">
                <Select.ItemText>Hired</Select.ItemText>
              </Select.Item>
              <Select.Item value="rejected">
                <Select.ItemText>Rejected</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select>
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
