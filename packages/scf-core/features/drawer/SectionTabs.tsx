import { useScreenRhythm } from '@scf/core/constants/layout'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useAppMode } from '@scf/core/utils/useAppMode'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { usePathname } from '@scf/core/utils/usePathname'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { Chip, Tabs, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { getNavItems } from './config'
import { useIsFocusMode } from './focus-mode'
import { getSectionTabs, stripEdgeFades, stripScrollTarget } from './section-tabs'
import { normalizePath } from './utils'

/**
 * The folder-tab strip across the top of a section's screens.
 *
 * Where the drawer used to open a section into an indented tree of its
 * children, the children are now tabs here — the prototype's arrangement,
 * and the same `Tabs type="folder"` every list screen already uses for its
 * primary partition. Rendered once by the shell, so a screen gets its tabs
 * without drawing them; a route the nav config does not claim gets nothing.
 */
export function SectionTabs() {
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const { t } = useTranslation()
  const { gutter, isDesktop } = useScreenRhythm()
  const { data: memberships } = useOrganizations()
  const { hasOfficeRole, hasRole } = useUserRoles()
  const isCheckAdmin = hasRole('background_check_admin')
  const { mode } = useAppMode()
  // A screen in focus mode — an assessment being taken — has no tabs (#1194).
  const focusMode = useIsFocusMode()

  const items = useMemo(
    () => getNavItems(memberships ?? undefined, hasOfficeRole, mode, isCheckAdmin),
    [memberships, hasOfficeRole, mode, isCheckAdmin]
  )
  const strip = useMemo(() => getSectionTabs(pathname, items), [pathname, items])

  const go = useCallback(
    (key: string) => {
      const tab = strip?.tabs.find((candidate) => candidate.key === key)
      if (tab && tab.key !== strip?.activeKey) router.push(tab.href as never)
    },
    [router, strip]
  )

  if (!strip || focusMode) return null

  const label = (tab: (typeof strip.tabs)[number]) =>
    tab.titleKey ? t(tab.titleKey) : (tab.title ?? tab.key)

  // On a phone the prototype does not draw folder tabs: a list screen's
  // partition is one row of chips, scrolling sideways, the chosen one tinted
  // (#980). Five folder tabs at 390px wrapped onto two rows of cards.
  if (!isDesktop) {
    return (
      <PhoneChipStrip
        tabs={strip.tabs.map((tab) => ({ key: tab.key, label: label(tab) }))}
        activeKey={strip.activeKey}
        gutter={gutter}
        onSelect={go}
      />
    )
  }

  return (
    <View testID="section-tabs" style={{ paddingHorizontal: gutter, paddingTop: 20 }}>
      <Tabs type="folder" value={strip.activeKey ?? ''} onValueChange={go}>
        {strip.tabs.map((tab) => (
          <Tabs.Item key={tab.key} value={tab.key}>
            <Tabs.Trigger>{label(tab)}</Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>
    </View>
  )
}

const CHIP_GAP = 6
const FADE_WIDTH = 24

/**
 * The phone's chip row. It scrolls sideways, so it has to say so: a fade on
 * each edge that hides more chips, a trailing gutter matching the leading one
 * (the last chip ran flush to the screen edge), and the active chip scrolled
 * on screen so a sub-route deep in the strip shows which tab owns it (#1120).
 * Exported for a screen's own folder tabs on a phone (Settings, #1212).
 */
export function PhoneChipStrip({
  tabs,
  activeKey,
  gutter,
  onSelect,
  testID = 'section-tabs',
}: {
  tabs: { key: string; label: string }[]
  activeKey: string | null
  gutter: number
  onSelect: (key: string) => void
  testID?: string
}) {
  const { theme } = useThemeContext()
  const scrollRef = useRef<ScrollView>(null)
  const chipLayouts = useRef(new Map<string, { x: number; width: number }>())
  const [viewportWidth, setViewportWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffsetX(event.nativeEvent.contentOffset.x)
  }, [])

  // Bring the active chip on screen once the row and the chip are measured.
  const [chipsMeasured, setChipsMeasured] = useState(0)
  useEffect(() => {
    if (!activeKey) return
    const layout = chipLayouts.current.get(activeKey)
    if (!layout) return
    const target = stripScrollTarget(layout, viewportWidth, gutter)
    if (target != null) scrollRef.current?.scrollTo({ x: target, animated: false })
  }, [activeKey, viewportWidth, gutter, chipsMeasured])

  const fades = stripEdgeFades(offsetX, contentWidth, viewportWidth)
  // The masthead's ground; the fade runs from clear to it.
  const ground = colors.bg[theme].default

  return (
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        testID={testID}
        accessibilityRole="tablist"
        style={{ flexGrow: 0 }}
        // The trailing gutter is a spacer, not paddingRight: a scroll
        // container's end padding is not reliably part of its scroll width
        // on web, which is how the last chip came to touch the edge.
        contentContainerStyle={{ paddingLeft: gutter, paddingVertical: 10, gap: CHIP_GAP }}
        onLayout={(event: LayoutChangeEvent) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey
          return (
            <View
              key={tab.key}
              onLayout={(event: LayoutChangeEvent) => {
                const { x, width } = event.nativeEvent.layout
                chipLayouts.current.set(tab.key, { x, width })
                if (tab.key === activeKey) setChipsMeasured((n) => n + 1)
              }}
            >
              <Chip
                size="md"
                tone={active ? 'accent' : 'neutral'}
                selected={active}
                onPress={() => onSelect(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                aria-selected={active}
              >
                {tab.label}
              </Chip>
            </View>
          )
        })}
        <View style={{ width: Math.max(0, gutter - CHIP_GAP) }} />
      </ScrollView>
      {fades.start ? (
        <LinearGradient
          start={[0, 0]}
          end={[1, 0]}
          colors={[ground, `${ground}00`]}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: FADE_WIDTH,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {fades.end ? (
        <LinearGradient
          start={[0, 0]}
          end={[1, 0]}
          colors={[`${ground}00`, ground]}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: FADE_WIDTH,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </View>
  )
}
