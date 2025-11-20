import { Button, Text, XStack, YStack } from '@app/ui'
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
      <YStack width={200}>
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
              <Select.Item index={0} value="all">
                <Select.ItemText>All Jobs</Select.ItemText>
              </Select.Item>
              {jobs.map((job, idx) => (
                <Select.Item key={job.id} index={idx + 1} value={job.id}>
                  <Select.ItemText>{job.title}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
      </YStack>

      {/* Status Filter */}
      <YStack width={200}>
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
              <Select.Item index={0} value="all">
                <Select.ItemText>All Statuses</Select.ItemText>
              </Select.Item>
              <Select.Item index={1} value="new">
                <Select.ItemText>New</Select.ItemText>
              </Select.Item>
              <Select.Item index={2} value="screen">
                <Select.ItemText>Screening</Select.ItemText>
              </Select.Item>
              <Select.Item index={3} value="interview">
                <Select.ItemText>Interview</Select.ItemText>
              </Select.Item>
              <Select.Item index={4} value="offer">
                <Select.ItemText>Offer</Select.ItemText>
              </Select.Item>
              <Select.Item index={5} value="hired">
                <Select.ItemText>Hired</Select.ItemText>
              </Select.Item>
              <Select.Item index={6} value="rejected">
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
