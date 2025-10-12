import { useState, useMemo } from 'react'
import { YStack, XStack, H2, Button, Text, Spinner } from '@app/ui'
import { useApplications } from './hooks/useApplications'
import type { Applications } from './hooks/useApplications'
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

  // Fetch applications using tRPC
  const { applications, isLoading, isError, error } = useApplications({
    status:
      (filters.status as
        | 'pending'
        | 'reviewing'
        | 'interview'
        | 'offer'
        | 'hired'
        | 'rejected'
        | 'withdrawn'
        | undefined) || undefined,
  })

  // Filter applications by score (client-side for now)
  const filteredApplications = useMemo(() => {
    return applications.filter((app: Applications[number]) => {
      if (app.application_score && app.application_score < filters.minScore) return false
      return true
    })
  }, [applications, filters.minScore])

  // Loading state
  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4" color="$color11">
          Loading applications...
        </Text>
      </YStack>
    )
  }

  // Error state
  if (isError) {
    return (
      <YStack flex={1} items="center" justify="center" bg="$background" p="$4">
        <Text color="$red10" fontSize="$5" fontWeight="bold">
          Error Loading Applications
        </Text>
        <YStack items="center">
          <Text color="$color11" mt="$2">
            {error?.message || 'Failed to load applications. Please try again.'}
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} p="$4" bg="$background">
      {/* Header */}
      <XStack justify="space-between" items="center" mb="$4">
        <YStack>
          <H2>Applications</H2>
          <Text color="$color11" fontSize="$3">
            {filteredApplications.length} total applications
          </Text>
        </YStack>

        <XStack gap="$2">
          <Button
            size="$3"
            onPress={() => setViewMode('kanban')}
            variant={viewMode === 'kanban' ? 'outlined' : undefined}
          >
            Kanban
          </Button>
          <Button
            size="$3"
            onPress={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'outlined' : undefined}
          >
            List
          </Button>
        </XStack>
      </XStack>

      {/* Filters - Note: needs jobs list from API */}
      <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={[]} />

      {/* Content */}
      {viewMode === 'kanban' ? (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      ) : (
        <YStack p="$4">
          <Text>List view coming soon...</Text>
        </YStack>
      )}
    </YStack>
  )
}
