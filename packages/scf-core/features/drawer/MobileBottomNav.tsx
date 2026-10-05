/**
 * Mobile primary navigation — the flat strip at the foot of every phone
 * screen.
 *
 * The SCF prototype's bar is a strip, not a floating pill: full width, a
 * hairline on top, five slots at a 52px floor, an icon over an 11px label,
 * the active one in the accent and the rest in the secondary text colour.
 * Ours was a glass pill — blur, a 32px radius, a drop shadow, an animated
 * indicator sliding under the active tab (#975). Everything the pill did to
 * stay legible over scrolled content (#378) the strip gets for free by being
 * opaque.
 *
 * - The tab set mirrors the role you are in (worker / employer); see config.
 * - More opens the navigation drawer; it owns no route and never lights.
 * - Profile, settings, notifications and organisations live in the drawer
 *   and the account sheet, not here. Search lives in the masthead.
 */

import { Text, useResponsive, useThemeContext, useBottomBarContext } from '@scaffald/ui'
import { colors, fontSize, lineHeight } from '@scaffald/ui/tokens'
import { usePathname, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MoreHorizontal } from 'lucide-react-native'
import { EMPLOYER_MOBILE_SECTIONS, MOBILE_SECTIONS, type MobileSection } from './config'
import { useDrawer } from './DrawerContext'
import { useAppMode } from '@scf/core/utils/useAppMode'

// ── Constants ──

/** The strip's own height; the safe-area inset is added beneath it. */
export const BOTTOM_NAV_HEIGHT = 52
const ICON_SIZE = 21

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
  const { open: openDrawer } = useDrawer()
  const visible = isMobile || shouldForceMobile()

  // Register the strip's height so page-level BottomBars and the scrolling
  // screen wrapper can clear it; they add the safe-area inset themselves.
  useEffect(() => {
    setNavBarHeight(visible ? BOTTOM_NAV_HEIGHT : 0)
    return () => setNavBarHeight(0)
  }, [visible, setNavBarHeight])

  const activeIndex = useMemo(() => getActiveSectionIndex(pathname, sections), [pathname, sections])

  if (!visible) return null

  const resolvedTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'
  const activeColor = resolvedTheme === 'dark' ? colors.primary[300] : colors.primary[600]
  const inactiveColor = colors.text[resolvedTheme].secondary

  const handleTabPress = (section: MobileSection, index: number) => {
    if (index === activeIndex) return
    router.push(section.route)
  }

  const bottomPadding = Platform.OS === 'web' ? 0 : insets.bottom

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          position: Platform.OS === 'web' ? ('fixed' as never) : 'absolute',
          paddingBottom: bottomPadding,
          backgroundColor: colors.bg[resolvedTheme].default,
          borderTopColor: colors.border[resolvedTheme].subtle,
        },
      ]}
    >
      {sections.map((section, index) => {
        const Icon = section.icon
        const isActive = index === activeIndex
        const color = isActive ? activeColor : inactiveColor
        return (
          <Pressable
            key={section.key}
            onPress={() => handleTabPress(section, index)}
            accessibilityRole="tab"
            // Both, deliberately. react-native-web 0.21 maps `aria-selected`
            // but has NO mapping for `accessibilityState` — so the state
            // below reaches native and nothing else, and on web the active
            // tab was never announced (#638).
            accessibilityState={{ selected: isActive }}
            aria-selected={isActive}
            accessibilityLabel={section.label}
            style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Icon size={ICON_SIZE} color={color} />
            <Text
              style={StyleSheet.flatten([
                styles.label,
                { color, fontWeight: isActive ? '600' : '500' },
              ])}
            >
              {section.label}
            </Text>
          </Pressable>
        )
      })}

      {/* More — the drawer's door.
          The masthead avatar opens the account-and-role sheet, so the drawer
          needs this. It is deliberately NOT a section: it navigates nowhere,
          owns no route, and must never take the active colour, so keeping it
          out of `sections` keeps the index arithmetic honest. */}
      <Pressable
        onPress={openDrawer}
        accessibilityRole="button"
        accessibilityLabel="More — open navigation drawer"
        style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
      >
        <MoreHorizontal size={ICON_SIZE} color={inactiveColor} />
        <Text
          style={StyleSheet.flatten([styles.label, { color: inactiveColor, fontWeight: '500' }])}
        >
          More
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: BOTTOM_NAV_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 8,
    paddingBottom: 9,
  },
  label: {
    fontSize: fontSize.xxs,
    lineHeight: lineHeight.xxs,
    letterSpacing: 0.2,
  },
})
