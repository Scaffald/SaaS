// src/pages/broker/settings/ProfileSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function BrokerProfileSettings() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { userSettings, updateUserSettings, isLoading: settingsLoading, isSaving } = useSettings();

  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licensedStates, setLicensedStates] = useState('');
  const [originalState, setOriginalState] = useState({ phone: '', licenseNumber: '', licensedStates: '' });

  // Initialize from userSettings.ui_preferences
  useEffect(() => {
    if (userSettings?.ui_preferences) {
      const prefs = userSettings.ui_preferences as Record<string, unknown>;
      const newState = {
        phone: (prefs.phone as string) || '',
        licenseNumber: (prefs.licenseNumber as string) || '',
        licensedStates: (prefs.licensedStates as string) || '',
      };
      setPhone(newState.phone);
      setLicenseNumber(newState.licenseNumber);
      setLicensedStates(newState.licensedStates);
      setOriginalState(newState);
    }
  }, [userSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return phone !== originalState.phone ||
           licenseNumber !== originalState.licenseNumber ||
           licensedStates !== originalState.licensedStates;
  }, [phone, licenseNumber, licensedStates, originalState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUserSettings({
        ui_preferences: {
          ...userSettings?.ui_preferences,
          phone,
          licenseNumber,
          licensedStates,
        },
      });
      setOriginalState({ phone, licenseNumber, licensedStates });
      toast.success('Profile settings saved successfully');
    } catch (err) {
      console.error('Failed to save profile settings:', err);
      toast.error('Failed to save profile settings');
    }
  }, [phone, licenseNumber, licensedStates, userSettings, updateUserSettings]);

  const isLoading = authLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="broker-profile-settings">
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="broker-profile-settings">
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={user?.name || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Name is managed in Scaffald</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Email is managed in Scaffald</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter phone number"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., BRK-12345"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Licensed States</label>
          <input
            type="text"
            value={licensedStates}
            onChange={(e) => setLicensedStates(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., TX, CA, NY"
          />
          <p className="text-xs text-gray-500 mt-1">Enter comma-separated state abbreviations</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
          <input
            type="text"
            value={profile?.user_type === 'broker' ? 'Insurance Broker' : profile?.user_type || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
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

export default BrokerProfileSettings;
