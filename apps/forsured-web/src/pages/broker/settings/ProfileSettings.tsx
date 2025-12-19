// src/pages/broker/settings/ProfileSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, Input } from '@unicornlove/ui';
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
      <YStack gap="$4">
        <H2>Profile Settings</H2>
        <YStack gap="$4">
          {[1, 2, 3, 4, 5].map(i => (
            <YStack key={i} height={40} backgroundColor="$color3" borderRadius="$4" />
          ))}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Profile Settings</H2>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Input
            label="Name"
            type="text"
            value={user?.name || ''}
            disabled
            helperText="Name is managed in Scaffald"
          />
          <Input
            label="Email"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="Email is managed in Scaffald"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
          />
          <Input
            label="License Number"
            type="text"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="e.g., BRK-12345"
          />
          <Input
            label="Licensed States"
            type="text"
            value={licensedStates}
            onChangeText={setLicensedStates}
            placeholder="e.g., TX, CA, NY"
            helperText="Enter comma-separated state abbreviations"
          />
          <Input
            label="User Type"
            type="text"
            value={profile?.user_type === 'broker' ? 'Insurance Broker' : profile?.user_type || ''}
            disabled
          />
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

export default BrokerProfileSettings;
