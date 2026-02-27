/**
 * ExpandedTableRow component types
 */

import type { ViewStyle, } from 'react-native'
import type React from 'react'

/**
 * Expanded row variant
 */
export type ExpandedTableRowVariant = 'default' | 'variant2'

/**
 * Form field definition for default variant
 */
export interface ExpandedRowFormField {
  /**
   * Field label
   */
  label: string

  /**
   * Field placeholder
   */
  placeholder?: string

  /**
   * Field value
   */
  value?: string

  /**
   * Field type/name
   */
  type?: string

  /**
   * Whether field is required
   */
  required?: boolean

  /**
   * Helper text
   */
  helperText?: string

  /**
   * Whether field has an error
   */
  error?: boolean

  /**
   * Error message to display
   */
  errorMessage?: string
}

/**
 * Info item definition for variant2
 */
export interface ExpandedRowInfoItem {
  /**
   * Item label (e.g., "Full Address", "CEO")
   */
  label: string

  /**
   * Item value (e.g., "123 Main St", "John Doe")
   */
  value: string
}

/**
 * Expanded table row props
 */
export interface ExpandedTableRowProps {
  /**
   * Variant type
   * @default 'default'
   */
  variant?: ExpandedTableRowVariant

  /**
   * Custom content (overrides variant-based rendering)
   */
  children?: React.ReactNode

  /**
   * Form fields data (for default variant)
   */
  fields?: ExpandedRowFormField[]

  /**
   * Info items data (for variant2)
   */
  infoItems?: ExpandedRowInfoItem[]

  /**
   * Title/heading for expanded content
   * Used in variant2
   */
  title?: string

  /**
   * Callback when form field changes (for default variant)
   */
  onFieldChange?: (fieldType: string, value: string) => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom content style
   */
  contentStyle?: ViewStyle

  /**
   * Number of columns for form fields (default variant)
   * @default 3
   */
  columns?: number
}
