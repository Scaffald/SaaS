/**
 * ScrollArea component
 * Styled scrollable container wrapper
 *
 * @example
 * ```tsx
 * import { ScrollArea } from '@scaffald/ui'
 *
 * // Vertical scroll
 * <ScrollArea maxHeight={400}>
 *   <Stack gap={16}>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *   </Stack>
 * </ScrollArea>
 *
 * // Horizontal scroll
 * <ScrollArea direction="horizontal" showsScrollIndicator={false}>
 *   <Row gap={12}>
 *     {items.map(item => <Chip key={item.id} {...item} />)}
 *   </Row>
 * </ScrollArea>
 * ```
 */

import { useCallback, useRef } from 'react'
import {
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView as RNScrollView } from 'react-native'
import type { ScrollAreaProps } from './ScrollArea.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'

export function ScrollArea({
  children,
  direction = 'vertical',
  showsScrollIndicator = true,
  bounces = true,
  maxHeight,
  maxWidth,
  padding,
  contentGap,
  onScroll,
  onEndReached,
  onEndReachedThreshold = 0.1,
  centerContent = false,
  pagingEnabled = false,
  snapToAlignment,
  snapToInterval,
  scrollRef,
  style,
  contentContainerStyle,
  testID,
}: ScrollAreaProps) {
  const { theme } = useThemeContext()
  const internalRef = useRef<RNScrollView>(null)
  const ref = scrollRef || internalRef

  // Track if end reached callback has been fired
  const hasReachedEnd = useRef(false)

  // Handle scroll event
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent

      // Call onScroll if provided
      if (onScroll) {
        onScroll({ x: contentOffset.x, y: contentOffset.y })
      }

      // Check for end reached
      if (onEndReached) {
        const isVertical = direction === 'vertical' || direction === 'both'
        const isHorizontal = direction === 'horizontal' || direction === 'both'

        let hasReached = false

        if (isVertical) {
          const distanceFromEnd =
            contentSize.height - layoutMeasurement.height - contentOffset.y
          const threshold = contentSize.height * onEndReachedThreshold
          hasReached = distanceFromEnd <= threshold
        }

        if (isHorizontal && !hasReached) {
          const distanceFromEnd =
            contentSize.width - layoutMeasurement.width - contentOffset.x
          const threshold = contentSize.width * onEndReachedThreshold
          hasReached = distanceFromEnd <= threshold
        }

        if (hasReached && !hasReachedEnd.current) {
          hasReachedEnd.current = true
          onEndReached()
        } else if (!hasReached) {
          hasReachedEnd.current = false
        }
      }
    },
    [direction, onScroll, onEndReached, onEndReachedThreshold]
  )

  const isHorizontal = direction === 'horizontal'
  const isBoth = direction === 'both'

  const styles = getStyles(
    theme,
    maxHeight,
    maxWidth,
    padding,
    contentGap,
    isHorizontal,
    centerContent
  )

  return (
    <ScrollView
      ref={ref}
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      horizontal={isHorizontal || isBoth}
      showsVerticalScrollIndicator={showsScrollIndicator && !isHorizontal}
      showsHorizontalScrollIndicator={showsScrollIndicator && (isHorizontal || isBoth)}
      bounces={bounces}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      pagingEnabled={pagingEnabled}
      snapToAlignment={snapToAlignment}
      snapToInterval={snapToInterval}
      centerContent={centerContent}
      testID={testID}
      {...(Platform.OS === 'web' && {
        style: [styles.container, styles.webScrollbar, style],
      })}
    >
      {children}
    </ScrollView>
  )
}

// ============================================================================
// Styles
// ============================================================================

function getStyles(
  theme: 'light' | 'dark',
  maxHeight?: number,
  maxWidth?: number,
  padding?: number,
  contentGap?: number,
  isHorizontal?: boolean,
  centerContent?: boolean
) {
  return StyleSheet.create({
    container: {
      flex: maxHeight || maxWidth ? undefined : 1,
      maxHeight,
      maxWidth,
    },
    contentContainer: {
      padding: padding ?? undefined,
      gap: contentGap ?? undefined,
      flexDirection: isHorizontal ? 'row' : 'column',
      ...(centerContent && {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }),
    },
    webScrollbar: Platform.select({
      web: {
        // Custom scrollbar styling for web
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border[theme].default} transparent`,
      } as any,
      default: {},
    }),
  })
}

// ============================================================================
// Utility: scrollTo helper
// ============================================================================

export function scrollTo(
  ref: React.RefObject<RNScrollView>,
  options: { x?: number; y?: number; animated?: boolean }
) {
  ref.current?.scrollTo({
    x: options.x ?? 0,
    y: options.y ?? 0,
    animated: options.animated ?? true,
  })
}

export function scrollToEnd(
  ref: React.RefObject<RNScrollView>,
  animated = true
) {
  ref.current?.scrollToEnd({ animated })
}
