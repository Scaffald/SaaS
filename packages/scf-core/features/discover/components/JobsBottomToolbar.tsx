import { RotateCcw } from 'lucide-react-native'
import { BottomBar, useSearchSheet, useFilterSheet, useSortSheet } from '@scaffald/ui'
import type { FilterControl } from '@scaffald/ui'
import type { ToolbarButtonConfig } from '@scaffald/ui'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobSortBy = 'relevance' | 'match_score'
export type JobSource = 'all' | 'internal' | 'external'

export interface JobsBottomToolbarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  // Filter
  selectedJobTypes: string[]
  onJobTypesChange: (types: string[]) => void
  jobSource: JobSource
  onJobSourceChange: (source: JobSource) => void
  minSoftSkillsMatch: number | null
  onMinSoftSkillsMatchChange: (match: number | null) => void
  // Sort
  sortBy: JobSortBy
  onSortChange: (sort: JobSortBy) => void
  // Reset
  hasFilters: boolean
  onReset: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTER_CONTROLS: FilterControl[] = [
  {
    key: 'jobSource',
    type: 'checkbox-group',
    label: 'Job Source',
    options: [
      { label: 'All Jobs', value: 'all' },
      { label: 'Internal Only', value: 'internal' },
      { label: 'External Only', value: 'external' },
    ],
  },
  {
    key: 'jobTypes',
    type: 'checkbox-group',
    label: 'Job Type',
    options: [
      { label: 'Full-Time', value: 'Full-Time' },
      { label: 'Part-Time', value: 'Part-Time' },
      { label: 'Contract', value: 'Contract' },
      { label: 'Temporary', value: 'Temporary' },
    ],
  },
  {
    key: 'softSkillsMatch',
    type: 'range',
    label: 'Min Soft Skills Match',
    min: 0,
    max: 100,
    step: 5,
  },
]

const SORT_OPTIONS: Array<{ label: string; value: JobSortBy }> = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Best Soft Skills Match', value: 'match_score' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobsBottomToolbar({
  searchValue,
  onSearchChange,
  selectedJobTypes,
  onJobTypesChange,
  jobSource,
  onJobSourceChange,
  minSoftSkillsMatch,
  onMinSoftSkillsMatchChange,
  sortBy,
  onSortChange,
  hasFilters,
  onReset,
}: JobsBottomToolbarProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { searchButton, SearchSheet } = useSearchSheet({
    placeholder: 'Search jobs by title, company...',
    value: searchValue,
    onValueChange: onSearchChange,
  })

  const filterValues: Record<string, unknown> = {
    jobSource: [jobSource],
    jobTypes: selectedJobTypes,
    softSkillsMatch: minSoftSkillsMatch ?? 0,
  }

  const { filterButton, FilterSheet } = useFilterSheet({
    controls: FILTER_CONTROLS,
    values: filterValues,
    onValuesChange: (next) => {
      const sources = (next.jobSource as string[]) ?? ['all']
      onJobSourceChange((sources[0] as JobSource) ?? 'all')
      onJobTypesChange((next.jobTypes as string[]) ?? [])
      onMinSoftSkillsMatchChange((next.softSkillsMatch as number) ?? null)
    },
  })

  const { sortButton, SortSheet } = useSortSheet({
    title: 'Sort Jobs',
    options: SORT_OPTIONS,
    value: sortBy,
    onValueChange: onSortChange,
  })

  const buttons: ToolbarButtonConfig[] = [searchButton, filterButton, sortButton]

  if (hasFilters) {
    buttons.push({
      key: 'reset',
      icon: <RotateCcw size={20} color={colors.text[t].secondary} />,
      label: 'Reset',
      variant: 'icon',
      onPress: onReset,
      accessibilityLabel: 'Reset all filters',
    })
  }

  return (
    <>
      <BottomBar level="page">
        <BottomBar.Actions buttons={buttons} />
      </BottomBar>
      <SearchSheet />
      <FilterSheet />
      <SortSheet />
    </>
  )
}
