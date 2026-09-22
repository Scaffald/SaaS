/**
 * Turns the discover screens' filter-pill arrays into `ListToolbar`'s flyout.
 *
 * The prototype's audit called out two competing filter idioms: a search
 * field with one "Filters & sort · n" flyout on some screens, and a loose row
 * of inline pills on others, so a user who learned one screen could not
 * predict the next. We had exactly that split — `/office/applications` moved
 * onto the flyout in #624 while the discover screens kept `PageHeader`'s
 * pills.
 *
 * Each screen already describes its filters as data (`FilterPillConfig[]`,
 * with a `popoverContent` per filter). That description is good; only its
 * presentation was wrong. So rather than rewrite five screens' filter
 * internals, this stacks the same content inside the one flyout and surfaces
 * the active ones as removable chips — which is the shape the prototype uses
 * and what `ListToolbar` already renders.
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Separator, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ListToolbarFilterChip } from '@scaffald/ui'

/**
 * How a screen describes one filter. Lived in `PageHeader` until that
 * component was deleted; the description outlived its presentation.
 */
export type FilterPillConfig = {
  /** Unique key */
  id: string
  /** Display label, e.g. "Trade" */
  label: string
  /** Currently selected value text, e.g. "Construction" */
  value?: string
  /** Callback when pill is pressed (used when no popoverContent) */
  onPress: () => void
  /** Whether the pill is in an "active/filtered" state */
  isActive?: boolean
  /**
   * When provided, the pill becomes a popover trigger (desktop) or
   * toggles an inline expandable panel (mobile). `onPress` is ignored.
   */
  popoverContent?: ReactNode
}

export type ToolbarFilters = {
  /** Stacked filter sections for `ListToolbar`'s flyout. */
  filterContent: ReactNode
  /** The active filters, as removable chips beneath the search row. */
  chips: ListToolbarFilterChip[]
  /** Drives the "· n" on the Filters & sort button. */
  activeFilterCount: number
}

function FilterSections({ pills }: { pills: FilterPillConfig[] }) {
  const { theme } = useThemeContext()
  const withContent = pills.filter((pill) => pill.popoverContent)

  return (
    <Stack gap={12} style={{ minWidth: 240 }}>
      {withContent.map((pill, index) => (
        <Stack key={pill.id} gap={6}>
          {index > 0 ? <Separator /> : null}
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: colors.text[theme].tertiary,
            }}
          >
            {pill.label}
          </Text>
          {pill.popoverContent}
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * @param pills the screen's existing filter descriptors
 * @param onOpenFilters press handler for a chip — opens the flyout, since a
 *   chip names a filter whose control lives there
 */
export function useToolbarFilters(
  pills: FilterPillConfig[],
  onOpenFilters: () => void,
): ToolbarFilters {
  return useMemo(() => {
    const active = pills.filter((pill) => pill.isActive)
    return {
      filterContent: <FilterSections pills={pills} />,
      chips: active.map((pill) => ({
        id: pill.id,
        label: pill.label,
        value: pill.value,
        // A chip is a label for a filter, not a second control for it: it
        // opens the flyout where that filter actually lives. `onClear` is
        // deliberately absent — `FilterPillConfig` carries no way to clear a
        // single filter, and a cross that silently did nothing would be
        // worse than no cross. "Clear all" comes from the screen's reset.
        onPress: onOpenFilters,
        active: true,
      })),
      activeFilterCount: active.length,
    }
  }, [pills, onOpenFilters])
}
