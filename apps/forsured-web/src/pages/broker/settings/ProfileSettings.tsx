// src/pages/broker/settings/ProfileSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Input } from '@unicornlove/beyond-ui';
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

  const handleSubmit = useCallback(async () => {
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

  const skeletonStyle: React.CSSProperties = {
    height: 40,
    backgroundColor: 'var(--color-3)',
    borderRadius: 'var(--radius-4)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: 4,
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 4,
  };

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Profile Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={skeletonStyle} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Profile Settings</H2>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Name</Text>
            <Input
              type="text"
              value={user?.name || ''}
              disabled
              style={{ ...inputStyle, opacity: 0.6 }}
            />
            <Text style={helperTextStyle}>Name is managed in Scaffald</Text>
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Email</Text>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              style={{ ...inputStyle, opacity: 0.6 }}
            />
            <Text style={helperTextStyle}>Email is managed in Scaffald</Text>
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Phone</Text>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              style={inputStyle}
            />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>License Number</Text>
            <Input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g., BRK-12345"
              style={inputStyle}
            />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Licensed States</Text>
            <Input
              type="text"
              value={licensedStates}
              onChange={(e) => setLicensedStates(e.target.value)}
              placeholder="e.g., TX, CA, NY"
              style={inputStyle}
            />
            <Text style={helperTextStyle}>Enter comma-separated state abbreviations</Text>
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>User Type</Text>
            <Input
              type="text"
              value={profile?.user_type === 'broker' ? 'Insurance Broker' : profile?.user_type || ''}
              disabled
              style={{ ...inputStyle, opacity: 0.6 }}
            />
          </Stack>
          <Button
            onPress={handleSubmit}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            color="primary"
          >
            Save Changes
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default BrokerProfileSettings;
