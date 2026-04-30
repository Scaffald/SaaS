/**
 * Compact, scrollable notifications feed embedded inside the mobile drawer.
 * Shows recent notifications with tap-to-read + tap-to-navigate behavior.
 * "See all" link routes to the full notifications page.
 */

import { useCallback, useMemo } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import { AlertCircle, ChevronRight, Info, ShieldAlert } from 'lucide-react-native'
import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  useMarkAsReadMutation,
  useNotifications,
} from '@scf/core/utils/notifications-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'
import { useQueryClient } from '@tanstack/react-query'

type Severity = 'critical' | 'important' | 'info'

type FeedItem = {
  id: string
  title: string
  preview: string
  createdAt: string
  read: boolean
  severity: Severity
  ctaUrl?: string
}

const FEED_LIMIT = 8
const FEED_MAX_HEIGHT = 320

function severityColor(severity: Severity) {
  switch (severity) {
    case 'critical':
      return colors.error[500]
    case 'important':
      return colors.warning[500]
    default:
      return colors.blue[500]
  }
}

function severityIcon(severity: Severity) {
  switch (severity) {
    case 'critical':
      return ShieldAlert
    case 'important':
      return AlertCircle
    default:
      return Info
  }
}

function formatRelative(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`
  const diffWk = Math.floor(diffDay / 7)
  if (diffWk < 5) return `${diffWk}w`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export type DrawerNotificationsFeedProps = {
  /** Called after navigating from a notification (so the parent can close the drawer). */
  onNavigate?: () => void
}

export function DrawerNotificationsFeed({ onNavigate }: DrawerNotificationsFeedProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const notificationsQuery = useNotifications({ limit: FEED_LIMIT })
  const markRead = useMarkAsReadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({
        queryKey: ['scaffald', 'notifications', 'unread-count'],
      })
    },
  })

  const items: FeedItem[] = useMemo(() => {
    const raw = (notificationsQuery.data as { data?: { items?: unknown[] } } | undefined)?.data
      ?.items
    const list = (raw ?? (notificationsQuery.data as { items?: unknown[] } | undefined)?.items) ?? []
    return (list as Array<Record<string, unknown>>).map((n) => ({
      id: String(n.id ?? ''),
      title: String(n.title ?? ''),
      preview:
        typeof (n.body as { preview?: string } | undefined)?.preview === 'string'
          ? String((n.body as { preview?: string }).preview)
          : typeof n.preview === 'string'
            ? (n.preview as string)
            : typeof n.message === 'string'
              ? (n.message as string)
              : '',
      createdAt: String(n.created_at ?? ''),
      read: Boolean(n.read),
      severity: ((n.severity as Severity) ?? 'info') as Severity,
      ctaUrl: typeof n.cta_url === 'string' ? (n.cta_url as string) : undefined,
    }))
  }, [notificationsQuery.data])

  const handleItemPress = useCallback(
    (item: FeedItem) => {
      if (!item.read) markRead.mutate(item.id)
      if (item.ctaUrl) {
        router.push(item.ctaUrl as Href)
        onNavigate?.()
      }
    },
    [markRead, onNavigate, router]
  )

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
        borderRadius: 16,
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
          <Stack gap={2}>
            {items.map((item) => {
              const Icon = severityIcon(item.severity)
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}${item.read ? '' : ', unread'}`}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    borderRadius: 10,
                    backgroundColor: pressed ? colors.bg[theme].muted : 'transparent',
                  })}
                >
                  <Row align="flex-start" gap={10}>
                    <View style={{ paddingTop: 2 }}>
                      <Icon size={18} color={severityColor(item.severity)} />
                    </View>
                    <Stack flex={1} gap={2}>
                      <Row align="center" justify="space-between" gap={8}>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            color: colors.text[theme].primary,
                            fontSize: 13,
                            fontWeight: item.read ? '500' : '700',
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={{
                            color: colors.text[theme].tertiary,
                            fontSize: 11,
                            fontWeight: '500',
                          }}
                        >
                          {formatRelative(item.createdAt)}
                        </Text>
                      </Row>
                      {item.preview ? (
                        <Text
                          numberOfLines={2}
                          style={{
                            color: colors.text[theme].secondary,
                            fontSize: 12,
                            lineHeight: 16,
                          }}
                        >
                          {item.preview}
                        </Text>
                      ) : null}
                    </Stack>
                    {!item.read ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.primary[500],
                          marginTop: 6,
                        }}
                      />
                    ) : null}
                  </Row>
                </Pressable>
              )
            })}
          </Stack>
        </ScrollView>
      )}
    </Stack>
  )
}
