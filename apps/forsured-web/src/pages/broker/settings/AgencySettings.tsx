// src/pages/broker/settings/AgencySettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      <div className="broker-agency-settings">
        <h2 className="text-xl font-semibold mb-4">Agency Information</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="broker-agency-settings">
      <h2 className="text-xl font-semibold mb-4">Agency Information</h2>
      <p className="text-gray-600 mb-6">
        Manage your insurance agency's contact information.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
          <input
            type="text"
            value={agencyInfo.agencyName}
            onChange={(e) => updateField('agencyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={agencyInfo.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={agencyInfo.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={agencyInfo.website}
            onChange={(e) => updateField('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
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

export default BrokerAgencySettings;
