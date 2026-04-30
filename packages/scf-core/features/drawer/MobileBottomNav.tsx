/**
 * Mobile primary navigation — 3-tab glass pill (Home / Jobs / Community).
 *
 * - Profile, settings, notifications, organizations live in the drawer
 *   (header avatar tap), not in this bar.
 * - Search lives in the header.
 * - Active-tab pill animates between tabs with vanilla Animated
 *   (no Reanimated worklets, per the project's animation policy).
 *
 * TODO(blur): swap GlassSurface for expo-blur BlurView on iOS for true
 *   "liquid glass" parity with iOS 17+ chrome materials. Tracked separately.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { GlassSurface, Text, useResponsive, useThemeContext, useBottomBarContext } from '@scaffald/ui'
import { colors, glassVibrantColors } from '@scaffald/ui/tokens'
import { usePathname, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, LayoutChangeEvent, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MOBILE_SECTIONS, type MobileSection } from './config'

// ── Constants ──

const PILL_HEIGHT = 56
const TAB_VERTICAL_PAD = 6
const ICON_SIZE = 22
const LABEL_FONT_SIZE = 11
const ACTIVE_INDICATOR_RADIUS = 22
const PILL_HORIZONTAL_PAD = 6

// ── Helpers ──

/** Dev override — see DrawerLayout's shouldForceMobile. */
function shouldForceMobile(): boolean {
  if (typeof window === 'undefined' || !window.location) return false
  return new URLSearchParams(window.location.search).has('forceMobile')
}

function getActiveSectionIndex(pathname: string): number {
  for (let i = 0; i < MOBILE_SECTIONS.length; i++) {
    const section = MOBILE_SECTIONS[i]
    for (const prefix of section.matchPrefixes) {
      if (pathname === prefix || pathname.startsWith(prefix)) {
        return i
      }
    }
  }
  // Default to Home if nothing else matches.
  return 0
}

// ── Component ──

export function MobileBottomNav() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { globalBarHidden } = useBottomBarContext()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()

  const activeIndex = useMemo(() => getActiveSectionIndex(pathname), [pathname])

  // Animated active-tab indicator position (translateX) and width.
  const indicatorX = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const tabLayoutsRef = useRef<Array<{ x: number; width: number } | null>>(
    MOBILE_SECTIONS.map(() => null)
  )

  useEffect(() => {
    const layout = tabLayoutsRef.current[activeIndex]
    if (!layout) return
    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: layout.x,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(indicatorWidth, {
        toValue: layout.width,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start()
  }, [activeIndex, indicatorX, indicatorWidth])

  if ((!isMobile && !shouldForceMobile()) || globalBarHidden) return null

  const resolvedTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'
  const vibrant = glassVibrantColors[resolvedTheme]
  const inactiveText = vibrant.tertiaryText
  const activeText = colors.primary[600]
  const activeBg =
    resolvedTheme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)'

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    const next = { x, width }
    const prev = tabLayoutsRef.current[index]
    tabLayoutsRef.current[index] = next
    // Snap indicator to the active tab on first measurement.
    if (index === activeIndex && (!prev || prev.x !== x || prev.width !== width)) {
      indicatorX.setValue(x)
      indicatorWidth.setValue(width)
    }
  }

  const handleTabPress = (section: MobileSection, index: number) => {
    if (index === activeIndex) {
      // Tapping the active tab is a no-op (could later scroll-to-top).
      return
    }
    router.push(section.route)
  }

  // Web has no real safe area; native respects the bottom inset so the bar
  // sits above the iOS home indicator. The previous `+ 8` padding produced
  // a visible gap below the bar on web (no inset to absorb it) — drop it.
  const bottomPadding = Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 8)

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === 'web' ? ('fixed' as never) : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: bottomPadding,
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <GlassSurface
        material="thin"
        radius="3xl"
        elevated
        style={{ height: PILL_HEIGHT }}
      >
        <View
          style={{
            height: PILL_HEIGHT,
            flexDirection: 'row',
            alignItems: 'stretch',
            paddingHorizontal: PILL_HORIZONTAL_PAD,
            position: 'relative',
          }}
        >
          {/* Animated active indicator */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: TAB_VERTICAL_PAD,
              bottom: TAB_VERTICAL_PAD,
              left: 0,
              transform: [{ translateX: indicatorX }],
              width: indicatorWidth,
              borderRadius: ACTIVE_INDICATOR_RADIUS,
              backgroundColor: activeBg,
            }}
          />

          {MOBILE_SECTIONS.map((section, index) => {
            const Icon = section.icon
            const isActive = index === activeIndex
            return (
              <Pressable
                key={section.key}
                onPress={() => handleTabPress(section, index)}
                onLayout={handleTabLayout(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={section.label}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: TAB_VERTICAL_PAD,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Icon size={ICON_SIZE} color={isActive ? activeText : inactiveText} />
                <Text
                  size="xs"
                  weight={isActive ? 'semibold' : 'medium'}
                  style={{
                    marginTop: 2,
                    fontSize: LABEL_FONT_SIZE,
                    color: isActive ? activeText : inactiveText,
                  }}
                >
                  {section.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </GlassSurface>
    </View>
  )
}
