import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Button, useTheme, YStack, Text, XStack, useMedia } from 'tamagui'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { NotificationDropdown } from '@app/ui'
import { UserMenuAvatar } from './UserMenuAvatar'
import { DrawerMenu } from './DrawerMenu'
import { api } from '@app/core/utils/api'
import type { NotificationItem } from '@app/ui'
import { useNotificationDeviceRegistration } from '@app/core/hooks/useNotificationDeviceRegistration'
import { FeedbackWidget } from '@app/core/features/feedback'
import { OfficeFlyout } from '@app/core/features/office-navigation'
import { useUserRoles } from '@app/core/utils/auth/useUserRoles'

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
  // Use Tamagui media hook to check breakpoint
  // $gtMd = minWidth: 981px (permanent drawer)
  // When width > 980px: gtMd is true, permanent drawer
  // When width <= 980px: gtMd is false, front drawer
  const media = useMedia()
  const theme = useTheme()
  const isSmall = !media.gtMd // Permanent drawer when gtMd, front drawer otherwise
  const navigation = useNavigation()
  const { hasOfficeRole } = useUserRoles()

  // Automatically open drawer on large screens (permanent drawer mode)
  useEffect(() => {
    if (!hideDrawer && !isSmall) {
      // Open drawer when screen is large enough for permanent drawer
      navigation.dispatch(DrawerActions.openDrawer())
    }
  }, [hideDrawer, isSmall, navigation])
  const { data: preferencesData } = api.notifications.preferences.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  })

  const pushEnabled = preferencesData
    ? preferencesData.globalEnabled && preferencesData.channelEnabled.push
    : true

  useNotificationDeviceRegistration(pushEnabled)

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    api.notifications.list.useQuery({ limit: 25 })

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
  const transformedNotifications: NotificationItem[] = (notificationsData?.items ?? []).map(
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
                    {/* Show OfficeFlyout if user has office role */}
                    {hasOfficeRole && <OfficeFlyout />}
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
          }
        }}
        drawerContent={hideDrawer ? () => null : (props) => <DrawerMenu {...props} />}
      >
        {children}
      </Drawer>
      {/* TODO: Uncomment this when we implement fully */}
      {/* {!hideDrawer ? <FeedbackWidget /> : null} */}
    </>
  )
}
