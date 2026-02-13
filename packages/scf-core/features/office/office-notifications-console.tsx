import { api } from '@scf/core/utils/api'
import { NotificationTag, useThemeContext } from '@scaffald/ui'
import { AlertCircle, RefreshCw } from 'lucide-react-native'
import { useState } from 'react'
import { Button, ScrollView, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface NotificationDelivery {
  id: string
  channel: string
  status: string
  attempts: number
  last_error?: string | null
  updated_at?: string | null
  notification?: {
    severity?: 'info' | 'important' | 'critical'
    title?: string | null
    preview?: string | null
    message?: string | null
  } | null
}

interface DigestQueueItem {
  id: string
  user_id: string
  type: string
  bucket: string
  count: number
  channels?: string[] | null
  last_event_at?: string | null
}

const DELIVERY_STATUSES = [
  'all',
  'queued',
  'sending',
  'sent',
  'delivered',
  'failed',
  'bounce',
  'blocked',
] as const

type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

const severityThemeMap: Record<'info' | 'important' | 'critical', 'info' | 'warning' | 'error'> = {
  info: 'info',
  important: 'warning',
  critical: 'error',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function formatChannel(channel: string) {
  switch (channel) {
    case 'email':
      return 'Email'
    case 'sms':
      return 'SMS'
    case 'push':
      return 'Push'
    default:
      return channel
  }
}

export function OfficeNotificationsConsole() {
  const { theme } = useThemeContext()
  const [status, setStatus] = useState<DeliveryStatus>('queued')

  const deliveriesQuery = api.notifications.admin.deliveries.useQuery({
    status,
    limit: 50,
  })
  const digestQuery = api.notifications.admin.digestQueue.useQuery({ limit: 50 })

  const deliveries = (deliveriesQuery.data ?? []) as NotificationDelivery[]
  const digestItems = (digestQuery.data ?? []) as DigestQueueItem[]

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Text>Notification Operations</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Monitor delivery workers, inspect failures, and triage digest backlogs.
        </Text>
      </Stack>

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text>Delivery Queue</Text>
          <Button
            size="xs"
            theme="info"
            iconStart={RefreshCw}
            onPress={() => deliveriesQuery.refetch()}
            disabled={deliveriesQuery.isRefetching}
          >
            Refresh
          </Button>
        </Row>

        <Row gap={8} flexWrap="wrap">
          {DELIVERY_STATUSES.map((value) => {
            const isActive = status === value

            return (
              <Button
                key={value}
                size="xs"
                theme={isActive ? 'info' : 'gray'}
                {...(!isActive ? { variant: 'outlined' as const } : {})}
                onPress={() => {
                  setStatus(value)
                  deliveriesQuery.refetch()
                }}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Button>
            )
          })}
        </Row>

        {deliveriesQuery.isLoading ? (
          <Stack align="center" gap={12} marginTop={16}>
            <Spinner size="lg" style={{ color: colors.text[theme].secondary }} />
            <Text style={{ color: colors.text[theme].secondary }}>Loading deliveries…</Text>
          </Stack>
        ) : deliveries.length === 0 ? (
          <Stack gap={12} align="center" marginTop={16}>
            <AlertCircle size={32} style={{ color: colors.text[theme].secondary }} />
            <Text style={{ color: colors.text[theme].secondary }}>
              No deliveries match this filter.
            </Text>
          </Stack>
        ) : (
          <Stack
            borderWidth={1}
            borderColor={colors.border[theme].default}
            borderRadius={16}
            overflow="hidden"
          >
            <Row style={{ backgroundColor: colors.bg[theme].subtle }} padding="sm" gap={12}>
              <Text flex={2}>Notification</Text>
              <Text flex={1}>Channel</Text>
              <Text flex={1}>Status</Text>
              <Text flex={1}>Attempts</Text>
              <Text flex={2}>Last error</Text>
              <Text flex={1}>Updated</Text>
            </Row>

            {deliveries.map((delivery, index) => {
              const notification = delivery.notification
              const severity = notification?.severity ?? 'info'
              const tagTheme = severityThemeMap[severity]

              return (
                <Stack
                  key={delivery.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? colors.bg[theme].onPrimary : colors.bg[theme].subtle,
                  }}
                  padding="sm"
                >
                  <Row gap={12} align="center">
                    <Stack flex={2} gap={4}>
                      <Row gap={8} align="center">
                        <Text style={{ color: colors.text[theme].secondary }}>
                          {notification?.title ?? 'Untitled notification'}
                        </Text>
                        <NotificationTag
                          size="sm"
                          themeName={tagTheme}
                          textColorToken={colors.text[theme].primary}
                        >
                          {severity.toUpperCase()}
                        </NotificationTag>
                      </Row>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {notification?.preview ?? notification?.message ?? '—'}
                      </Text>
                    </Stack>
                    <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                      {formatChannel(delivery.channel)}
                    </Text>
                    <NotificationTag
                      size="md"
                      themeName={delivery.status === 'failed' ? 'error' : 'gray'}
                      flex={1}
                      justify="center"
                      textColorToken={colors.text[theme].primary}
                    >
                      {delivery.status}
                    </NotificationTag>
                    <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                      {delivery.attempts}
                    </Text>
                    <Text flex={2} style={{ color: colors.text[theme].secondary }}>
                      {delivery.last_error ?? '—'}
                    </Text>
                    <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                      {formatDate(delivery.updated_at)}
                    </Text>
                  </Row>
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>

      <Separator style={{ backgroundColor: colors.bg[theme].muted }} />

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text>Digest Backlog</Text>
          <Button
            size="xs"
            theme="info"
            iconStart={RefreshCw}
            onPress={() => digestQuery.refetch()}
            disabled={digestQuery.isRefetching}
          >
            Refresh
          </Button>
        </Row>

        {digestQuery.isLoading ? (
          <Stack align="center" gap={12} marginTop={16}>
            <Spinner size="lg" style={{ color: colors.text[theme].secondary }} />
            <Text style={{ color: colors.text[theme].secondary }}>Loading digest queue…</Text>
          </Stack>
        ) : digestItems.length === 0 ? (
          <Stack gap={12} align="center" marginTop={16}>
            <AlertCircle size={32} style={{ color: colors.text[theme].secondary }} />
            <Text style={{ color: colors.text[theme].secondary }}>Digest queue is empty.</Text>
          </Stack>
        ) : (
          <Stack
            borderWidth={1}
            borderColor={colors.border[theme].default}
            borderRadius={16}
            overflow="hidden"
          >
            <Row style={{ backgroundColor: colors.bg[theme].subtle }} padding="sm" gap={12}>
              <Text flex={1}>User ID</Text>
              <Text flex={1}>Type</Text>
              <Text flex={1}>Bucket</Text>
              <Text flex={1}>Count</Text>
              <Text flex={2}>Channels</Text>
              <Text flex={1}>Last event</Text>
            </Row>

            {digestItems.map((item, index) => (
              <Row
                key={item.id}
                gap={12}
                padding="sm"
                style={{
                  backgroundColor:
                    index % 2 === 0 ? colors.bg[theme].onPrimary : colors.bg[theme].subtle,
                }}
                align="flex-start"
              >
                <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                  {item.user_id}
                </Text>
                <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                  {item.type}
                </Text>
                <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                  {item.bucket}
                </Text>
                <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                  {item.count}
                </Text>
                <Text flex={2} style={{ color: colors.text[theme].secondary }}>
                  {Array.isArray(item.channels) && item.channels.length > 0
                    ? item.channels.join(', ')
                    : '—'}
                </Text>
                <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                  {formatDate(item.last_event_at)}
                </Text>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

export function OfficeNotificationsConsoleScrollWrapper() {
  return (
    <ScrollView paddingHorizontal={24} paddingVertical={24}>
      <OfficeNotificationsConsole />
    </ScrollView>
  )
}
