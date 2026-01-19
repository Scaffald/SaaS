/**
 * ProfileModal - Profile settings modal using SimpleModal
 * Displays user profile information and editable settings in a modal
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, Row, Input } from '@unicornlove/beyond-ui';
import { User, Mail, Phone, FileText, MapPin, Briefcase } from 'lucide-react';
import { SimpleModal } from '../Common/SimpleModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'sonner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
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

  const handleClose = useCallback(() => {
    if (isSaving) return;
    onClose();
  }, [isSaving, onClose]);

  const isLoading = authLoading || settingsLoading;

  // Get user type display
  const getUserTypeDisplay = () => {
    if (!profile?.user_type) return 'User';
    const typeMap: Record<string, string> = {
      broker: 'Insurance Broker',
      gc: 'General Contractor',
      contractor: 'Subcontractor',
      admin: 'Administrator',
    };
    return typeMap[profile.user_type] || profile.user_type;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    backgroundColor: 'var(--color-background)',
    fontSize: 14,
  };

  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 4,
  };

  const iconBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: 'var(--color-blue-3)',
    borderRadius: 6,
    flexShrink: 0,
  };

  const footer = (
    <Row gap={12} justifyContent="flex-end" style={{ width: '100%' }}>
      <Button
        variant="ghost"
        color="gray"
        onPress={handleClose}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        color="primary"
        onPress={handleSubmit}
        disabled={!isDirty || isSaving}
        loading={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Row>
  );

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Profile Settings"
      description="View and update your profile information"
      icon={<User size={20} style={{ color: 'var(--color-blue-10)' }} />}
      width={520}
      closeOnBackdropClick={!isSaving}
      closeOnEscape={!isSaving}
      footer={footer}
      testID="profile-modal"
    >
      {isLoading ? (
        <Stack gap={16}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
                backgroundColor: 'var(--color-gray-3)',
                borderRadius: 8,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </Stack>
      ) : (
        <Stack gap={20}>
          {/* Name Field - Read Only */}
          <Stack gap={6}>
            <Row gap={8} alignItems="center">
              <div style={iconBoxStyle}>
                <User size={16} style={{ color: 'var(--color-blue-10)' }} />
              </div>
              <Text style={labelStyle}>Name</Text>
            </Row>
            <Input
              type="text"
              value={user?.name || ''}
              disabled
              style={disabledInputStyle}
            />
            <Text style={helperTextStyle}>Name is managed in Scaffald</Text>
          </Stack>

          {/* Email Field - Read Only */}
          <Stack gap={6}>
            <Row gap={8} alignItems="center">
              <div style={iconBoxStyle}>
                <Mail size={16} style={{ color: 'var(--color-blue-10)' }} />
              </div>
              <Text style={labelStyle}>Email</Text>
            </Row>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              style={disabledInputStyle}
            />
            <Text style={helperTextStyle}>Email is managed in Scaffald</Text>
          </Stack>

          {/* Phone Field - Editable */}
          <Stack gap={6}>
            <Row gap={8} alignItems="center">
              <div style={iconBoxStyle}>
                <Phone size={16} style={{ color: 'var(--color-blue-10)' }} />
              </div>
              <Text style={labelStyle}>Phone</Text>
            </Row>
            <Input
              type="tel"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              style={inputStyle}
            />
          </Stack>

          {/* License Number Field - Editable (Broker only) */}
          {profile?.user_type === 'broker' && (
            <Stack gap={6}>
              <Row gap={8} alignItems="center">
                <div style={iconBoxStyle}>
                  <FileText size={16} style={{ color: 'var(--color-blue-10)' }} />
                </div>
                <Text style={labelStyle}>License Number</Text>
              </Row>
              <Input
                type="text"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="e.g., BRK-12345"
                style={inputStyle}
              />
            </Stack>
          )}

          {/* Licensed States Field - Editable (Broker only) */}
          {profile?.user_type === 'broker' && (
            <Stack gap={6}>
              <Row gap={8} alignItems="center">
                <div style={iconBoxStyle}>
                  <MapPin size={16} style={{ color: 'var(--color-blue-10)' }} />
                </div>
                <Text style={labelStyle}>Licensed States</Text>
              </Row>
              <Input
                type="text"
                value={licensedStates}
                onChangeText={setLicensedStates}
                placeholder="e.g., TX, CA, NY"
                style={inputStyle}
              />
              <Text style={helperTextStyle}>Enter comma-separated state abbreviations</Text>
            </Stack>
          )}

          {/* User Type Field - Read Only */}
          <Stack gap={6}>
            <Row gap={8} alignItems="center">
              <div style={iconBoxStyle}>
                <Briefcase size={16} style={{ color: 'var(--color-blue-10)' }} />
              </div>
              <Text style={labelStyle}>User Type</Text>
            </Row>
            <Input
              type="text"
              value={getUserTypeDisplay()}
              disabled
              style={disabledInputStyle}
            />
          </Stack>
        </Stack>
      )}
    </SimpleModal>
  );
}
