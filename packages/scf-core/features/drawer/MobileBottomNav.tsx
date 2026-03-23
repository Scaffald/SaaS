import { ROUTES } from '@scf/core/constants/routes'
import { Text, useThemeContext, useResponsive, Popover, PopoverContent, GlassSurface, useBottomBarContext } from '@scaffald/ui'
import { colors, glassVibrantColors } from '@scaffald/ui/tokens'
import { usePathname, useRouter } from 'expo-router'
import { ChevronLeft, Search, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  TextInput,
  UIManager,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MOBILE_SECTIONS, type MobileSection, type MobileTabItem } from './config'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

/** Determine which section the user is currently in based on pathname. */
function getActiveSection(pathname: string): MobileSection | null {
  for (const section of MOBILE_SECTIONS) {
    for (const prefix of section.matchPrefixes) {
      if (pathname === prefix || pathname.startsWith(prefix)) {
        return section
      }
    }
  }
  if (pathname === ROUTES.DASHBOARD.path || pathname === '/dashboard') {
    return MOBILE_SECTIONS[0]
  }
  return null
}

/** Check if a sub-item tab is active */
function isTabActive(tab: { route: string; exact?: boolean }, pathname: string): boolean {
  if (tab.exact) return pathname === tab.route
  return pathname === tab.route || pathname.startsWith(`${tab.route}/`)
}

// ============================================================================
// Constants
// ============================================================================

const PILL_HEIGHT = 44
const BUTTON_SIZE = 44
const ICON_SIZE = 20
const ACTIVE_DOT_SIZE = 36
const BAR_GAP = 8

// ============================================================================
// Component
// ============================================================================

export function MobileBottomNav() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { globalBarHidden } = useBottomBarContext()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useRef<TextInput>(null)

  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const activeSection = getActiveSection(pathname)

  // Hide when not mobile or when a page-level BottomBar is active
  if (!isMobile || globalBarHidden) return null

  const resolvedTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'
  const vibrant = glassVibrantColors[resolvedTheme]
  const iconMuted = vibrant.tertiaryText
  const iconDefault = vibrant.primaryText

  // ── Handlers ──

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push(ROUTES.DASHBOARD.path)
    }
  }

  const handleSectionTap = (section: MobileSection) => {
    if (activeSection?.key === section.key) {
      // Tapping active section → open popover with sub-items
      setPopoverOpen(true)
      return
    }
    router.push(section.route)
  }

  const handleSubItemTap = (item: MobileTabItem) => {
    setPopoverOpen(false)
    router.push(item.route)
  }

  const handleSearchOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setSearchActive(true)
    setPopoverOpen(false)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const handleSearchClose = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setSearchActive(false)
    setSearchQuery('')
  }

  // ── Search results ──

  const getSearchResults = () => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results: { label: string; route: string; section: string; icon: MobileTabItem['icon'] }[] = []
    for (const section of MOBILE_SECTIONS) {
      // Match section itself
      if (section.label.toLowerCase().includes(q)) {
        results.push({
          label: section.label,
          route: section.route,
          section: 'Sections',
          icon: section.icon,
        })
      }
      // Match sub-items
      for (const item of section.subItems) {
        if (item.label.toLowerCase().includes(q)) {
          results.push({
            label: item.label,
            route: item.route,
            section: section.label,
            icon: item.icon,
          })
        }
      }
    }
    return results.slice(0, 8)
  }

  const searchResults = searchActive ? getSearchResults() : []

  // ── Sub-menu popover content ──

  const renderPopoverContent = () => {
    if (!activeSection) return null
    return (
      <View style={{ minWidth: 200, paddingVertical: 4 }}>
        <Text
          size="xs"
          weight="semibold"
          style={{
            color: colors.text[resolvedTheme].tertiary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {activeSection.label}
        </Text>
        {activeSection.subItems.map((item) => {
          const Icon = item.icon
          const isActive = isTabActive(item, pathname)
          return (
            <Pressable
              key={item.key}
              onPress={() => handleSubItemTap(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: pressed
                  ? colors.bg[resolvedTheme].subtle
                  : isActive
                    ? colors.bg[resolvedTheme].subtle
                    : 'transparent',
                borderRadius: 8,
                marginHorizontal: 4,
              })}
            >
              <Icon
                size={18}
                color={isActive ? colors.primary[600] : iconDefault}
              />
              <Text
                size="sm"
                weight={isActive ? 'semibold' : 'regular'}
                style={{
                  color: isActive
                    ? colors.primary[600]
                    : colors.text[resolvedTheme].primary,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    )
  }

  // ── Search mode ──

  if (searchActive) {
    return (
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 8,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        {/* Search results popover */}
        {searchResults.length > 0 && (
          <GlassSurface
            material="thick"
            radius="lg"
            elevated
            style={{
              marginBottom: 8,
              paddingVertical: 4,
            }}
          >
            {searchResults.map((result, i) => {
              const Icon = result.icon
              return (
                <Pressable
                  key={`${result.route}-${i}`}
                  onPress={() => {
                    handleSearchClose()
                    router.push(result.route)
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: pressed
                      ? colors.bg[resolvedTheme].subtle
                      : 'transparent',
                    borderRadius: 8,
                    marginHorizontal: 4,
                  })}
                >
                  <Icon size={18} color={iconMuted} />
                  <View style={{ flex: 1 }}>
                    <Text size="sm" style={{ color: colors.text[resolvedTheme].primary }}>
                      {result.label}
                    </Text>
                    <Text size="xs" style={{ color: colors.text[resolvedTheme].tertiary }}>
                      {result.section}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </GlassSurface>
        )}

        {/* Search input bar */}
        <GlassSurface
          material="regular"
          radius="3xl"
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: PILL_HEIGHT,
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <Search size={18} color={iconMuted} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={colors.text[resolvedTheme].tertiary}
            style={{
              flex: 1,
              fontSize: 15,
              color: colors.text[resolvedTheme].primary,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
            } as Record<string, unknown>}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <Pressable onPress={handleSearchClose} hitSlop={8}>
            <X size={18} color={iconMuted} />
          </Pressable>
        </GlassSurface>
      </View>
    )
  }

  // ── Default bar ──

  return (
    <View
      style={{
        position: Platform.OS === 'web' ? ('fixed' as never) : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: insets.bottom + 8,
        paddingHorizontal: 16,
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: BAR_GAP,
      }}
    >
      {/* Back button */}
      <Pressable onPress={handleBack} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <GlassSurface
          material="regular"
          radius="3xl"
          elevated
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={ICON_SIZE} color={iconDefault} />
        </GlassSurface>
      </Pressable>

      {/* Center pill with section icons */}
      <View style={{ flex: 1 }}>
        <Popover
          placement="top"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          trigger="manual"
          content={
            <PopoverContent>{renderPopoverContent()}</PopoverContent>
          }
        >
          <GlassSurface
            material="regular"
            radius="3xl"
            elevated
            style={{
              height: PILL_HEIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              paddingHorizontal: 8,
            }}
          >
            {MOBILE_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = activeSection?.key === section.key
              return (
                <Pressable
                  key={section.key}
                  onPress={() => handleSectionTap(section)}
                  style={({ pressed }) => ({
                    width: ACTIVE_DOT_SIZE,
                    height: ACTIVE_DOT_SIZE,
                    borderRadius: ACTIVE_DOT_SIZE / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive
                      ? colors.primary[600]
                      : pressed
                        ? colors.bg[resolvedTheme].subtle
                        : 'transparent',
                  })}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={isActive ? '#fff' : iconMuted}
                  />
                </Pressable>
              )
            })}
          </GlassSurface>
        </Popover>
      </View>

      {/* Search button */}
      <Pressable onPress={handleSearchOpen} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <GlassSurface
          material="regular"
          radius="3xl"
          elevated
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search size={ICON_SIZE} color={iconDefault} />
        </GlassSurface>
      </Pressable>
    </View>
  )
}
