// src/pages/contractor/settings/InsuranceSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Input } from '@scaffald/ui';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

interface InsuranceAgentInfo {
  carrier: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
}

const defaultAgentInfo: InsuranceAgentInfo = {
  carrier: '',
  agentName: '',
  agentEmail: '',
  agentPhone: '',
};

function ContractorInsuranceSettings() {
  const { contractorSettings, updateContractorSettings, isLoading, isSaving } = useSettings();

  const [agentInfo, setAgentInfo] = useState<InsuranceAgentInfo>(defaultAgentInfo);
  const [originalInfo, setOriginalInfo] = useState<InsuranceAgentInfo>(defaultAgentInfo);

  // Initialize from contractorSettings.insurance_agent_info
  useEffect(() => {
    if (contractorSettings?.insurance_agent_info) {
      const info = contractorSettings.insurance_agent_info as InsuranceAgentInfo;
      const newInfo = {
        carrier: info.carrier || '',
        agentName: info.agentName || '',
        agentEmail: info.agentEmail || '',
        agentPhone: info.agentPhone || '',
      };
      setAgentInfo(newInfo);
      setOriginalInfo(newInfo);
    }
  }, [contractorSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(agentInfo) !== JSON.stringify(originalInfo);
  }, [agentInfo, originalInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateContractorSettings({
        insurance_agent_info: agentInfo,
      });
      setOriginalInfo(agentInfo);
      toast.success('Insurance agent information saved successfully');
    } catch (err) {
      console.error('Failed to save insurance settings:', err);
      toast.error('Failed to save insurance settings');
    }
  }, [agentInfo, updateContractorSettings]);

  const updateField = useCallback(<K extends keyof InsuranceAgentInfo>(
    key: K,
    value: InsuranceAgentInfo[K]
  ) => {
    setAgentInfo(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Insurance Agent Information</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <Stack
              key={i}
              style={{
                height: 40,
                backgroundColor: 'var(--color-3)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Insurance Agent Information</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Keep your insurance agent's contact information up to date for easy communication.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="Insurance Carrier"
            type="text"
            value={agentInfo.carrier}
            onChange={(e) => updateField('carrier', e.target.value)}
            required
          />
          <Input
            label="Agent Name"
            type="text"
            value={agentInfo.agentName}
            onChange={(e) => updateField('agentName', e.target.value)}
          />
          <Input
            label="Agent Email"
            type="email"
            value={agentInfo.agentEmail}
            onChange={(e) => updateField('agentEmail', e.target.value)}
          />
          <Input
            label="Agent Phone"
            type="tel"
            value={agentInfo.agentPhone}
            onChange={(e) => updateField('agentPhone', e.target.value)}
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default ContractorInsuranceSettings;
