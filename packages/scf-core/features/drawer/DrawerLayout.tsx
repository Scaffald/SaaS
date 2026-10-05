import { useNotificationDeviceRegistration } from '@scf/core/hooks/useNotificationDeviceRegistration'
import {
  useNotificationPreferences,
  useUnreadCount,
  useMarkAsReadMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useQueryClient } from '@tanstack/react-query'
import { useThemeContext, useResponsive, Avatar, Row, Text } from '@scaffald/ui'
import { borderRadius, colors, fontSize, lineHeight } from '@scaffald/ui/tokens'
import { ScaffaldLogo } from '@scf/core/assets'
import type { NotificationItem } from '@scf/core/components/notifications'
import { ROUTES } from '@scf/core/constants/routes'
import { ArrowLeft, Bell, Search, X } from 'lucide-react-native'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomDrawer } from './CustomDrawer'
import { DrawerProvider, useDrawer } from './DrawerContext'
import { DrawerContent } from './DrawerContent'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileAccountSheet } from './MobileAccountSheet'
import { SectionTabs } from './SectionTabs'

interface DrawerLayoutProps {
  /**
   * Protection component to render while checking auth/permissions
   * Should return null if not authorized, or children if authorized
   */
  protectionComponent: ReactNode
  /**
   * Child Stack.Screen components
   */
  children: ReactNode
  /**
   * Whether to hide the drawer and header (e.g., during prerequisites completion)
   */
  hideDrawer?: boolean
  /**
   * Wraps every screen the navigator renders. The Office stack passes
   * `scrollingScreenLayout` so its screens scroll on a phone (#796).
   */
  screenLayout?: ComponentProps<typeof Stack>['screenLayout']
}

const DRAWER_WIDTH_FULL = 300

/** Masthead controls are 44pt targets around 21px glyphs, the prototype's floor. */
const mastheadStyles = StyleSheet.create({
  control: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.xxs,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
})
const DRAWER_WIDTH_COLLAPSED = 92

export function DrawerLayout(props: DrawerLayoutProps) {
  // BottomBarProvider used to wrap this. It now lives at the app root (see
  // scf-core/provider/index.tsx) so that the cookie banner, which renders up
  // there, can read the height this layout's tab bar publishes.
  return (
    <DrawerProvider>
      <DrawerLayoutInner {...props} />
    </DrawerProvider>
  )
}

/**
 * Dev-only override: visit any page with `?forceMobile=1` (web only) to
 * render the mobile drawer + bottom-nav layout at any viewport width.
 * Useful for inspecting the mobile chrome on a desktop browser without
 * needing DevTools device toolbar.
 */
function shouldForceMobile(): boolean {
  if (typeof window === 'undefined' || !window.location) return false // platform-allow: web-only dev flag
  return new URLSearchParams(window.location.search).has('forceMobile') // platform-allow: web-only dev flag
}

function DrawerLayoutInner({
  protectionComponent,
  children,
  hideDrawer,
  screenLayout,
}: DrawerLayoutProps) {
  const { width } = useResponsive()
  const { theme } = useThemeContext()
  const router = useRouter()
  const { session } = useSessionContext()
  const { close } = useDrawer()
  const isSmall = width < 1024 || shouldForceMobile()
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)

  const { data: preferencesData } = useNotificationPreferences({
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })
  const pushEnabled = preferencesData?.data?.push_notifications ?? true
  useNotificationDeviceRegistration(pushEnabled)

  const { data: unreadCountData } = useUnreadCount({ enabled: !!session })
  const unreadCount = unreadCountData?.data?.unread_count ?? 0

  const { data: profileData } = useGeneralInfoWidget()
  const avatarUrl = profileData?.avatar_url ?? profileData?.avatar_path ?? undefined
  const firstName = profileData?.privateData?.first_name ?? ''
  const lastName = profileData?.privateData?.last_name ?? ''
  // Match ProfileHero's name + initials logic so the header avatar and the
  // dashboard profile card never disagree (SC-87): first+last when both exist,
  // otherwise fall back to display_name / username.
  const avatarName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : (profileData?.display_name ?? profileData?.username ?? '')
  const avatarInitials =
    avatarName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  const avatarAlt = profileData?.display_name ?? avatarName
  const isVerified = profileData?.idVerificationBadge?.badge_status === 'active'

  // The masthead avatar opens the account sheet, not the navigation drawer.
  //
  // It used to open the drawer, and was the ONLY thing that did on a phone —
  // so this could not move until the drawer had another door. The bottom bar's
  // More tab is that door, added in the same change. Both halves are the
  // prototype's arrangement: the bar carries navigation and More, the avatar
  // carries account and role.
  const [accountOpen, setAccountOpen] = useState(false)
  const openAccount = useCallback(() => setAccountOpen(true), [])
  const closeAccount = useCallback(() => setAccountOpen(false), [])

  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const insets = useSafeAreaInsets()

  const closeSearch = useCallback(() => {
    setSearchActive(false)
    setSearchQuery('')
  }, [])

  const submitSearch = useCallback(() => {
    const q = searchQuery.trim()
    closeSearch()
    const base = ROUTES.SEARCH.path
    router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base)
  }, [searchQuery, closeSearch, router])

  useEffect(() => {
    if (searchActive) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [searchActive])

  const queryClient = useQueryClient()
  const markAsReadMutation = useMarkAsReadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'unread-count'] })
    },
  })

  const _handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
  }
  const _handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  useEffect(() => {
    if (isSmall && isDrawerCollapsed) {
      setIsDrawerCollapsed(false)
    }
  }, [isDrawerCollapsed, isSmall])

  const drawerWidth = isSmall
    ? DRAWER_WIDTH_FULL
    : isDrawerCollapsed
      ? DRAWER_WIDTH_COLLAPSED
      : DRAWER_WIDTH_FULL

  const renderMobileHeader = useCallback(() => {
    if (searchActive) {
      return (
        <View
          style={{
            paddingTop: insets.top,
            backgroundColor: colors.bg[theme].default,
            borderBottomWidth: 1,
            borderBottomColor: colors.border[theme].subtle,
          }}
        >
          <Row gap={8} align="center" style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Pressable
              onPress={closeSearch}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
            >
              <ArrowLeft size={22} color={colors.icon[theme].default} />
            </Pressable>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.bg[theme].subtle,
                borderRadius: 999,
              }}
            >
              <Search size={18} color={colors.icon[theme].muted} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={submitSearch}
                placeholder="Search Scaffald"
                placeholderTextColor={colors.text[theme].tertiary}
                returnKeyType="search"
                autoCorrect={false}
                style={[
                  {
                    flex: 1,
                    fontSize: 15,
                    color: colors.text[theme].primary,
                    paddingVertical: 0,
                  },
                  { outlineStyle: 'none' } as object,
                ]}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <X size={16} color={colors.icon[theme].muted} />
                </Pressable>
              ) : null}
            </View>
          </Row>
        </View>
      )
    }
    // The masthead: logo / search / bell with its count / avatar, on a
    // hairline — the prototype's arrangement (#976). It used to be avatar /
    // centred screen title / search: the title now comes from each screen's
    // ScreenHeader, the unread count moves from the avatar's corner to a
    // bell of its own, and the logo takes the left edge so a phone screen
    // says whose app it is. The section's tabs ride beneath the row.
    return (
      <View style={{ paddingTop: insets.top, backgroundColor: colors.bg[theme].default }}>
        <Row
          gap={4}
          align="center"
          style={{
            paddingHorizontal: 16,
            height: 52,
            borderBottomWidth: 1,
            borderBottomColor: colors.border[theme].subtle,
          }}
        >
          <Pressable
            onPress={() => router.push(ROUTES.DASHBOARD.path)}
            accessibilityRole="link"
            accessibilityLabel="Scaffald home"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginRight: 'auto' })}
          >
            <ScaffaldLogo height={18} width={108} showWordmark />
          </Pressable>
          <Pressable
            onPress={() => setSearchActive(true)}
            accessibilityLabel="Search"
            accessibilityRole="button"
            style={({ pressed }) => [mastheadStyles.control, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Search size={21} color={colors.icon[theme].default} />
          </Pressable>
          <Pressable
            onPress={() => router.push(ROUTES.DASHBOARD.NOTIFICATIONS.path)}
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            accessibilityRole="link"
            style={({ pressed }) => [mastheadStyles.control, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Bell size={21} color={colors.icon[theme].default} />
            {unreadCount > 0 ? (
              <View style={[mastheadStyles.badge, { backgroundColor: colors.primary[600] }]}>
                <Text
                  style={StyleSheet.flatten([mastheadStyles.badgeText, { color: colors.white }])}
                >
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={openAccount}
            accessibilityLabel="Account and role"
            accessibilityRole="button"
            style={({ pressed }) => [
              mastheadStyles.control,
              { marginRight: -10, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Avatar
              size={32}
              src={avatarUrl}
              initials={avatarInitials}
              verified={isVerified}
              alt={avatarAlt}
            />
          </Pressable>
        </Row>
        {/* The section's tabs ride under the masthead on a phone, where the
              shell has no column to put them beside. */}
        <SectionTabs />
      </View>
    )
  }, [
    avatarAlt,
    avatarInitials,
    avatarUrl,
    closeSearch,
    insets.top,
    isVerified,
    searchActive,
    searchQuery,
    submitSearch,
    theme,
    openAccount,
    unreadCount,
    router,
  ])

  const drawerContentNode = (
    <DrawerContent
      onClose={close}
      isCollapsed={!isSmall && isDrawerCollapsed}
      canCollapse={!isSmall}
      onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
      unreadCount={unreadCount}
    />
  )

  const showHeader = isSmall && !hideDrawer

  return (
    <View style={{ flex: 1 }}>
      {protectionComponent}
      <CustomDrawer
        permanent={!isSmall && !hideDrawer}
        drawerWidth={drawerWidth}
        drawerContent={drawerContentNode}
        panelBackgroundColor={colors.bg[theme].default}
      >
        {/* What used to nest under a drawer section is the section's tab
            strip, across the top of its screens. On desktop it sits here,
            between the column and the screen; on a phone it rides in the
            masthead above. */}
        {!isSmall && !hideDrawer ? <SectionTabs /> : null}
        <Stack
          screenLayout={screenLayout}
          screenOptions={{
            headerShown: showHeader,
            header: showHeader ? renderMobileHeader : undefined,
            contentStyle: {
              backgroundColor: colors.bg[theme].default,
            },
          }}
        >
          {children}
        </Stack>
        {isSmall && !hideDrawer ? <MobileBottomNav /> : null}
        {isSmall && !hideDrawer ? (
          <MobileAccountSheet
            visible={accountOpen}
            onClose={closeAccount}
            avatarUrl={avatarUrl}
            avatarInitials={avatarInitials}
            name={avatarName || 'Your account'}
            subtitle={profileData?.headline ?? undefined}
            verified={isVerified}
            unreadCount={unreadCount}
          />
        ) : null}
      </CustomDrawer>
    </View>
  )
}
