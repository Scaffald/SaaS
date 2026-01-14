// src/pages/broker/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2 } from '@unicornlove/beyond-ui';
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

  const handleSubmit = useCallback(async () => {
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

  const skeletonStyle: React.CSSProperties = {
    height: 40,
    backgroundColor: 'var(--color-3)',
    borderRadius: 'var(--radius-4)',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    fontSize: 14,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: 4,
  };

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Notification Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={skeletonStyle} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Notification Settings</H2>
      <Text muted style={{ marginBottom: 'var(--space-6)' }}>
        Configure how and when you receive notifications about your clients.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
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
          <Stack style={{ gap: 4, marginBottom: 'var(--space-6)' }}>
            <Text style={labelStyle}>Email Digest Frequency</Text>
            <select
              value={preferences.emailDigestFrequency}
              onChange={(e) => updatePreference('emailDigestFrequency', e.target.value)}
              style={selectStyle}
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Stack>
          <Button
            onPress={handleSubmit}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            color="primary"
          >
            Save Changes
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default BrokerNotificationSettings;
