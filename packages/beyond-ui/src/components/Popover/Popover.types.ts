/**
 * Popover component type definitions
 * Floating container for interactive content
 */

import type { ReactNode } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'

/**
 * Popover placement options
 */
export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

/**
 * Popover trigger mode
 */
export type PopoverTrigger = 'press' | 'longPress' | 'hover' | 'manual'

/**
 * Main Popover props
 */
export interface PopoverProps {
  /**
   * Trigger element
   */
  children: ReactNode

  /**
   * Popover content
   */
  content: ReactNode

  /**
   * Preferred placement of the popover
   * @default 'bottom'
   */
  placement?: PopoverPlacement

  /**
   * How the popover is triggered
   * @default 'press'
   */
  trigger?: PopoverTrigger

  /**
   * Whether the popover is open (controlled)
   */
  open?: boolean

  /**
   * Default open state (uncontrolled)
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether to close on backdrop press
   * @default true
   */
  closeOnBackdropPress?: boolean

  /**
   * Whether to close on escape key (web only)
   * @default true
   */
  closeOnEscapeKey?: boolean

  /**
   * Whether to show the arrow
   * @default true
   */
  showArrow?: boolean

  /**
   * Offset from the trigger element in pixels
   * @default 8
   */
  offset?: number

  /**
   * Custom width for the popover
   */
  width?: number | 'auto' | 'trigger'

  /**
   * Maximum width for the popover
   * @default 320
   */
  maxWidth?: number

  /**
   * Custom style for the popover container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Custom style for the popover content
   */
  contentStyle?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * PopoverHeader props
 */
export interface PopoverHeaderProps {
  /**
   * Title text
   */
  title?: string

  /**
   * Whether to show close button
   * @default false
   */
  showCloseButton?: boolean

  /**
   * Callback when close button is pressed
   */
  onClose?: () => void

  /**
   * Custom content instead of title
   */
  children?: ReactNode

  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * PopoverContent props
 */
export interface PopoverContentProps {
  /**
   * Content to render
   */
  children?: ReactNode

  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * PopoverFooter props
 */
export interface PopoverFooterProps {
  /**
   * Content to render in footer
   */
  children?: ReactNode

  /**
   * Alignment of footer content
   * @default 'right'
   */
  align?: 'left' | 'center' | 'right' | 'space-between'

  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * Layout measurements for positioning
 */
export interface TriggerLayout {
  x: number
  y: number
  width: number
  height: number
  pageX: number
  pageY: number
}
