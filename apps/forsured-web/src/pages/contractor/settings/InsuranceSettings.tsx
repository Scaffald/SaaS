// src/pages/contractor/settings/InsuranceSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      <div className="contractor-insurance-settings">
        <h2 className="text-xl font-semibold mb-4">Insurance Agent Information</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="contractor-insurance-settings">
      <h2 className="text-xl font-semibold mb-4">Insurance Agent Information</h2>
      <p className="text-gray-600 mb-6">
        Keep your insurance agent's contact information up to date for easy communication.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Carrier</label>
          <input
            type="text"
            value={agentInfo.carrier}
            onChange={(e) => updateField('carrier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
          <input
            type="text"
            value={agentInfo.agentName}
            onChange={(e) => updateField('agentName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent Email</label>
          <input
            type="email"
            value={agentInfo.agentEmail}
            onChange={(e) => updateField('agentEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent Phone</label>
          <input
            type="tel"
            value={agentInfo.agentPhone}
            onChange={(e) => updateField('agentPhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

export default ContractorInsuranceSettings;
