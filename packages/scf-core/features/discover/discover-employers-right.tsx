import { ScrollView, Stack } from '@unicornlove/beyond-ui'
import { AddOrganizationWidget } from './components/AddOrganizationWidget'
import { SearchFilterWidget } from './components/SearchFilterWidget'

interface DiscoverEmployersRightProps {
  searchQuery: string
  industries: string[]
  industryCounts: Record<string, number>
  selectedIndustries: string[]
  onSearchChange: (query: string) => void
  onIndustriesChange: (industries: string[]) => void
  onClearFilters: () => void
}

/**
 * Discover Employers Right Component
 * Right panel content for the employers discovery page - displays search and filters
 */
export function DiscoverEmployersRight({
  searchQuery,
  selectedIndustries,
  onSearchChange,
  onClearFilters,
}: DiscoverEmployersRightProps) {
  const hasActiveFilters = searchQuery.length > 0 || selectedIndustries.length > 0

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        <SearchFilterWidget
          title="Search & Filter"
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchLabel="Find employers that match your interests"
          searchPlaceholder="Search employers..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
        />
        <AddOrganizationWidget />
      </Stack>
    </ScrollView>
  )
}
