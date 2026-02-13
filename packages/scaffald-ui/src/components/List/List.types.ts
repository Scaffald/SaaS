/**
 * List component types
 * Container component for displaying lists of items
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'

/**
 * List component props
 */
export interface ListProps {
  /**
   * Optional title displayed above the list
   */
  title?: string

  /**
   * List items (ListItem components)
   */
  children: React.ReactNode

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Gap between list items
   * @default 10
   */
  gap?: number

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}
