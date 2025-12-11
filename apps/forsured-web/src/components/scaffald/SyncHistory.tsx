/**
 * SyncHistory - Sync history table using Tamagui
 */
import { YStack, Text } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { DataTable } from '../Common/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface SyncLogEntry {
  id: string;
  sync_id: string;
  direction: 'inbound' | 'outbound';
  action: string;
  entity_data: any;
  result: 'success' | 'error' | 'skipped';
  error_message?: string;
  created_at: string;
}

interface SyncHistoryProps {
  history: SyncLogEntry[];
  isLoading?: boolean;
  error?: any;
}

function SyncHistory({ history, isLoading, error }: SyncHistoryProps) {
  if (isLoading) {
    return (
      <YStack padding="$4" alignItems="center">
        <Text>Loading sync history...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack padding="$4" alignItems="center">
        <Text color="$red9">Error loading sync history: {error.message}</Text>
      </YStack>
    );
  }

  if (history.length === 0) {
    return (
      <YStack padding="$4" alignItems="center">
        <Text color="$color10">No sync history available.</Text>
      </YStack>
    );
  }

  const columns: ColumnDef<SyncLogEntry>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => (
        <Text fontSize="$2">
          {new Date(row.original.created_at).toLocaleString()}
        </Text>
      ),
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
      cell: ({ row }) => (
        <Text fontSize="$2">{row.original.direction}</Text>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Text fontSize="$2">{row.original.action}</Text>
      ),
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => {
        const result = row.original.result;
        const variant = result === 'success' ? 'success' : result === 'error' ? 'error' : 'warning';
        return (
          <Badge variant={variant} size="sm">
            {result}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <Text fontSize="$2">
          {row.original.error_message || JSON.stringify(row.original.entity_data)}
        </Text>
      ),
    },
  ];

  return (
    <YStack gap="$4">
      <Text fontSize="$5" fontWeight="600" marginBottom="$4">
        Sync History
      </Text>
      <DataTable
        data={history}
        columns={columns}
        enableSorting
        enablePagination
        pageSize={10}
      />
    </YStack>
  );
}

export default SyncHistory;
