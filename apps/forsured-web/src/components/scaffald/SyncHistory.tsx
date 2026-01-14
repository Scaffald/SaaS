/**
 * SyncHistory - Sync history table using Beyond UI
 */
import { Stack, Text, Chip } from '@unicornlove/beyond-ui';
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
      <Stack style={{ padding: '16px', alignItems: 'center' }}>
        <Text>Loading sync history...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack style={{ padding: '16px', alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-red-9)' }}>Error loading sync history: {error.message}</Text>
      </Stack>
    );
  }

  if (history.length === 0) {
    return (
      <Stack style={{ padding: '16px', alignItems: 'center' }}>
        <Text style={{ color: 'var(--color-10)' }}>No sync history available.</Text>
      </Stack>
    );
  }

  const columns: ColumnDef<SyncLogEntry>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => (
        <Text style={{ fontSize: '14px' }}>
          {new Date(row.original.created_at).toLocaleString()}
        </Text>
      ),
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
      cell: ({ row }) => (
        <Text style={{ fontSize: '14px' }}>{row.original.direction}</Text>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Text style={{ fontSize: '14px' }}>{row.original.action}</Text>
      ),
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => {
        const result = row.original.result;
        const type = result === 'success' ? 'success' : result === 'error' ? 'error' : 'warning';
        return (
          <Chip type={type} size="sm">
            {result}
          </Chip>
        );
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <Text style={{ fontSize: '14px' }}>
          {row.original.error_message || JSON.stringify(row.original.entity_data)}
        </Text>
      ),
    },
  ];

  return (
    <Stack style={{ gap: '16px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
        Sync History
      </Text>
      <DataTable
        data={history}
        columns={columns}
        enableSorting
        enablePagination
        pageSize={10}
      />
    </Stack>
  );
}

export default SyncHistory;
