import { Button, ResponsiveSelect, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import type { ApplicationStatus } from '../types'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  return (
    <Row
      gap={12}
      paddingVertical={12}
      paddingHorizontal={16}
      style={{ backgroundColor: colors.bg[theme].subtle }}
      borderRadius={16}
      marginBottom={16}
      wrap
    >
      {/* Job Filter */}
      <Stack width={200}>
        <Text style={{ marginBottom: 8, opacity: 0.7 }}>
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
        />
      </Stack>

      {/* Status Filter */}
      <Stack width={200}>
        <Text style={{ marginBottom: 8, opacity: 0.7 }}>
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
        />
      </Stack>

      {/* Clear Filters */}
      {(filters.jobId || filters.status || filters.minScore > 0) && (
        <Stack justify="flex-end">
          <Button
            size="sm"
            variant="outline"
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
        </Stack>
      )}
    </Row>
  )
}
