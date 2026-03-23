import { RotateCcw } from 'lucide-react-native'
import { BottomBar, useSearchSheet, useFilterSheet } from '@scaffald/ui'
import type { FilterControl } from '@scaffald/ui'
import type { ToolbarButtonConfig } from '@scaffald/ui'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmployersBottomToolbarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  // Filter
  selectedIndustries: string[]
  onIndustriesChange: (industries: string[]) => void
  /** Available industry options (dynamic from API data) */
  availableIndustries: string[]
  // Reset
  hasFilters: boolean
  onReset: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployersBottomToolbar({
  searchValue,
  onSearchChange,
  selectedIndustries,
  onIndustriesChange,
  availableIndustries,
  hasFilters,
  onReset,
}: EmployersBottomToolbarProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const { searchButton, SearchSheet } = useSearchSheet({
    placeholder: 'Search employers...',
    value: searchValue,
    onValueChange: onSearchChange,
  })

  // Build filter controls dynamically from available industries
  const filterControls: FilterControl[] = [
    {
      key: 'industries',
      type: 'checkbox-group',
      label: 'Industry',
      options: availableIndustries.map((ind) => ({ label: ind, value: ind })),
    },
  ]

  const filterValues: Record<string, unknown> = {
    industries: selectedIndustries,
  }

  const { filterButton, FilterSheet } = useFilterSheet({
    controls: filterControls,
    values: filterValues,
    onValuesChange: (next) => {
      onIndustriesChange((next.industries as string[]) ?? [])
    },
  })

  const buttons: ToolbarButtonConfig[] = [searchButton, filterButton]

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
    </>
  )
}
