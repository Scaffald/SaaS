/**
 * useSearchSheet — returns a search button config + Sheet component.
 *
 * @example
 * ```tsx
 * const { searchValue, searchButton, SearchSheet } = useSearchSheet({
 *   placeholder: 'Search workers...',
 * })
 * // Render searchButton in BottomBar.Actions, SearchSheet outside BottomBar
 * ```
 */

import { Search } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import type { ToolbarButtonConfig } from '../../ToolbarButton'
import { Sheet, SheetHeader, SheetContent } from '../../Sheet'
import { ToolbarSearchBar } from '../../ToolbarSearchBar'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'

export interface UseSearchSheetOptions {
  placeholder?: string
  /** External controlled value (if omitted, hook manages its own state) */
  value?: string
  /** External onChange handler */
  onValueChange?: (value: string) => void
}

export function useSearchSheet(options: UseSearchSheetOptions = {}) {
  const { placeholder = 'Search...', value: externalValue, onValueChange } = options
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const [internalValue, setInternalValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const searchValue = externalValue ?? internalValue
  const setSearchValue = onValueChange ?? setInternalValue
  const hasSearch = searchValue.length > 0

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const searchButton = useMemo<ToolbarButtonConfig>(() => ({
    key: 'search',
    icon: <Search size={20} color={hasSearch ? colors.primary[t === 'dark' ? 300 : 500] : colors.text[t].secondary} />,
    label: 'Search',
    variant: 'icon',
    onPress: open,
    accessibilityLabel: 'Open search',
  }), [hasSearch, t, open])

  const SearchSheet = useMemo(() => {
    return function SearchSheetComponent() {
      return (
        <Sheet visible={isOpen} onClose={close} height="auto">
          <SheetHeader title="Search" onClose={close} />
          <SheetContent>
            <ToolbarSearchBar
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder={placeholder}
            />
          </SheetContent>
        </Sheet>
      )
    }
  }, [isOpen, close, searchValue, setSearchValue, placeholder])

  return {
    searchValue,
    setSearchValue,
    isOpen,
    open,
    close,
    SearchSheet,
    searchButton,
  }
}
