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
import { shadows, useThemeContext, useResponsive, Avatar, Row, Text, BottomBarProvider } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { NotificationItem } from '@scf/core/components/notifications'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DrawerActions } from '@react-navigation/native'
import { ArrowLeft, Bell, Search, X } from 'lucide-react-native'
import { Drawer } from 'expo-router/drawer'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DrawerContent } from './DrawerContent'
import { MobileBottomNav } from './MobileBottomNav'
import { ScaffaldLogo } from '@scf/core/assets'

interface DrawerLayoutProps {
  /**
   * Protection component to render while checking auth/permissions
   * Should return null if not authorized, or children if authorized
   */
  protectionComponent: ReactNode
  /**
   * Child Drawer.Screen components
   */
  children: ReactNode
  /**
   * Whether to hide the drawer and header (e.g., during prerequisites completion)
   */
  hideDrawer?: boolean
}

/**
 * Shared drawer layout component used by both dashboard and office sections
 * Provides consistent drawer behavior, styling, and responsive design
 */
export function DrawerLayout({ protectionComponent, children }: DrawerLayoutProps) {
  const { width } = useResponsive()
  const { theme } = useThemeContext()
  const router = useRouter()
  const { session } = useSessionContext()
  // Permanent drawer when width >= 1024px, front drawer otherwise
  const isSmall = width < 1024
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)
  const { data: preferencesData } = useNotificationPreferences({
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const pushEnabled = preferencesData?.data?.push_notifications ?? true

  useNotificationDeviceRegistration(pushEnabled)

  // Fetch notifications
  const { data: notificationsData, isPending: _isLoadingNotifications } = useNotifications({
    limit: 25,
  })

  // Fetch unread count only when authenticated to avoid 400 from OpenAPI validation
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

  const closeSearch = () => {
    setSearchActive(false)
    setSearchQuery('')
  }

  const submitSearch = () => {
    const q = searchQuery.trim()
    closeSearch()
    const base = ROUTES.SEARCH.path
    router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base)
  }

  useEffect(() => {
    if (searchActive) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [searchActive])

  // Mark as read mutation
  const queryClient = useQueryClient()
  const markAsReadMutation = useMarkAsReadMutation({
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'unread-count'] })
    },
  })

  // Handle notification click
  const _handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
  }

  // Handle mark as read
  const _handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  // Transform notifications to match NotificationItem interface
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

  const drawerWidth = isSmall ? undefined : isDrawerCollapsed ? 92 : 300

  return (
    <BottomBarProvider>
      {protectionComponent}

      <Drawer
        screenOptions={({ navigation }) => ({
          drawerType: isSmall ? 'front' : 'permanent',
          swipeEnabled: isSmall,
          headerShown: isSmall,
          contentStyle: { paddingBottom: isSmall ? 56 : 0 },
          headerStyle: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          headerLeftContainerStyle: {
            paddingLeft: 20,
          },
          headerRightContainerStyle: {
            paddingRight: 20,
          },
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: colors.text[theme].primary,
          },
          drawerStyle: {
            backgroundColor: 'transparent',
            borderRightWidth: 0,
            borderRadius: 0,
            width: drawerWidth,
            maxWidth: drawerWidth,
            minWidth: drawerWidth,
          },
          overlayColor: shadows.xs.shadowColor,
          header: isSmall && searchActive
            ? () => (
                <View
                  style={{
                    paddingTop: insets.top,
                    backgroundColor: colors.bg[theme].default,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border[theme].subtle,
                  }}
                >
                  <Row
                    gap={8}
                    align="center"
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
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
            : undefined,
          headerLeft: () => {
            return isSmall ? (
              <Pressable
                onPress={() => {
                  navigation.dispatch(DrawerActions.toggleDrawer())
                }}
                hitSlop={4}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Avatar
                  size={32}
                  src={avatarUrl}
                  initials={avatarInitials}
                  verified={isVerified}
                  alt={avatarAlt}
                />
              </Pressable>
            ) : null
          },
          headerRight: () =>
            isSmall ? (
              <Row gap={16} align="center">
                <Pressable
                  onPress={() => setSearchActive(true)}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Search size={22} color={colors.icon[theme].default} />
                </Pressable>
                <Pressable
                  onPress={() => router.push(buildPath(ROUTES.DASHBOARD.NOTIFICATIONS, {}))}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingRight: 4 })}
                >
                  <View>
                    <Bell size={22} color={colors.icon[theme].default} />
                    {unreadCount > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -6,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: colors.primary[500],
                          paddingHorizontal: 4,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: colors.bg[theme].default,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '700',
                            color: '#ffffff',
                            lineHeight: 11,
                          }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </Row>
            ) : (
              <Row gap={12} align="center">
                <ScaffaldLogo height={22} width={22} showWordmark={false} />
              </Row>
            ),
        })}
        drawerContent={(props) => (
          <DrawerContent
            {...props}
            isCollapsed={!isSmall && isDrawerCollapsed}
            canCollapse={!isSmall}
            onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
          />
        )}
      >
        {children}
      </Drawer>
      {isSmall && <MobileBottomNav />}
      {/* TODO: Uncomment this when we implement fully */}
      {/* {!hideDrawer ? <FeedbackWidget /> : null} */}
    </BottomBarProvider>
  )
}
