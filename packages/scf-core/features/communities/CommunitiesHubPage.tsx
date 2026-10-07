import { useCallback, useMemo, useState } from 'react'
import { ListToolbar, SegmentedControl, Stack, Tabs, useResponsive, } from '@scaffald/ui'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { FilterPillConfig } from '@scf/core/components/toolbarFilters'
import { AllCommunitiesList } from './components/AllCommunitiesList'
import { MyCommunitiesList } from './components/MyCommunitiesList'
import { useToolbarFilters } from '@scf/core/components/toolbarFilters'

type TabValue = 'all' | 'my'
type CommunitySortBy = 'most_active' | 'name' | 'newest'

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
  const { isMobile } = useResponsive()
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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const openFilters = useCallback(() => setFiltersOpen(true), [])
  const toolbarPills = useMemo<FilterPillConfig[]>(
    () => [
      ...filterPills,
      {
        id: 'sort',
        label: 'Sort',
        value: sortOptions.find((option) => option.value === sortBy)?.label,
        isActive: sortBy !== sortOptions[0]?.value,
        onPress: () => {},
        popoverContent: (
          <SegmentedControl
            segments={sortOptions.map((option) => option.label)}
            selectedIndex={Math.max(
              0,
              sortOptions.findIndex((option) => option.value === sortBy),
            )}
            onSelectionChange={(index) =>
              setSortBy(sortOptions[index]?.value as CommunitySortBy)
            }
          />
        ),
      },
    ],
    [filterPills, sortBy, sortOptions],
  )
  const { filterContent, chips, activeFilterCount } = useToolbarFilters(
    toolbarPills,
    openFilters,
  )

  return (
    <Stack gap={16}>
      {/* No title here: the shared header above already says "Communities" (#1025). */}

      {/* Desktop: the one search row — search, Filters & sort, count right.
          Sort moved into the flyout: it was the last screen keeping a
          separate control beside the search field. */}
      {!isMobile && (
        <ListToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search communities..."
          filterContent={filterContent}
          activeFilterCount={activeFilterCount}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          chips={chips}
          onClearAll={hasFilters ? handleReset : undefined}
          resultCount={resultCount}
          resultNoun="community"
          resultNounPlural="communities"
        />
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
    </Stack>
  )
}
