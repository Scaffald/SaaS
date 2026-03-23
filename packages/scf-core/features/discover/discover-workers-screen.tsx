import { useMemo, useRef, useState } from 'react'
import { Row, Stack, Text, RangeSlider, useThemeContext, useResponsive } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { PageHeader } from '@scf/core/components/PageHeader'
import type { FilterPillConfig } from '@scf/core/components/PageHeader'
import type { ResultListRef } from './components/ResultList'
import { WorkersBottomToolbar } from './components/WorkersBottomToolbar'
import type { WorkerSortBy } from './components/WorkersBottomToolbar'
import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'

/**
 * Discover Workers Screen Component
 *
 * Search/filter/sort state lives here as the single source of truth.
 * Two UIs control the same state:
 *   - Desktop+: PageHeader with search input + filter pills (header)
 *   - Mobile: BottomToolbar with Sheets/ActionSheet (footer)
 */
export function DiscoverWorkersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [sortBy, setSortBy] = useState<WorkerSortBy>('score')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'

  const resultListRef = useRef<ResultListRef>(null)

  const handleSelect = (id: string) => {
    setSelectedProfileId(id)
    setTimeout(() => {
      resultListRef.current?.scrollToCard(id)
    }, 100)
  }

  const handleReset = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setMinScore(0)
    setSortBy('score')
  }

  const hasFilters =
    searchQuery.length > 0 ||
    selectedIndustries.length > 0 ||
    minScore > 0

  // Min Score popover content (for header pill on desktop)
  const scorePopoverContent = useMemo(
    () => (
      <Stack style={{ minWidth: 220, paddingVertical: 4, paddingHorizontal: 4 }} gap={12}>
        <Row justify="space-between" align="center">
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[t].primary }}>
            Min Score
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text[t].primary }}>
            {minScore}
          </Text>
        </Row>
        <RangeSlider
          value={minScore}
          onValueChange={setMinScore}
          min={0}
          max={100}
          step={5}
        />
      </Stack>
    ),
    [minScore, t]
  )

  // Build filter pills for the header bar
  const filterPills = useMemo<FilterPillConfig[]>(() => {
    const pills: FilterPillConfig[] = []

    pills.push({
      id: 'industry',
      label: 'Trade',
      value: selectedIndustries.length > 0
        ? selectedIndustries.length === 1
          ? selectedIndustries[0]
          : `${selectedIndustries.length} selected`
        : undefined,
      isActive: selectedIndustries.length > 0,
      onPress: () => {},
    })

    pills.push({
      id: 'score',
      label: 'Min Score',
      value: minScore > 0 ? `${minScore}+` : undefined,
      isActive: minScore > 0,
      onPress: () => {},
      popoverContent: scorePopoverContent,
    })

    return pills
  }, [selectedIndustries, minScore, scorePopoverContent])

  // Footer — mobile only
  const footer = isMobile ? (
    <WorkersBottomToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      selectedIndustries={selectedIndustries}
      onIndustriesChange={setSelectedIndustries}
      minScore={minScore}
      onMinScoreChange={setMinScore}
      sortBy={sortBy}
      onSortChange={setSortBy}
      hasFilters={hasFilters}
      onReset={handleReset}
    />
  ) : null

  // Header — desktop+ only (mobile uses footer instead)
  const header = isMobile ? null : (
    <PageHeader
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search workers, skills, or locations..."
      searchVariant="pill"
      filterPills={filterPills}
      onReset={hasFilters ? handleReset : undefined}
    />
  )

  return {
    header,
    left: (
      <DiscoverWorkersLeft
        searchQuery={debouncedSearch}
        selectedIndustries={selectedIndustries}
        minScore={minScore}
        selectedSkills={[]}
        selectedCertifications={[]}
        selectedProfileId={selectedProfileId}
        onSelect={handleSelect}
        resultListRef={resultListRef}
        sortBy={sortBy}
      />
    ),
    right: <DiscoverWorkersRight />,
    footer,
  }
}
