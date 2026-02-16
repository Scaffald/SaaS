/**
 * ProcoreIntegration — Procore connection card and sync status display
 *
 * Shows one of these states:
 * 1. Not connected — "Connect Procore" button
 * 2. Connected, healthy — status info, last/next sync, "Sync Now" button, sync log
 * 3. Error — error message, "Reconnect" button
 * 4. Items need review — badge linking to SyncReviewPanel
 */

import { useState } from 'react';
import { Stack, Row, Text, Button, Card, H3, Spinner } from '@unicornlove/beyond-ui';
import { RefreshCcw, Link2, AlertTriangle, Check, Clock } from 'lucide-react-native';
import { trpc } from '../../../../lib/trpc';

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFutureTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not scheduled';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Imminent';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

interface ProcoreIntegrationProps {
  onReviewQueue: () => void;
}

export default function ProcoreIntegration({ onReviewQueue }: ProcoreIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch: refetchStatus } = trpc.procore.getStatus.useQuery();
  const { data: syncQueue } = trpc.procore.getSyncQueue.useQuery(undefined, {
    enabled: status?.status === 'connected',
  });
  const { data: syncLog } = trpc.procore.getSyncLog.useQuery(
    { limit: 5, offset: 0 },
    { enabled: status?.status === 'connected' },
  );

  const connectMutation = trpc.procore.connect.useMutation();
  const disconnectMutation = trpc.procore.disconnect.useMutation();
  const triggerSyncMutation = trpc.procore.triggerSync.useMutation();

  const pendingItems = syncQueue?.length ?? 0;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectMutation.mutateAsync();
      // Redirect to Procore OAuth
      window.location.href = result.url;
    } catch {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync();
    refetchStatus();
  };

  const handleSyncNow = async () => {
    try {
      await triggerSyncMutation.mutateAsync();
      refetchStatus();
    } catch {
      // Error displayed via triggerSyncMutation.error
    }
  };

  if (isLoading) {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Spinner size="sm" />
          <Text>Loading Procore integration...</Text>
        </Row>
      </Card>
    );
  }

  // State 1: Not connected
  if (!status) {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
          <Stack style={{ flex: 1 }}>
            <H3>Procore</H3>
            <Text style={{ color: 'var(--color-10)', fontSize: 'var(--font-size-3)' }}>
              Connect your Procore account to import projects and subcontractors.
            </Text>
          </Stack>
          <Button
            onPress={handleConnect}
            disabled={isConnecting}
            variant="primary"
            leftIcon={isConnecting ? <Spinner size="sm" /> : <Link2 size={14} />}
          >
            {isConnecting ? 'Connecting...' : 'Connect Procore'}
          </Button>
        </Row>
      </Card>
    );
  }

  // State 3: Error
  if (status.status === 'error') {
    return (
      <Card style={{ padding: 'var(--space-6)', borderColor: 'var(--color-red-7)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
          <AlertTriangle size={20} color="var(--color-red-10)" />
          <Stack style={{ flex: 1 }}>
            <H3 style={{ color: 'var(--color-red-11)' }}>Procore — Connection Error</H3>
            <Text style={{ color: 'var(--color-10)', fontSize: 'var(--font-size-3)' }}>
              Your Procore connection needs to be re-established. Please reconnect.
            </Text>
          </Stack>
          <Button onPress={handleConnect} variant="primary" disabled={isConnecting}>
            Reconnect
          </Button>
        </Row>
      </Card>
    );
  }

  // State 4: Disconnected (soft)
  if (status.status === 'disconnected') {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
          <Stack style={{ flex: 1 }}>
            <H3>Procore — Disconnected</H3>
            <Text style={{ color: 'var(--color-10)', fontSize: 'var(--font-size-3)' }}>
              Your Procore account was disconnected. Previously imported data is still available.
            </Text>
          </Stack>
          <Button onPress={handleConnect} variant="primary" disabled={isConnecting}>
            Reconnect
          </Button>
        </Row>
      </Card>
    );
  }

  // State 2: Connected, healthy
  return (
    <Card style={{ padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-4)' }}>
        {/* Header */}
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <Check size={16} color="var(--color-green-10)" />
            <H3>Procore — Connected</H3>
          </Row>
          <Button
            onPress={handleDisconnect}
            variant="ghost"
            size="sm"
            disabled={disconnectMutation.isPending}
          >
            Disconnect
          </Button>
        </Row>

        {/* Pending review badge */}
        {pendingItems > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={onReviewQueue}
            onKeyDown={(e) => e.key === 'Enter' && onReviewQueue()}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-amber-3)',
              borderRadius: 'var(--radius-3)',
              border: '1px solid var(--color-amber-7)',
              cursor: 'pointer',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={14} color="var(--color-amber-10)" />
              <Text style={{ fontWeight: 600, fontSize: 'var(--font-size-3)' }}>
                {pendingItems} item{pendingItems !== 1 ? 's' : ''} need your review
              </Text>
            </Row>
          </div>
        )}

        {/* Sync status */}
        <Row style={{ gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Stack style={{ gap: 'var(--space-1)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', fontWeight: 600, textTransform: 'uppercase' }}>
              Last Synced
            </Text>
            <Text style={{ fontSize: 'var(--font-size-3)' }}>
              {formatRelativeTime(status.last_synced_at)}
            </Text>
            {status.last_synced_at && (
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                {new Date(status.last_synced_at).toLocaleString()}
              </Text>
            )}
          </Stack>
          <Stack style={{ gap: 'var(--space-1)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Sync
            </Text>
            <Text style={{ fontSize: 'var(--font-size-3)' }}>
              {formatFutureTime(status.next_sync_at)}
            </Text>
            {status.next_sync_at && (
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                {new Date(status.next_sync_at).toLocaleString()}
              </Text>
            )}
          </Stack>
        </Row>

        {/* Sync Now button */}
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button
            onPress={handleSyncNow}
            disabled={triggerSyncMutation.isPending || !status.canManualSync}
            variant="outline"
            size="sm"
            leftIcon={triggerSyncMutation.isPending ? <Spinner size="sm" /> : <RefreshCcw size={14} />}
          >
            Sync Now
          </Button>
          {!status.canManualSync && status.minutesUntilManualSync != null && (
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
              Available {formatFutureTime(
                new Date(Date.now() + status.minutesUntilManualSync * 60_000).toISOString(),
              )}
            </Text>
          )}
          {triggerSyncMutation.error && (
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-red-10)' }}>
              {triggerSyncMutation.error.message}
            </Text>
          )}
        </Row>

        {/* Sync history */}
        {syncLog && syncLog.logs.length > 0 && (
          <Stack style={{ gap: 'var(--space-2)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', fontWeight: 600, textTransform: 'uppercase' }}>
              Recent Syncs
            </Text>
            {syncLog.logs.map((log) => (
              <Row
                key={log.id}
                style={{
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--color-2)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                {log.status === 'completed' ? (
                  <Check size={12} color="var(--color-green-10)" />
                ) : log.status === 'failed' ? (
                  <AlertTriangle size={12} color="var(--color-red-10)" />
                ) : (
                  <Clock size={12} color="var(--color-9)" />
                )}
                <Text style={{ fontSize: 'var(--font-size-2)', flex: 1 }}>
                  {log.triggered_by === 'manual' ? 'Manual' : log.triggered_by === 'initial' ? 'Initial' : 'Scheduled'} sync
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                  {log.projects_found ?? 0} projects, {log.vendors_found ?? 0} vendors
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                  {formatRelativeTime(log.started_at)}
                </Text>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
