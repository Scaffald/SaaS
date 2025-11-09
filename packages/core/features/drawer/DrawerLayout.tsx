import type { ReactNode } from 'react'
import { Button, useTheme, YStack, Text, XStack } from 'tamagui'
import { DrawerActions } from '@react-navigation/native'
import { Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useWindowDimensions } from 'tamagui'
import { NotificationDropdown } from '@app/ui'
import { UserMenuAvatar } from './UserMenuAvatar'
import { DrawerMenu } from './DrawerMenu'
import { api } from '@app/core/utils/api'
import type { NotificationItem } from '@app/ui'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { useNotificationDeviceRegistration } from '@app/core/hooks/useNotificationDeviceRegistration'

const NOTIFICATIONS_ROUTE: Href = '/dashboard/notifications'

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
export function DrawerLayout({
  protectionComponent,
  children,
  hideDrawer = false,
}: DrawerLayoutProps) {
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const isSmall = width < 1400
  const router = useRouter()

  const { data: preferencesData } = api.notifications.preferences.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const pushEnabled = preferencesData
    ? preferencesData.globalEnabled && preferencesData.channelEnabled.push
    : true

  useNotificationDeviceRegistration(pushEnabled)

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = api.notifications.list.useQuery({ limit: 25 })

  // Fetch unread count
  const { data: unreadCountData, refetch: refetchUnread } =
    api.notifications.getUnreadCount.useQuery()
  const unreadCount = unreadCountData?.count || 0

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
  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsReadMutation.mutate({ id: notification.id })
    }
  }

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ id: notificationId })
  }

  // Transform notifications to match NotificationItem interface
  const transformedNotifications: NotificationItem[] = (notificationsData?.items ?? []).map(
    (n) => ({
      id: n.id,
      type: n.type,
      severity: n.severity ?? 'info',
      title: n.title,
      preview: typeof n.body?.preview === 'string' ? n.body.preview : n.preview ?? n.message ?? '',
      createdAt: n.created_at,
      read: n.read ?? false,
      ctaUrl: n.cta_url ?? undefined,
      ctaLabel: n.cta_label ?? undefined,
      channels: Array.isArray(n.routed_channels) ? n.routed_channels : [],
    })
  )

  return (
    <>
      {protectionComponent}

      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: !hideDrawer,
          drawerType: hideDrawer ? 'back' : isSmall ? 'front' : 'permanent',
          swipeEnabled: hideDrawer ? false : isSmall,
          ...(hideDrawer
            ? {}
            : {
                headerStyle: {
                  backgroundColor: theme.color2.val,
                },
                headerLeftContainerStyle: {},
                headerTitleStyle: {
                  color: theme.color12.val,
                  marginLeft: isSmall ? 0 : 35,
                },
                headerLeft: () => (
                  <Button
                    borderStyle="unset"
                    borderWidth={0}
                    bg="transparent"
                    display={isSmall ? 'flex' : 'none'}
                    ml="$5"
                    px="$4"
                    height={30}
                    onPress={() => {
                      navigation.dispatch(DrawerActions.toggleDrawer())
                    }}
                  >
                    <Menu size={24} />
                  </Button>
                ),
                headerRight: () => (
                  <XStack gap="$3" items="center" px="$4">
                    <NotificationDropdown
                      notifications={transformedNotifications}
                      unreadCount={unreadCount}
                      isLoading={isLoadingNotifications}
                      onNotificationClick={handleNotificationClick}
                      onMarkAsRead={handleMarkAsRead}
                      onViewAll={() => {
                        router.push(NOTIFICATIONS_ROUTE)
                        setTimeout(() => {
                          refetchNotifications()
                          refetchUnread()
                        }, 250)
                      }}
                    />
                    <UserMenuAvatar />
                  </XStack>
                ),
              }),
          overlayColor: hideDrawer ? 'transparent' : 'rgba(0, 0, 0, 0.15)',
          drawerStyle: hideDrawer ? { width: 0, display: 'none' } : { width: 300 },
        })}
        drawerContent={hideDrawer ? () => null : (props) => <DrawerMenu {...props} />}
      >
        {children}
      </Drawer>
    </>
  )
}
