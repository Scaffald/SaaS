// src/pages/gc/settings/CompanySettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { scaffaldClient } from '../../../lib/scaffald/client';
import { toast } from 'sonner';

interface CompanyInfo {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  website: string;
}

const defaultCompanyInfo: CompanyInfo = {
  name: '',
  address: { street: '', city: '', state: '', zip: '' },
  phone: '',
  website: '',
};

function GCCompanySettings() {
  const { user, isLoading: authLoading } = useAuth();

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [originalInfo, setOriginalInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get the first company the user belongs to
  const companyId = user?.companies?.[0]?.company_id;

  // Fetch company data from Scaffald
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const company = await scaffaldClient.companies.get(companyId);
        if (company) {
          const info: CompanyInfo = {
            name: company.name,
            address: company.address || { street: '', city: '', state: '', zip: '' },
            phone: company.phone || '',
            website: company.website || '',
          };
          setCompanyInfo(info);
          setOriginalInfo(info);
        }
      } catch (err) {
        console.error('Failed to fetch company:', err);
        toast.error('Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(companyInfo) !== JSON.stringify(originalInfo);
  }, [companyInfo, originalInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) return;

    setIsSaving(true);
    try {
      await scaffaldClient.companies.update(companyId, {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        website: companyInfo.website,
      });
      setOriginalInfo(companyInfo);
      toast.success('Company settings saved successfully');
    } catch (err) {
      console.error('Failed to save company settings:', err);
      toast.error('Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  }, [companyId, companyInfo]);

  const updateField = useCallback(<K extends keyof CompanyInfo>(
    key: K,
    value: CompanyInfo[K]
  ) => {
    setCompanyInfo(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAddress = useCallback((field: keyof CompanyInfo['address'], value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="gc-company-settings">
        <h2 className="text-xl font-semibold mb-4">Company Profile</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="gc-company-settings">
        <h2 className="text-xl font-semibold mb-4">Company Profile</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No company is linked to your account. Please complete onboarding to connect your company.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gc-company-settings">
      <h2 className="text-xl font-semibold mb-4">Company Profile</h2>
      <p className="text-gray-600 mb-6">
        Manage your company information. This data is synced with Scaffald.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            value={companyInfo.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input
            type="text"
            value={companyInfo.address.street}
            onChange={(e) => updateAddress('street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={companyInfo.address.city}
              onChange={(e) => updateAddress('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={companyInfo.address.state}
              onChange={(e) => updateAddress('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={companyInfo.address.zip}
              onChange={(e) => updateAddress('zip', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={companyInfo.website}
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

export default GCCompanySettings;
