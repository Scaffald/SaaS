// src/pages/contractor/settings/NotificationSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      <div className="contractor-notification-settings">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="contractor-notification-settings">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
      <p className="text-gray-600 mb-6">
        Configure how and when you receive notifications about your projects and insurance.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnNewTask}
              onChange={(e) => updatePreference('emailOnNewTask', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on new task assignments</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnExpiringPolicy}
              onChange={(e) => updatePreference('emailOnExpiringPolicy', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on expiring insurance policies</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnProjectInvite}
              onChange={(e) => updatePreference('emailOnProjectInvite', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on new project invitations</span>
          </label>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remind me (days before expiration)
          </label>
          <input
            type="number"
            value={preferences.reminderDaysBefore}
            onChange={(e) => updatePreference('reminderDaysBefore', parseInt(e.target.value) || 7)}
            min={1}
            max={90}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default ContractorNotificationSettings;
