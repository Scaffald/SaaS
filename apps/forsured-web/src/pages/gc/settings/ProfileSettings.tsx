// src/pages/gc/settings/ProfileSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, Input } from '@unicornlove/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function GCProfileSettings() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { userSettings, updateUserSettings, isLoading: settingsLoading, isSaving } = useSettings();

  const [phone, setPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  // Initialize phone from userSettings.ui_preferences
  useEffect(() => {
    if (userSettings?.ui_preferences) {
      const storedPhone = (userSettings.ui_preferences as Record<string, unknown>).phone as string || '';
      setPhone(storedPhone);
      setOriginalPhone(storedPhone);
    }
  }, [userSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => phone !== originalPhone, [phone, originalPhone]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUserSettings({
        ui_preferences: {
          ...userSettings?.ui_preferences,
          phone,
        },
      });
      setOriginalPhone(phone);
      toast.success('Profile settings saved successfully');
    } catch (err) {
      console.error('Failed to save profile settings:', err);
      toast.error('Failed to save profile settings');
    }
  }, [phone, userSettings, updateUserSettings]);

  const isLoading = authLoading || settingsLoading;

  if (isLoading) {
    return (
      <YStack gap="$4">
        <H2>Profile Settings</H2>
        <YStack gap="$4">
          <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
          <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
          <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
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
            label="User Type"
            type="text"
            value={profile?.user_type === 'gc' ? 'General Contractor' : profile?.user_type || ''}
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

export default GCProfileSettings;
