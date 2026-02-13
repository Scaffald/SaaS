import { useNotificationDeviceRegistration } from '@scf/core/hooks/useNotificationDeviceRegistration'
import {
  useNotificationPreferences,
  useNotifications,
  useUnreadCount,
  useMarkAsReadMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { shadows, useThemeContext, useWindowDimensions, Row } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { NotificationItem } from '@scf/core/components/notifications'
import { DrawerActions } from '@react-navigation/native'
import { Menu } from 'lucide-react-native'
import { Drawer } from 'expo-router/drawer'
import { useEffect, useState, type ReactNode } from 'react'
import { Pressable } from 'react-native'
import { DrawerContent } from './DrawerContent'
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
  const { width } = useWindowDimensions()
  const { theme } = useThemeContext()
  // Permanent drawer when width >= 1024px, front drawer otherwise
  const isSmall = width < 1024
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)
  const { data: preferencesData } = useNotificationPreferences({
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const pushEnabled = preferencesData
    ? preferencesData.globalEnabled && preferencesData.channelEnabled.push
    : true

  useNotificationDeviceRegistration(pushEnabled)

  // Fetch notifications
  const { data: notificationsData, isPending: _isLoadingNotifications } = useNotifications({
    limit: 25,
  })

  // Fetch unread count
  const { data: unreadCountData } = useUnreadCount()
  const _unreadCount = unreadCountData?.count || 0

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
      markAsReadMutation.mutate({ id: notification.id })
    }
  }

  // Handle mark as read
  const _handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ id: notificationId })
  }

  // Transform notifications to match NotificationItem interface
  const _transformedNotifications: NotificationItem[] = (notificationsData?.items ?? []).map(
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
            backgroundColor: colors.bg[theme].subtle,
            borderRightWidth: 0,
            borderRadius: 0,
            width: drawerWidth,
            maxWidth: drawerWidth,
            minWidth: drawerWidth,
          },
          overlayColor: shadows.shadowColor,
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
          headerRight: () => (
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
      {/* TODO: Uncomment this when we implement fully */}
      {/* {!hideDrawer ? <FeedbackWidget /> : null} */}
    </>
  )
}
