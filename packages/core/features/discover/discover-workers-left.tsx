import { useState } from 'react'
import { YStack, ScrollView, Text, Spinner } from 'tamagui'
import { WorkerCard, type Worker } from './components/WorkerCard'
import { api } from '@app/core/utils/api'

interface DiscoverWorkersLeftProps {
  searchQuery: string
  selectedIndustries: string[]
}

/**
 * Discover Workers Left Component
 * Left panel content for the workers discovery page - displays worker listings
 */
export function DiscoverWorkersLeft({
  searchQuery,
  selectedIndustries: _selectedIndustries,
}: DiscoverWorkersLeftProps) {
  // Fetch workers from API
  const { data, isLoading } = api.workers.getWorkers.useQuery()
  const workers = data?.workers || []

  // Filter workers based on search and filters
  const filteredWorkers = workers.filter((worker: Worker) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const displayName =
        worker.name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim()
      const matchesSearch =
        displayName.toLowerCase().includes(query) || worker.about?.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Note: Industry and skill filtering would require additional data from the API
    // For now, we'll skip these filters in the list view

    return true
  })

  const handleViewDetails = (worker: Worker) => {
    // TODO: Open detail modal or navigate to detail page
    console.log('View worker details:', worker)
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Spinner size="large" color="$blue10" />
        <Text mt="$2" color="$color11">
          Loading workers...
        </Text>
      </YStack>
    )
  }

  if (filteredWorkers.length === 0) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          No workers found
        </Text>
        <Text fontSize="$4" color="$color11">
          Try adjusting your filters or search query
        </Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$3" p="$4">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {filteredWorkers.length} {filteredWorkers.length === 1 ? 'Worker' : 'Workers'}
        </Text>

        {filteredWorkers.map((worker: Worker) => (
          <WorkerCard key={worker.id} worker={worker} onViewDetails={handleViewDetails} />
        ))}
      </YStack>
    </ScrollView>
  )
}
