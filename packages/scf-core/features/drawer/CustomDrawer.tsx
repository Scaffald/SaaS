import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDrawer } from './DrawerContext'

const DEFAULT_WIDTH = 300
const EDGE_HIT_SLOP = 32
const DISMISS_VELOCITY = 500

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

type CustomDrawerProps = {
  /** Main content rendered behind the drawer (the route tree). */
  children: ReactNode
  /** Drawer panel content. */
  drawerContent: ReactNode
  /** Whether to render the drawer as a fixed sidebar (no animation, no overlay). */
  permanent?: boolean
  /** Drawer width in pixels. Defaults to 300. */
  drawerWidth?: number
  /**
   * Solid background color applied to the panel itself. Without this the panel
   * would be transparent and the underlying route content would bleed through
   * any translucent material (e.g. GlassSurface) inside `drawerContent`.
   */
  panelBackgroundColor?: string
}

/**
 * Custom mobile drawer using vanilla `Animated` + `react-native-gesture-handler`'s
 * legacy non-worklet API. Avoids `react-native-drawer-layout` / Reanimated worklets
 * entirely, sidestepping the freezeObjectInDev / RemoteFunction crash that affects
 * Reanimated 4 + worklets 0.7.x.
 */
export function CustomDrawer({
  children,
  drawerContent,
  permanent = false,
  drawerWidth = DEFAULT_WIDTH,
  panelBackgroundColor,
}: CustomDrawerProps) {
  const { isOpen, close, open } = useDrawer()
  const insets = useSafeAreaInsets()
  const closedX = -drawerWidth
  const openX = 0

  const translateX = useRef(new Animated.Value(isOpen ? openX : closedX)).current
  // Tracks the committed/animated position so a gesture beginning mid-animation
  // continues from the actual on-screen position, not the last committed state.
  const positionRef = useRef(isOpen ? openX : closedX)
  // Captures position at gesture start.
  const gestureStartRef = useRef(closedX)

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      positionRef.current = value
    })
    return () => translateX.removeListener(id)
  }, [translateX])

  useEffect(() => {
    if (permanent) return
    Animated.spring(translateX, {
      toValue: isOpen ? openX : closedX,
      useNativeDriver: true,
      stiffness: 1000,
      damping: 70,
      mass: 1,
      overshootClamping: true,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 1,
    }).start()
  }, [isOpen, permanent, translateX, closedX, openX])

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const next = clamp(gestureStartRef.current + event.nativeEvent.translationX, closedX, openX)
      translateX.setValue(next)
    },
    [translateX, closedX, openX]
  )

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      const { state, translationX, velocityX } = event.nativeEvent
      if (state === State.BEGAN) {
        // Anchor at the current animated position (handles mid-spring grabs).
        gestureStartRef.current = clamp(positionRef.current, closedX, openX)
        return
      }
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const finalX = gestureStartRef.current + translationX
        const movingRight = velocityX > DISMISS_VELOCITY
        const movingLeft = velocityX < -DISMISS_VELOCITY
        const past50 = finalX > closedX / 2
        const shouldOpen = movingRight || (!movingLeft && past50)
        if (shouldOpen) {
          open()
        } else {
          close()
        }
      }
    },
    [open, close, closedX, openX]
  )

  if (permanent) {
    return (
      <View style={styles.permanentContainer}>
        <View
          style={[
            styles.permanentDrawer,
            {
              width: drawerWidth,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              backgroundColor: panelBackgroundColor,
            },
          ]}
        >
          <View style={styles.drawerInner}>{drawerContent}</View>
        </View>
        <View style={styles.permanentMain}>{children}</View>
      </View>
    )
  }

  // When closed, restrict gesture activation to the left edge so the drawer
  // doesn't fight horizontal swipes inside the content (e.g. carousels).
  // When open, the whole-screen pan handler can close it from anywhere.
  const hitSlop = isOpen ? undefined : { left: 0, top: 0, bottom: 0, width: EDGE_HIT_SLOP }

  const overlayOpacity = translateX.interpolate({
    inputRange: [closedX, openX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
        hitSlop={hitSlop}
      >
        <Animated.View style={styles.gestureRoot}>
          <View style={styles.content}>{children}</View>

          <Animated.View
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[styles.overlay, { opacity: overlayOpacity }]}
          >
            <Pressable
              style={styles.overlayPress}
              accessibilityLabel="Close navigation drawer"
              onPress={close}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                backgroundColor: panelBackgroundColor,
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.drawerInner}>{drawerContent}</View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gestureRoot: { flex: 1 },
  content: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayPress: { flex: 1 },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerInner: { flex: 1, width: '100%' },
  permanentContainer: { flex: 1, flexDirection: 'row' },
  permanentDrawer: { height: '100%' },
  permanentMain: { flex: 1 },
})
