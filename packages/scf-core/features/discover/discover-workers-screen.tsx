import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ListToolbar,
  RangeSlider,
  Row,
  SegmentedControl,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { FilterPillConfig } from '@scf/core/components/toolbarFilters'
import { useRouter } from 'expo-router'
import type { ResultListRef } from './components/ResultList'
import { WorkerPreviewModal } from './components/WorkerPreviewModal'
import { WorkersBottomToolbar } from './components/WorkersBottomToolbar'
import type { WorkerSortBy } from './components/WorkersBottomToolbar'
import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'
import { useToolbarFilters } from '@scf/core/components/toolbarFilters'

const VIEW_SEGMENTS = ['List', 'Map']

/**
 * The control's segments are `flex: 1` inside an `overflow: hidden` track, so
 * in a toolbar that runs out of room it silently shrinks until the labels are
 * cut off ("List | M…"). Hold its width instead.
 */
const VIEW_SWITCH_STYLE = { flexShrink: 0, minWidth: 132 } as const

/**
 * Discover Workers Screen Component
 *
 * Search/filter/sort state lives here as the single source of truth.
 * Two UIs control the same state:
 *   - Desktop+: ListToolbar — search, one Filters & sort flyout, chips
 *   - Mobile: BottomToolbar with Sheets/ActionSheet (footer)
 */
export function DiscoverWorkersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [sortBy, setSortBy] = useState<WorkerSortBy>('score')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerModalUserId, setWorkerModalUserId] = useState<string | null>(null)

  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()

  const resultListRef = useRef<ResultListRef>(null)

  const handleSelect = (id: string) => {
    setSelectedProfileId(id)
    if (isMobile) {
      router.push(buildPath(ROUTES.WORKERS.DETAIL, { id }))
    } else {
      setWorkerModalUserId(id)
      setWorkerModalOpen(true)
      setTimeout(() => {
        resultListRef.current?.scrollToCard(id)
      }, 100)
    }
  }

  const handleReset = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setMinScore(0)
    setSortBy('score')
  }

  const hasFilters = searchQuery.length > 0 || selectedIndustries.length > 0 || minScore > 0

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
        <RangeSlider value={minScore} onValueChange={setMinScore} min={0} max={100} step={5} />
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
      value:
        selectedIndustries.length > 0
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
  const [resultCount, setResultCount] = useState<number | undefined>(undefined)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const openFilters = useCallback(() => setFiltersOpen(true), [])
  const { filterContent, chips, activeFilterCount } = useToolbarFilters(filterPills, openFilters)

  // List and Map are two views of one search, so the switch belongs in the
  // search row rather than reading as a sibling screen (#834). The drawer
  // entry stays for anyone who navigates that way.
  const viewSwitch = (
    <SegmentedControl
      segments={VIEW_SEGMENTS}
      selectedIndex={0}
      onSelectionChange={(index) => {
        if (index === 1) router.push(ROUTES.WORKERS.MAP.path)
      }}
      style={VIEW_SWITCH_STYLE}
    />
  )

  const header = isMobile ? null : (
    <ListToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search workers, skills, or locations..."
      filterContent={filterContent}
      activeFilterCount={activeFilterCount}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      chips={chips}
      onClearAll={hasFilters ? handleReset : undefined}
      resultCount={resultCount}
      resultNoun="worker"
      actions={viewSwitch}
    />
  )

  return {
    header,
    left: (
      <>
        <DiscoverWorkersLeft
          onResultCount={setResultCount}
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
        <WorkerPreviewModal
          userId={workerModalUserId}
          open={workerModalOpen}
          onOpenChange={setWorkerModalOpen}
        />
      </>
    ),
    right: <DiscoverWorkersRight />,
    footer,
  }
}
