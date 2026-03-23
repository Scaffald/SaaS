/**
 * useSortSheet — returns a sort button config + ActionSheet component.
 *
 * @example
 * ```tsx
 * const { sortBy, sortButton, SortSheet } = useSortSheet({
 *   options: [
 *     { label: 'By Score', value: 'score' },
 *     { label: 'By Name', value: 'name' },
 *   ],
 * })
 * ```
 */

import { ArrowUpDown } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import type { ToolbarButtonConfig } from '../../ToolbarButton'
import { ActionSheet } from '../../ActionSheet'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import type { SortOption } from '../BottomBar.types'

export interface UseSortSheetOptions<T extends string = string> {
  title?: string
  options: SortOption<T>[]
  /** Default sort value. Falls back to first option's value. */
  defaultValue?: T
  /** External controlled value */
  value?: T
  /** External onChange */
  onValueChange?: (value: T) => void
}

export function useSortSheet<T extends string = string>(options: UseSortSheetOptions<T>) {
  const { title = 'Sort', options: sortOptions, defaultValue } = options
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const fallback = defaultValue ?? sortOptions[0]?.value ?? ('' as T)
  const [internalValue, setInternalValue] = useState<T>(fallback)
  const [isOpen, setIsOpen] = useState(false)

  const sortBy = options.value ?? internalValue
  const setSortBy = options.onValueChange ?? setInternalValue

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const sortButton = useMemo<ToolbarButtonConfig>(() => ({
    key: 'sort',
    icon: <ArrowUpDown size={20} color={colors.text[t].secondary} />,
    label: 'Sort',
    variant: 'icon',
    onPress: open,
    accessibilityLabel: 'Sort options',
  }), [t, open])

  const SortSheet = useMemo(() => {
    return function SortSheetComponent() {
      return (
        <ActionSheet
          visible={isOpen}
          onClose={close}
          title={title}
          actions={sortOptions.map((opt) => ({
            label: `${opt.label}${sortBy === opt.value ? ' ✓' : ''}`,
            onPress: () => setSortBy(opt.value),
          }))}
        />
      )
    }
  }, [isOpen, close, title, sortOptions, sortBy, setSortBy])

  return {
    sortBy,
    setSortBy,
    isOpen,
    open,
    close,
    SortSheet,
    sortButton,
  }
}
