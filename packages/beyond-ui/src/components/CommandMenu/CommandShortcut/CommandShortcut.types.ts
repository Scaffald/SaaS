/**
 * CommandShortcut component types
 * Component for displaying keyboard shortcuts in command menu
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Keyboard shortcut variant
 */
export type CommandShortcutVariant = 'Single' | 'Double' | 'Arrow'

/**
 * Keyboard shortcut props
 */
export interface CommandShortcutProps {
  /**
   * Variant of the shortcut display
   * - Single: Single key (e.g., "Esc")
   * - Double: Two keys (e.g., "⌘K", "Ctrl+K")
   * - Arrow: Arrow key (e.g., "↑", "↓")
   * @default 'Single'
   */
  variant?: CommandShortcutVariant

  /**
   * Keys to display in the shortcut
   * For Single: ["Esc"] or ["K"]
   * For Double: ["⌘", "K"] or ["Ctrl", "K"]
   * For Arrow: ["↑"] or ["ArrowUp"]
   */
  keys: string[]

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}
