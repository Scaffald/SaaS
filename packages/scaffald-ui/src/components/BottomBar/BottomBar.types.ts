/**
 * BottomBar type definitions
 * Composable bottom bar system with context-based global/page bar management.
 */

import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ToolbarButtonConfig } from '../ToolbarButton'
import type { ToolbarSearchBarProps } from '../ToolbarSearchBar'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface BottomBarContextValue {
  /** Whether the global (app-level) bar should be hidden */
  globalBarHidden: boolean
  /** Called by page-level BottomBars on mount to hide global bar */
  registerPageBar: (id: string) => void
  /** Called by page-level BottomBars on unmount to show global bar */
  unregisterPageBar: (id: string) => void
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export type BottomBarLevel = 'global' | 'page'

export interface BottomBarProps {
  /**
   * Whether this is the app-level global bar or a page-specific override.
   * - 'global' — hides when any page bar is active
   * - 'page' — auto-registers on mount, causing global bar to hide
   * @default 'page'
   */
  level?: BottomBarLevel
  /** Content to render inside the glass pill */
  children: ReactNode
  /** Additional styles on the pill container */
  style?: StyleProp<ViewStyle>
  /** Additional styles on the outer fixed wrapper */
  wrapperStyle?: StyleProp<ViewStyle>
  /** Unique ID for page-level bars (auto-generated if omitted) */
  id?: string
  /** Test ID */
  testID?: string
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface BottomBarActionsProps {
  /** Toolbar buttons to render in a row */
  buttons: ToolbarButtonConfig[]
}

export interface BottomBarSearchProps extends ToolbarSearchBarProps {}

export interface BottomBarPageControlConfig {
  /** Total number of pages */
  count: number
  /** Currently active page (0-indexed) */
  current: number
  /** Called when page changes */
  onChange?: (page: number) => void
}

export interface BottomBarPageControlProps {
  /** Page control config */
  pageControl: BottomBarPageControlConfig
  /** Buttons before page control */
  leadingButtons?: ToolbarButtonConfig[]
  /** Buttons after page control */
  trailingButtons?: ToolbarButtonConfig[]
}

// ---------------------------------------------------------------------------
// Sheet hooks
// ---------------------------------------------------------------------------

export interface SearchSheetOptions {
  placeholder?: string
}

export interface SearchSheetReturn {
  searchValue: string
  setSearchValue: (v: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
  /** Pre-configured Sheet JSX to render outside the BottomBar */
  SearchSheet: React.FC
  /** ToolbarButtonConfig to trigger the sheet */
  searchButton: ToolbarButtonConfig
}

export interface FilterControl {
  key: string
  type: 'checkbox-group' | 'range'
  label: string
  /** Options for checkbox-group type */
  options?: Array<{ label: string; value: string }>
  /** Min/max/step for range type */
  min?: number
  max?: number
  step?: number
}

export interface FilterSheetOptions {
  title?: string
  controls: FilterControl[]
}

export interface FilterSheetReturn {
  values: Record<string, unknown>
  setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  hasActiveFilters: boolean
  reset: () => void
  isOpen: boolean
  open: () => void
  close: () => void
  FilterSheet: React.FC
  filterButton: ToolbarButtonConfig
}

export interface SortOption<T extends string = string> {
  label: string
  value: T
}

export interface SortSheetOptions<T extends string = string> {
  title?: string
  options: SortOption<T>[]
  defaultValue?: T
}

export interface SortSheetReturn<T extends string = string> {
  sortBy: T
  setSortBy: (value: T) => void
  isOpen: boolean
  open: () => void
  close: () => void
  SortSheet: React.FC
  sortButton: ToolbarButtonConfig
}
