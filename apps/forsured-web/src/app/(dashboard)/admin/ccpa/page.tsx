/**
 * REQ-3: CCPA Compliance Implementation
 * CCPA Admin Dashboard
 *
 * Administrative interface for managing CCPA compliance:
 * - View compliance metrics
 * - Manage data requests
 * - Monitor 45-day deadline compliance
 * - Generate compliance reports
 */

'use client';

import { useState, useEffect } from 'react';

// Types
interface ComplianceMetrics {
  total_requests: number;
  pending_requests: number;
  processing_requests: number;
  completed_requests: number;
  failed_requests: number;
  average_processing_days: number;
  compliance_rate: number;
  overdue_count: number;
  requests_by_type: {
    export: number;
    deletion: number;
    correction: number;
    opt_out: number;
  };
}

interface CCPARequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  type: 'export' | 'deletion' | 'correction' | 'opt_out';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  days_elapsed: number;
  is_overdue: boolean;
}

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const TYPE_COLORS: Record<string, string> = {
  export: 'bg-blue-100 text-blue-800',
  deletion: 'bg-red-100 text-red-800',
  correction: 'bg-purple-100 text-purple-800',
  opt_out: 'bg-green-100 text-green-800',
};

export default function CCPAAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [requests, setRequests] = useState<CCPARequest[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock metrics
      setMetrics({
        total_requests: 150,
        pending_requests: 5,
        processing_requests: 10,
        completed_requests: 130,
        failed_requests: 5,
        average_processing_days: 12.5,
        compliance_rate: 0.97,
        overdue_count: 0,
        requests_by_type: {
          export: 80,
          deletion: 50,
          correction: 15,
          opt_out: 5,
        },
      });

      // Mock requests
      setRequests([
        {
          id: 'req-001',
          user_id: 'user-1',
          user_email: 'user1@example.com',
          user_name: 'John Doe',
          type: 'export',
          status: 'pending',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          days_elapsed: 5,
          is_overdue: false,
        },
        {
          id: 'req-002',
          user_id: 'user-2',
          user_email: 'user2@example.com',
          user_name: 'Jane Smith',
          type: 'deletion',
          status: 'processing',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'admin@forsured.com',
          priority: 'high',
          days_elapsed: 10,
          is_overdue: false,
        },
        {
          id: 'req-003',
          user_id: 'user-3',
          user_email: 'user3@example.com',
          user_name: 'Bob Wilson',
          type: 'export',
          status: 'completed',
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'admin@forsured.com',
          priority: 'low',
          days_elapsed: 20,
          is_overdue: false,
        },
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (typeFilter !== 'all' && req.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
    return true;
  });

  const overdueRequests = requests.filter(req => req.is_overdue);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CCPA Compliance Dashboard</h1>
        <p className="text-gray-600">
          Monitor and manage CCPA data requests across your organization.
        </p>
      </div>

      {/* Overdue Warning */}
      {overdueRequests.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">
                {overdueRequests.length} request(s) have exceeded the 45-day CCPA deadline
              </h3>
              <p className="text-red-700 text-sm">
                Immediate action required to maintain compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.total_requests}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics?.pending_requests}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{metrics?.processing_requests}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{metrics?.completed_requests}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Avg Processing Days</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.average_processing_days.toFixed(1)}
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Compliance Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {((metrics?.compliance_rate || 0) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Overdue Requests</p>
            <p className={`text-2xl font-bold ${
              (metrics?.overdue_count || 0) > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {metrics?.overdue_count}
            </p>
          </div>
        </div>
      </div>

      {/* Request Management */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Request Management</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <div className="flex gap-2">
              {['all', 'export', 'deletion', 'correction'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded text-sm ${
                    typeFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Priority</label>
            <div className="flex gap-2">
              {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`px-3 py-1 rounded text-sm ${
                    priorityFilter === priority
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Days</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No requests match your filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className={req.is_overdue ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{req.user_name}</p>
                        <p className="text-sm text-gray-500">{req.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${TYPE_COLORS[req.type]}`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[req.status]}`}>
                        {req.status}
                      </span>
                      {req.is_overdue && (
                        <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs">
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {req.days_elapsed}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button className="text-green-600 hover:text-green-800 text-sm">
                              Process
                            </button>
                            <button className="text-purple-600 hover:text-purple-800 text-sm">
                              Assign
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Generate Compliance Report
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Export All Requests
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            View Breach Notifications
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Audit Log
          </button>
        </div>
      </div>

      {/* CCPA Timeline Requirements */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">CCPA Timeline Requirements</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>10 days</strong> - Acknowledge receipt of request</li>
          <li>• <strong>45 days</strong> - Complete request (extendable by 45 days with notice)</li>
          <li>• <strong>12 months</strong> - Retain records of requests and responses</li>
          <li>• <strong>72 hours</strong> - Notify affected parties in case of data breach</li>
        </ul>
      </div>
    </div>
  );
}
