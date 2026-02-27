/**
 * SyncStatus - Sync status indicator using Beyond UI
 */
import { Row, Text } from '@scaffald/ui';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type React from 'react';

interface SyncStatusProps {
  entityType: string;
  status: 'synced' | 'pending' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}

function SyncStatus({ entityType, status, lastSyncedAt, errorMessage }: SyncStatusProps) {
  const renderIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} color="currentColor" />;
      case 'pending':
        return <Loader2 size={16} color="currentColor" className="animate-spin" />;
      case 'error':
        return <XCircle size={16} color="currentColor" />;
      default:
        return null;
    }
  };

  const renderMessage = () => {
    switch (status) {
      case 'synced':
        return `Synced ${lastSyncedAt ? `at ${new Date(lastSyncedAt).toLocaleString()}` : ''}`;
      case 'pending':
        return 'Sync pending...';
      case 'error':
        return `Sync error: ${errorMessage || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  };

  const getColor = (): React.CSSProperties => {
    switch (status) {
      case 'synced':
        return { color: 'var(--color-green-9)' };
      case 'pending':
        return { color: 'var(--color-blue-9)' };
      case 'error':
        return { color: 'var(--color-red-9)' };
      default:
        return { color: 'var(--color-10)' };
    }
  };

  return (
    <Row style={{ alignItems: 'center', gap: '8px', fontSize: '14px', ...getColor() }}>
      {renderIcon()}
      <Text style={{ fontWeight: 500 }}>{entityType}:</Text>
      <Text>{renderMessage()}</Text>
    </Row>
  );
}

export default SyncStatus;
