import { useState } from 'react'
import { YStack, Text, Input, Button, Separator, XStack, ScrollView, Spinner } from 'tamagui'
import { Search, Filter, X } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'

interface DiscoverJobsRightProps {
  onSearchChange: (search: string) => void
  onIndustriesChange: (industries: string[]) => void
  onJobTypesChange: (types: string[]) => void
}

/**
 * Discover Jobs Right Component
 * Right panel content for the jobs discovery page - filters and search
 */
export function DiscoverJobsRight({
  onSearchChange,
  onIndustriesChange,
  onJobTypesChange,
}: DiscoverJobsRightProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])

  // Fetch filter options from API
  const { data: filterData, isLoading: filtersLoading } = api.jobs.getFilterOptions.useQuery()
  const INDUSTRIES = filterData?.industries || []
  const JOB_TYPES = filterData?.jobTypes || []

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  const toggleIndustry = (industry: string) => {
    const newSelection = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry]

    setSelectedIndustries(newSelection)
    onIndustriesChange(newSelection)
  }

  const toggleJobType = (type: string) => {
    const newSelection = selectedJobTypes.includes(type)
      ? selectedJobTypes.filter((t) => t !== type)
      : [...selectedJobTypes, type]

    setSelectedJobTypes(newSelection)
    onJobTypesChange(newSelection)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setSelectedJobTypes([])
    onSearchChange('')
    onIndustriesChange([])
    onJobTypesChange([])
  }

  const hasActiveFilters =
    searchQuery || selectedIndustries.length > 0 || selectedJobTypes.length > 0

  if (filtersLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Spinner size="large" color="$blue10" />
        <Text mt="$2" color="$color11">
          Loading filters...
        </Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        {/* Search */}
        <DashboardWidget>
          <YStack gap="$3">
            <XStack items="center" justify="space-between">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Search Jobs
              </Text>
              <Search size={20} color="$color10" />
            </XStack>

            <Input
              placeholder="Search by title, company..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              size="$4"
            />
          </YStack>
        </DashboardWidget>

        {/* Filters Header */}
        <DashboardWidget>
          <XStack items="center" justify="space-between">
            <XStack items="center" gap="$2">
              <Filter size={20} color="$color10" />
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Filters
              </Text>
            </XStack>

            {hasActiveFilters && (
              <Button size="$2" variant="outlined" onPress={clearAllFilters} icon={X}>
                Clear
              </Button>
            )}
          </XStack>
        </DashboardWidget>

        {/* Industry Filter */}
        {INDUSTRIES.length > 0 && (
          <DashboardWidget>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Industry ({INDUSTRIES.length})
              </Text>

              <YStack gap="$2">
                {INDUSTRIES.map((industry: string) => {
                  const isSelected = selectedIndustries.includes(industry)
                  return (
                    <Button
                      key={industry}
                      size="$3"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => toggleIndustry(industry)}
                    >
                      {industry}
                    </Button>
                  )
                })}
              </YStack>
            </YStack>
          </DashboardWidget>
        )}

        {/* Job Type Filter */}
        {JOB_TYPES.length > 0 && (
          <DashboardWidget>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Job Type ({JOB_TYPES.length})
              </Text>

              <YStack gap="$2">
                {JOB_TYPES.map((type: string) => {
                  const isSelected = selectedJobTypes.includes(type)
                  return (
                    <Button
                      key={type}
                      size="$3"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => toggleJobType(type)}
                    >
                      {type}
                    </Button>
                  )
                })}
              </YStack>
            </YStack>
          </DashboardWidget>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <DashboardWidget>
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Active Filters
              </Text>

              {searchQuery && (
                <XStack items="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Search:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    "{searchQuery}"
                  </Text>
                </XStack>
              )}

              {selectedIndustries.length > 0 && (
                <XStack items="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Industries:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {selectedIndustries.length}
                  </Text>
                </XStack>
              )}

              {selectedJobTypes.length > 0 && (
                <XStack items="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Job Types:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {selectedJobTypes.length}
                  </Text>
                </XStack>
              )}
            </YStack>
          </DashboardWidget>
        )}
      </YStack>
    </ScrollView>
  )
}
