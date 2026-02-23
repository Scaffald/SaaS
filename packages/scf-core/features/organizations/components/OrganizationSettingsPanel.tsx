import {
  type OrganizationSettingsInput,
  organizationSettingsSchema,
} from "@scf/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
} from "@scaffald/ui";
import {
  useOrganizationSettings,
  useOrganizationStorageUsage,
  useUpdateOrganizationSettings,
} from "../api";

type OrganizationSettingsPanelProps = {
  organizationId: string;
};

export function OrganizationSettingsPanel({
  organizationId,
}: OrganizationSettingsPanelProps) {
  const { data: settings, isLoading } = useOrganizationSettings(organizationId);
  const usage = useOrganizationStorageUsage(organizationId);
  const updateMutation = useUpdateOrganizationSettings();
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
  });

  const handleSave = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      organizationId,
      params: {
        timezone: values.timezone,
        locale: values.locale,
        defaultCurrency: values.defaultCurrency,
        enforceMfa: values.enforceMfa,
        sessionTimeoutMinutes: values.sessionTimeoutMinutes,
        ipAllowList: values.ipAllowList,
      },
    });
  });

  return (
    <Card bordered padding="md">
      <Row justify="space-between" align="center">
        <H4>Organization Settings</H4>
        {usage.data ? (
          <Text color="$gray11">
            {(usage.data.percentUsed ?? 0).toFixed(1)}% storage used (
            {usage.data.documentCount} docs)
          </Text>
        ) : null}
      </Row>
      <Separator />
      {isLoading || !settings ? (
        <Spinner />
      ) : (
        <Stack gap={12}>
          <Controller
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Timezone</Text>
                <Input
                  value={field.value}
                  onChangeText={(value) => field.onChange(value)}
                />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="locale"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Locale</Text>
                <Input
                  value={field.value}
                  onChangeText={(value) => field.onChange(value)}
                />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Default currency</Text>
                <Input
                  value={field.value}
                  onChangeText={(value) => field.onChange(value)}
                />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="enforceMfa"
            render={({ field }) => (
              <Row justify="space-between" align="center">
                <Text>Require MFA for members</Text>
                <Switch checked={field.value} onChange={field.onChange} />
              </Row>
            )}
          />
          <Controller
            control={form.control}
            name="sessionTimeoutMinutes"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Session timeout (minutes)</Text>
                <Input
                  keyboardType="numeric"
                  value={String(field.value)}
                  onChangeText={(value) => field.onChange(Number(value))}
                />
              </Stack>
            )}
          />
          <Button onPress={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </Stack>
      )}
    </Card>
  );
}
