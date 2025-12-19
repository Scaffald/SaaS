// src/pages/gc/settings/IntegrationSettings.tsx
import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCcw, X } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H2, H3, Spinner, Dialog } from '@unicornlove/ui';
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
    <YStack gap="$4">
      <H2>Integrations</H2>

      {/* Sync Status Section - only show when Scaffald is connected */}
      {isScaffaldConnected && (
        <Card padding="$6" marginBottom="$6">
          <H3 marginBottom="$3">Scaffald Sync Status</H3>
          <YStack gap="$2" marginBottom="$4">
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
          </YStack>
          <XStack alignItems="center" gap="$4" marginBottom="$4">
            <Button
              onPress={handleManualSync}
              disabled={isSyncing}
              variant="outlined"
              size="$3"
              icon={isSyncing ? <Spinner size="small" /> : <RefreshCcw size={14} />}
            >
              Sync Now
            </Button>
            {lastSyncedAt && (
              <Text fontSize="$3" color="$color10">
                Synced at {new Date(lastSyncedAt).toLocaleString()}
              </Text>
            )}
          </XStack>
          <SyncHistory history={mockSyncHistory} isLoading={false} error={undefined} />
        </Card>
      )}

      {/* Integrations Table */}
      <Card padding="$6" marginBottom="$6">
        <YStack gap="$2">
          {/* Table Header */}
          <XStack paddingVertical="$2" paddingHorizontal="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
            <Text flex={1} fontWeight="600" fontSize="$4">Name</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Status</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Sync Enabled</Text>
            <Text flex={1} fontWeight="600" fontSize="$4">Actions</Text>
          </XStack>
          {/* Table Rows */}
          {integrations.map(integration => (
            <XStack
              key={integration.id}
              paddingVertical="$2"
              paddingHorizontal="$4"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              alignItems="center"
            >
              <Text flex={1} fontSize="$4">{integration.name}</Text>
              <XStack flex={1} alignItems="center" gap="$1">
                {integration.status === 'connected' ? (
                  <CheckCircle size={16} color="$green10" />
                ) : (
                  <XCircle size={16} color="$red10" />
                )}
                <Text
                  fontSize="$4"
                  color={integration.status === 'connected' ? '$green10' : '$red10'}
                >
                  {integration.status}
                </Text>
              </XStack>
              <XStack flex={1}>
                <Checkbox
                  checked={integration.syncEnabled}
                  onChange={(e) => {
                    if (e.target.checked !== undefined) {
                      handleToggleSync(integration.id, integration.syncEnabled);
                    }
                  }}
                  disabled={integration.status !== 'connected'}
                />
              </XStack>
              <XStack flex={1}>
                {integration.status === 'connected' ? (
                  <Button
                    variant="ghost"
                    size="$3"
                    onPress={() => handleDisconnect(integration.id)}
                    color="$red10"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="$3"
                    onPress={() => handleConnect(integration.id)}
                    color="$blue10"
                  >
                    Connect
                  </Button>
                )}
              </XStack>
            </XStack>
          ))}
        </YStack>
      </Card>

      {/* Connection Dialog */}
      <Dialog modal open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <Dialog.Portal>
          <Dialog.Overlay key="overlay" />
          <Dialog.Content key="content" maxWidth={600} width="90vw">
            <XStack alignItems="center" justifyContent="space-between" padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
              <H3>Connect Your Scaffald Company</H3>
              <Button
                variant="ghost"
                size="$2"
                onPress={() => setShowConnectionDialog(false)}
                circular
              >
                <X size={20} />
              </Button>
            </XStack>
            <YStack padding="$6">
              <Text color="$color10" marginBottom="$4">
                We found a company associated with your Scaffald account:
              </Text>
              <Card backgroundColor="$color2" borderRadius="$4" padding="$4" marginBottom="$4" borderWidth={1} borderColor="$borderColor">
                <XStack alignItems="flex-start" gap="$3">
                  <Text fontSize="$8">🏢</Text>
                  <YStack flex={1}>
                    <Text fontWeight="600" fontSize="$5">Acme Construction LLC</Text>
                    <Text fontSize="$3" color="$color10">123 Main Street, Austin, TX 78701</Text>
                    <Text fontSize="$3" color="$color9">Member since: January 2024</Text>
                  </YStack>
                </XStack>
              </Card>
              <YStack marginBottom="$6">
                <Text fontSize="$3" color="$color10" marginBottom="$2">Connecting this company will:</Text>
                <YStack gap="$1">
                  <XStack alignItems="center" gap="$2">
                    <CheckCircle size={14} color="$green10" />
                    <Text fontSize="$3" color="$color10">Import your existing projects</Text>
                  </XStack>
                  <XStack alignItems="center" gap="$2">
                    <CheckCircle size={14} color="$green10" />
                    <Text fontSize="$3" color="$color10">Sync contractor relationships</Text>
                  </XStack>
                  <XStack alignItems="center" gap="$2">
                    <CheckCircle size={14} color="$green10" />
                    <Text fontSize="$3" color="$color10">Share compliance data</Text>
                  </XStack>
                </YStack>
              </YStack>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="primary"
                  onPress={handleConfirmConnection}
                >
                  Connect This Company
                </Button>
                <Button
                  flex={1}
                  variant="outlined"
                  onPress={() => setShowConnectionDialog(false)}
                >
                  Create New Company Instead
                </Button>
              </XStack>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </YStack>
  );
}

export default GCIntegrationSettings;
