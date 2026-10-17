/**
 * Full-page notifications center — the "See all" target from the drawer feed.
 * Hairline rows shared with DrawerNotificationsFeed; opening a row navigates
 * to its `ctaUrl` and marks it read.
 */
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Info, Settings as SettingsIcon } from 'lucide-react-native'
import { Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight } from '@scaffald/ui/tokens'
import { ROUTES } from '@scf/core/constants/routes'
import { useNotifications, useUnreadCount } from '@scf/core/utils/notifications-sdk-hooks'
import { useAppMode } from '@scf/core/utils/useAppMode'
import { filterNotificationsForMode } from './audience'
import { NotificationRow } from './components/NotificationRow'
import { toNotificationItems } from './normalize'
import { useMarkAllNotificationsRead, useOpenNotification } from './useNotificationActions'

const LIST_LIMIT = 50

/**
 * Rendered as the layout's `screenActions`, so these sit at header right with
 * every other page-level action.
 */
export function NotificationsHeaderActions() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const unreadCount = useUnreadCount().data?.data?.unread_count ?? 0
  const markAllRead = useMarkAllNotificationsRead()

  return (
    <Row align="center" gap={8}>
      {unreadCount > 0 ? (
        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications read"
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: 8,
            opacity: pressed || markAllRead.isPending ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.medium,
              color: colors.text[theme].attention,
            }}
          >
            Mark all read
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        // Settings' Notifications tab owns the preferences (#1212).
        onPress={() =>
          router.push({
            pathname: ROUTES.DASHBOARD.SETTINGS.path,
            params: { section: 'notifications' },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Notification settings"
        hitSlop={8}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border[theme].default,
          backgroundColor: pressed ? colors.bg[theme].subtle : 'transparent',
        })}
      >
        <SettingsIcon size={16} color={colors.icon[theme].default} />
        <Text size="sm" style={{ color: colors.text[theme].primary }}>
          Settings
        </Text>
      </Pressable>
    </Row>
  )
}

export function NotificationsCenterScreen() {
  const { theme } = useThemeContext()
  const query = useNotifications({ limit: LIST_LIMIT })
  // The inbox is scoped to the role in use, as the prototype's worker and
  // employer views are (#1178). Wait for the stored mode rather than flash the
  // worker list at someone who is in employer mode.
  const { mode, isLoading: modeLoading } = useAppMode()
  const items = useMemo(
    () => filterNotificationsForMode(toNotificationItems(query.data), mode),
    [query.data, mode]
  )
  const openNotification = useOpenNotification()

  if (query.isLoading || modeLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ paddingVertical: 48 }}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading notifications…</Text>
      </Stack>
    )
  }

  if (items.length === 0) {
    return (
      <Stack align="center" gap={6} style={{ paddingVertical: 48 }} testID="notifications-center">
        <Info size={28} color={colors.icon[theme].muted} />
        <Text style={{ color: colors.text[theme].secondary }}>You're all caught up.</Text>
      </Stack>
    )
  }

  return (
    <View
      testID="notifications-center"
      style={{ borderTopWidth: 1, borderTopColor: colors.border[theme].default }}
    >
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} onPress={openNotification} />
      ))}
    </View>
  )
}
