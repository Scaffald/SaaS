import { type OrganizationSettingsInput, organizationSettingsSchema } from '@scf/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { X } from '@tamagui/lucide-icons'
import {
  Button,
  Card,
  H4,
  Input,
  Separator,
  Spinner,
  Switch,
  Text,
  useToast,
  XStack,
  YStack,
} from '@unicornlove/ui'
import {
  useOrganizationSettings,
  useOrganizationStorageUsage,
  useRenewalSettings,
  useUpdateOrganizationSettings,
  useUpdateRenewalSettings,
} from '../api'

type RenewalSettingsSectionProps = {
  organizationId: string
}

function RenewalSettingsSection({ organizationId }: RenewalSettingsSectionProps) {
  const toast = useToast()
  const { data: renewalSettings, isLoading } = useRenewalSettings(organizationId)
  const updateMutation = useUpdateRenewalSettings()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [intervals, setIntervals] = useState<number[] | null>(null)
  const [newInterval, setNewInterval] = useState('')

  // Use local state if user has edited, otherwise use server data
  const currentEnabled = enabled ?? renewalSettings?.enabled ?? false
  const currentIntervals = intervals ?? renewalSettings?.intervals ?? []

  const handleToggle = (value: boolean) => {
    setEnabled(value)
  }

  const handleAddInterval = () => {
    const value = parseInt(newInterval, 10)
    if (isNaN(value) || value < 1 || value > 365) {
      toast.show('Invalid interval', {
        message: 'Please enter a number between 1 and 365.',
      })
      return
    }
    if (currentIntervals.includes(value)) {
      toast.show('Duplicate interval', {
        message: `${value} days is already in the list.`,
      })
      return
    }
    setIntervals([...currentIntervals, value].sort((a, b) => a - b))
    setNewInterval('')
  }

  const handleRemoveInterval = (value: number) => {
    setIntervals(currentIntervals.filter((v) => v !== value))
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        organizationId,
        enabled: currentEnabled,
        intervals: currentIntervals,
      })
      toast.show('Renewal settings saved', {
        message: 'Your renewal reminder settings have been updated.',
      })
      // Clear local overrides so we re-sync from server
      setEnabled(null)
      setIntervals(null)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Please try again.'
      toast.show('Failed to save settings', { message })
    }
  }

  if (isLoading) {
    return (
      <Card bordered padding="$4" gap="$3">
        <H4>Renewal Reminders</H4>
        <Separator />
        <Spinner />
      </Card>
    )
  }

  const hasChanges =
    enabled !== null || intervals !== null

  return (
    <Card bordered padding="$4" gap="$3">
      <H4>Renewal Reminders</H4>
      <Separator />
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="600">Enable renewal reminders</Text>
          <Switch checked={currentEnabled} onCheckedChange={handleToggle} />
        </XStack>

        <YStack gap="$2">
          <Text fontWeight="600">Reminder intervals (days before expiry)</Text>
          <XStack gap="$2" flexWrap="wrap">
            {currentIntervals.map((day) => (
              <XStack
                key={day}
                alignItems="center"
                backgroundColor="$color4"
                borderRadius="$3"
                paddingHorizontal="$2"
                paddingVertical="$1"
                gap="$1"
              >
                <Text fontSize="$3">{day}d</Text>
                <Button
                  size="$1"
                  chromeless
                  circular
                  icon={<X size={12} />}
                  onPress={() => handleRemoveInterval(day)}
                  aria-label={`Remove ${day} day interval`}
                />
              </XStack>
            ))}
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Input
              flex={1}
              keyboardType="numeric"
              placeholder="e.g. 30"
              value={newInterval}
              onChangeText={setNewInterval}
              onSubmitEditing={handleAddInterval}
            />
            <Button size="$3" onPress={handleAddInterval}>
              Add
            </Button>
          </XStack>
        </YStack>

        <Button
          onPress={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save renewal settings'}
        </Button>
      </YStack>
    </Card>
  )
}

type OrganizationSettingsPanelProps = {
  organizationId: string
}

export function OrganizationSettingsPanel({ organizationId }: OrganizationSettingsPanelProps) {
  const { data: settings, isLoading } = useOrganizationSettings(organizationId)
  const usage = useOrganizationStorageUsage(organizationId)
  const updateMutation = useUpdateOrganizationSettings()
  const form = useForm<OrganizationSettingsInput>({
    resolver: zodResolver(organizationSettingsSchema),
    values: settings
      ? {
          timezone: settings.timezone,
          locale: settings.locale,
          defaultCurrency: settings.default_currency,
          enforceMfa: settings.enforce_mfa ?? false,
          sessionTimeoutMinutes: settings.session_timeout_minutes ?? 60,
          ipAllowList: settings.ip_allow_list ?? [],
          notificationPreferences: settings.notification_preferences ?? {},
          securityPreferences: settings.security_preferences ?? {},
          privacyPreferences: settings.privacy_preferences ?? {},
        }
      : undefined,
  })

  const handleSave = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      organizationId,
      timezone: values.timezone,
      locale: values.locale,
      defaultCurrency: values.defaultCurrency,
      enforceMfa: values.enforceMfa,
      sessionTimeoutMinutes: values.sessionTimeoutMinutes,
      ipAllowList: values.ipAllowList,
    })
  })

  return (
    <YStack gap="$4">
    <Card bordered padding="$4" gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <H4>Organization Settings</H4>
        {usage.data ? (
          <Text color="$color10">
            {(usage.data.percentUsed ?? 0).toFixed(1)}% storage used ({usage.data.documentCount}{' '}
            docs)
          </Text>
        ) : null}
      </XStack>
      <Separator />
      {isLoading || !settings ? (
        <Spinner />
      ) : (
        <YStack gap="$3">
          <Controller
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Timezone</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </YStack>
            )}
          />
          <Controller
            control={form.control}
            name="locale"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Locale</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </YStack>
            )}
          />
          <Controller
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Default currency</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </YStack>
            )}
          />
          <Controller
            control={form.control}
            name="enforceMfa"
            render={({ field }) => (
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Require MFA for members</Text>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </XStack>
            )}
          />
          <Controller
            control={form.control}
            name="sessionTimeoutMinutes"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Session timeout (minutes)</Text>
                <Input
                  keyboardType="numeric"
                  value={String(field.value)}
                  onChangeText={(value) => field.onChange(Number(value))}
                />
              </YStack>
            )}
          />
          <Button onPress={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </YStack>
      )}
    </Card>
    <RenewalSettingsSection organizationId={organizationId} />
    </YStack>
  )
}
