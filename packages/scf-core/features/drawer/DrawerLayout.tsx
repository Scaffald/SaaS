import { useNotificationDeviceRegistration } from '@scf/core/hooks/useNotificationDeviceRegistration'
import {
  useNotificationPreferences,
  useNotifications,
  useUnreadCount,
  useMarkAsReadMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useQueryClient } from '@tanstack/react-query'
import { shadows, useThemeContext, useResponsive, Row } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { NotificationItem } from '@scf/core/components/notifications'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from 'lucide-react-native'
import { Drawer } from 'expo-router/drawer'
import { useRouter } from 'expo-router'
import { useEffect, useState, type ReactNode } from 'react'
import { Pressable } from 'react-native'
import { DrawerContent } from './DrawerContent'
import { MobileBottomNav } from './MobileBottomNav'
import { AccountSwitcher } from '@scf/core/features/dev/AccountSwitcher'
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
  const _unreadCount = unreadCountData?.data?.unread_count ?? 0

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
    <>
      {protectionComponent}

      <Drawer
        screenOptions={({ navigation }) => ({
          drawerType: isSmall ? 'front' : 'permanent',
          swipeEnabled: isSmall,
          headerShown: isSmall,
          contentStyle: { paddingBottom: isSmall ? 56 : 0 },
          headerStyle: {
            backgroundColor: colors.bg[theme].default,
            borderWidth: 0,
          },
          headerLeftContainerStyle: {
            paddingLeft: 20,
          },
          headerRightContainerStyle: {
            paddingRight: 20,
          },
          headerTitleStyle: {
            color: colors.text[theme].primary,
          },
          drawerStyle: {
            backgroundColor: colors.bg[theme].default,
            borderRightWidth: 0,
            borderRadius: 0,
            width: drawerWidth,
            maxWidth: drawerWidth,
            minWidth: drawerWidth,
          },
          overlayColor: shadows.xs.shadowColor,
          headerLeft: () => {
            return isSmall ? (
              <Pressable
                onPress={() => {
                  navigation.dispatch(DrawerActions.toggleDrawer())
                }}
              >
                <Menu size={24} />
              </Pressable>
            ) : null
          },
          headerRight: () =>
            isSmall ? (
              <Pressable
                onPress={() => router.push(buildPath(ROUTES.DASHBOARD.SETTINGS.NOTIFICATIONS, {}))}
                style={{ paddingRight: 4 }}
              >
                <Bell size={22} color={colors.icon[theme].default} />
              </Pressable>
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
      <AccountSwitcher />
      {/* TODO: Uncomment this when we implement fully */}
      {/* {!hideDrawer ? <FeedbackWidget /> : null} */}
    </>
  )
}
