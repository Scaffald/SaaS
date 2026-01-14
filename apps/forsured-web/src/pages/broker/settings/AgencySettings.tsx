// src/pages/broker/settings/AgencySettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Input } from '@unicornlove/beyond-ui';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

interface AgencyInfo {
  agencyName: string;
  address: string;
  phone: string;
  website: string;
}

const defaultAgencyInfo: AgencyInfo = {
  agencyName: '',
  address: '',
  phone: '',
  website: '',
};

function BrokerAgencySettings() {
  const { brokerSettings, updateBrokerSettings, isLoading, isSaving } = useSettings();

  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>(defaultAgencyInfo);
  const [originalInfo, setOriginalInfo] = useState<AgencyInfo>(defaultAgencyInfo);

  // Initialize from brokerSettings.agency_info
  useEffect(() => {
    if (brokerSettings?.agency_info) {
      const info = brokerSettings.agency_info as AgencyInfo;
      const newInfo = {
        agencyName: info.agencyName || '',
        address: info.address || '',
        phone: info.phone || '',
        website: info.website || '',
      };
      setAgencyInfo(newInfo);
      setOriginalInfo(newInfo);
    }
  }, [brokerSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(agencyInfo) !== JSON.stringify(originalInfo);
  }, [agencyInfo, originalInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateBrokerSettings({
        agency_info: agencyInfo,
      });
      setOriginalInfo(agencyInfo);
      toast.success('Agency information saved successfully');
    } catch (err) {
      console.error('Failed to save agency settings:', err);
      toast.error('Failed to save agency settings');
    }
  }, [agencyInfo, updateBrokerSettings]);

  const updateField = useCallback(<K extends keyof AgencyInfo>(
    key: K,
    value: AgencyInfo[K]
  ) => {
    setAgencyInfo(prev => ({ ...prev, [key]: value }));
  }, []);

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

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Agency Information</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={skeletonStyle} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Agency Information</H2>
      <Text muted style={{ marginBottom: 'var(--space-6)' }}>
        Manage your insurance agency's contact information.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Agency Name *</Text>
            <Input
              type="text"
              value={agencyInfo.agencyName}
              onChange={(e) => updateField('agencyName', e.target.value)}
              required
              style={inputStyle}
            />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Address *</Text>
            <Input
              type="text"
              value={agencyInfo.address}
              onChange={(e) => updateField('address', e.target.value)}
              required
              style={inputStyle}
            />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Phone *</Text>
            <Input
              type="tel"
              value={agencyInfo.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              required
              style={inputStyle}
            />
          </Stack>
          <Stack style={{ gap: 4 }}>
            <Text style={labelStyle}>Website</Text>
            <Input
              type="url"
              value={agencyInfo.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </Stack>
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            color="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default BrokerAgencySettings;
