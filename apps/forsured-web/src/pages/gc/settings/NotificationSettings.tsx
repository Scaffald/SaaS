// src/pages/gc/settings/NotificationSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      <div className="gc-notification-settings">
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
    <div className="gc-notification-settings">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
      <p className="text-gray-600 mb-6">
        Configure how and when you receive notifications about your projects and subcontractors.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnNewDocument}
              onChange={(e) => updatePreference('emailOnNewDocument', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on new document uploads</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnExpiringCOI}
              onChange={(e) => updatePreference('emailOnExpiringCOI', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on expiring COIs</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.emailOnComplianceChange}
              onChange={(e) => updatePreference('emailOnComplianceChange', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Email me on compliance status changes</span>
          </label>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Digest Frequency</label>
          <select
            value={preferences.emailDigestFrequency}
            onChange={(e) => updatePreference('emailDigestFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
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

export default GCNotificationSettings;
