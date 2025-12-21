// src/pages/admin/AuditLog.tsx
import { useState } from 'react';
import { Search, RefreshCcw, FileText } from 'lucide-react';
import { YStack, XStack, Text, H1, Card, Button, Input, Select, styled, EmptyState } from '@unicornlove/ui';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

// Generate dynamic timestamps for realistic mock data
const now = new Date();
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    admin_user_id: 'user-4',
    action: 'CREATE_INVITATION',
    target_type: 'broker_invitation',
    target_id: 'inv-1',
    created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: '2',
    admin_user_id: 'user-4',
    action: 'UPDATE_USER_ROLE',
    target_type: 'user',
    target_id: 'user-1',
    created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: '3',
    admin_user_id: 'user-4',
    action: 'DELETE_ENUM_VALUE',
    target_type: 'enum_value',
    target_id: 'enum-1',
    created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
];

// Use inline styles for native CSS table properties to avoid React prop warnings
const tableStyle = { borderCollapse: 'collapse' as const, width: '100%' };
const thStyle = { textAlign: 'left' as const, padding: '8px 16px', borderBottom: '1px solid var(--borderColor, #e5e5e5)' };
const tdStyle = { padding: '8px 16px', borderBottom: '1px solid var(--borderColor, #e5e5e5)' };
const trStyle = { borderBottom: '1px solid var(--borderColor, #e5e5e5)' };


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

        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery || actionFilter !== 'all' ? 'No audit logs match your filters' : 'No audit logs yet'}
            description={searchQuery || actionFilter !== 'all'
              ? 'Try adjusting your search query or filter criteria to find audit logs.'
              : 'Admin actions will be logged here for auditing and compliance purposes.'}
            secondaryAction={searchQuery || actionFilter !== 'all' ? {
              label: "Clear Filters",
              onClick: () => {
                setSearchQuery('');
                setActionFilter('all');
              },
            } : undefined}
          />
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={trStyle}>
                <th style={thStyle}>
                  <Text fontWeight="600">Timestamp</Text>
                </th>
                <th style={thStyle}>
                  <Text fontWeight="600">User ID</Text>
                </th>
                <th style={thStyle}>
                  <Text fontWeight="600">Action</Text>
                </th>
                <th style={thStyle}>
                  <Text fontWeight="600">Target Type</Text>
                </th>
                <th style={thStyle}>
                  <Text fontWeight="600">Target ID</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={trStyle}>
                  <td style={tdStyle}>
                    <Text>{new Date(log.created_at).toLocaleString()}</Text>
                  </td>
                  <td style={tdStyle}>
                    <Text>{log.admin_user_id}</Text>
                  </td>
                  <td style={tdStyle}>
                    <Text>{log.action}</Text>
                  </td>
                  <td style={tdStyle}>
                    <Text>{log.target_type}</Text>
                  </td>
                  <td style={tdStyle}>
                    <Text>{log.target_id}</Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </YStack>
  );
}

export default AdminAuditLog;
