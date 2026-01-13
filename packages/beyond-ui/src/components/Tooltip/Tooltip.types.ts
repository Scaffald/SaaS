/**
 * Tooltip component types
 * Mapped from Figma Forsured Design System Tooltip component
 */

import type { ReactNode } from 'react'
import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Tooltip type variants
 */
export type TooltipType = 'default' | 'rich'

/**
 * Tooltip color variants
 */
export type TooltipColor = 'primary' | 'gray'

/**
 * Tooltip arrow position variants
 * Supports 9 positions: None, Up (Center/Left/Right), Down (Center/Left/Right), Left, Right
 */
export type TooltipArrowPosition =
  | 'none'
  | 'up-center'
  | 'up-left'
  | 'up-right'
  | 'down-center'
  | 'down-left'
  | 'down-right'
  | 'left'
  | 'right'

/**
 * Tooltip action (for Rich tooltips)
 */
export interface TooltipAction {
  /**
   * Action label text
   */
  label: string

  /**
   * Action press handler
   */
  onPress: () => void
}

/**
 * Tooltip props
 */
export interface TooltipProps {
  /**
   * Trigger element that shows the tooltip on hover/long press
   */
  children: ReactNode

  /**
   * Tooltip content (for default type)
   * Can be string or ReactNode
   */
  content?: ReactNode

  /**
   * Tooltip type variant
   * @default 'default'
   */
  type?: TooltipType

  /**
   * Tooltip color variant
   * @default 'primary'
   */
  color?: TooltipColor

  /**
   * Arrow position
   * @default 'none'
   */
  arrowPosition?: TooltipArrowPosition

  /**
   * Title text (required for rich type)
   */
  title?: string

  /**
   * Description text or content (for rich type)
   */
  description?: ReactNode

  /**
   * Action buttons (for rich type, max 2)
   */
  actions?: TooltipAction[]

  /**
   * Show action buttons (for rich type)
   * @default true
   */
  showActions?: boolean

  /**
   * Delay in milliseconds before showing tooltip on hover
   * @default 200
   */
  delay?: number

  /**
   * Delay in milliseconds before hiding tooltip after mouse leave
   * Prevents flickering on quick mouse movements
   * @default 100
   */
  leaveDelay?: number

  /**
   * Controlled visibility state
   */
  visible?: boolean

  /**
   * Default visibility state (uncontrolled)
   * @default false
   */
  defaultVisible?: boolean

  /**
   * Callback when visibility changes
   */
  onVisibleChange?: (visible: boolean) => void

  /**
   * Custom tooltip container style
   */
  style?: ViewStyle

  /**
   * Custom tooltip content style
   */
  contentStyle?: ViewStyle
}

/**
 * Tooltip content props
 */
export interface TooltipContentProps {
  /**
   * Tooltip type
   */
  type: TooltipType

  /**
   * Tooltip color variant
   */
  color: TooltipColor

  /**
   * Content for default type
   */
  content?: ReactNode

  /**
   * Title for rich type
   */
  title?: string

  /**
   * Description for rich type
   */
  description?: ReactNode

  /**
   * Actions for rich type
   */
  actions?: TooltipAction[]

  /**
   * Show actions
   */
  showActions: boolean

  /**
   * Custom content style
   */
  style?: ViewStyle
}

/**
 * Tooltip arrow props
 */
export interface TooltipArrowProps {
  /**
   * Arrow position
   */
  position: TooltipArrowPosition

  /**
   * Tooltip color variant (for arrow color)
   */
  color: TooltipColor

  /**
   * Custom arrow style
   */
  style?: ViewStyle
}

/**
 * Trigger layout measurements for positioning
 */
export interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Tooltip style configuration
 */
export interface TooltipStyleConfig {
  container: ViewStyle
  content: ViewStyle
  defaultContent: ViewStyle
  richContent: ViewStyle
  richTitle: TextStyle
  richDescription: TextStyle
  richActions: ViewStyle
  actionButton: ViewStyle
  actionButtonText: TextStyle
  arrow: ViewStyle
  backgroundColor: string
  textColor: string
  arrowColor: string
}

