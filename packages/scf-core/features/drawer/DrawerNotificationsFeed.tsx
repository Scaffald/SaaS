/**
 * Compact, scrollable notifications feed embedded inside the mobile drawer.
 * Shows recent notifications on the same hairline rows as the full page.
 * "See all" link routes to the full notifications page.
 *
 * "Mark all read" sits BELOW the list rather than in the header (#940). Rows
 * without a `ctaUrl` are deliberately not pressable — a dead tap is worse than
 * an obviously inert row (#824) — but with no mark-read control on this
 * surface, an unread link-less notification could not be cleared from the
 * drawer at all while it kept the masthead badge lit. The badge is shared
 * state, so it showed everywhere and the only way out was to open the full
 * page.
 *
 * Below, not beside "See all", because the drawer is 300px wide: the uppercase
 * title, "Mark all read" and "See all" together need roughly 286px against the
 * ~250px this card actually has, and `Row` does not wrap. A full-width footer
 * has the room and is a bigger touch target.
 */

import { useCallback, useMemo } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'
import { useNotifications, useUnreadCount } from '@scf/core/utils/notifications-sdk-hooks'
import { toNotificationItems } from '@scf/core/features/notifications/normalize'
import { NotificationRow } from '@scf/core/features/notifications/components/NotificationRow'
import {
  useMarkAllNotificationsRead,
  useOpenNotification,
} from '@scf/core/features/notifications/useNotificationActions'
import { ROUTES } from '@scf/core/constants/routes'

const FEED_LIMIT = 8
const FEED_MAX_HEIGHT = 320

export type DrawerNotificationsFeedProps = {
  /** Called after navigating from a notification (so the parent can close the drawer). */
  onNavigate?: () => void
}

export function DrawerNotificationsFeed({ onNavigate }: DrawerNotificationsFeedProps) {
  const { theme } = useThemeContext()
  const router = useRouter()

  const notificationsQuery = useNotifications({ limit: FEED_LIMIT })
  const items = useMemo(
    () => toNotificationItems(notificationsQuery.data),
    [notificationsQuery.data]
  )
  const openNotification = useOpenNotification(onNavigate)
  const unreadCount = useUnreadCount().data?.data?.unread_count ?? 0
  const markAllRead = useMarkAllNotificationsRead()

  const handleSeeAllPress = useCallback(() => {
    router.push(ROUTES.DASHBOARD.NOTIFICATIONS.path)
    onNavigate?.()
  }, [onNavigate, router])

  const isLoading = notificationsQuery.isLoading
  const isEmpty = !isLoading && items.length === 0

  return (
    <Stack
      gap={8}
      style={{
        borderRadius: 7,
        backgroundColor: colors.bg[theme].subtle,
        borderWidth: 1,
        borderColor: colors.border[theme].subtle,
        padding: 12,
      }}
    >
      <Row align="center" justify="space-between">
        <Text
          style={{
            color: colors.text[theme].primary,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Notifications
        </Text>
        <Pressable
          onPress={handleSeeAllPress}
          accessibilityRole="link"
          accessibilityLabel="See all notifications"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Row align="center" gap={2}>
            <Text style={{ color: colors.primary[500], fontSize: 12, fontWeight: '600' }}>
              See all
            </Text>
            <ChevronRight size={14} color={colors.primary[500]} />
          </Row>
        </Pressable>
      </Row>

      {isLoading ? (
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12, paddingVertical: 12 }}>
          Loading…
        </Text>
      ) : isEmpty ? (
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12, paddingVertical: 12 }}>
          You're all caught up.
        </Text>
      ) : (
        <ScrollView
          style={{ maxHeight: FEED_MAX_HEIGHT }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {items.map((item, index) => (
            <NotificationRow
              key={item.id}
              item={item}
              onPress={openNotification}
              compact
              last={index === items.length - 1}
            />
          ))}
        </ScrollView>
      )}

      {unreadCount > 0 ? (
        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications read"
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || markAllRead.isPending ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: colors.text[theme].attention,
              fontSize: fontSize.xs,
              fontWeight: '600',
            }}
          >
            Mark all read
          </Text>
        </Pressable>
      ) : null}
    </Stack>
  )
}
