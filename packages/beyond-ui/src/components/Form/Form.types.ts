/**
 * Form component type definitions
 * Layout components for organizing form fields
 */

import type { ReactNode } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'

/**
 * Form props
 */
export interface FormProps {
  /**
   * Form content (fields, fieldsets, buttons)
   */
  children: ReactNode

  /**
   * Callback when form is submitted
   */
  onSubmit?: () => void

  /**
   * Gap between form elements
   * @default 16
   */
  gap?: number

  /**
   * Custom style for the form container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * Fieldset props
 */
export interface FieldsetProps {
  /**
   * Fieldset content (form fields)
   */
  children: ReactNode

  /**
   * Legend/title for the fieldset
   */
  legend?: string

  /**
   * Description text below the legend
   */
  description?: string

  /**
   * Whether the fieldset is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Gap between fields in the fieldset
   * @default 12
   */
  gap?: number

  /**
   * Layout direction
   * @default 'column'
   */
  direction?: 'row' | 'column'

  /**
   * Custom style for the fieldset container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * FormField props
 */
export interface FormFieldProps {
  /**
   * Form control element (Input, Checkbox, etc.)
   */
  children: ReactNode

  /**
   * Label text for the field
   */
  label?: string

  /**
   * Helper text below the field
   */
  helperText?: string

  /**
   * Error message (overrides helperText when present)
   */
  error?: string

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Unique ID for the field (for label association)
   */
  id?: string

  /**
   * Gap between label, field, and helper text
   * @default 4
   */
  gap?: number

  /**
   * Custom style for the field container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * FormRow props - for horizontal field layouts
 */
export interface FormRowProps {
  /**
   * Form fields to display in a row
   */
  children: ReactNode

  /**
   * Gap between fields in the row
   * @default 16
   */
  gap?: number

  /**
   * Alignment of fields
   * @default 'stretch'
   */
  align?: 'start' | 'center' | 'end' | 'stretch'

  /**
   * Custom style for the row container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * FormActions props - for form buttons
 */
export interface FormActionsProps {
  /**
   * Action buttons
   */
  children: ReactNode

  /**
   * Alignment of buttons
   * @default 'right'
   */
  align?: 'left' | 'center' | 'right' | 'space-between'

  /**
   * Gap between buttons
   * @default 12
   */
  gap?: number

  /**
   * Custom style for the actions container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
