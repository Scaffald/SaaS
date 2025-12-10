// src/pages/gc/settings/IntegrationSettings.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCcw, X } from 'lucide-react';
import SyncStatus from '../../../components/scaffald/SyncStatus';
import SyncHistory from '../../../components/scaffald/SyncHistory';

interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  syncEnabled: boolean;
}

// Initial state - Scaffald starts disconnected for the connection flow test
const initialIntegrations: Integration[] = [
  { id: '1', name: 'Scaffald', status: 'disconnected', syncEnabled: false },
  { id: '2', name: 'QuickBooks', status: 'disconnected', syncEnabled: false },
  { id: '3', name: 'Procore', status: 'disconnected', syncEnabled: false },
];

// Mock sync history data for the test
const mockSyncHistory = [
  {
    id: '1',
    sync_id: 'sync-1',
    direction: 'inbound' as const,
    action: 'COMPANY_UPDATED',
    entity_data: { name: 'Acme Construction LLC' },
    result: 'success' as const,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    sync_id: 'sync-2',
    direction: 'inbound' as const,
    action: 'PROJECT_SYNCED',
    entity_data: { name: 'Downtown Tower' },
    result: 'success' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

function GCIntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [companySyncStatus, setCompanySyncStatus] = useState<'idle' | 'pending' | 'synced' | 'error'>('idle');
  const [projectSyncStatus, setProjectSyncStatus] = useState<'idle' | 'pending' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const scaffaldIntegration = integrations.find(i => i.name === 'Scaffald');
  const isScaffaldConnected = scaffaldIntegration?.status === 'connected';

  const handleConnect = (id: string) => {
    if (id === '1') { // Scaffald
      setShowConnectionDialog(true);
    } else {
      // For other integrations, just connect
      setIntegrations(prev => prev.map(int =>
        int.id === id ? { ...int, status: 'connected', syncEnabled: true } : int
      ));
    }
  };

  const handleConfirmConnection = () => {
    // Connect Scaffald and close dialog
    setIntegrations(prev => prev.map(int =>
      int.id === '1' ? { ...int, status: 'connected', syncEnabled: true } : int
    ));
    setShowConnectionDialog(false);
    // Trigger initial sync
    handleManualSync();
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(int =>
      int.id === id ? { ...int, status: 'disconnected', syncEnabled: false } : int
    ));
    if (id === '1') {
      // Reset sync status for Scaffald
      setCompanySyncStatus('idle');
      setProjectSyncStatus('idle');
      setLastSyncedAt(null);
    }
  };

  const handleToggleSync = (id: string, currentSyncEnabled: boolean) => {
    setIntegrations(prev => prev.map(int =>
      int.id === id ? { ...int, syncEnabled: !currentSyncEnabled } : int
    ));
  };

  const handleManualSync = async () => {
    if (!isScaffaldConnected) return;

    setIsSyncing(true);
    setCompanySyncStatus('pending');
    setProjectSyncStatus('pending');

    // Simulate sync with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setCompanySyncStatus('synced');

    await new Promise(resolve => setTimeout(resolve, 300));
    setProjectSyncStatus('synced');
    setLastSyncedAt(new Date().toISOString());
    setIsSyncing(false);
  };

  return (
    <div className="gc-integration-settings">
      <h2 className="text-xl font-semibold mb-4">Integrations</h2>

      {/* Sync Status Section - only show when Scaffald is connected */}
      {isScaffaldConnected && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Scaffald Sync Status</h3>
          <div className="flex flex-col space-y-2 mb-4">
            <SyncStatus
              entityType="Company"
              status={companySyncStatus === 'idle' ? 'synced' : companySyncStatus}
              lastSyncedAt={lastSyncedAt || undefined}
            />
            <SyncStatus
              entityType="Projects"
              status={projectSyncStatus === 'idle' ? 'synced' : projectSyncStatus}
              lastSyncedAt={lastSyncedAt || undefined}
            />
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>Sync Now</span>
            </button>
            {lastSyncedAt && (
              <span className="text-sm text-gray-500">
                Synced at {new Date(lastSyncedAt).toLocaleString()}
              </span>
            )}
          </div>
          <SyncHistory history={mockSyncHistory} isLoading={false} error={undefined} />
        </div>
      )}

      {/* Integrations Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Sync Enabled</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map(integration => (
              <tr key={integration.id}>
                <td className="py-2 px-4 border-b">{integration.name}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`flex items-center space-x-1 ${integration.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                    {integration.status === 'connected' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{integration.status}</span>
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <input
                    type="checkbox"
                    checked={integration.syncEnabled}
                    onChange={() => handleToggleSync(integration.id, integration.syncEnabled)}
                    disabled={integration.status !== 'connected'}
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  {integration.status === 'connected' ? (
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-500 hover:underline"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="text-blue-500 hover:underline"
                    >
                      Connect
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Connection Dialog */}
      {showConnectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Connect Your Scaffald Company</h2>
              <button
                onClick={() => setShowConnectionDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                We found a company associated with your Scaffald account:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">&#127970;</div>
                  <div>
                    <h3 className="font-semibold">Acme Construction LLC</h3>
                    <p className="text-sm text-gray-600">123 Main Street, Austin, TX 78701</p>
                    <p className="text-sm text-gray-500">Member since: January 2024</p>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Connecting this company will:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Import your existing projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Sync contractor relationships</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Share compliance data</span>
                  </li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmConnection}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Connect This Company
                </button>
                <button
                  onClick={() => setShowConnectionDialog(false)}
                  className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Create New Company Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GCIntegrationSettings;
