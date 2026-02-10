import { type OrganizationSettingsInput, organizationSettingsSchema } from '@scf/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  Card,
  H4,
  Input,
  Separator,
  Spinner,
  Switch,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import {
  useOrganizationSettings,
  useOrganizationStorageUsage,
  useUpdateOrganizationSettings,
} from '../api'

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
      <Row justifyContent="space-between" alignItems="center">
        <H4>Organization Settings</H4>
        {usage.data ? (
          <Text color="$color10">
            {(usage.data.percentUsed ?? 0).toFixed(1)}% storage used ({usage.data.documentCount}{' '}
            docs)
          </Text>
        ) : null}
      </Row>
      <Separator />
      {isLoading || !settings ? (
        <Spinner />
      ) : (
        <Stack gap="$3">
          <Controller
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <Stack gap="$1">
                <Text fontWeight="600">Timezone</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="locale"
            render={({ field }) => (
              <Stack gap="$1">
                <Text fontWeight="600">Locale</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <Stack gap="$1">
                <Text fontWeight="600">Default currency</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="enforceMfa"
            render={({ field }) => (
              <Row justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Require MFA for members</Text>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </Row>
            )}
          />
          <Controller
            control={form.control}
            name="sessionTimeoutMinutes"
            render={({ field }) => (
              <Stack gap="$1">
                <Text fontWeight="600">Session timeout (minutes)</Text>
                <Input
                  keyboardType="numeric"
                  value={String(field.value)}
                  onChangeText={(value) => field.onChange(Number(value))}
                />
              </Stack>
            )}
          />
          <Button onPress={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </Stack>
      )}
    </Card>
  )
}
