import { useNotificationDeviceRegistration } from '@app/core/hooks/useNotificationDeviceRegistration'
import { api } from '@app/core/utils/api'
import { shadows } from '@scaffald/neue-ui'
import type { NotificationItem } from '@app/core/components/notifications'
import { DrawerActions } from '@react-navigation/native'
import { Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useEffect, useState, type ReactNode } from 'react'
import { Pressable } from 'react-native'
import { useTheme, useWindowDimensions, XStack } from 'tamagui'
import { DrawerContent } from './DrawerContent'
import { ScaffaldLogo } from '@app/core/assets'

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
  const theme = useTheme()
  // Permanent drawer when width >= 1024px, front drawer otherwise
  const isSmall = width < 1024
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false)
  const { data: preferencesData } = api.notifications.preferences.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const pushEnabled = preferencesData
    ? preferencesData.globalEnabled && preferencesData.channelEnabled.push
    : true

  useNotificationDeviceRegistration(pushEnabled)

  // Fetch notifications
  const { data: notificationsData, isLoading: _isLoadingNotifications } =
    api.notifications.list.useQuery({ limit: 25 })

  // Fetch unread count
  const { data: unreadCountData } = api.notifications.getUnreadCount.useQuery()
  const _unreadCount = unreadCountData?.count || 0

  // Mark as read mutation
  const utils = api.useUtils()
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      utils.notifications.list.invalidate()
      utils.notifications.getUnreadCount.invalidate()
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
            backgroundColor: theme.blue1.val,
            borderWidth: 0,
          },
          headerLeftContainerStyle: {
            paddingLeft: 20,
          },
          headerRightContainerStyle: {
            paddingRight: 20,
          },
          headerTitleStyle: {
            color: theme.color12.val,
          },
          drawerStyle: {
            backgroundColor: theme.color3.val,
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
            <XStack gap="$3" items="center">
              <ScaffaldLogo height={22} width={22} showWordmark={false} />
            </XStack>
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
