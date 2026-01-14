/**
 * ScrollArea component type definitions
 * Styled scrollable container wrapper
 */

import type { ReactNode, RefObject } from 'react'
import type { ViewStyle, StyleProp, ScrollView as RNScrollView } from 'react-native'

/**
 * ScrollArea props
 */
export interface ScrollAreaProps {
  /**
   * Scrollable content
   */
  children: ReactNode

  /**
   * Scroll direction
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal' | 'both'

  /**
   * Whether to show scroll indicators
   * @default true
   */
  showsScrollIndicator?: boolean

  /**
   * Whether to bounce at edges (iOS)
   * @default true
   */
  bounces?: boolean

  /**
   * Maximum height for vertical scrolling
   */
  maxHeight?: number

  /**
   * Maximum width for horizontal scrolling
   */
  maxWidth?: number

  /**
   * Padding inside the scroll container
   */
  padding?: number

  /**
   * Gap between items (if using with Stack/Row)
   */
  contentGap?: number

  /**
   * Callback when scroll position changes
   */
  onScroll?: (event: { x: number; y: number }) => void

  /**
   * Callback when scroll reaches the end
   */
  onEndReached?: () => void

  /**
   * Threshold for onEndReached (0-1)
   * @default 0.1
   */
  onEndReachedThreshold?: number

  /**
   * Whether content should be centered when smaller than container
   * @default false
   */
  centerContent?: boolean

  /**
   * Whether to enable paging
   * @default false
   */
  pagingEnabled?: boolean

  /**
   * Snap to alignment (for paging/snapping)
   */
  snapToAlignment?: 'start' | 'center' | 'end'

  /**
   * Snap to interval (distance between snap points)
   */
  snapToInterval?: number

  /**
   * Reference to the underlying ScrollView
   */
  scrollRef?: RefObject<RNScrollView>

  /**
   * Custom style for the scroll container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Custom style for the content container
   */
  contentContainerStyle?: StyleProp<ViewStyle>

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
