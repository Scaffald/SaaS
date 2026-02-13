/**
 * Sheet component
 * Bottom sheet/drawer for mobile-friendly overlays
 *
 * @example
 * ```tsx
 * import { Sheet, SheetHeader, SheetContent, SheetFooter } from '@scaffald/ui'
 *
 * <Sheet visible={isVisible} onClose={() => setIsVisible(false)} height="half">
 *   <SheetHeader title="Sheet Title" onClose={() => setIsVisible(false)} />
 *   <SheetContent>Content here</SheetContent>
 *   <SheetFooter>
 *     <Button onPress={handleAction}>Action</Button>
 *   </SheetFooter>
 * </Sheet>
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Modal as RNModal,
  Pressable,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native'
import type { SheetProps, SheetHeaderProps, SheetContentProps, SheetFooterProps, SheetHeight } from './Sheet.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { Text, H4 } from '../Typography'
import { Button } from '../Button'
import {
  getSheetStyles,
  getSheetHeaderStyles,
  getSheetContentStyles,
  getSheetFooterStyles,
} from './Sheet.styles'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ============================================================================
// Height Calculation
// ============================================================================

function getSheetHeight(height: SheetHeight, maxHeight: number): number {
  const maxPixels = SCREEN_HEIGHT * maxHeight

  if (typeof height === 'number') {
    return Math.min(height, maxPixels)
  }

  switch (height) {
    case 'auto':
      return maxPixels // Will be constrained by content
    case 'quarter':
      return Math.min(SCREEN_HEIGHT * 0.25, maxPixels)
    case 'half':
      return Math.min(SCREEN_HEIGHT * 0.5, maxPixels)
    case 'three-quarters':
      return Math.min(SCREEN_HEIGHT * 0.75, maxPixels)
    case 'full':
      return maxPixels
    default:
      return Math.min(SCREEN_HEIGHT * 0.5, maxPixels)
  }
}

// ============================================================================
// Sheet Component
// ============================================================================

export function Sheet({
  visible: controlledVisible,
  defaultVisible = false,
  onClose,
  closeOnBackdropPress = true,
  closeOnEscapeKey = true,
  enableDragToDismiss = true,
  height = 'half',
  maxHeight = 0.9,
  animation = 'slide',
  animationDuration = 300,
  showHandle = true,
  style,
  children,
  testID,
}: SheetProps) {
  const { theme } = useThemeContext()

  // Controlled/uncontrolled visibility state
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const isControlled = controlledVisible !== undefined
  const isVisible = isControlled ? controlledVisible : internalVisible

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  // Calculate sheet height
  const sheetHeight = getSheetHeight(height, maxHeight)

  // Handle close
  const handleClose = useCallback(() => {
    const closeAnimation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ])

    closeAnimation.start(() => {
      if (!isControlled) {
        setInternalVisible(false)
      }
      onClose?.()
    })
  }, [isControlled, onClose, translateY, backdropOpacity, animationDuration])

  // Open animation
  useEffect(() => {
    if (isVisible) {
      translateY.setValue(SCREEN_HEIGHT)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isVisible, translateY, backdropOpacity, animationDuration])

  // Handle Escape key press (web only)
  useEffect(() => {
    if (!closeOnEscapeKey || !isVisible || Platform.OS !== 'web') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        handleClose()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isVisible, closeOnEscapeKey, handleClose])

  // Pan responder for drag-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableDragToDismiss,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes
        return enableDragToDismiss && gestureState.dy > 10
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged more than 25% of sheet height, close it
        if (gestureState.dy > sheetHeight * 0.25) {
          handleClose()
        } else {
          // Snap back to open position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start()
        }
      },
    })
  ).current

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      handleClose()
    }
  }

  if (!isVisible) {
    return null
  }

  const styles = getSheetStyles(theme, sheetHeight, height === 'auto')

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          />
        </Animated.View>

        {/* Sheet container */}
        <Animated.View
          style={[
            styles.container,
            style,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
          {...(Platform.OS === 'web' && {
            role: 'dialog',
            'aria-modal': 'true',
          } as any)}
          accessible={true}
          accessibilityRole="alert"
          accessibilityViewIsModal={true}
        >
          {/* Drag handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {children}
        </Animated.View>
      </View>
    </RNModal>
  )
}

// ============================================================================
// SheetHeader Component
// ============================================================================

export function SheetHeader({
  title,
  subtitle,
  showCloseButton = true,
  onClose,
  children,
  style,
  testID,
}: SheetHeaderProps) {
  const { theme } = useThemeContext()
  const styles = getSheetHeaderStyles(theme)

  return (
    <View style={[styles.header, style]} testID={testID}>
      {children ? (
        children
      ) : (
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            {title && <H4>{title}</H4>}
            {subtitle && (
              <Text size="sm" color="secondary">
                {subtitle}
              </Text>
            )}
          </View>
          {showCloseButton && onClose && (
            <Button
              variant="text"
              size="sm"
              onPress={onClose}
              accessibilityLabel="Close sheet"
            >
              Close
            </Button>
          )}
        </View>
      )}
    </View>
  )
}

// ============================================================================
// SheetContent Component
// ============================================================================

export function SheetContent({
  children,
  scrollable = true,
  style,
  testID,
}: SheetContentProps) {
  const { theme } = useThemeContext()
  const styles = getSheetContentStyles(theme)

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.contentScroll, style]}
        contentContainerStyle={styles.contentContainer}
        testID={testID}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View style={[styles.content, style]} testID={testID}>
      {children}
    </View>
  )
}

// ============================================================================
// SheetFooter Component
// ============================================================================

export function SheetFooter({
  children,
  align = 'right',
  style,
  testID,
}: SheetFooterProps) {
  const { theme } = useThemeContext()
  const styles = getSheetFooterStyles(theme, align)

  return (
    <View style={[styles.footer, style]} testID={testID}>
      {children}
    </View>
  )
}

// ============================================================================
// Styles
// ============================================================================

// Styles are now in Sheet.styles.ts
