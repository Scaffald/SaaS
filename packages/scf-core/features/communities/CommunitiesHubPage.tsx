import { useState, useCallback } from 'react'
import { Tabs, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { PageHeader } from '@scf/core/components/PageHeader'
import { SortDropdown } from '@scf/core/features/discover/components/SortDropdown'
import { AllCommunitiesList } from './components/AllCommunitiesList'
import { MyCommunitiesList } from './components/MyCommunitiesList'

type TabValue = 'all' | 'my'
type SortValue = 'most_active' | 'name' | 'newest'

const sortOptions = [
  { value: 'most_active', label: 'Most Active' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest' },
]

export function CommunitiesHubPage() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortValue>('most_active')
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

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text>Communities</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Join trade communities to share work, get feedback, and build your reputation.
        </Text>
      </Stack>

      <PageHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search communities..."
        resultCount={resultCount}
        resultLabel={resultCount === 1 ? 'Community' : 'Communities'}
        onReset={hasFilters ? handleReset : undefined}
      >
        <SortDropdown
          value={sortBy}
          onChange={(v) => setSortBy(v as SortValue)}
          options={sortOptions}
        />
      </PageHeader>

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
