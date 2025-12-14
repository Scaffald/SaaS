/**
 * REQ-129: Manager Dashboard Page
 * Real-time compliance metrics and monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../../lib/api/dashboard/dashboardService';
import { useLexicon } from '../../../contexts/LexiconContext';
import type {
  DashboardOverview,
  SubcontractorScore,
  TaskSummary,
  ExpiringPolicy,
  ActivityEvent,
  DashboardFilters,
} from '../../../lib/api/dashboard/types';
import { MetricCard } from '../../../components/dashboard/MetricCard';

export default function DashboardPage() {
  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [subcontractorScores, setSubcontractorScores] = useState<SubcontractorScore[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [expiringPolicies, setExpiringPolicies] = useState<ExpiringPolicy[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, scores, tasks, policies, activityFeed] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getSubcontractorScores(filters),
        dashboardService.getTaskSummary(),
        dashboardService.getExpiringPolicies(30),
        dashboardService.getActivityFeed(20, filters),
      ]);

      setOverview(overviewData);
      setSubcontractorScores(scores);
      setTaskSummary(tasks);
      setExpiringPolicies(policies);
      setActivities(activityFeed);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load and real-time updates
  useEffect(() => {
    loadDashboardData();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, subcontractor_search: search }));
  };

  const handleExportCSV = async () => {
    try {
      const csv = await dashboardService.exportDashboard({
        format: 'csv',
        filters,
        report_date: new Date().toISOString(),
      });
      const blob = new Blob([csv as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export dashboard:', error);
    }
  };

  const getComplianceStatus = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('nav.dashboard')}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time compliance metrics across all projects and {getContractorLabel(true).toLowerCase()}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export to CSV
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Search ${getContractorLabel(true).toLowerCase()}...`}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {(filters.subcontractor_search || filters.status_filter || filters.project_ids) && (
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Overall Compliance Score"
            value={overview?.overall_compliance_score || 0}
            status={overview ? getComplianceStatus(overview.overall_compliance_score) : 'info'}
            loading={loading}
            subtitle={`Across all ${getContractorLabel(true).toLowerCase()}`}
          />
          <MetricCard
            title={`Compliant ${getContractorLabel(true)}`}
            value={overview?.compliant_count || 0}
            status="success"
            loading={loading}
            subtitle={`of ${overview?.total_subcontractors || 0} total`}
          />
          <MetricCard
            title="Warning Status"
            value={overview?.warning_count || 0}
            status="warning"
            loading={loading}
            subtitle="Needs attention"
          />
          <MetricCard
            title="Critical Status"
            value={overview?.critical_count || 0}
            status="danger"
            loading={loading}
            subtitle="Immediate action required"
          />
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Open Tasks"
            value={taskSummary?.total_open_tasks || 0}
            loading={loading}
            subtitle="Total pending tasks"
          />
          <MetricCard
            title="Urgent Priority"
            value={taskSummary?.urgent_count || 0}
            status="danger"
            loading={loading}
          />
          <MetricCard
            title="Overdue"
            value={taskSummary?.overdue_count || 0}
            status="danger"
            loading={loading}
          />
          <MetricCard
            title="Due Today"
            value={taskSummary?.due_today_count || 0}
            status="warning"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subcontractor Scores Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{getContractorLabel()} Compliance</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Open Tasks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subcontractorScores.slice(0, 10).map((score) => (
                      <tr key={score.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {score.company_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {score.compliance_score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              score.status === 'compliant'
                                ? 'bg-green-100 text-green-800'
                                : score.status === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {score.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {score.open_tasks_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Expiring Policies */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Policies Expiring Soon (30 days)
              </h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getContractorLabel()}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Policy Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Left
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expiringPolicies.slice(0, 10).map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {policy.subcontractor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {policy.policy_type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              policy.days_remaining <= 7
                                ? 'bg-red-100 text-red-800'
                                : policy.days_remaining <= 14
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {policy.days_remaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                    {expiringPolicies.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          No policies expiring in the next 30 days
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activities.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          {activity.subcontractor_name && <span>{activity.subcontractor_name}</span>}
                          <span>•</span>
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    No recent activity
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
