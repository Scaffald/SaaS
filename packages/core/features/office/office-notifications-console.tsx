import { api } from '@app/core/utils/api'
import { NotificationTag } from '@unicornlove/ui'
import { AlertCircle, RefreshCw } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, ScrollView, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

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
  const [status, setStatus] = useState<DeliveryStatus>('queued')

  const deliveriesQuery = api.notifications.admin.deliveries.useQuery({
    status,
    limit: 50,
  })
  const digestQuery = api.notifications.admin.digestQueue.useQuery({ limit: 50 })

  const deliveries = (deliveriesQuery.data ?? []) as NotificationDelivery[]
  const digestItems = (digestQuery.data ?? []) as DigestQueueItem[]

  return (
    <YStack gap="$6">
      <YStack gap="$2">
        <Text fontSize="$9" fontWeight="700">
          Notification Operations
        </Text>
        <Text fontSize="$3" color="$color10">
          Monitor delivery workers, inspect failures, and triage digest backlogs.
        </Text>
      </YStack>

      <YStack gap="$3">
        <XStack justify="space-between" items="center">
          <Text fontSize="$7" fontWeight="600">
            Delivery Queue
          </Text>
          <Button
            size="$2"
            theme="info"
            icon={RefreshCw}
            onPress={() => deliveriesQuery.refetch()}
            disabled={deliveriesQuery.isRefetching}
          >
            Refresh
          </Button>
        </XStack>

        <XStack gap="$2" flexWrap="wrap">
          {DELIVERY_STATUSES.map((value) => {
            const isActive = status === value

            return (
              <Button
                key={value}
                size="$2"
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
        </XStack>

        {deliveriesQuery.isLoading ? (
          <YStack items="center" gap="$3" mt="$4">
            <Spinner size="large" color="$color10" />
            <Text color="$color10">Loading deliveries…</Text>
          </YStack>
        ) : deliveries.length === 0 ? (
          <YStack gap="$3" items="center" mt="$4">
            <AlertCircle size={32} color="$color8" />
            <Text color="$color10">No deliveries match this filter.</Text>
          </YStack>
        ) : (
          <YStack borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            <XStack bg="$color2" p="$3" gap="$3">
              <Text flex={2} fontWeight="600">
                Notification
              </Text>
              <Text flex={1} fontWeight="600">
                Channel
              </Text>
              <Text flex={1} fontWeight="600">
                Status
              </Text>
              <Text flex={1} fontWeight="600">
                Attempts
              </Text>
              <Text flex={2} fontWeight="600">
                Last error
              </Text>
              <Text flex={1} fontWeight="600">
                Updated
              </Text>
            </XStack>

            {deliveries.map((delivery, index) => {
              const notification = delivery.notification
              const severity = notification?.severity ?? 'info'
              const tagTheme = severityThemeMap[severity]

              return (
                <YStack key={delivery.id} bg={index % 2 === 0 ? '$color1' : '$color2'} p="$3">
                  <XStack gap="$3" items="center">
                    <YStack flex={2} gap="$1">
                      <XStack gap="$2" items="center">
                        <Text fontWeight="600" color="$color12" numberOfLines={1}>
                          {notification?.title ?? 'Untitled notification'}
                        </Text>
                        <NotificationTag size="sm" themeName={tagTheme} textColorToken="$color12">
                          {severity.toUpperCase()}
                        </NotificationTag>
                      </XStack>
                      <Text fontSize="$2" color="$color10" numberOfLines={2}>
                        {notification?.preview ?? notification?.message ?? '—'}
                      </Text>
                    </YStack>
                    <Text flex={1} color="$color11">
                      {formatChannel(delivery.channel)}
                    </Text>
                    <NotificationTag
                      size="md"
                      themeName={delivery.status === 'failed' ? 'error' : 'gray'}
                      flex={1}
                      justify="center"
                      textColorToken="$color12"
                    >
                      {delivery.status}
                    </NotificationTag>
                    <Text flex={1} color="$color11">
                      {delivery.attempts}
                    </Text>
                    <Text flex={2} color="$color10" numberOfLines={1}>
                      {delivery.last_error ?? '—'}
                    </Text>
                    <Text flex={1} color="$color10">
                      {formatDate(delivery.updated_at)}
                    </Text>
                  </XStack>
                </YStack>
              )
            })}
          </YStack>
        )}
      </YStack>

      <Separator bg="$color3" />

      <YStack gap="$3">
        <XStack justify="space-between" items="center">
          <Text fontSize="$7" fontWeight="600">
            Digest Backlog
          </Text>
          <Button
            size="$2"
            theme="info"
            icon={RefreshCw}
            onPress={() => digestQuery.refetch()}
            disabled={digestQuery.isRefetching}
          >
            Refresh
          </Button>
        </XStack>

        {digestQuery.isLoading ? (
          <YStack items="center" gap="$3" mt="$4">
            <Spinner size="large" color="$color10" />
            <Text color="$color10">Loading digest queue…</Text>
          </YStack>
        ) : digestItems.length === 0 ? (
          <YStack gap="$3" items="center" mt="$4">
            <AlertCircle size={32} color="$color8" />
            <Text color="$color10">Digest queue is empty.</Text>
          </YStack>
        ) : (
          <YStack borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            <XStack bg="$color2" p="$3" gap="$3">
              <Text flex={1} fontWeight="600">
                User ID
              </Text>
              <Text flex={1} fontWeight="600">
                Type
              </Text>
              <Text flex={1} fontWeight="600">
                Bucket
              </Text>
              <Text flex={1} fontWeight="600">
                Count
              </Text>
              <Text flex={2} fontWeight="600">
                Channels
              </Text>
              <Text flex={1} fontWeight="600">
                Last event
              </Text>
            </XStack>

            {digestItems.map((item, index) => (
              <XStack
                key={item.id}
                gap="$3"
                p="$3"
                bg={index % 2 === 0 ? '$color1' : '$color2'}
                items="flex-start"
              >
                <Text flex={1} color="$color11" numberOfLines={1}>
                  {item.user_id}
                </Text>
                <Text flex={1} color="$color11">
                  {item.type}
                </Text>
                <Text flex={1} color="$color11">
                  {item.bucket}
                </Text>
                <Text flex={1} color="$color11">
                  {item.count}
                </Text>
                <Text flex={2} color="$color11">
                  {Array.isArray(item.channels) && item.channels.length > 0
                    ? item.channels.join(', ')
                    : '—'}
                </Text>
                <Text flex={1} color="$color10">
                  {formatDate(item.last_event_at)}
                </Text>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}

export function OfficeNotificationsConsoleScrollWrapper() {
  return (
    <ScrollView px="$6" py="$6">
      <OfficeNotificationsConsole />
    </ScrollView>
  )
}
