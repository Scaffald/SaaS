import { useNotificationDeviceRegistration } from '@scf/core/hooks/useNotificationDeviceRegistration'
import {
  useNotificationPreferences,
  useNotifications,
  useUnreadCount,
  useMarkAsReadMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useQueryClient } from '@tanstack/react-query'
import { useThemeContext, useResponsive, Avatar, Row, Text, BottomBarProvider } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { NotificationItem } from '@scf/core/components/notifications'
import { ROUTES, } from '@scf/core/constants/routes'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomDrawer } from './CustomDrawer'
import { DrawerProvider, useDrawer } from './DrawerContext'
import { DrawerContent } from './DrawerContent'
import { MobileBottomNav } from './MobileBottomNav'

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
}

const DRAWER_WIDTH_FULL = 300
const DRAWER_WIDTH_COLLAPSED = 92

export function DrawerLayout(props: DrawerLayoutProps) {
  return (
    <BottomBarProvider>
      <DrawerProvider>
        <DrawerLayoutInner {...props} />
      </DrawerProvider>
    </BottomBarProvider>
  )
}

/**
 * Dev-only override: visit any page with `?forceMobile=1` (web only) to
 * render the mobile drawer + bottom-nav layout at any viewport width.
 * Useful for inspecting the mobile chrome on a desktop browser without
 * needing DevTools device toolbar.
 */
function shouldForceMobile(): boolean {
  if (typeof window === 'undefined' || !window.location) return false
  return new URLSearchParams(window.location.search).has('forceMobile')
}

function DrawerLayoutInner({ protectionComponent, children, hideDrawer }: DrawerLayoutProps) {
  const { width } = useResponsive()
  const { theme } = useThemeContext()
  const router = useRouter()
  const { session } = useSessionContext()
  const { close, toggle } = useDrawer()
  const isSmall = width < 1024 || shouldForceMobile()
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)

  const { data: preferencesData } = useNotificationPreferences({
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })
  const pushEnabled = preferencesData?.data?.push_notifications ?? true
  useNotificationDeviceRegistration(pushEnabled)

  const { data: notificationsData } = useNotifications({ limit: 25 })
  const { data: unreadCountData } = useUnreadCount({ enabled: !!session })
  const unreadCount = unreadCountData?.data?.unread_count ?? 0

  const { data: profileData } = useGeneralInfoWidget()
  const avatarUrl = profileData?.avatar_url ?? profileData?.avatar_path ?? undefined
  const firstName = profileData?.privateData?.first_name ?? ''
  const avatarInitials = (firstName.charAt(0) || 'U').toUpperCase()
  const avatarAlt = profileData?.display_name ?? firstName
  const isVerified = profileData?.idVerificationBadge?.badge_status === 'active'

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
  const _transformedNotifications: NotificationItem[] = (notificationsData?.data ?? []).map(
    (notification: unknown): NotificationItem => {
      const item = notification as {
        id: string
        type: NotificationItem['type']
        severity?: NotificationItem['severity'] | null
        title: string
        body?: { preview?: string | null } | null
        preview?: string | null
        message?: string | null
        created_at: string
        read?: boolean | null
        cta_url?: string | null
        cta_label?: string | null
        routed_channels?: string[] | null
      }
      return {
        id: item.id,
        type: item.type,
        severity: item.severity ?? 'info',
        title: item.title,
        preview:
          typeof item.body?.preview === 'string'
            ? item.body.preview
            : (item.preview ?? item.message ?? ''),
        createdAt: item.created_at,
        read: item.read ?? false,
        ctaUrl: item.cta_url ?? undefined,
        ctaLabel: item.cta_label ?? undefined,
        channels: Array.isArray(item.routed_channels) ? item.routed_channels : [],
      }
    }
  )

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

  const renderMobileHeader = useCallback(
    ({ options }: { options: { title?: string } }) => {
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
      return (
        <View
          style={{
            paddingTop: insets.top,
            backgroundColor: 'transparent',
          }}
        >
          <Row
            gap={12}
            align="center"
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              minHeight: 44,
            }}
          >
            <Pressable
              onPress={toggle}
              hitSlop={8}
              accessibilityLabel="Open navigation drawer"
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Avatar
                size={32}
                src={avatarUrl}
                initials={avatarInitials}
                verified={isVerified}
                badgeCount={unreadCount}
                alt={avatarAlt}
              />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              {options.title ? (
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 17, fontWeight: '600' }}
                >
                  {options.title}
                </Text>
              ) : null}
            </View>
            <Row gap={16} align="center">
              <Pressable
                onPress={() => setSearchActive(true)}
                hitSlop={8}
                accessibilityLabel="Search"
                accessibilityRole="button"
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Search size={22} color={colors.icon[theme].default} />
              </Pressable>
            </Row>
          </Row>
        </View>
      )
    },
    [
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
      toggle, 
      unreadCount
    ]
  )

  const drawerContentNode = (
    <DrawerContent
      onClose={close}
      isCollapsed={!isSmall && isDrawerCollapsed}
      canCollapse={!isSmall}
      onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
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
        <Stack
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
      </CustomDrawer>
      {isSmall && !hideDrawer ? <MobileBottomNav /> : null}
    </View>
  )
}
