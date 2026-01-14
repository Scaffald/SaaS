// src/pages/gc/settings/IntegrationSettings.tsx
import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCcw, X } from 'lucide-react';
import { Stack, Row, Text, Button, Card, H2, H3, Spinner, Modal, ModalHeader, ModalContent } from '@unicornlove/beyond-ui';
import Checkbox from '../../../ui/Checkbox';
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
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Integrations</H2>

      {/* Sync Status Section - only show when Scaffald is connected */}
      {isScaffaldConnected && (
        <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <H3 style={{ marginBottom: 'var(--space-3)' }}>Scaffald Sync Status</H3>
          <Stack style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
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
          </Stack>
          <Row style={{ alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <Button
              onClick={handleManualSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              leftIcon={isSyncing ? <Spinner size="sm" /> : <RefreshCcw size={14} />}
            >
              Sync Now
            </Button>
            {lastSyncedAt && (
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                Synced at {new Date(lastSyncedAt).toLocaleString()}
              </Text>
            )}
          </Row>
          <SyncHistory history={mockSyncHistory} isLoading={false} error={undefined} />
        </Card>
      )}

      {/* Integrations Table */}
      <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <Stack style={{ gap: 'var(--space-2)' }}>
          {/* Table Header */}
          <Row style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Name</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Status</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Sync Enabled</Text>
            <Text style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-4)' }}>Actions</Text>
          </Row>
          {/* Table Rows */}
          {integrations.map(integration => (
            <Row
              key={integration.id}
              style={{
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-2)',
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
              }}
            >
              <Text style={{ flex: 1, fontSize: 'var(--font-size-4)' }}>{integration.name}</Text>
              <Row style={{ flex: 1, alignItems: 'center', gap: 'var(--space-1)' }}>
                {integration.status === 'connected' ? (
                  <CheckCircle size={16} color="var(--color-green-10)" />
                ) : (
                  <XCircle size={16} color="var(--color-red-10)" />
                )}
                <Text
                  style={{
                    fontSize: 'var(--font-size-4)',
                    color: integration.status === 'connected' ? 'var(--color-green-10)' : 'var(--color-red-10)',
                  }}
                >
                  {integration.status}
                </Text>
              </Row>
              <Row style={{ flex: 1 }}>
                <Checkbox
                  checked={integration.syncEnabled}
                  onChange={(e) => {
                    if (e.target.checked !== undefined) {
                      handleToggleSync(integration.id, integration.syncEnabled);
                    }
                  }}
                  disabled={integration.status !== 'connected'}
                />
              </Row>
              <Row style={{ flex: 1 }}>
                {integration.status === 'connected' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                  >
                    Connect
                  </Button>
                )}
              </Row>
            </Row>
          ))}
        </Stack>
      </Card>

      {/* Connection Dialog */}
      <Modal open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <ModalHeader
          title="Connect Your Scaffald Company"
          onClose={() => setShowConnectionDialog(false)}
        />
        <ModalContent>
          <Stack style={{ padding: 'var(--space-6)' }}>
            <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-4)' }}>
              We found a company associated with your Scaffald account:
            </Text>
            <Card style={{ backgroundColor: 'var(--color-2)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <Text style={{ fontSize: 'var(--font-size-8)' }}>&#127970;</Text>
                <Stack style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 600, fontSize: 'var(--font-size-5)' }}>Acme Construction LLC</Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>123 Main Street, Austin, TX 78701</Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-9)' }}>Member since: January 2024</Text>
                </Stack>
              </Row>
            </Card>
            <Stack style={{ marginBottom: 'var(--space-6)' }}>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)', marginBottom: 'var(--space-2)' }}>Connecting this company will:</Text>
              <Stack style={{ gap: 'var(--space-1)' }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle size={14} color="var(--color-green-10)" />
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Import your existing projects</Text>
                </Row>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle size={14} color="var(--color-green-10)" />
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Sync contractor relationships</Text>
                </Row>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle size={14} color="var(--color-green-10)" />
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Share compliance data</Text>
                </Row>
              </Stack>
            </Stack>
            <Row style={{ gap: 'var(--space-3)' }}>
              <Button
                style={{ flex: 1 }}
                variant="primary"
                onClick={handleConfirmConnection}
              >
                Connect This Company
              </Button>
              <Button
                style={{ flex: 1 }}
                variant="outline"
                onClick={() => setShowConnectionDialog(false)}
              >
                Create New Company Instead
              </Button>
            </Row>
          </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

export default GCIntegrationSettings;
