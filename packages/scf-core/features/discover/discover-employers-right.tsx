import { ScrollView, Stack } from '@scaffald/ui'
import { AddOrganizationWidget } from './components/AddOrganizationWidget'
import { SearchFilterWidget } from './components/SearchFilterWidget'

interface DiscoverEmployersRightProps {
  searchQuery: string
  industries: string[]
  industryCounts: Record<string, number>
  selectedIndustries: string[]
  onClearSearch: () => void
  onIndustriesChange: (industries: string[]) => void
  onClearFilters: () => void
}

/**
 * Discover Employers Right Component
 * Right panel content for the employers discovery page - displays filters
 */
export function DiscoverEmployersRight({
  searchQuery,
  selectedIndustries,
  onClearSearch,
  onClearFilters,
}: DiscoverEmployersRightProps) {
  const hasActiveFilters = searchQuery.length > 0 || selectedIndustries.length > 0

  const handleClearAll = () => {
    onClearSearch()
    onClearFilters()
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        <SearchFilterWidget
          title="Filters"
          searchQuery={searchQuery}
          onSearchChange={() => {}}
          showSearch={false}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
        <AddOrganizationWidget />
      </Stack>
    </ScrollView>
  )
}
