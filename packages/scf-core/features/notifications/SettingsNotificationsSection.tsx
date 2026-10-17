/**
 * Notification preferences — channels, quiet hours, digest, devices — for the
 * Settings screen's Notifications tab.
 *
 * This used to carry a second inbox under the preferences: All / Unread tabs
 * and the whole list again, as cards with CRITICAL tags and per-row buttons,
 * duplicating /dashboard/notifications in another row style (#1211). There is
 * one inbox now; this links to it.
 */

import { ROUTES } from '@scf/core/constants/routes'
import {
  useNotificationPreferences,
  useSavePreferencesMutation,
  useNotificationDevices,
} from '@scf/core/utils/notifications-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react-native'
import {
  Button,
  Card,
  Toggle,
  Input,
  Label,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

const QUIET_HOURS_FIELD_WIDTH = 104

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function SettingsNotificationsSection() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const queryClient = useQueryClient()
  const preferencesQuery = useNotificationPreferences()
  const savePreferencesMutation = useSavePreferencesMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scaffald', 'notifications', 'preferences'],
      })
    },
  })

  const devicesQuery = useNotificationDevices({ refetchOnMount: false })

  type DeviceRow = {
    id: string
    token: string
    platform: string
    last_seen_at?: string | null
    updated_at?: string | null
    created_at?: string | null
    metadata?: Record<string, unknown>
  }
  const deviceRows: DeviceRow[] = (devicesQuery.data ?? []) as DeviceRow[]

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
          in_app: true,
          push: prefs.push_notifications,
          sms: false,
        },
        digestFrequency: 'immediate',
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

  return (
    <Stack gap={24}>
      <Row align="center" justify="space-between" gap={12} style={{ flexWrap: 'wrap' }}>
        <Text style={{ flexShrink: 1, color: colors.text[theme].secondary }}>
          Read, open and archive your notifications in the inbox.
        </Text>
        <Button
          size="sm"
          variant="outline"
          iconEnd={ArrowRight}
          onPress={() => router.push(ROUTES.DASHBOARD.NOTIFICATIONS.path)}
        >
          Open inbox
        </Button>
      </Row>

      {/* Preferences card */}
      <Card variant="outlined" radius="lg" padding="lg">
        <Stack gap={16}>
          <Row justify="space-between" align="center">
            <Stack gap={4}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[theme].primary }}>
                Preferences
              </Text>
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                Control how and when we reach you.
              </Text>
            </Stack>
            <Button
              variant="filled"
              size="sm"
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
                style={{ color: colors.text[theme].primary }}
                onPress={() =>
                  setPreferences((prev) => ({ ...prev, globalEnabled: !prev.globalEnabled }))
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
                    style={{ color: colors.text[theme].secondary }}
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
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].primary }}>
                Quiet hours
              </Text>
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                We'll queue non-critical alerts during these hours.
              </Text>
              {/* Fixed-width time fields: Input fills its parent, so in a Row
                  the start field took the whole card and pushed "to", the end
                  field and Clear past its edge (#1029). Five characters of
                  HH:MM need no more than this, and all four fit at 390. */}
              <Row gap={8} align="center">
                <Stack style={{ width: QUIET_HOURS_FIELD_WIDTH }}>
                  <Input
                    placeholder="22:00"
                    value={preferences.quietHours?.start ?? ''}
                    onChangeText={(text) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quietHours: {
                          end: prev.quietHours?.end ?? '',
                          start: text,
                        },
                      }))
                    }
                  />
                </Stack>
                <Text style={{ color: colors.text[theme].tertiary }}>to</Text>
                <Stack style={{ width: QUIET_HOURS_FIELD_WIDTH }}>
                  <Input
                    placeholder="07:00"
                    value={preferences.quietHours?.end ?? ''}
                    onChangeText={(text) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quietHours: {
                          end: text,
                          start: prev.quietHours?.start ?? '',
                        },
                      }))
                    }
                  />
                </Stack>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => setPreferences((prev) => ({ ...prev, quietHours: null }))}
                >
                  Clear
                </Button>
              </Row>
            </Stack>

            <Separator />

            <Stack gap={8}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].primary }}>
                Digest frequency
              </Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {(
                  [
                    { label: 'Immediate', value: 'immediate' },
                    { label: 'Daily summary', value: 'digest_daily' },
                    { label: 'Weekly summary', value: 'digest_weekly' },
                    { label: 'Mute', value: 'mute' },
                  ] as const
                ).map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    color={preferences.digestFrequency === option.value ? 'primary' : 'gray'}
                    variant={preferences.digestFrequency === option.value ? 'filled' : 'outline'}
                    onPress={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        digestFrequency: option.value as typeof prev.digestFrequency,
                      }))
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </Row>
            </Stack>

            {savePreferencesMutation.isSuccess && (
              <Text style={{ color: colors.success[500] }}>Preferences saved.</Text>
            )}
            {savePreferencesMutation.isError && (
              <Text style={{ color: colors.error[500] }}>Failed to save preferences.</Text>
            )}
          </Stack>

          <Separator />

          {/* Registered devices */}
          <Stack gap={8}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].primary }}>
              Registered devices
            </Text>
            {devicesQuery.isLoading ? (
              <Row gap={8} align="center">
                <Spinner variant="ios" size="sm" color="gray" />
                <Text style={{ color: colors.text[theme].secondary }}>Checking devices…</Text>
              </Row>
            ) : deviceRows.length === 0 ? (
              <Text style={{ color: colors.text[theme].tertiary }}>No devices registered yet.</Text>
            ) : (
              <Stack gap={4}>
                <Row
                  gap={8}
                  style={{
                    padding: 8,
                    borderRadius: 7,
                    backgroundColor: colors.bg[theme].muted,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontWeight: '600',
                      fontSize: 12,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    Token
                  </Text>
                  <Text
                    style={{
                      width: 80,
                      fontWeight: '600',
                      fontSize: 12,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    Platform
                  </Text>
                  <Text
                    style={{
                      width: 120,
                      fontWeight: '600',
                      fontSize: 12,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    Last seen
                  </Text>
                </Row>
                {deviceRows.map((device) => (
                  <Row key={device.id} gap={8} style={{ padding: 8, borderRadius: 7 }}>
                    <Text
                      style={{ flex: 1, fontSize: 12, color: colors.text[theme].tertiary }}
                      numberOfLines={1}
                    >
                      {device.token}
                    </Text>
                    <Text style={{ width: 80, fontSize: 12, color: colors.text[theme].tertiary }}>
                      {device.platform}
                    </Text>
                    <Text style={{ width: 120, fontSize: 12, color: colors.text[theme].tertiary }}>
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
      </Card>
    </Stack>
  )
}
