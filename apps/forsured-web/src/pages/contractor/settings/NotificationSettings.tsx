// src/pages/contractor/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, Input } from '@unicornlove/ui';
import Checkbox from '../../../ui/Checkbox';
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
      <YStack gap="$4">
        <H2>Notification Settings</H2>
        <YStack gap="$4">
          {[1, 2, 3, 4].map(i => (
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
        Configure how and when you receive notifications about your projects and insurance.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Checkbox
            checked={preferences.emailOnNewTask}
            onChange={(e) => updatePreference('emailOnNewTask', e.target.checked)}
            label="Email me on new task assignments"
          />
          <Checkbox
            checked={preferences.emailOnExpiringPolicy}
            onChange={(e) => updatePreference('emailOnExpiringPolicy', e.target.checked)}
            label="Email me on expiring insurance policies"
          />
          <Checkbox
            checked={preferences.emailOnProjectInvite}
            onChange={(e) => updatePreference('emailOnProjectInvite', e.target.checked)}
            label="Email me on new project invitations"
          />
          <Input
            label="Remind me (days before expiration)"
            type="number"
            value={preferences.reminderDaysBefore.toString()}
            onChangeText={(value) => updatePreference('reminderDaysBefore', parseInt(value) || 7)}
            width={128}
            min={1}
            max={90}
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            marginTop="$6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default ContractorNotificationSettings;
