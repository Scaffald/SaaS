/**
 * SelectionCard component types
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

export type SelectionCardType = 'checkbox' | 'radio' | 'toggle'
export type SelectionCardLeadingType = 'featured-icon' | 'avatar' | 'payment' | 'brand' | 'custom'

export interface SelectionCardProps {
  /**
   * Type of selection control to render
   * @default 'checkbox'
   */
  type?: SelectionCardType

  /**
   * Whether the card is selected
   */
  selected?: boolean

  /**
   * Callback when selection state changes
   */
  onChange?: (selected: boolean) => void

  /**
   * Whether the card is disabled
   */
  disabled?: boolean

  /**
   * Title text (required)
   */
  title: string

  /**
   * Description text (optional)
   */
  description?: string

  /**
   * Whether to show the description
   * @default true
   */
  showDescription?: boolean

  /**
   * Custom leading content (icon, avatar, etc.)
   * Takes precedence over leadingType
   */
  leadingContent?: React.ReactNode

  /**
   * Preset leading content type
   * @default 'featured-icon'
   */
  leadingType?: SelectionCardLeadingType

  /**
   * Icon component for featured-icon type
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Custom style for the card container
   */
  style?: ViewStyle

  /**
   * Custom style for the title text
   */
  titleStyle?: TextStyle

  /**
   * Custom style for the description text
   */
  descriptionStyle?: TextStyle

  /**
   * Size variant for the selection control
   * @default 'md'
   */
  size?: 'sm' | 'md'

  /**
   * Color variant for the selection control
   * @default 'primary'
   */
  color?: 'gray' | 'primary' | 'red-green'

  /**
   * Optional content shown below the card when selected (ToggleCard-style expansion).
   * Rendered in an attached panel with consistent padding and border.
   */
  expandedContent?: React.ReactNode
}
