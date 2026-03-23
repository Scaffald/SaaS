import { useState, useCallback } from 'react'
import { Tabs, Text, Stack, useThemeContext, useResponsive } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { PageHeader } from '@scf/core/components/PageHeader'
import type { FilterPillConfig } from '@scf/core/components/PageHeader'
import { SortDropdown } from '@scf/core/features/discover/components/SortDropdown'
import { CommunitiesBottomToolbar } from './CommunitiesBottomToolbar'
import type { CommunitySortBy } from './CommunitiesBottomToolbar'
import { AllCommunitiesList } from './components/AllCommunitiesList'
import { MyCommunitiesList } from './components/MyCommunitiesList'

type TabValue = 'all' | 'my'

const sortOptions = [
  { value: 'most_active', label: 'Most Active' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest' },
]

const SORT_LABEL_MAP: Record<CommunitySortBy, string> = {
  most_active: 'Most Active',
  name: 'Name (A–Z)',
  newest: 'Newest',
}

export function CommunitiesHubPage() {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<CommunitySortBy>('most_active')
  const [resultCount, setResultCount] = useState<number | undefined>(undefined)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const hasFilters = searchQuery.length > 0 || sortBy !== 'most_active'

  const handleReset = () => {
    setSearchQuery('')
    setSortBy('most_active')
  }

  const handleFilteredCountChange = useCallback((count: number) => {
    setResultCount(count)
  }, [])

  // Filter pills for desktop header
  const filterPills: FilterPillConfig[] = []
  if (sortBy !== 'most_active') {
    filterPills.push({
      id: 'sort',
      label: 'Sort',
      value: SORT_LABEL_MAP[sortBy],
      isActive: true,
      onPress: () => {},
    })
  }

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text>Communities</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Join trade communities to share work, get feedback, and build your reputation.
        </Text>
      </Stack>

      {/* Desktop: header with search + sort pill */}
      {!isMobile && (
        <PageHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search communities..."
          searchVariant="pill"
          filterPills={filterPills}
          resultCount={resultCount}
          resultLabel={resultCount === 1 ? 'Community' : 'Communities'}
          onReset={hasFilters ? handleReset : undefined}
        >
          <SortDropdown
            value={sortBy}
            onChange={(v) => setSortBy(v as CommunitySortBy)}
            options={sortOptions}
          />
        </PageHeader>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        type="line"
      >
        <Tabs.Item value="all">
          <Tabs.Trigger>All Communities</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <AllCommunitiesList
                searchQuery={debouncedSearch}
                sortBy={sortBy}
                onFilteredCountChange={activeTab === 'all' ? handleFilteredCountChange : undefined}
              />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="my">
          <Tabs.Trigger>My Communities</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <MyCommunitiesList
                searchQuery={debouncedSearch}
                sortBy={sortBy}
                onFilteredCountChange={activeTab === 'my' ? handleFilteredCountChange : undefined}
              />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>

      {/* Mobile: bottom toolbar for search + sort */}
      {isMobile && (
        <CommunitiesBottomToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasFilters={hasFilters}
          onReset={handleReset}
        />
      )}
    </Stack>
  )
}
