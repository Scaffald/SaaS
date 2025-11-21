import type { ReactNode } from 'react'

export type SearchSelectMode = 'single' | 'multiple'

export type SearchResultOrigin = 'static' | 'remote'

export interface SearchSelectHighlightRange {
  start: number
  end: number
}

export interface SearchSelectOption<T> {
  /** Original option value */
  raw: T
  /** Display label */
  label: string
  /** Stable identifier */
  value: string
  /** Optional supporting text */
  description?: string
  /** Optional flag to disable selection */
  disabled?: boolean
  /** Additional metadata */
  meta?: {
    origin?: SearchResultOrigin
    highlightRanges?: SearchSelectHighlightRange[]
    [key: string]: unknown
  }
}

export interface SearchSelectStrings {
  clear?: string
  selectAll?: string
  clearAll?: string
  searching?: string
  searchFailed?: string
  noResults?: string
  minCharacters?: (count: number) => string
}

export interface SearchSelectOptionRenderState {
  isActive: boolean
  isSelected: boolean
  index: number
}

export interface SearchSelectChipRenderState {
  onRemove: () => void
}

export interface SearchSelectProps<T> {
  mode?: SearchSelectMode
  value?: T | T[] | null
  defaultValue?: T | T[] | null
  onChange?: (value: T | T[] | null) => void
  /** Static options available immediately */
  options?: T[]
  /** Async search handler */
  onSearch?: (query: string) => Promise<T[]>
  /** Label getter */
  getOptionLabel: (option: T) => string
  /** Value getter (stringified internally) */
  getOptionValue: (option: T) => string | number
  /** Optional description getter */
  getOptionDescription?: (option: T) => string | undefined
  /** Custom option renderer */
  renderOption?: (option: SearchSelectOption<T>, state: SearchSelectOptionRenderState) => ReactNode
  /** Custom chip renderer (multi-select) */
  renderChip?: (option: SearchSelectOption<T>, state: SearchSelectChipRenderState) => ReactNode
  /** Placeholder text */
  placeholder?: string
  /** Error text */
  error?: string
  /** Disable entire field */
  disabled?: boolean
  /** Debounce duration for async search (ms) */
  debounceMs?: number
  /** Minimum characters before async search triggers */
  minSearchLength?: number
  /** Enable fuzzy matching for static options */
  enableFuzzyMatch?: boolean
  /** Enable highlight metadata for matches */
  enableHighlight?: boolean
  /** External loading override */
  isLoading?: boolean
  /** Accessibility labels */
  ariaLabel?: string
  ariaDescribedBy?: string
  /** Multi-select maximum selections */
  maxSelections?: number
  /** Force mobile sheet or web popover */
  forceMobileSheet?: boolean
  forceWebPopover?: boolean
  /** Copy overrides */
  strings?: Partial<SearchSelectStrings>
  /** Controlled input value */
  inputValue?: string
  /** Controlled input change handler */
  onInputChange?: (value: string) => void
  /** Called when dropdown/sheet open state changes */
  onOpenChange?: (open: boolean) => void
  /** Called when internal search errors */
  onError?: (message: string) => void
  /** Number of static options before virtualization kicks in */
  virtualizationThreshold?: number
  /** Row height hint for virtualization */
  virtualizationItemHeight?: number
  /** Show Select All / Clear All helpers */
  allowSelectAll?: boolean
  allowClearAll?: boolean
}

export interface UseSearchResult<T> {
  query: string
  results: SearchSelectOption<T>[]
  isSearching: boolean
  error: string | null
  /** Invoked when input text changes */
  handleQueryChange: (value: string) => void
  /** Clears local state/results */
  clearResults: () => void
  /** Manually trigger a refresh */
  refresh: () => Promise<void>
}

export interface UseSearchSelectResult<T> {
  mode: SearchSelectMode
  query: string
  inputValue: string
  setInputValue: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  results: SearchSelectOption<T>[]
  selectedOptions: SearchSelectOption<T>[]
  isSearching: boolean
  error: string | null
  canSelectMore: boolean
  handleOptionSelect: (option: SearchSelectOption<T>) => void
  handleRemoveOption: (value: string) => void
  handleClearSelection: () => void
  handleSelectAll: () => void
  handleClearAll: () => void
  isSelected: (value: string) => boolean
  clearResults: () => void
  refreshResults: () => Promise<void>
  setSelection: (value: T | T[] | null) => void
}
