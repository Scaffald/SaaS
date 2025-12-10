// src/pages/contractor/settings/DocumentSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function ContractorDocumentSettings() {
  const { contractorSettings, updateContractorSettings, isLoading, isSaving } = useSettings();

  const [autoShareWithGCs, setAutoShareWithGCs] = useState(true);
  const [originalAutoShare, setOriginalAutoShare] = useState(true);

  // Initialize from contractorSettings
  useEffect(() => {
    if (contractorSettings) {
      const autoShare = contractorSettings.auto_share_documents ?? true;
      setAutoShareWithGCs(autoShare);
      setOriginalAutoShare(autoShare);
    }
  }, [contractorSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return autoShareWithGCs !== originalAutoShare;
  }, [autoShareWithGCs, originalAutoShare]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateContractorSettings({
        auto_share_documents: autoShareWithGCs,
      });
      setOriginalAutoShare(autoShareWithGCs);
      toast.success('Document settings saved successfully');
    } catch (err) {
      console.error('Failed to save document settings:', err);
      toast.error('Failed to save document settings');
    }
  }, [autoShareWithGCs, updateContractorSettings]);

  if (isLoading) {
    return (
      <div className="contractor-document-settings">
        <h2 className="text-xl font-semibold mb-4">Document Settings</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="contractor-document-settings">
      <h2 className="text-xl font-semibold mb-4">Document Settings</h2>
      <p className="text-gray-600 mb-6">
        Configure how your documents are shared with General Contractors.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoShareWithGCs}
              onChange={(e) => setAutoShareWithGCs(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Automatically share documents with General Contractors
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-6">
            When enabled, uploaded COIs and insurance documents will automatically be shared with GCs you work with.
          </p>
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

export default ContractorDocumentSettings;
