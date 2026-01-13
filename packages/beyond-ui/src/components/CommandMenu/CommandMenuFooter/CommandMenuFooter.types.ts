/**
 * CommandMenuFooter component types
 * Footer section with keyboard shortcut hints
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Shortcut hint configuration
 */
export interface ShortcutHint {
  /**
   * Keyboard shortcut keys
   */
  keys: string[]

  /**
   * Label text for the shortcut
   */
  label: string

  /**
   * Shortcut variant
   */
  variant?: 'Single' | 'Double' | 'Arrow'
}

/**
 * CommandMenuFooter props
 */
export interface CommandMenuFooterProps {
  /**
   * Show navigation shortcuts (Arrow Up/Down, Enter)
   * @default true
   */
  navigationHint?: boolean

  /**
   * Show close shortcut (Esc)
   * @default true
   */
  closeHint?: boolean

  /**
   * Custom shortcut hints
   */
  customHints?: ShortcutHint[]

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}
