// src/pages/broker/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, Select } from '@unicornlove/ui';
import Checkbox from '../../../ui/Checkbox';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
];

interface NotificationPreferences {
  emailOnClientExpiringPolicy: boolean;
  emailOnClientComplianceIssue: boolean;
  emailDigestFrequency: string;
}

const defaultPreferences: NotificationPreferences = {
  emailOnClientExpiringPolicy: true,
  emailOnClientComplianceIssue: true,
  emailDigestFrequency: 'weekly',
};

function BrokerNotificationSettings() {
  const { userSettings, updateUserSettings, isLoading, isSaving } = useSettings();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Initialize from userSettings.notification_preferences
  useEffect(() => {
    if (userSettings?.notification_preferences) {
      const prefs = userSettings.notification_preferences as NotificationPreferences;
      const newPreferences = {
        emailOnClientExpiringPolicy: prefs.emailOnClientExpiringPolicy ?? true,
        emailOnClientComplianceIssue: prefs.emailOnClientComplianceIssue ?? true,
        emailDigestFrequency: prefs.emailDigestFrequency || 'weekly',
      };
      setPreferences(newPreferences);
      setOriginalPreferences(newPreferences);
    }
  }, [userSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  }, [preferences, originalPreferences]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUserSettings({
        notification_preferences: preferences,
      });
      setOriginalPreferences(preferences);
      toast.success('Notification settings saved successfully');
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      toast.error('Failed to save notification settings');
    }
  }, [preferences, updateUserSettings]);

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoading) {
    return (
      <YStack gap="$4">
        <H2>Notification Settings</H2>
        <YStack gap="$4">
          {[1, 2, 3].map(i => (
            <YStack key={i} height={40} backgroundColor="$color3" borderRadius="$4" />
          ))}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Notification Settings</H2>
      <Text color="$color10" marginBottom="$6">
        Configure how and when you receive notifications about your clients.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Checkbox
            checked={preferences.emailOnClientExpiringPolicy}
            onChange={(e) => updatePreference('emailOnClientExpiringPolicy', e.target.checked)}
            label="Email me on client expiring policies"
          />
          <Checkbox
            checked={preferences.emailOnClientComplianceIssue}
            onChange={(e) => updatePreference('emailOnClientComplianceIssue', e.target.checked)}
            label="Email me on client compliance issues"
          />
          <YStack gap="$1" marginBottom="$6">
            <Select
              label="Email Digest Frequency"
              value={preferences.emailDigestFrequency}
              onValueChange={(value) => updatePreference('emailDigestFrequency', value)}
              options={frequencyOptions}
            />
          </YStack>
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default BrokerNotificationSettings;
