import { RotateCcw } from 'lucide-react-native'
import { BottomBar, useSearchSheet, useFilterSheet, useSortSheet } from '@scaffald/ui'
import type { FilterControl } from '@scaffald/ui'
import type { ToolbarButtonConfig } from '@scaffald/ui'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkerSortBy = 'score' | 'experience' | 'name'

export interface WorkersBottomToolbarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  // Filter
  selectedIndustries: string[]
  onIndustriesChange: (industries: string[]) => void
  minScore: number
  onMinScoreChange: (score: number) => void
  // Sort
  sortBy: WorkerSortBy
  onSortChange: (sort: WorkerSortBy) => void
  // Reset
  hasFilters: boolean
  onReset: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTER_CONTROLS: FilterControl[] = [
  {
    key: 'trade',
    type: 'checkbox-group',
    label: 'Trade',
    options: [
      { label: 'Structural Mason', value: 'Structural Mason' },
      { label: 'LEED Specialist', value: 'LEED Specialist' },
      { label: 'Master Electrician', value: 'Master Electrician' },
      { label: 'Safety Lead', value: 'Safety Lead' },
      { label: 'General Foreman', value: 'General Foreman' },
      { label: 'Project Manager', value: 'Project Manager' },
    ],
  },
  {
    key: 'minScore',
    type: 'range',
    label: 'Min Score',
    min: 0,
    max: 100,
    step: 5,
  },
]

const SORT_OPTIONS: Array<{ label: string; value: WorkerSortBy }> = [
  { label: 'By Score (Highest First)', value: 'score' },
  { label: 'By Experience', value: 'experience' },
  { label: 'By Name (A–Z)', value: 'name' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkersBottomToolbar({
  searchValue,
  onSearchChange,
  selectedIndustries,
  onIndustriesChange,
  minScore,
  onMinScoreChange,
  sortBy,
  onSortChange,
  hasFilters,
  onReset,
}: WorkersBottomToolbarProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Search hook
  const { searchButton, SearchSheet } = useSearchSheet({
    placeholder: 'Search workers, skills, or locations...',
    value: searchValue,
    onValueChange: onSearchChange,
  })

  // Filter hook — bridge external state
  const filterValues: Record<string, unknown> = {
    trade: selectedIndustries,
    minScore,
  }

  const { filterButton, FilterSheet } = useFilterSheet({
    controls: FILTER_CONTROLS,
    values: filterValues,
    onValuesChange: (next) => {
      onIndustriesChange((next.trade as string[]) ?? [])
      onMinScoreChange((next.minScore as number) ?? 0)
    },
  })

  // Sort hook
  const { sortButton, SortSheet } = useSortSheet({
    title: 'Sort Workers',
    options: SORT_OPTIONS,
    value: sortBy,
    onValueChange: onSortChange,
  })

  // Build buttons array
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
