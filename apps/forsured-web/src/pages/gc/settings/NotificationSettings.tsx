// src/pages/gc/settings/NotificationSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Button, SettingsNotificationTable, SettingsSectionHeader } from '@unicornlove/beyond-ui';
import type { NotificationPreference } from '@unicornlove/beyond-ui';
import { Bell } from 'lucide-react-native';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

// Convert to SettingsNotificationTable format
const defaultPreferences: NotificationPreference[] = [
  { id: '1', name: 'Assigned comments', category: 'Comments', email: true, mobile: false, inbox: false, browser: false },
  { id: '2', name: 'Resolved comments', category: 'Comments', email: true, mobile: true, inbox: false, browser: true },
  { id: '3', name: 'New Comment Notifications', category: 'Comments', email: false, mobile: true, inbox: false, browser: true },
  { id: '4', name: 'Mentions in Comments', category: 'Comments', email: false, mobile: true, inbox: false, browser: true },
  { id: '5', name: 'Thread Activity Notifications', category: 'Comments', email: false, mobile: true, inbox: false, browser: false },
  { id: '6', name: 'Task Assignment Notifications', category: 'Tasks', email: true, mobile: true, inbox: false, browser: false },
  { id: '7', name: 'Task Deadline Reminders', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '8', name: 'Task Completion Acknowledgments', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '9', name: 'Task Updates and Edits', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '10', name: 'Task Comment Activity', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '11', name: 'Shared Folder Updates', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '12', name: 'Shared Calendar Events', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '13', name: 'Content Shared with You', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '14', name: 'Access Requests', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '15', name: 'Collaborator Activity', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '16', name: 'Shared Workspace Announcements', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '17', name: 'Expiration Notices', category: 'Sharing', email: true, mobile: true, inbox: true, browser: false },
  { id: '18', name: 'Policy Renewal Reminders', category: 'Insurance', email: true, mobile: false, inbox: true, browser: false },
];

function GCNotificationSettings() {
  const { userSettings, updateUserSettings, isLoading, isSaving } = useSettings();

  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreference[]>(defaultPreferences);

  // Initialize from userSettings.notification_preferences
  useEffect(() => {
    if (userSettings?.notification_preferences) {
      // In a real app, convert from stored format to NotificationPreference[]
      // For now, use defaults
      setPreferences(defaultPreferences);
      setOriginalPreferences(defaultPreferences);
    }
  }, [userSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  }, [preferences, originalPreferences]);

  const handlePreferenceChange = useCallback((id: string, channel: 'email' | 'mobile' | 'inbox' | 'browser', enabled: boolean) => {
    setPreferences(prev =>
      prev.map(pref => (pref.id === id ? { ...pref, [channel]: enabled } : pref))
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In a real app, convert NotificationPreference[] back to stored format
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

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <SettingsSectionHeader icon={Bell} title="Notifications" description="Manage your notification preferences" />
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <Stack key={i} style={{ height: 40, backgroundColor: 'var(--color-3)', borderRadius: 'var(--radius-4)' }} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <SettingsSectionHeader
        icon={Bell}
        title="Notifications"
        description="Manage your notification preferences"
      />
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <SettingsNotificationTable
            preferences={preferences}
            onPreferenceChange={handlePreferenceChange}
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

export default GCNotificationSettings;
