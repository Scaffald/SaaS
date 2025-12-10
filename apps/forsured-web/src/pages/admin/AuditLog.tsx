// src/pages/admin/AuditLog.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw } from 'lucide-react';
// import { Button } from '@unicornlove/ui'; // Assuming Button component exists

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

function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
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
    <div className="admin-audit-log-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Audit Log</h1>
        {/* <Button variant="secondary" onClick={handleRefresh}>
          <RefreshCcw size={16} className="mr-2" /> Refresh
        </Button> */}
        <button onClick={handleRefresh}>Refresh</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, type, or ID"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="actionFilter" className="sr-only">Filter by Action</label>
            <select
              id="actionFilter"
              className="p-2 border rounded-md"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="CREATE_INVITATION">Create Invitation</option>
              <option value="UPDATE_USER_ROLE">Update User Role</option>
              <option value="DELETE_ENUM_VALUE">Delete Enum Value</option>
            </select>
          </div>
        </div>

        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Timestamp</th>
              <th className="py-2 px-4 border-b text-left">User ID</th>
              <th className="py-2 px-4 border-b text-left">Action</th>
              <th className="py-2 px-4 border-b text-left">Target Type</th>
              <th className="py-2 px-4 border-b text-left">Target ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="py-2 px-4 border-b">{new Date(log.created_at).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{log.admin_user_id}</td>
                <td className="py-2 px-4 border-b">{log.action}</td>
                <td className="py-2 px-4 border-b">{log.target_type}</td>
                <td className="py-2 px-4 border-b">{log.target_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminAuditLog;
