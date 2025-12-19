// src/pages/broker/settings/AgencySettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, Input } from '@unicornlove/ui';
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

  if (isLoading) {
    return (
      <YStack gap="$4">
        <H2>Agency Information</H2>
        <YStack gap="$4">
          {[1, 2, 3, 4].map(i => (
            <YStack key={i} height={40} backgroundColor="$color3" borderRadius="$4" />
          ))}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Agency Information</H2>
      <Text color="$color10" marginBottom="$6">
        Manage your insurance agency's contact information.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Input
            label="Agency Name"
            type="text"
            value={agencyInfo.agencyName}
            onChangeText={(value) => updateField('agencyName', value)}
            required
          />
          <Input
            label="Address"
            type="text"
            value={agencyInfo.address}
            onChangeText={(value) => updateField('address', value)}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={agencyInfo.phone}
            onChangeText={(value) => updateField('phone', value)}
            required
          />
          <Input
            label="Website"
            type="url"
            value={agencyInfo.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="https://example.com"
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            marginTop="$6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default BrokerAgencySettings;
