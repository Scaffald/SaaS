// src/pages/contractor/settings/ProfileSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Input } from '@scaffald/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function ContractorProfileSettings() {
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Profile Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Profile Settings</H2>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
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
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
          />
          <Input
            label="User Type"
            type="text"
            value={profile?.user_type === 'contractor' ? 'Subcontractor' : profile?.user_type || ''}
            disabled
          />
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

export default ContractorProfileSettings;
