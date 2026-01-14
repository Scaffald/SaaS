// src/pages/gc/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2 } from '@unicornlove/beyond-ui';
import Checkbox from '../../../ui/Checkbox';
import Select from '../../../components/Common/Select';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
];

interface NotificationPreferences {
  emailOnNewDocument: boolean;
  emailOnExpiringCOI: boolean;
  emailOnComplianceChange: boolean;
  emailDigestFrequency: string;
}

const defaultPreferences: NotificationPreferences = {
  emailOnNewDocument: true,
  emailOnExpiringCOI: true,
  emailOnComplianceChange: true,
  emailDigestFrequency: 'weekly',
};

function GCNotificationSettings() {
  const { userSettings, updateUserSettings, isLoading, isSaving } = useSettings();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Initialize from userSettings.notification_preferences
  useEffect(() => {
    if (userSettings?.notification_preferences) {
      const prefs = userSettings.notification_preferences as NotificationPreferences;
      const newPreferences = {
        emailOnNewDocument: prefs.emailOnNewDocument ?? true,
        emailOnExpiringCOI: prefs.emailOnExpiringCOI ?? true,
        emailOnComplianceChange: prefs.emailOnComplianceChange ?? true,
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Notification Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <Stack key={i} style={{ height: 40, backgroundColor: 'var(--color-3)', borderRadius: 'var(--radius-4)' }} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Notification Settings</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Configure how and when you receive notifications about your projects and subcontractors.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Checkbox
            checked={preferences.emailOnNewDocument}
            onChange={(e) => updatePreference('emailOnNewDocument', e.target.checked)}
            label="Email me on new document uploads"
          />
          <Checkbox
            checked={preferences.emailOnExpiringCOI}
            onChange={(e) => updatePreference('emailOnExpiringCOI', e.target.checked)}
            label="Email me on expiring COIs"
          />
          <Checkbox
            checked={preferences.emailOnComplianceChange}
            onChange={(e) => updatePreference('emailOnComplianceChange', e.target.checked)}
            label="Email me on compliance status changes"
          />
          <Stack style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
            <Select
              label="Email Digest Frequency"
              value={preferences.emailDigestFrequency}
              onChange={(value) => updatePreference('emailDigestFrequency', value)}
              options={frequencyOptions}
            />
          </Stack>
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default GCNotificationSettings;
