import {
  type OrganizationSettingsInput,
  organizationSettingsSchema,
} from "@scf/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { useState } from "react";
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
  useThemeContext,
} from "@scaffald/ui";
import { colors } from '@scaffald/ui/tokens'
import {
  useOrganizationSettings,
  useOrganizationStorageUsage,
  useRenewalSettings,
  useUpdateOrganizationSettings,
  useUpdateRenewalSettings,
} from "../api";
import { api } from '@scf/core/utils/api'

type RenewalSettingsSectionProps = {
  organizationId: string
}

function RenewalSettingsSection({ organizationId }: RenewalSettingsSectionProps) {
  // biome-ignore lint/suspicious/noExplicitAny: api.useUtils unavailable in Node.js typecheck (Deno functions excluded)
  const utils = (api as unknown as Record<string, any>).useUtils()
  const { data: renewalSettings, isLoading } = useRenewalSettings(organizationId)
  const updateMutation = useUpdateRenewalSettings()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [intervals, setIntervals] = useState<number[] | null>(null)
  const [newInterval, setNewInterval] = useState('')

  // Use local state if user has edited, otherwise use server data
  const currentEnabled = enabled ?? renewalSettings?.enabled ?? false
  const currentIntervals = (intervals ?? renewalSettings?.intervals ?? []) as number[]

  const handleAddInterval = () => {
    const value = parseInt(newInterval, 10)
    if (Number.isNaN(value) || value < 1 || value > 365) {
      return
    }
    if (!currentIntervals.includes(value)) {
      setIntervals([...currentIntervals, value].sort((a, b) => a - b))
    }
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
      // Invalidate cache and clear local overrides so we re-sync from server
      // biome-ignore lint/suspicious/noExplicitAny: api.useUtils unavailable in Node.js typecheck (Deno functions excluded)
      void (utils as unknown as Record<string, any>).organizations.getRenewalSettings.invalidate({ organizationId })
      setEnabled(null)
      setIntervals(null)
    } catch {
      // Error is surfaced by mutation state
    }
  }

  if (isLoading) {
    return (
      <Card bordered padding="md">
        <H4>Renewal Reminders</H4>
        <Separator />
        <Spinner variant="ios" />
      </Card>
    )
  }

  const hasChanges = enabled !== null || intervals !== null

  return (
    <Card bordered padding="md">
      <H4>Renewal Reminders</H4>
      <Separator />
      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text>Enable renewal reminders</Text>
          <Switch checked={currentEnabled} onChange={setEnabled} />
        </Row>
        <Stack gap={8}>
          <Text>Reminder intervals (days before expiry)</Text>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {currentIntervals.map((day) => (
              <Row key={day} align="center" gap={4} style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'var(--color-3)' }}>
                <Text>{day}d</Text>
                <Button
                  size="sm"
                  variant="text"
                  onPress={() => handleRemoveInterval(day)}
                >
                  ×
                </Button>
              </Row>
            ))}
          </Row>
          <Row gap={8} align="center">
            <Input
              style={{ flex: 1 }}
              keyboardType="numeric"
              placeholder="e.g. 30"
              value={newInterval}
              onChangeText={setNewInterval}
              onSubmitEditing={handleAddInterval}
            />
            <Button size="sm" onPress={handleAddInterval}>
              Add
            </Button>
          </Row>
        </Stack>
        <Button
          onPress={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save renewal settings'}
        </Button>
      </Stack>
    </Card>
  )
}

type OrganizationSettingsPanelProps = {
  organizationId: string;
};

export function OrganizationSettingsPanel({
  organizationId,
}: OrganizationSettingsPanelProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  const { data: settings, isLoading } = useOrganizationSettings(organizationId);
  const usage = useOrganizationStorageUsage(organizationId);
  const updateMutation = useUpdateOrganizationSettings();
  const form = useForm<OrganizationSettingsInput>({
    // SC-59: cast required for @hookform/resolvers v5 — see useFeedbackForm for context.
    resolver: zodResolver(organizationSettingsSchema) as unknown as Resolver<OrganizationSettingsInput>,
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
    <Stack gap={16}>
      <Card bordered padding="md">
        <Row justify="space-between" align="center">
          <H4>Organization Settings</H4>
          {usage.data ? (
            <Text style={{ color: colors.text[t].secondary }}>
              {(usage.data.percentUsed ?? 0).toFixed(1)}% storage used (
              {usage.data.documentCount} docs)
            </Text>
          ) : null}
        </Row>
        <Separator />
        {isLoading || !settings ? (
          <Spinner variant="ios" />
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
      <RenewalSettingsSection organizationId={organizationId} />
    </Stack>
  );
}
