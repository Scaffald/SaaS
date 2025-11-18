import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, H4, Input, Separator, Spinner, Switch, Text, XStack, YStack } from 'tamagui'
import { organizationSettingsSchema, type OrganizationSettingsInput } from '@app/schemas'
import { useOrganizationSettings, useOrganizationStorageUsage, useUpdateOrganizationSettings } from '../api'

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
    <Card bordered padding="$4" gap="$3">
      <XStack justify="space-between" items="center">
        <H4>Organization Settings</H4>
        {usage.data ? (
          <Text color="$color10">
            {(usage.data.percentUsed ?? 0).toFixed(1)}% storage used ({usage.data.documentCount} docs)
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
              <XStack justify="space-between" items="center">
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
          <Button onPress={handleSave} disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving…' : 'Save settings'}
          </Button>
        </YStack>
      )}
    </Card>
  )
}

