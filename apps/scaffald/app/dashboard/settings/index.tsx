import { SiteOverlapNotification } from '@scf/core/features/notifications/components/SiteOverlapNotification'
import { AccountDeletionPanel } from '@scf/core/features/profile/components/AccountDeletionPanel'
import {
  useNotificationPreferences,
  useSavePreferencesMutation,
  useInfiniteNotifications,
  useUnreadCount,
  useNotificationDevices,
  useMarkManyReadMutation,
  useMarkManyUnreadMutation,
  useArchiveManyMutation,
  useRestoreManyMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ExternalLink, Info, ShieldAlert } from 'lucide-react-native'
import {
  Button,
  NotificationTag,
  Toggle,
  Input,
  Label,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from '@scaffald/ui'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'

type NotificationItem = {
  id: string
  type: string
  severity: 'critical' | 'important' | 'info'
  title: string
  preview: string
  createdAt: string
  read: boolean
  ctaUrl?: string
  ctaLabel?: string
  channels: string[]
  metadata?: {
    notification_type?: string
    site_id?: string
    overlapping_site_id?: string
    overlap_percent?: number
    threshold?: number
  } | null
}

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
    channels: Array.isArray(apiNotification.routed_channels) ? apiNotification.routed_channels : [],
    createdAt: apiNotification.created_at,
    ctaLabel: apiNotification.cta_label ?? undefined,
    ctaUrl: apiNotification.cta_url ?? undefined,
    id: apiNotification.id,
    preview:
      typeof apiNotification.body?.preview === 'string'
        ? apiNotification.body.preview
        : (apiNotification.preview ?? apiNotification.message ?? ''),
    read: apiNotification.read ?? false,
    severity: apiNotification.severity ?? 'info',
    title: apiNotification.title,
    type: apiNotification.type,
  }
}

export default function NotificationsCenterScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const preferencesQuery = useNotificationPreferences()
  const savePreferencesMutation = useSavePreferencesMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'preferences'] })
    },
  })

  const notificationsQuery = useInfiniteNotifications(
    {
      limit: 25,
      ...(filter === 'unread' ? { read: false } : filter === 'all' ? {} : {})
    },
    {
      placeholderData: (previousData) => previousData,
    }
  )

  const unreadCountQuery = useUnreadCount({
    refetchOnMount: false,
  })
  const devicesQuery = useNotificationDevices({
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

  const markReadMutation = useMarkManyReadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'unread-count'] })
    },
  })

  const markUnreadMutation = useMarkManyUnreadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'unread-count'] })
    },
  })

  const archiveMutation = useArchiveManyMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list-infinite'] })
    },
  })

  const restoreMutation = useRestoreManyMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'notifications', 'list-infinite'] })
    },
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

  const unreadCount = unreadCountQuery.data?.data?.unread_count ?? 0
  const isEmpty = notifications.length === 0 && !notificationsQuery.isLoading

  const [preferences, setPreferences] = useState({
    channelEnabled: { email: true, in_app: true, push: true, sms: false },
    digestFrequency: 'immediate' as 'immediate' | 'digest_daily' | 'digest_weekly' | 'mute',
    globalEnabled: true,
    quietHours: null as { start: string; end: string } | null,
  })

  useEffect(() => {
    if (preferencesQuery.data?.data) {
      const prefs = preferencesQuery.data.data
      setPreferences({
        channelEnabled: {
          email: prefs.email_notifications,
          in_app: true, // Always enabled for in-app
          push: prefs.push_notifications,
          sms: false, // Not supported yet
        },
        digestFrequency: 'immediate', // Default value, not in SDK yet
        globalEnabled: prefs.email_notifications || prefs.push_notifications,
        quietHours: prefs.quiet_hours?.enabled
          ? { start: prefs.quiet_hours.start, end: prefs.quiet_hours.end }
          : null,
      })
    }
  }, [preferencesQuery.data])

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate({
      email_notifications: preferences.channelEnabled.email,
      push_notifications: preferences.channelEnabled.push,
      quiet_hours: preferences.quietHours
        ? {
            enabled: true,
            start: preferences.quietHours.start,
            end: preferences.quietHours.end,
          }
        : { enabled: false, start: '22:00', end: '08:00' },
    })
  }

  const handleNavigate = (notification: NotificationItem) => {
    if (notification.ctaUrl) {
      router.push(notification.ctaUrl as Href)
    }
  }

  return (
    <ScrollView>
      <Stack gap={24}>
        <Stack gap={8}>
          <Text>Notifications</Text>
          <Text color="gray">
            Stay up to date with applications, opportunities, and platform updates.
          </Text>
        </Stack>

        <Stack gap={16} padding={16}>
          <Row justify="space-between" align="center">
            <Stack gap={4}>
              <Text>Preferences</Text>
              <Text color="gray">Control how and when we reach you.</Text>
            </Stack>
            <Button
              variant="filled"
              size="md"
              disabled={savePreferencesMutation.isPending}
              onPress={handleSavePreferences}
            >
              {savePreferencesMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </Row>

          <Separator />

          <Stack gap={12}>
            <Row align="center" justify="space-between">
              <Label
                color="gray"
                onPress={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    globalEnabled: !prev.globalEnabled,
                  }))
                }
              >
                Enable notifications
              </Label>
              <Toggle
                checked={preferences.globalEnabled}
                onChange={(value) => setPreferences((prev) => ({ ...prev, globalEnabled: value }))}
                aria-label="Enable notifications"
              />
            </Row>

            <Stack gap={8} paddingLeft={8}>
              {(
                [
                  { key: 'in_app', label: 'In-app' },
                  { key: 'email', label: 'Email' },
                  { key: 'push', label: 'Mobile push' },
                  { key: 'sms', label: 'SMS' },
                ] as const
              ).map(({ key, label }) => (
                <Row key={key} align="center" justify="space-between">
                  <Label
                    color="gray"
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
                  <Toggle
                    checked={preferences.channelEnabled[key]}
                    onChange={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        channelEnabled: { ...prev.channelEnabled, [key]: value },
                      }))
                    }
                    aria-label={`Enable ${label} notifications`}
                  />
                </Row>
              ))}
            </Stack>

            <Separator />

            <Stack gap={8}>
              <Text color="gray">Quiet hours</Text>
              <Text color="gray">We’ll queue non-critical alerts during these hours.</Text>
              <Row gap={8} align="center">
                <Input
                  placeholder="22:00"
                  value={preferences.quietHours?.start ?? ''}
                  onChangeText={(text) =>
                    setPreferences((prev) => ({
                      ...prev,
                      quietHours: { end: prev.quietHours?.end ?? '', start: text },
                    }))
                  }
                />
                <Text color="gray">to</Text>
                <Input
                  placeholder="07:00"
                  value={preferences.quietHours?.end ?? ''}
                  onChangeText={(text) =>
                    setPreferences((prev) => ({
                      ...prev,
                      quietHours: { end: text, start: prev.quietHours?.start ?? '' },
                    }))
                  }
                />
                <Button
                  size="md"
                  onPress={() => setPreferences((prev) => ({ ...prev, quietHours: null }))}
                >
                  Clear
                </Button>
              </Row>
            </Stack>

            <Separator />

            <Stack gap={8}>
              <Text color="gray">Digest frequency</Text>
              <Row gap={8}>
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
                      size="md"
                      color={isSelected ? 'primary' : 'gray'}
                      {...(!isSelected ? { variant: 'outline' as const } : {})}
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
              </Row>
            </Stack>

            {savePreferencesMutation.isSuccess && <Text color="green">Preferences saved.</Text>}
            {savePreferencesMutation.isError && (
              <Text color="red">Failed to save preferences.</Text>
            )}
          </Stack>

          <Separator />

          <Stack gap={8}>
            <Text color="gray">Registered devices</Text>
            {devicesQuery.isLoading ? (
              <Row gap={8} align="center">
                <Spinner size="sm" color="gray" />
                <Text color="gray">Checking devices…</Text>
              </Row>
            ) : deviceRows.length === 0 ? (
              <Text color="gray">No devices registered yet.</Text>
            ) : (
              <Stack>
                <Row padding={8}>
                  <Text>Token</Text>
                  <Text>Platform</Text>
                  <Text>Last seen</Text>
                </Row>
                {deviceRows.map((device, _index) => (
                  <Row key={device.id} padding={8} gap={8}>
                    <Text color="gray">{device.token}</Text>
                    <Text color="gray">{device.platform}</Text>
                    <Text color="gray">
                      {formatDate(
                        device.last_seen_at ?? device.updated_at ?? device.created_at ?? null
                      )}
                    </Text>
                  </Row>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>

        <Row gap={12}>
          {FILTERS.map((item) => {
            const isActive = filter === item.value

            return (
              <Button
                key={item.value}
                color={isActive ? 'primary' : 'gray'}
                {...(!isActive ? { variant: 'outline' as const } : {})}
                onPress={() => {
                  setFilter(item.value)
                  notificationsQuery.refetch()
                }}
              >
                {item.label}
                {item.value === 'unread' && unreadCount > 0 && (
                  <NotificationTag>{unreadCount > 99 ? '99+' : unreadCount}</NotificationTag>
                )}
              </Button>
            )
          })}
        </Row>

        {notificationsQuery.isLoading ? (
          <Stack gap={12} align="center">
            <Spinner size="lg" color="gray" />
            <Text color="gray">Loading notifications…</Text>
          </Stack>
        ) : isEmpty ? (
          <Stack gap={12} align="center">
            <Info size={48} color="$color8" />
            <Text color="gray">You're all caught up!</Text>
            <Text color="gray">
              New alerts will show up here when there's something you need to review.
            </Text>
          </Stack>
        ) : (
          <Stack gap={8}>
            {notifications.map((notification, _index) => {
              const IconComponent = getSeverityIcon(notification.severity) as ComponentType<{
                size?: number
                color?: string
              }>
              const _severityTheme = getSeverityTheme(notification.severity)

              return (
                <Stack key={notification.id}>
                  <Row padding={16} gap={12} align="flex-start">
                    <SeverityIcon IconComponent={IconComponent} severity={notification.severity} />
                    <Stack gap={8}>
                      <Row justify="space-between" align="center">
                        <Text color="gray">{notification.title}</Text>
                        <NotificationTag size="md">
                          {notification.severity.toUpperCase()}
                        </NotificationTag>
                      </Row>
                      <Text color="gray">{notification.preview}</Text>
                      <Row gap={12} align="center">
                        <Text color="gray">{formatRelativeTime(notification.createdAt)}</Text>
                        {notification.channels.length > 0 && (
                          <NotificationTag>{notification.channels.join(', ')}</NotificationTag>
                        )}
                      </Row>
                    </Stack>
                  </Row>

                  <Separator />

                  {/* Render site overlap notification with actions if type matches */}
                  {notification.metadata?.notification_type === 'site_overlap' &&
                  notification.metadata?.site_id &&
                  notification.metadata?.overlapping_site_id ? (
                    <Row padding={12}>
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
                    </Row>
                  ) : (
                    <Row padding={12} gap={12} justify="flex-end">
                      {!notification.read ? (
                        <Button
                          size="md"
                          color="primary"
                          onPress={() => markReadMutation.mutate({ ids: [notification.id] })}
                        >
                          Mark as read
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          color="gray"
                          onPress={() => markUnreadMutation.mutate({ ids: [notification.id] })}
                        >
                          Mark unread
                        </Button>
                      )}

                      {filter === 'archived' ? (
                        <Button
                          size="md"
                          color="success"
                          onPress={() => restoreMutation.mutate({ ids: [notification.id] })}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          color="gray"
                          onPress={() => archiveMutation.mutate({ ids: [notification.id] })}
                        >
                          Archive
                        </Button>
                      )}

                      {notification.ctaUrl && (
                        <Button
                          size="md"
                          color="primary"
                          onPress={() => handleNavigate(notification)}
                        >
                          <Row gap={8} align="center">
                            <Text color="gray">{notification.ctaLabel ?? 'Open'}</Text>
                            <ExternalLink size="lg" color="#ffffff" />
                          </Row>
                        </Button>
                      )}
                    </Row>
                  )}
                </Stack>
              )
            })}

            {notificationsQuery.hasNextPage && (
              <Button
                color="primary"
                disabled={notificationsQuery.isFetchingNextPage}
                onPress={() => notificationsQuery.fetchNextPage()}
              >
                {notificationsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            )}
          </Stack>
        )}

        <AccountDeletionPanel />
      </Stack>
    </ScrollView>
  )
}
