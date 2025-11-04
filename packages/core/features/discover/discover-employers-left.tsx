import { useState } from 'react'
import { YStack, ScrollView, Text, Spinner } from 'tamagui'
import { EmployerCard, type Employer } from './components/EmployerCard'
import { api } from '@app/core/utils/api'
import type { JSONContent } from '@tiptap/core'
import { extractPlainText } from '@app/ui'

interface DiscoverEmployersLeftProps {
  searchQuery: string
  selectedIndustries: string[]
}

/**
 * Discover Employers Left Component
 * Left panel content for the employers discovery page - displays employer listings
 */
export function DiscoverEmployersLeft({
  searchQuery,
  selectedIndustries,
}: DiscoverEmployersLeftProps) {
  const [_selectedEmployer, _setSelectedEmployer] = useState<Employer | null>(null)

  // Fetch employers from API
  const { data, isLoading } = api.employers.getEmployers.useQuery()
  const employers = data?.employers || []

  // Filter employers based on search and filters
  const filteredEmployers = employers.filter((employer: Employer) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const descriptionText = employer.description
        ? typeof employer.description === 'string'
          ? employer.description
          : extractPlainText(employer.description as JSONContent)
        : ''
      const matchesSearch =
        employer.name.toLowerCase().includes(query) ||
        descriptionText.toLowerCase().includes(query) ||
        employer.industries?.name.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Industry filter
    if (selectedIndustries && selectedIndustries.length > 0) {
      if (!employer.industries || !selectedIndustries.includes(employer.industries.name)) {
        return false
      }
    }

    return true
  })

  const handleViewDetails = (employer: Employer) => {
    _setSelectedEmployer(employer)
    // TODO: Open detail modal or navigate to detail page
    console.log('View employer details:', employer)
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Spinner size="large" color="$blue10" />
        <Text mt="$2" color="$color11">
          Loading employers...
        </Text>
      </YStack>
    )
  }

  if (filteredEmployers.length === 0) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          No employers found
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
          {filteredEmployers.length} {filteredEmployers.length === 1 ? 'Employer' : 'Employers'}
        </Text>

        {filteredEmployers.map((employer: Employer) => (
          <EmployerCard key={employer.id} employer={employer} onViewDetails={handleViewDetails} />
        ))}
      </YStack>
    </ScrollView>
  )
}
