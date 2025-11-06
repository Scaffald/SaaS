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

  // Fetch notifications
  const { data: notifications = [], isLoading: isLoadingNotifications } =
    api.notifications.list.useQuery({ limit: 50 })

  // Fetch unread count
  const { data: unreadCountData } = api.notifications.getUnreadCount.useQuery()
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
  const transformedNotifications: NotificationItem[] = notifications.map(
    (n: {
      id: string
      type: string
      title: string
      message: string
      created_at: string
      read: boolean
      destination_url: string | null
    }) => ({
      id: n.id,
      type: n.type as 'success' | 'warning' | 'info',
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      read: n.read,
      destination_url: n.destination_url,
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
