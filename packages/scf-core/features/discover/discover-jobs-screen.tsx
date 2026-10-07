import { useCallback, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import {
  Button,
  ListToolbar,
  RangeSlider,
  Row,
  SegmentedControl,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { useFilterOptions } from '@scf/core/utils/jobs-sdk-hooks'
import { useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { colors } from '@scaffald/ui/tokens'
import { Check } from 'lucide-react-native'
import { useDebounce } from '@scf/core/utils/useDebounce'
import type { FilterPillConfig } from '@scf/core/components/toolbarFilters'
import { useToolbarFilters } from '@scf/core/components/toolbarFilters'
import { JobsBottomToolbar } from './components/JobsBottomToolbar'
import type { JobSortBy, JobSource } from './components/JobsBottomToolbar'
import { DiscoverJobsLeft, type DiscoverJobsInitialData } from './discover-jobs-left'

/** Sort options, as parallel arrays because SegmentedControl works by index. */
const SORT_VALUES = ['relevance', 'match_score'] as const
const SORT_LABELS = ['Relevance', 'Best Match']

const VIEW_VALUES = ['list', 'cards'] as const
const VIEW_LABELS = ['List', 'Cards']

function summarize(selected: string[]): string | undefined {
  if (selected.length === 0) return undefined
  return selected.length === 1 ? selected[0] : `${selected.length} selected`
}

/** A wrap of toggle buttons for a multi-select filter section. */
function ToggleList({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <Row gap={8} wrap>
      {options.map((option) => {
        const on = selected.includes(option)
        return (
          <Button
            key={option}
            size="sm"
            variant="outline"
            color={on ? 'primary' : 'gray'}
            accessibilityState={{ selected: on }}
            onPress={() =>
              onChange(on ? selected.filter((value) => value !== option) : [...selected, option])
            }
          >
            {option}
          </Button>
        )
      })}
    </Row>
  )
}

/**
 * Discover Jobs Screen Component
 *
 * Search/filter/sort state lives here as the single source of truth.
 *   - Desktop+: ListToolbar — search, one Filters & sort flyout, chips
 *   - Mobile: BottomToolbar with Sheets/ActionSheet (footer)
 */
export type DiscoverJobsScreenOptions = {
  /**
   * Rows a route loader fetched on the server, so the listing renders with
   * content on the first paint instead of a skeleton (#774). Only the public
   * `/jobs` route has a loader; everywhere else this is undefined and the
   * screen fetches as it always did.
   */
  initialJobs?: DiscoverJobsInitialData
}

export function DiscoverJobsScreen({ initialJobs }: DiscoverJobsScreenOptions = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])
  const [jobSource, setJobSource] = useState<JobSource>('all')
  const [minSoftSkillsMatch, setMinSoftSkillsMatch] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<JobSortBy>('relevance')

  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [view, setView] = useState<'list' | 'cards'>('list')

  const { data: filterData } = useFilterOptions()
  const industries: string[] = filterData?.industries ?? []
  const jobTypes: string[] = filterData?.jobTypes ?? []
  // Per-user, so an anonymous visitor on the public /jobs listing would get a
  // guaranteed 401; the filter it unlocks is meaningless without a session.
  const { session } = useSessionContext()
  const { data: softSkillsData } = useSoftSkills(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: !!session?.access_token,
  })
  const hasSoftSkillsAssessment = (softSkillsData?.skills.length ?? 0) > 0

  const handleReset = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setSelectedJobTypes([])
    setJobSource('all')
    setMinSoftSkillsMatch(null)
    setSortBy('relevance')
  }

  const hasFilters =
    searchQuery.length > 0 ||
    selectedIndustries.length > 0 ||
    selectedJobTypes.length > 0 ||
    jobSource !== 'all' ||
    (minSoftSkillsMatch !== null && minSoftSkillsMatch > 0) ||
    sortBy !== 'relevance'

  // Source pill popover content (desktop)
  const SOURCE_OPTIONS: { value: JobSource; label: string }[] = [
    { value: 'all', label: 'All Jobs' },
    { value: 'internal', label: 'Internal Jobs (Scaffald)' },
    { value: 'external', label: 'External Jobs' },
  ]

  const sourcePopoverContent = useMemo(
    () => (
      <Stack gap={4} style={{ minWidth: 200, padding: 8 }}>
        <Text
          style={{
            fontSize: 13,
            color: colors.text[t].secondary,
            paddingHorizontal: 8,
            paddingBottom: 4,
          }}
        >
          Job Source
        </Text>
        {SOURCE_OPTIONS.map((option) => {
          const isSelected = option.value === jobSource
          return (
            <Pressable
              key={option.value}
              onPress={() => setJobSource(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 4,
                backgroundColor: isSelected ? colors.bg[t].muted : 'transparent',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{ color: isSelected ? colors.text[t].primary : colors.text[t].secondary }}
              >
                {option.label}
              </Text>
              {isSelected ? <Check size={16} color={colors.fg[t].active} /> : null}
            </Pressable>
          )
        })}
      </Stack>
    ),
    [jobSource, t, SOURCE_OPTIONS.map]
  )

  // Filter pills for desktop header
  const filterPills = useMemo<FilterPillConfig[]>(() => {
    const pills: FilterPillConfig[] = []

    pills.push({
      id: 'source',
      label: 'Source',
      value: jobSource !== 'all' ? (jobSource === 'internal' ? 'Internal' : 'External') : undefined,
      isActive: jobSource !== 'all',
      onPress: () => {},
      popoverContent: sourcePopoverContent,
    })

    // Industry, job type and the soft-skills threshold lived in a right-hand
    // rail of their own: a second "Filters" panel beside the toolbar's
    // "Filters & sort", so the screen had two places to filter (#1035).
    // They are sections of the one flyout now; the rail is gone.
    if (industries.length > 0) {
      pills.push({
        id: 'industry',
        label: 'Industry',
        value: summarize(selectedIndustries),
        isActive: selectedIndustries.length > 0,
        onPress: () => {},
        popoverContent: (
          <ToggleList
            options={industries}
            selected={selectedIndustries}
            onChange={setSelectedIndustries}
          />
        ),
      })
    }

    if (jobTypes.length > 0) {
      pills.push({
        id: 'jobType',
        label: 'Job type',
        value: summarize(selectedJobTypes),
        isActive: selectedJobTypes.length > 0,
        onPress: () => {},
        popoverContent: (
          <ToggleList options={jobTypes} selected={selectedJobTypes} onChange={setSelectedJobTypes} />
        ),
      })
    }

    // Only meaningful with an assessment on file, and only for Scaffald jobs.
    if (hasSoftSkillsAssessment && jobSource !== 'external') {
      pills.push({
        id: 'softSkills',
        label: 'Soft-skills match',
        value: minSoftSkillsMatch ? `${minSoftSkillsMatch}%+` : undefined,
        isActive: minSoftSkillsMatch !== null && minSoftSkillsMatch > 0,
        onPress: () => setMinSoftSkillsMatch(null),
        popoverContent: (
          <Stack gap={8}>
            <Text style={{ color: colors.text[t].secondary }}>
              Only jobs whose soft-skills match is at least this score.
            </Text>
            <RangeSlider
              value={minSoftSkillsMatch ?? 0}
              onValueChange={(value: number) => setMinSoftSkillsMatch(value > 0 ? value : null)}
              min={0}
              max={100}
              step={5}
            />
          </Stack>
        ),
      })
    }

    return pills
  }, [
    jobSource,
    selectedJobTypes,
    selectedIndustries,
    industries,
    jobTypes,
    hasSoftSkillsAssessment,
    minSoftSkillsMatch,
    sourcePopoverContent,
    t,
  ])

  // Header — desktop+ only.
  //
  // One row: search, one Filters & sort flyout, the active filters as chips,
  // the result count at the right. Sort lives inside the flyout rather than
  // beside it — the audit's "the search row has three grammars" finding was
  // about exactly this kind of per-screen extra.
  const [resultCount, setResultCount] = useState<number | undefined>(undefined)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const openFilters = useCallback(() => setFiltersOpen(true), [])
  const sortPill: FilterPillConfig | null =
    jobSource !== 'external'
      ? {
          id: 'sort',
          label: 'Sort',
          value: sortBy === 'match_score' ? 'Best Match' : 'Relevance',
          isActive: sortBy !== 'relevance',
          onPress: () => {},
          popoverContent: (
            <SegmentedControl
              segments={SORT_LABELS}
              selectedIndex={SORT_VALUES.indexOf(sortBy)}
              onSelectionChange={(index) => setSortBy(SORT_VALUES[index] as JobSortBy)}
            />
          ),
        }
      : null
  const toolbarPills = useMemo(
    () => (sortPill ? [...filterPills, sortPill] : filterPills),
    [filterPills, sortPill],
  )
  const { filterContent, chips, activeFilterCount } = useToolbarFilters(
    toolbarPills,
    openFilters,
  )

  const header = isMobile ? null : (
    <ListToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search jobs by title, company..."
      filterContent={filterContent}
      activeFilterCount={activeFilterCount}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      chips={chips}
      onClearAll={hasFilters ? handleReset : undefined}
      resultCount={resultCount}
      resultNoun="job"
      actions={
        <SegmentedControl
          segments={VIEW_LABELS}
          selectedIndex={VIEW_VALUES.indexOf(view)}
          onSelectionChange={(index) => setView(VIEW_VALUES[index] ?? 'list')}
          // The toolbar's action cell is sized by the row; without a floor
          // the second segment truncated to "Ca…".
          style={{ minWidth: 150 }}
        />
      }
    />
  )

  // Footer — mobile only
  const footer = isMobile ? (
    <JobsBottomToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      selectedJobTypes={selectedJobTypes}
      onJobTypesChange={setSelectedJobTypes}
      jobSource={jobSource}
      onJobSourceChange={setJobSource}
      minSoftSkillsMatch={minSoftSkillsMatch}
      onMinSoftSkillsMatchChange={setMinSoftSkillsMatch}
      sortBy={sortBy}
      onSortChange={setSortBy}
      hasFilters={hasFilters}
      onReset={handleReset}
    />
  ) : null

  return {
    header,
    left: (
      <DiscoverJobsLeft
          onResultCount={setResultCount}
        view={isMobile ? 'list' : view}
        initialJobs={initialJobs}
        searchQuery={debouncedSearch}
        selectedIndustries={selectedIndustries}
        selectedJobTypes={selectedJobTypes}
        jobSource={jobSource}
        minSoftSkillsMatch={minSoftSkillsMatch}
        sortBy={sortBy}
      />
    ),
    // No rail: its filters are sections of the toolbar flyout (#1035).
    right: null,
    footer,
  }
}
