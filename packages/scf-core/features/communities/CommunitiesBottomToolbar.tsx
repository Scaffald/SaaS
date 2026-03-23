import { RotateCcw } from 'lucide-react-native'
import { BottomBar, useSearchSheet, useSortSheet } from '@scaffald/ui'
import type { ToolbarButtonConfig } from '@scaffald/ui'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommunitySortBy = 'most_active' | 'name' | 'newest'

export interface CommunitiesBottomToolbarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  // Sort
  sortBy: CommunitySortBy
  onSortChange: (sort: CommunitySortBy) => void
  // Reset
  hasFilters: boolean
  onReset: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS: Array<{ label: string; value: CommunitySortBy }> = [
  { label: 'Most Active', value: 'most_active' },
  { label: 'Name (A–Z)', value: 'name' },
  { label: 'Newest', value: 'newest' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommunitiesBottomToolbar({
  searchValue,
  onSearchChange,
  sortBy,
  onSortChange,
  hasFilters,
  onReset,
}: CommunitiesBottomToolbarProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { searchButton, SearchSheet } = useSearchSheet({
    placeholder: 'Search communities...',
    value: searchValue,
    onValueChange: onSearchChange,
  })

  const { sortButton, SortSheet } = useSortSheet({
    title: 'Sort Communities',
    options: SORT_OPTIONS,
    value: sortBy,
    onValueChange: onSortChange,
  })

  const buttons: ToolbarButtonConfig[] = [searchButton, sortButton]

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
      <SortSheet />
    </>
  )
}
