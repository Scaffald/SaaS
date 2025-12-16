/**
 * SyncStatus - Sync status indicator using Tamagui
 */
import { useState, useEffect } from 'react';
import { XStack, Text, View } from '@unicornlove/ui';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SyncStatusProps {
  entityType: string;
  status: 'synced' | 'pending' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}

function SyncStatus({ entityType, status, lastSyncedAt, errorMessage }: SyncStatusProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (status === 'pending') {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 30) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [status]);

  const renderIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} color="currentColor" />;
      case 'pending':
        return (
          <View animation="quick" rotate={`${rotation}deg`}>
            <Loader2 size={16} color="currentColor" />
          </View>
        );
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

  const getColor = () => {
    switch (status) {
      case 'synced':
        return '$green9';
      case 'pending':
        return '$blue9';
      case 'error':
        return '$red9';
      default:
        return '$color10';
    }
  };

  return (
    <XStack alignItems="center" gap="$2" fontSize="$2" color={getColor()}>
      {renderIcon()}
      <Text fontWeight="500">{entityType}:</Text>
      <Text>{renderMessage()}</Text>
    </XStack>
  );
}

export default SyncStatus;
