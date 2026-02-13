/**
 * Sheet component type definitions
 * Bottom sheet/drawer for mobile-friendly overlays
 */

import type { ViewStyle, StyleProp } from 'react-native'
import type React from 'react'

/**
 * Sheet height presets
 */
export type SheetHeight = 'auto' | 'quarter' | 'half' | 'three-quarters' | 'full' | number

/**
 * Sheet animation configuration
 */
export type SheetAnimation = 'slide' | 'fade' | 'none'

/**
 * Main Sheet props
 */
export interface SheetProps {
  /**
   * Whether the sheet is visible (controlled)
   */
  visible?: boolean

  /**
   * Default visibility for uncontrolled mode
   * @default false
   */
  defaultVisible?: boolean

  /**
   * Callback when sheet should be closed
   */
  onClose?: () => void

  /**
   * Whether to close sheet when backdrop is pressed
   * @default true
   */
  closeOnBackdropPress?: boolean

  /**
   * Whether to close sheet when Escape key is pressed (web only)
   * @default true
   */
  closeOnEscapeKey?: boolean

  /**
   * Whether to enable drag-to-dismiss gesture
   * @default true
   */
  enableDragToDismiss?: boolean

  /**
   * Height of the sheet
   * @default 'half'
   */
  height?: SheetHeight

  /**
   * Maximum height as percentage of screen (0-1)
   * @default 0.9
   */
  maxHeight?: number

  /**
   * Animation type for sheet
   * @default 'slide'
   */
  animation?: SheetAnimation

  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration?: number

  /**
   * Whether to show the drag handle indicator
   * @default true
   */
  showHandle?: boolean

  /**
   * Custom style for the sheet container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Content to render inside the sheet
   */
  children?: React.ReactNode

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * Sheet header props
 */
export interface SheetHeaderProps {
  /**
   * Title text
   */
  title?: string

  /**
   * Subtitle text
   */
  subtitle?: string

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean

  /**
   * Callback when close button is pressed
   */
  onClose?: () => void

  /**
   * Custom content to render instead of title/subtitle
   */
  children?: React.ReactNode

  /**
   * Custom style for the header container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * Sheet content props
 */
export interface SheetContentProps {
  /**
   * Content to render
   */
  children?: React.ReactNode

  /**
   * Whether content should be scrollable
   * @default true
   */
  scrollable?: boolean

  /**
   * Custom style for the content container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}

/**
 * Sheet footer props
 */
export interface SheetFooterProps {
  /**
   * Content to render in the footer
   */
  children?: React.ReactNode

  /**
   * Alignment of footer content
   * @default 'right'
   */
  align?: 'left' | 'center' | 'right' | 'space-between'

  /**
   * Custom style for the footer container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
