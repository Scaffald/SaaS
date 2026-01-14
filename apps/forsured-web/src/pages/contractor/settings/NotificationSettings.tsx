// src/pages/contractor/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Input, Checkbox } from '@unicornlove/beyond-ui';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

interface NotificationPreferences {
  emailOnNewTask: boolean;
  emailOnExpiringPolicy: boolean;
  emailOnProjectInvite: boolean;
  reminderDaysBefore: number;
}

const defaultPreferences: NotificationPreferences = {
  emailOnNewTask: true,
  emailOnExpiringPolicy: true,
  emailOnProjectInvite: true,
  reminderDaysBefore: 7,
};

function ContractorNotificationSettings() {
  const { userSettings, updateUserSettings, isLoading, isSaving } = useSettings();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Initialize from userSettings.notification_preferences
  useEffect(() => {
    if (userSettings?.notification_preferences) {
      const prefs = userSettings.notification_preferences as NotificationPreferences;
      const newPreferences = {
        emailOnNewTask: prefs.emailOnNewTask ?? true,
        emailOnExpiringPolicy: prefs.emailOnExpiringPolicy ?? true,
        emailOnProjectInvite: prefs.emailOnProjectInvite ?? true,
        reminderDaysBefore: prefs.reminderDaysBefore || 7,
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Notification Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <Stack
              key={i}
              style={{
                height: 40,
                backgroundColor: 'var(--color-3)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Notification Settings</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Configure how and when you receive notifications about your projects and insurance.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Checkbox
            checked={preferences.emailOnNewTask}
            onChange={(checked) => updatePreference('emailOnNewTask', checked)}
            label="Email me on new task assignments"
          />
          <Checkbox
            checked={preferences.emailOnExpiringPolicy}
            onChange={(checked) => updatePreference('emailOnExpiringPolicy', checked)}
            label="Email me on expiring insurance policies"
          />
          <Checkbox
            checked={preferences.emailOnProjectInvite}
            onChange={(checked) => updatePreference('emailOnProjectInvite', checked)}
            label="Email me on new project invitations"
          />
          <Input
            label="Remind me (days before expiration)"
            type="number"
            value={preferences.reminderDaysBefore.toString()}
            onChange={(e) => updatePreference('reminderDaysBefore', parseInt(e.target.value) || 7)}
            style={{ width: 128 }}
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default ContractorNotificationSettings;
