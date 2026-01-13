/**
 * SearchSelect component type definitions
 * Searchable dropdown with filtering
 */

import type { ReactNode } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'

/**
 * Option item for SearchSelect
 */
export interface SearchSelectOption {
  /**
   * Unique value for the option
   */
  value: string

  /**
   * Display label for the option
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Whether the option is disabled
   */
  disabled?: boolean

  /**
   * Optional icon to display
   */
  icon?: ReactNode

  /**
   * Optional group name for grouped options
   */
  group?: string
}

/**
 * SearchSelect props
 */
export interface SearchSelectProps {
  /**
   * Available options
   */
  options: SearchSelectOption[]

  /**
   * Selected value(s)
   */
  value?: string | string[]

  /**
   * Callback when selection changes
   */
  onChange?: (value: string | string[]) => void

  /**
   * Placeholder text when no selection
   * @default 'Select...'
   */
  placeholder?: string

  /**
   * Placeholder for search input
   * @default 'Search...'
   */
  searchPlaceholder?: string

  /**
   * Whether to allow multiple selections
   * @default false
   */
  multiple?: boolean

  /**
   * Whether the select is searchable
   * @default true
   */
  searchable?: boolean

  /**
   * Whether the select is clearable
   * @default true
   */
  clearable?: boolean

  /**
   * Whether the select is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Whether the select has an error
   * @default false
   */
  error?: boolean

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Label for the select
   */
  label?: string

  /**
   * Helper text below the select
   */
  helperText?: string

  /**
   * Error message (overrides helperText)
   */
  errorMessage?: string

  /**
   * Message when no options match search
   * @default 'No results found'
   */
  noResultsText?: string

  /**
   * Message when loading options
   */
  loadingText?: string

  /**
   * Whether options are being loaded
   * @default false
   */
  loading?: boolean

  /**
   * Maximum height of the dropdown
   * @default 300
   */
  maxDropdownHeight?: number

  /**
   * Custom filter function
   */
  filterFunction?: (option: SearchSelectOption, searchQuery: string) => boolean

  /**
   * Custom render function for options
   */
  renderOption?: (option: SearchSelectOption, isSelected: boolean) => ReactNode

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
