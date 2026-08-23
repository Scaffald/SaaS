/**
 * Mobile primary navigation — 3-tab glass pill (Home / Jobs / Community).
 *
 * - Profile, settings, notifications, organizations live in the drawer
 *   (header avatar tap), not in this bar.
 * - Search lives in the header.
 * - Active-tab pill animates between tabs with vanilla Animated
 *   (no Reanimated worklets, per the project's animation policy).
 *
 * GlassTabBar encapsulates the blur surface:
 *   iOS    → expo-blur BlurView (systemChromeMaterial, intensity 80)
 *   Android → expo-blur BlurView (intensity 40) + opaque fallback bg
 *   Web    → GlassSurface (CSS backdrop-filter)
 */

import {
  GlassSurface,
  Text,
  useResponsive,
  useThemeContext,
  useBottomBarContext,
} from '@scaffald/ui'
import { colors, glassVibrantColors } from '@scaffald/ui/tokens'
import { BlurView } from './NativeBlurView'
import { usePathname, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EMPLOYER_MOBILE_SECTIONS, MOBILE_SECTIONS, type MobileSection } from './config'
import { useAppMode } from '@scf/core/utils/useAppMode'

// ── Constants ──

const PILL_HEIGHT = 56
const TAB_VERTICAL_PAD = 6
const ICON_SIZE = 22
const LABEL_FONT_SIZE = 11
const ACTIVE_INDICATOR_RADIUS = 22
const PILL_HORIZONTAL_PAD = 6
const PILL_BORDER_RADIUS = 32

// ── Helpers ──

/** Dev override — visit any page with ?forceMobile=1 on web to test mobile layout. */
function shouldForceMobile(): boolean {
  if (typeof window === 'undefined' || !window.location) return false // platform-allow: web-only dev flag
  return new URLSearchParams(window.location.search).has('forceMobile') // platform-allow: web-only dev flag
}

/** Index of the tab owning `pathname`, or -1 when the route isn't a tab section. */
function getActiveSectionIndex(pathname: string, sections: MobileSection[]): number {
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    for (const prefix of section.matchPrefixes) {
      if (pathname === prefix || pathname.startsWith(prefix)) {
        return i
      }
    }
  }
  // Previously fell back to 0, so Profile/employer screens lit up Home (#385).
  return -1
}

// ── GlassTabBar ──
// Platform-branched blur surface. Callers render children inside without
// needing to branch on platform themselves.

const pillShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 12,
}

function GlassTabBar({ children, theme }: { children: ReactNode; theme: 'light' | 'dark' }) {
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)'

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.pillWrapper, pillShadow, { borderColor }]}>
        <BlurView intensity={80} tint="systemChromeMaterial" style={styles.blurFill}>
          {children}
        </BlurView>
      </View>
    )
  }

  if (Platform.OS === 'android') {
    const fallbackBg = theme === 'dark' ? 'rgba(30,30,30,0.85)' : 'rgba(245,245,245,0.88)'
    return (
      <View style={[styles.pillWrapper, pillShadow, { borderColor, backgroundColor: fallbackBg }]}>
        <BlurView
          intensity={40}
          tint={theme === 'dark' ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.blurFill}
        >
          {children}
        </BlurView>
      </View>
    )
  }

  // Web: CSS backdrop-filter via GlassSurface.
  // "thin" (45% white) let page text read straight through the bar on every
  // scrolled screen (#378) — backdrop-filter blur isn't enough on its own.
  // "thick" (88%) keeps the glass look while staying legible over content.
  return (
    <GlassSurface
      material="thick"
      radius="3xl"
      elevated
      style={[
        styles.webSurface,
        {
          boxShadow: '0 6px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          // Near-opaque backing: even at material="thick" (84%) scrolled text
          // stayed legible through the pill (#378). Keeps the backdrop blur
          // for depth at the edges while making the surface itself read solid.
          backgroundColor: theme === 'dark' ? 'rgba(28,28,30,0.97)' : 'rgba(252,251,249,0.97)',
        } as object,
      ]}
    >
      {children}
    </GlassSurface>
  )
}

// ── Component ──

export function MobileBottomNav() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { setNavBarHeight } = useBottomBarContext()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()
  const { mode } = useAppMode()

  // The bar mirrors the role you are in. Employer mode used to hide it
  // altogether — correct in that worker tabs must not imply worker context on
  // employer screens (#385), but it left an employer on a phone with no primary
  // navigation at all. Now each mode has its own tab set.
  const sections = mode === 'employer' ? EMPLOYER_MOBILE_SECTIONS : MOBILE_SECTIONS
  const visible = isMobile || shouldForceMobile()

  // Register nav height so page-level BottomBars can offset above the pill.
  // PILL_HEIGHT (56) + paddingTop (8) + gap (8) = 72.
  useEffect(() => {
    setNavBarHeight(visible ? 72 : 0)
    return () => setNavBarHeight(0)
  }, [visible, setNavBarHeight])

  const activeIndex = useMemo(() => getActiveSectionIndex(pathname, sections), [pathname, sections])

  const indicatorX = useRef(new Animated.Value(0)).current
  const indicatorWidth = useRef(new Animated.Value(0)).current
  const tabLayoutsRef = useRef<Array<{ x: number; width: number } | null>>(sections.map(() => null))

  // Switching mode swaps the tab set, and the two sets are different lengths.
  // The layout cache is a ref, so it keeps its old size unless we clear it —
  // which would leave the active pill measuring a tab that is no longer there.
  useEffect(() => {
    tabLayoutsRef.current = sections.map(() => null)
  }, [sections])

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

  if (!visible) return null

  const resolvedTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'
  const vibrant = glassVibrantColors[resolvedTheme]
  const inactiveText = vibrant.tertiaryText
  const activeText = colors.primary[600]
  const activeBg = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)'

  const handleTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout
    const next = { x, width }
    const prev = tabLayoutsRef.current[index]
    tabLayoutsRef.current[index] = next
    if (index === activeIndex && (!prev || prev.x !== x || prev.width !== width)) {
      indicatorX.setValue(x)
      indicatorWidth.setValue(width)
    }
  }

  const handleTabPress = (section: MobileSection, index: number) => {
    if (index === activeIndex) return
    router.push(section.route)
  }

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
      <GlassTabBar theme={resolvedTheme}>
        <View style={styles.tabRow}>
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
              // No tab owns this route (e.g. Profile, employer screens) —
              // hide the pill rather than stranding it on Home (#385).
              opacity: activeIndex < 0 ? 0 : 1,
            }}
          />

          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = index === activeIndex
            return (
              <Pressable
                key={section.key}
                onPress={() => handleTabPress(section, index)}
                onLayout={handleTabLayout(index)}
                accessibilityRole="tab"
                // Both, deliberately. react-native-web 0.21 maps `aria-selected`
                // but has NO mapping for `accessibilityState` — so the state
                // below reaches native and nothing else, and on web the active
                // tab was never announced. Verified against
                // react-native-web/dist/modules/createDOMProps: the excluded-prop
                // list carries aria-selected/accessibilitySelected and no
                // accessibilityState entry.
                accessibilityState={{ selected: isActive }}
                aria-selected={isActive}
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
      </GlassTabBar>
    </View>
  )
}

const styles = StyleSheet.create({
  pillWrapper: {
    borderRadius: PILL_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    height: PILL_HEIGHT,
  },
  blurFill: {
    flex: 1,
  },
  webSurface: {
    height: PILL_HEIGHT,
  },
  tabRow: {
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: PILL_HORIZONTAL_PAD,
    position: 'relative',
  },
})
