// src/pages/gc/settings/InsuranceSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

interface InsuranceRequirements {
  glPerOccurrence: string;
  glAggregate: string;
  wcRequired: boolean;
  autoRequired: boolean;
  umbrellaRequired: boolean;
}

function GCInsuranceSettings() {
  const { gcSettings, updateGCSettings, isLoading, isSaving } = useSettings();

  const [requirements, setRequirements] = useState<InsuranceRequirements>({
    glPerOccurrence: '1000000',
    glAggregate: '2000000',
    wcRequired: true,
    autoRequired: true,
    umbrellaRequired: false,
  });
  const [additionalInsured, setAdditionalInsured] = useState(true);
  const [waiverOfSubrogation, setWaiverOfSubrogation] = useState(true);

  const [originalState, setOriginalState] = useState({
    requirements: requirements,
    additionalInsured: true,
    waiverOfSubrogation: true,
  });

  // Initialize from gcSettings
  useEffect(() => {
    if (gcSettings) {
      const reqs = gcSettings.default_insurance_requirements as InsuranceRequirements | undefined;
      const newRequirements = {
        glPerOccurrence: reqs?.glPerOccurrence || '1000000',
        glAggregate: reqs?.glAggregate || '2000000',
        wcRequired: reqs?.wcRequired ?? true,
        autoRequired: reqs?.autoRequired ?? true,
        umbrellaRequired: reqs?.umbrellaRequired ?? false,
      };
      setRequirements(newRequirements);
      setAdditionalInsured(gcSettings.require_additional_insured);
      setWaiverOfSubrogation(gcSettings.require_waiver_of_subrogation);

      setOriginalState({
        requirements: newRequirements,
        additionalInsured: gcSettings.require_additional_insured,
        waiverOfSubrogation: gcSettings.require_waiver_of_subrogation,
      });
    }
  }, [gcSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(requirements) !== JSON.stringify(originalState.requirements) ||
      additionalInsured !== originalState.additionalInsured ||
      waiverOfSubrogation !== originalState.waiverOfSubrogation
    );
  }, [requirements, additionalInsured, waiverOfSubrogation, originalState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateGCSettings({
        default_insurance_requirements: requirements,
        require_additional_insured: additionalInsured,
        require_waiver_of_subrogation: waiverOfSubrogation,
      });
      setOriginalState({
        requirements,
        additionalInsured,
        waiverOfSubrogation,
      });
      toast.success('Insurance requirements saved successfully');
    } catch (err) {
      console.error('Failed to save insurance settings:', err);
      toast.error('Failed to save insurance settings');
    }
  }, [requirements, additionalInsured, waiverOfSubrogation, updateGCSettings]);

  const updateRequirement = useCallback(<K extends keyof InsuranceRequirements>(
    key: K,
    value: InsuranceRequirements[K]
  ) => {
    setRequirements(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoading) {
    return (
      <div className="gc-insurance-settings">
        <h2 className="text-xl font-semibold mb-4">Default Insurance Requirements</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="gc-insurance-settings">
      <h2 className="text-xl font-semibold mb-4">Default Insurance Requirements</h2>
      <p className="text-gray-600 mb-6">
        Set the default insurance requirements for subcontractors on your projects.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Liability Per Occurrence Limit ($)
          </label>
          <input
            type="number"
            value={requirements.glPerOccurrence}
            onChange={(e) => updateRequirement('glPerOccurrence', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Liability Aggregate Limit ($)
          </label>
          <input
            type="number"
            value={requirements.glAggregate}
            onChange={(e) => updateRequirement('glAggregate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requirements.wcRequired}
              onChange={(e) => updateRequirement('wcRequired', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Workers Compensation Required</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requirements.autoRequired}
              onChange={(e) => updateRequirement('autoRequired', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Commercial Auto Required</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={requirements.umbrellaRequired}
              onChange={(e) => updateRequirement('umbrellaRequired', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Umbrella/Excess Liability Required</span>
          </label>
        </div>
        <hr className="my-6" />
        <h3 className="text-lg font-medium mb-4">Endorsement Requirements</h3>
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={additionalInsured}
              onChange={(e) => setAdditionalInsured(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Require Additional Insured Endorsement</span>
          </label>
        </div>
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={waiverOfSubrogation}
              onChange={(e) => setWaiverOfSubrogation(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Require Waiver of Subrogation</span>
          </label>
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

export default GCInsuranceSettings;
