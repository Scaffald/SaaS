import { AccountDeletionPanel } from '@app/core/features/profile/components/AccountDeletionPanel'
import { SiteOverlapNotification } from '@app/core/features/notifications/components/SiteOverlapNotification'
import { api } from '@app/core/utils/api'
import { UIButton as Button, type NotificationItem, NotificationTag, ToggleSwitch } from '@app/ui'
import { AlertCircle, ExternalLink, Info, ShieldAlert } from '@tamagui/lucide-icons'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Input, Label, ScrollView, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

interface ApiNotification {
  id: string
  type: string
  severity?: NotificationItem['severity'] | null
  title: string
  body?: { preview?: string | null } | null
  preview?: string | null
  message?: string | null
  metadata?: {
    notification_type?: string
    site_id?: string
    overlapping_site_id?: string
    overlap_percent?: number
    threshold?: number
  } | null
  created_at: string
  read?: boolean | null
  cta_url?: string | null
  cta_label?: string | null
  routed_channels?: string[] | null
}

const FILTERS: Array<{ label: string; value: 'all' | 'unread' | 'archived' }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Archived', value: 'archived' },
]

const severityIconTokens: Record<NotificationItem['severity'], string> = {
  critical: '$red10',
  important: '$yellow10',
  info: '$blue10',
}

type SeverityIconProps = {
  IconComponent: ComponentType<{ size?: number; color?: string }>
  severity: NotificationItem['severity']
}

const SeverityIcon = ({ IconComponent, severity }: SeverityIconProps) => {
  const colorToken = severityIconTokens[severity] ?? '$blue10'
  return <IconComponent size={22} color={colorToken} />
}

function getSeverityIcon(severity: NotificationItem['severity']) {
  switch (severity) {
    case 'critical':
      return ShieldAlert
    case 'important':
      return AlertCircle
    default:
      return Info
  }
}

function getSeverityTheme(severity: NotificationItem['severity']) {
  switch (severity) {
    case 'critical':
      return 'error'
    case 'important':
      return 'warning'
    default:
      return 'info'
  }
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function mapNotification(apiNotification: ApiNotification): NotificationItem {
  return {
    id: apiNotification.id,
    type: apiNotification.type,
    severity: apiNotification.severity ?? 'info',
    title: apiNotification.title,
    preview:
      typeof apiNotification.body?.preview === 'string'
        ? apiNotification.body.preview
        : (apiNotification.preview ?? apiNotification.message ?? ''),
    createdAt: apiNotification.created_at,
    read: apiNotification.read ?? false,
    ctaUrl: apiNotification.cta_url ?? undefined,
    ctaLabel: apiNotification.cta_label ?? undefined,
    channels: Array.isArray(apiNotification.routed_channels) ? apiNotification.routed_channels : [],
  }
}

export default function NotificationsCenterScreen() {
  const router = useRouter()
  const utils = api.useUtils()
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const preferencesQuery = api.notifications.preferences.get.useQuery()
  const savePreferencesMutation = api.notifications.preferences.save.useMutation({
    onSuccess: () => {
      utils.notifications.preferences.get.invalidate()
    },
  })

  const notificationsQuery = api.notifications.list.useInfiniteQuery(
    { status: filter, limit: 25 },
    {
      getNextPageParam: (lastPage: { nextCursor?: string | null }) =>
        lastPage?.nextCursor ?? undefined,
      placeholderData: (previousData) => previousData,
    }
  )

  const unreadCountQuery = api.notifications.getUnreadCount.useQuery(undefined, {
    refetchOnMount: false,
  })
  const devicesQuery = api.notifications.devices.list.useQuery(undefined, {
    refetchOnMount: false,
  })

  type DeviceRow = {
    id: number
    token: string
    platform: string
    last_seen_at?: string | null
    updated_at?: string | null
    created_at?: string | null
  }

  const deviceRows: DeviceRow[] = devicesQuery.data ?? []

  const markReadMutation = api.notifications.markManyRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate()
      utils.notifications.getUnreadCount.invalidate()
    },
  })

  const markUnreadMutation = api.notifications.markManyUnread.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate()
      utils.notifications.getUnreadCount.invalidate()
    },
  })

  const archiveMutation = api.notifications.archiveMany.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  })

  const restoreMutation = api.notifications.restoreMany.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  })

  const notifications: NotificationItem[] = useMemo(
    () =>
      (notificationsQuery.data?.pages ?? [])
        .flatMap(
          (page: { items?: ApiNotification[] | null } | null | undefined) => page?.items ?? []
        )
        .map(mapNotification),
    [notificationsQuery.data]
  )

  const unreadCount = unreadCountQuery.data?.count ?? 0
  const isEmpty = notifications.length === 0 && !notificationsQuery.isLoading

  const [preferences, setPreferences] = useState({
    globalEnabled: true,
    channelEnabled: { in_app: true, email: true, push: true, sms: false },
    digestFrequency: 'immediate' as 'immediate' | 'digest_daily' | 'digest_weekly' | 'mute',
    quietHours: null as { start: string; end: string } | null,
  })

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences({
        globalEnabled: preferencesQuery.data.globalEnabled,
        channelEnabled: {
          in_app: preferencesQuery.data.channelEnabled.in_app,
          email: preferencesQuery.data.channelEnabled.email,
          push: preferencesQuery.data.channelEnabled.push,
          sms: preferencesQuery.data.channelEnabled.sms,
        },
        digestFrequency: preferencesQuery.data.digestFrequency,
        quietHours: preferencesQuery.data.quietHours ?? null,
      })
    }
  }, [preferencesQuery.data])

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({
      globalEnabled: preferences.globalEnabled,
      channelEnabled: preferences.channelEnabled,
      quietHours: preferences.quietHours ?? undefined,
      digestFrequency: preferences.digestFrequency,
    })
  }

  const handleNavigate = (notification: NotificationItem) => {
    if (notification.ctaUrl) {
      router.push(notification.ctaUrl as Href)
    }
  }

  return (
    <ScrollView px="$6" py="$6">
      <YStack gap="$6">
        <YStack gap="$2">
          <Text fontSize="$9" fontWeight="700">
            Notifications
          </Text>
          <Text fontSize="$3" color="$color10">
            Stay up to date with applications, opportunities, and platform updates.
          </Text>
        </YStack>

        <YStack
          gap="$4"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$4"
          bg="$color1"
        >
          <XStack justify="space-between" items="center">
            <YStack gap="$1">
              <Text fontSize="$6" fontWeight="600">
                Preferences
              </Text>
              <Text fontSize="$3" color="$color10">
                Control how and when we reach you.
              </Text>
            </YStack>
            <Button
              variant="primary"
              size="$2"
              disabled={savePreferencesMutation.isPending}
              onPress={handleSavePreferences}
            >
              {savePreferencesMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </XStack>

          <Separator bg="$color3" />

          <YStack gap="$3">
            <XStack items="center" justify="space-between">
              <Label
                color="$color12"
                fontWeight="600"
                onPress={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    globalEnabled: !prev.globalEnabled,
                  }))
                }
              >
                Enable notifications
              </Label>
              <ToggleSwitch
                checked={preferences.globalEnabled}
                onCheckedChange={(value) =>
                  setPreferences((prev) => ({ ...prev, globalEnabled: value }))
                }
                aria-label="Enable notifications"
              />
            </XStack>

            <YStack gap="$2" pl="$2">
              {(
                [
                  { key: 'in_app', label: 'In-app' },
                  { key: 'email', label: 'Email' },
                  { key: 'push', label: 'Mobile push' },
                  { key: 'sms', label: 'SMS' },
                ] as const
              ).map(({ key, label }) => (
                <XStack key={key} items="center" justify="space-between">
                  <Label
                    color="$color11"
                    onPress={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        channelEnabled: {
                          ...prev.channelEnabled,
                          [key]: !prev.channelEnabled[key],
                        },
                      }))
                    }
                  >
                    {label}
                  </Label>
                  <ToggleSwitch
                    checked={preferences.channelEnabled[key]}
                    onCheckedChange={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        channelEnabled: { ...prev.channelEnabled, [key]: value },
                      }))
                    }
                    aria-label={`Enable ${label} notifications`}
                  />
                </XStack>
              ))}
            </YStack>

            <Separator bg="$color3" />

            <YStack gap="$2">
              <Text fontWeight="600" color="$color12">
                Quiet hours
              </Text>
              <Text fontSize="$2" color="$color10">
                We’ll queue non-critical alerts during these hours.
              </Text>
              <XStack gap="$2" items="center">
                <Input
                  placeholder="22:00"
                  value={preferences.quietHours?.start ?? ''}
                  onChangeText={(text) =>
                    setPreferences((prev) => ({
                      ...prev,
                      quietHours: { start: text, end: prev.quietHours?.end ?? '' },
                    }))
                  }
                  width={100}
                />
                <Text color="$color11">to</Text>
                <Input
                  placeholder="07:00"
                  value={preferences.quietHours?.end ?? ''}
                  onChangeText={(text) =>
                    setPreferences((prev) => ({
                      ...prev,
                      quietHours: { start: prev.quietHours?.start ?? '', end: text },
                    }))
                  }
                  width={100}
                />
                <Button
                  size="$2"
                  onPress={() => setPreferences((prev) => ({ ...prev, quietHours: null }))}
                >
                  Clear
                </Button>
              </XStack>
            </YStack>

            <Separator bg="$color3" />

            <YStack gap="$2">
              <Text fontWeight="600" color="$color12">
                Digest frequency
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {(
                  [
                    { label: 'Immediate', value: 'immediate' },
                    { label: 'Daily summary', value: 'digest_daily' },
                    { label: 'Weekly summary', value: 'digest_weekly' },
                    { label: 'Mute', value: 'mute' },
                  ] as const
                ).map((option) => {
                  const isSelected = preferences.digestFrequency === option.value

                  return (
                    <Button
                      key={option.value}
                      size="$2"
                      theme={isSelected ? 'blue' : 'gray'}
                      {...(!isSelected ? { variant: 'outlined' as const } : {})}
                      onPress={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          digestFrequency: option.value as typeof prev.digestFrequency,
                        }))
                      }
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </XStack>
            </YStack>

            {savePreferencesMutation.isSuccess && (
              <Text fontSize="$2" color="$green10">
                Preferences saved.
              </Text>
            )}
            {savePreferencesMutation.isError && (
              <Text fontSize="$2" color="$red10">
                Failed to save preferences.
              </Text>
            )}
          </YStack>

          <Separator bg="$color3" />

          <YStack gap="$2">
            <Text fontWeight="600" color="$color12">
              Registered devices
            </Text>
            {devicesQuery.isLoading ? (
              <XStack gap="$2" items="center">
                <Spinner size="small" color="$color10" />
                <Text fontSize="$2" color="$color10">
                  Checking devices…
                </Text>
              </XStack>
            ) : deviceRows.length === 0 ? (
              <Text fontSize="$2" color="$color10">
                No devices registered yet.
              </Text>
            ) : (
              <YStack borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
                <XStack bg="$color2" p="$2">
                  <Text flex={2} fontSize="$2" fontWeight="600">
                    Token
                  </Text>
                  <Text flex={1} fontSize="$2" fontWeight="600">
                    Platform
                  </Text>
                  <Text flex={1} fontSize="$2" fontWeight="600">
                    Last seen
                  </Text>
                </XStack>
                {deviceRows.map((device, index) => (
                  <XStack
                    key={device.id}
                    p="$2"
                    bg={index % 2 === 0 ? '$color1' : '$color2'}
                    gap="$2"
                  >
                    <Text flex={2} fontSize="$2" color="$color11" numberOfLines={1}>
                      {device.token}
                    </Text>
                    <Text flex={1} fontSize="$2" color="$color11">
                      {device.platform}
                    </Text>
                    <Text flex={1} fontSize="$2" color="$color10">
                      {formatDate(
                        device.last_seen_at ?? device.updated_at ?? device.created_at ?? null
                      )}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        </YStack>

        <XStack gap="$3" flexWrap="wrap">
          {FILTERS.map((item) => {
            const isActive = filter === item.value

            return (
              <Button
                key={item.value}
                theme={isActive ? 'blue' : 'gray'}
                {...(!isActive ? { variant: 'outlined' as const } : {})}
                onPress={() => {
                  setFilter(item.value)
                  notificationsQuery.refetch()
                }}
              >
                {item.label}
                {item.value === 'unread' && unreadCount > 0 && (
                  <NotificationTag ml="$2" themeName="error">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </NotificationTag>
                )}
              </Button>
            )
          })}
        </XStack>

        {notificationsQuery.isLoading ? (
          <YStack gap="$3" items="center" mt="$4">
            <Spinner size="large" color="$color10" />
            <Text color="$color11">Loading notifications…</Text>
          </YStack>
        ) : isEmpty ? (
          <YStack gap="$3" items="center" mt="$5">
            <Info size={48} color="$color8" />
            <Text fontSize="$5" fontWeight="600" color="$color12">
              You're all caught up!
            </Text>
            <Text fontSize="$3" color="$color10" text="center">
              New alerts will show up here when there's something you need to review.
            </Text>
          </YStack>
        ) : (
          <YStack gap="$2">
            {notifications.map((notification, _index) => {
              const IconComponent = getSeverityIcon(notification.severity) as ComponentType<{
                size?: number
                color?: string
              }>
              const severityTheme = getSeverityTheme(notification.severity)

              return (
                <YStack
                  key={notification.id}
                  borderWidth={1}
                  borderColor="$borderColor"
                  rounded="$4"
                  bg="$color1"
                >
                  <XStack p="$4" gap="$3" items="flex-start">
                    <SeverityIcon IconComponent={IconComponent} severity={notification.severity} />
                    <YStack flex={1} gap="$2">
                      <XStack justify="space-between" items="center">
                        <Text fontSize="$4" fontWeight="700" color="$color12">
                          {notification.title}
                        </Text>
                        <NotificationTag
                          themeName={severityTheme}
                          size="md"
                          textColorToken="$color12"
                        >
                          {notification.severity.toUpperCase()}
                        </NotificationTag>
                      </XStack>
                      <Text fontSize="$3" color="$color11">
                        {notification.preview}
                      </Text>
                      <XStack gap="$3" items="center">
                        <Text fontSize="$2" color="$color10">
                          {formatRelativeTime(notification.createdAt)}
                        </Text>
                        {notification.channels.length > 0 && (
                          <NotificationTag themeName="gray">
                            {notification.channels.join(', ')}
                          </NotificationTag>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>

                  <Separator bg="$color3" />

                  {/* Render site overlap notification with actions if type matches */}
                  {notification.metadata?.notification_type === 'site_overlap' &&
                  notification.metadata?.site_id &&
                  notification.metadata?.overlapping_site_id ? (
                    <XStack p="$3">
                      <SiteOverlapNotification
                        notificationId={notification.id}
                        siteId={notification.metadata.site_id}
                        overlappingSiteId={notification.metadata.overlapping_site_id}
                        overlapPercent={notification.metadata.overlap_percent || 0}
                        threshold={notification.metadata.threshold || 2.0}
                        onDismiss={(id) => {
                          archiveMutation.mutate({ ids: [id] })
                        }}
                      />
                    </XStack>
                  ) : (
                    <XStack p="$3" gap="$3" justify="flex-end" flexWrap="wrap">
                      {!notification.read ? (
                        <Button
                          size="$2"
                          theme="info"
                          onPress={() => markReadMutation.mutate({ ids: [notification.id] })}
                        >
                          Mark as read
                        </Button>
                      ) : (
                        <Button
                          size="$2"
                          theme="gray"
                          onPress={() => markUnreadMutation.mutate({ ids: [notification.id] })}
                        >
                          Mark unread
                        </Button>
                      )}

                      {filter === 'archived' ? (
                        <Button
                          size="$2"
                          theme="success"
                          onPress={() => restoreMutation.mutate({ ids: [notification.id] })}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="$2"
                          theme="gray"
                          onPress={() => archiveMutation.mutate({ ids: [notification.id] })}
                        >
                          Archive
                        </Button>
                      )}

                      {notification.ctaUrl && (
                        <Button size="$2" theme="info" onPress={() => handleNavigate(notification)}>
                          <XStack gap="$2" items="center">
                            <Text fontSize="$2" fontWeight="600" color="$color12">
                              {notification.ctaLabel ?? 'Open'}
                            </Text>
                            <ExternalLink size={16} color="#ffffff" />
                          </XStack>
                        </Button>
                      )}
                    </XStack>
                  )}
                </YStack>
              )
            })}

            {notificationsQuery.hasNextPage && (
              <Button
                mt="$4"
                theme="info"
                disabled={notificationsQuery.isFetchingNextPage}
                onPress={() => notificationsQuery.fetchNextPage()}
              >
                {notificationsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            )}
          </YStack>
        )}

        <AccountDeletionPanel />
      </YStack>
    </ScrollView>
  )
}
