import { useState, useMemo } from 'react'
import { YStack, XStack, H2, Button, Text } from '@app/ui'
import { mockApplications, mockJobs } from '../mock-data/ats-mock-data'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import type { ApplicationStatus } from '../mock-data/ats-mock-data'

export const OfficeApplicationsScreen = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState<{
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }>({
    jobId: null,
    status: null,
    minScore: 0,
  })

  // Filter mock data based on filters
  const filteredApplications = useMemo(() => {
    return mockApplications.filter((app) => {
      if (filters.jobId && app.job.id !== filters.jobId) return false
      if (filters.status && app.status !== filters.status) return false
      if (app.score < filters.minScore) return false
      return true
    })
  }, [filters])

  return (
    <YStack flex={1} padding="$4" backgroundColor="$background">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
        <YStack>
          <H2>Applications</H2>
          <Text color="$gray11" fontSize="$3">
            {filteredApplications.length} total applications
          </Text>
        </YStack>

        <XStack gap="$2">
          <Button
            size="$3"
            variant={viewMode === 'kanban' ? 'outlined' : 'ghost'}
            onPress={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            size="$3"
            variant={viewMode === 'list' ? 'outlined' : 'ghost'}
            onPress={() => setViewMode('list')}
          >
            List
          </Button>
        </XStack>
      </XStack>

      {/* Filters */}
      <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={mockJobs} />

      {/* Content */}
      {viewMode === 'kanban' ? (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      ) : (
        <YStack padding="$4">
          <Text>List view coming soon...</Text>
        </YStack>
      )}
    </YStack>
  )
}
