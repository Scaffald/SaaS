/**
 * PasswordStrength component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Password strength level for bar variant
 */
export type PasswordStrengthLevel = 'too-weak' | 'weak' | 'good' | 'strong'

/**
 * Password strength variant
 */
export type PasswordStrengthVariant = 'bar' | 'checklist'

/**
 * Password requirement item for checklist variant
 */
export interface PasswordRequirement {
  /**
   * Requirement label text
   */
  label: string

  /**
   * Whether the requirement is met
   */
  met: boolean
}

/**
 * PasswordStrength component props
 */
export interface PasswordStrengthProps {
  /**
   * Variant type
   * @default 'bar'
   */
  variant?: PasswordStrengthVariant

  /**
   * Strength level for bar variant
   * Only used when variant is 'bar'
   */
  strength?: PasswordStrengthLevel

  /**
   * Requirements list for checklist variant
   * Only used when variant is 'checklist'
   */
  requirements?: PasswordRequirement[]

  /**
   * Label text for checklist variant
   * @default 'Must contain at least:'
   */
  checklistLabel?: string

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Width of the component
   * @default 252
   */
  width?: number
}

