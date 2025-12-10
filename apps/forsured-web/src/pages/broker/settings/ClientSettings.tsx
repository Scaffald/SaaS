// src/pages/broker/settings/ClientSettings.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function BrokerClientSettings() {
  const { brokerSettings, updateBrokerSettings, isLoading, isSaving } = useSettings();

  const [autoAssignClients, setAutoAssignClients] = useState(false);
  const [originalAutoAssign, setOriginalAutoAssign] = useState(false);

  // Initialize from brokerSettings
  useEffect(() => {
    if (brokerSettings) {
      const autoAssign = brokerSettings.auto_assign_clients ?? false;
      setAutoAssignClients(autoAssign);
      setOriginalAutoAssign(autoAssign);
    }
  }, [brokerSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return autoAssignClients !== originalAutoAssign;
  }, [autoAssignClients, originalAutoAssign]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateBrokerSettings({
        auto_assign_clients: autoAssignClients,
      });
      setOriginalAutoAssign(autoAssignClients);
      toast.success('Client settings saved successfully');
    } catch (err) {
      console.error('Failed to save client settings:', err);
      toast.error('Failed to save client settings');
    }
  }, [autoAssignClients, updateBrokerSettings]);

  if (isLoading) {
    return (
      <div className="broker-client-settings">
        <h2 className="text-xl font-semibold mb-4">Client Management Settings</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="broker-client-settings">
      <h2 className="text-xl font-semibold mb-4">Client Management Settings</h2>
      <p className="text-gray-600 mb-6">
        Configure how new clients are assigned to you.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoAssignClients}
              onChange={(e) => setAutoAssignClients(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Automatically assign new clients to me
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-6">
            When enabled, new clients in your agency's territory will automatically be assigned to you.
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

export default BrokerClientSettings;
