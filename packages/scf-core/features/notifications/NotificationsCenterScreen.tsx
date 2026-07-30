/**
 * Full-page notifications center — the "See all" target from the drawer feed.
 * Lists notifications (tap to read + navigate), with a link to preferences.
 * Reuses the SDK hooks; mirrors the row styling of DrawerNotificationsFeed.
 */
import { useCallback, useMemo } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import { AlertCircle, Info, Settings as SettingsIcon, ShieldAlert } from 'lucide-react-native'
import { Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import { useMarkAsReadMutation, useNotifications } from '@scf/core/utils/notifications-sdk-hooks'
import { toNotificationItems } from './normalize'

type Severity = 'critical' | 'important' | 'info'

type Item = {
  id: string
  title: string
  preview: string
  createdAt: string
  read: boolean
  severity: Severity
  ctaUrl?: string
}

const LIST_LIMIT = 50

function severityColor(s: Severity) {
  return s === 'critical' ? colors.error[500] : s === 'important' ? colors.warning[500] : colors.blue[500]
}
function severityIcon(s: Severity) {
  return s === 'critical' ? ShieldAlert : s === 'important' ? AlertCircle : Info
}
function formatRelative(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  const min = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotificationsCenterScreen() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const queryClient = useQueryClient()

  const query = useNotifications({ limit: LIST_LIMIT })
  const markRead = useMarkAsReadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'unread-count'] })
    },
  })

  const items = useMemo(() => toNotificationItems(query.data), [query.data])

  const onPress = useCallback(
    (item: Item) => {
      if (!item.read) markRead.mutate(item.id)
      if (item.ctaUrl) router.push(item.ctaUrl as Href)
    },
    [markRead, router],
  )

  return (
    <Stack gap={12} style={{ padding: 16 }} testID="notifications-center">
      <Row align="center" justify="space-between">
        <Text style={{ color: colors.text[theme].primary, fontSize: 20, fontWeight: '700' }}>
          Notifications
        </Text>
        <Pressable
          onPress={() => router.push('/dashboard/notifications/settings' as Href)}
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

      {query.isLoading ? (
        <Stack align="center" justify="center" gap={12} style={{ paddingVertical: 48 }}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading notifications…</Text>
        </Stack>
      ) : items.length === 0 ? (
        <Stack align="center" gap={6} style={{ paddingVertical: 48 }}>
          <Info size={28} color={colors.icon[theme].muted} />
          <Text style={{ color: colors.text[theme].secondary }}>You're all caught up.</Text>
        </Stack>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Stack gap={2}>
            {items.map((item) => {
              const Icon = severityIcon(item.severity)
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}${item.read ? '' : ', unread'}`}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                    backgroundColor: pressed ? colors.bg[theme].muted : 'transparent',
                  })}
                >
                  <Row align="flex-start" gap={12}>
                    <View style={{ paddingTop: 2 }}>
                      <Icon size={20} color={severityColor(item.severity)} />
                    </View>
                    <Stack flex={1} gap={2}>
                      <Row align="center" justify="space-between" gap={8}>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            color: colors.text[theme].primary,
                            fontSize: 14,
                            fontWeight: item.read ? '500' : '700',
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11, fontWeight: '500' }}>
                          {formatRelative(item.createdAt)}
                        </Text>
                      </Row>
                      {item.preview ? (
                        <Text numberOfLines={2} style={{ color: colors.text[theme].secondary, fontSize: 13, lineHeight: 18 }}>
                          {item.preview}
                        </Text>
                      ) : null}
                    </Stack>
                    {!item.read ? (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500], marginTop: 6 }} />
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
