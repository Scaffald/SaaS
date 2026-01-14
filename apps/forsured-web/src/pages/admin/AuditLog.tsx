// src/pages/admin/AuditLog.tsx
import { useState } from 'react';
import { Search, RefreshCcw, FileText } from 'lucide-react';
import { Stack, Row, Text, H1, Card, Button, Input } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize } from '@unicornlove/beyond-ui';
import Select from '../../components/Common/Select';
import { EmptyState } from '../../ui/EmptyState';

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
const thStyle = { textAlign: 'left' as const, padding: `${spacing[8]} ${spacing[16]}`, borderBottom: `1px solid ${colors.border.light.default}` };
const tdStyle = { padding: `${spacing[8]} ${spacing[16]}`, borderBottom: `1px solid ${colors.border.light.default}` };
const trStyle = { borderBottom: `1px solid ${colors.border.light.default}` };


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
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>Admin Audit Log</H1>
        <Button variant="outline" onClick={handleRefresh}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <RefreshCcw size={16} />
            <Text>Refresh</Text>
          </Row>
        </Button>
      </Row>

      <Card style={{ backgroundColor: colors.bg.light.default, padding: spacing[24], borderRadius: borderRadius.s, marginBottom: spacing[24] }}>
        <Row style={{ alignItems: 'center', gap: spacing[16], marginBottom: spacing[16] }}>
          <Row style={{ position: 'relative', flex: 1, alignItems: 'center' }}>
            <Row
              style={{
                position: 'absolute',
                left: spacing[12],
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              <Search size={18} color={colors.text.light.tertiary} />
            </Row>
            <Input
              type="text"
              placeholder="Search by action, type, or ID"
              style={{ width: '100%', paddingLeft: spacing[40], paddingRight: spacing[16], paddingTop: spacing[8], paddingBottom: spacing[8], borderWidth: 1, borderRadius: borderRadius.s }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Row>
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
        </Row>

        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery || actionFilter !== 'all' ? 'No audit logs match your filters' : 'No audit logs yet'}
            description={searchQuery || actionFilter !== 'all'
              ? 'Try adjusting your search query or filter criteria to find audit logs.'
              : 'Admin actions will be logged here for auditing and compliance purposes.'}
            secondaryAction={searchQuery || actionFilter !== 'all' ? {
              label: "Clear Filters",
              onPress: () => {
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
                  <Text style={{ fontWeight: 600 }}>Timestamp</Text>
                </th>
                <th style={thStyle}>
                  <Text style={{ fontWeight: 600 }}>User ID</Text>
                </th>
                <th style={thStyle}>
                  <Text style={{ fontWeight: 600 }}>Action</Text>
                </th>
                <th style={thStyle}>
                  <Text style={{ fontWeight: 600 }}>Target Type</Text>
                </th>
                <th style={thStyle}>
                  <Text style={{ fontWeight: 600 }}>Target ID</Text>
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
    </Stack>
  );
}

export default AdminAuditLog;
