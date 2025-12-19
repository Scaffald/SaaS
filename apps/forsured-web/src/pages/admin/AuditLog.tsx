// src/pages/admin/AuditLog.tsx
import { useState } from 'react';
import { Search, RefreshCcw } from 'lucide-react';
import { YStack, XStack, Text, H1, Card, Button, Input, Select, styled } from '@unicornlove/ui';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

const mockAuditLogs: AuditLogEntry[] = [
  { id: '1', admin_user_id: 'user-4', action: 'CREATE_INVITATION', target_type: 'broker_invitation', target_id: 'inv-1', created_at: '2024-10-25T10:00:00Z' },
  { id: '2', admin_user_id: 'user-4', action: 'UPDATE_USER_ROLE', target_type: 'user', target_id: 'user-1', created_at: '2024-10-25T10:30:00Z' },
  { id: '3', admin_user_id: 'user-4', action: 'DELETE_ENUM_VALUE', target_type: 'enum_value', target_id: 'enum-1', created_at: '2024-10-25T11:00:00Z' },
];

const Table = styled('table', {
  name: 'Table',
  width: '100%',
  backgroundColor: '$background',
  borderCollapse: 'collapse',
});

const TableHead = styled('thead', {
  name: 'TableHead',
});

const TableBody = styled('tbody', {
  name: 'TableBody',
});

const TableRow = styled('tr', {
  name: 'TableRow',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

const TableHeaderCell = styled('th', {
  name: 'TableHeaderCell',
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  textAlign: 'left',
});

const TableCell = styled('td', {
  name: 'TableCell',
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});


function AdminAuditLog() {
  const [logs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.target_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleRefresh = () => {
    console.log('Refreshing audit logs');
    // In a real app, refetch logs from backend
  };

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="bold">Admin Audit Log</H1>
        <Button variant="outlined" onPress={handleRefresh}>
          <XStack alignItems="center" gap="$2">
            <RefreshCcw size={16} />
            <Text>Refresh</Text>
          </XStack>
        </Button>
      </XStack>

      <Card backgroundColor="$background" padding="$6" borderRadius="$4" elevation={1} marginBottom="$6">
        <XStack alignItems="center" gap="$4" marginBottom="$4">
          <XStack position="relative" flex={1} alignItems="center">
            <XStack
              position="absolute"
              left="$3"
              zIndex={1}
              pointerEvents="none"
            >
              <Search size={18} color="$color10" />
            </XStack>
            <Input
              type="text"
              placeholder="Search by action, type, or ID"
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderRadius="$4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </XStack>
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'CREATE_INVITATION', label: 'Create Invitation' },
              { value: 'UPDATE_USER_ROLE', label: 'Update User Role' },
              { value: 'DELETE_ENUM_VALUE', label: 'Delete Enum Value' },
            ]}
          />
        </XStack>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <Text fontWeight="600">Timestamp</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text fontWeight="600">User ID</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text fontWeight="600">Action</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text fontWeight="600">Target Type</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text fontWeight="600">Target ID</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>
                  <Text>{new Date(log.created_at).toLocaleString()}</Text>
                </TableCell>
                <TableCell>
                  <Text>{log.admin_user_id}</Text>
                </TableCell>
                <TableCell>
                  <Text>{log.action}</Text>
                </TableCell>
                <TableCell>
                  <Text>{log.target_type}</Text>
                </TableCell>
                <TableCell>
                  <Text>{log.target_id}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </YStack>
  );
}

export default AdminAuditLog;
