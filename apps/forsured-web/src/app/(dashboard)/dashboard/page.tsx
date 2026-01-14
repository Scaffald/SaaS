/**
 * REQ-129: Manager Dashboard Page
 * Real-time compliance metrics and monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Row, Text, Button, Card, H1, H3, Input } from '@unicornlove/beyond-ui';
import { Search } from 'lucide-react';
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
import { RiskBadge } from '../../../components/compliance/RiskBadge';
import type { RiskLevel } from '../../../lib/compliance/riskCalculationService';

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
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-2)' }}>
      <Stack style={{ maxWidth: 1120, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        {/* Header */}
        <Row style={{ marginBottom: 'var(--space-8)', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Stack>
            <H1>{t('nav.dashboard')}</H1>
            <Text style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
              Real-time compliance metrics across all projects and {getContractorLabel(true).toLowerCase()}
            </Text>
            <Text style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-1)', color: 'var(--color-gray-10)' }}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          </Stack>
          <Button
            onClick={handleExportCSV}
            style={{
              backgroundColor: 'var(--color-blue-9)',
              color: 'white',
              fontSize: 'var(--font-size-2)',
              borderRadius: 'var(--radius-4)',
            }}
          >
            Export to CSV
          </Button>
        </Row>

        {/* Search and Filters */}
        <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <Row style={{ gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Row style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <Row
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                <Search size={20} color="var(--color-gray-10)" />
              </Row>
              <Input
                type="text"
                placeholder={`Search ${getContractorLabel(true).toLowerCase()}...`}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  paddingLeft: 'var(--space-10)',
                  flex: 1,
                  borderWidth: 1,
                  borderColor: 'var(--color-gray-6)',
                  borderRadius: 'var(--radius-4)',
                }}
              />
            </Row>
            {(filters.subcontractor_search || filters.status_filter || filters.project_ids) && (
              <Button
                onClick={() => setFilters({})}
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-gray-11)',
                  borderWidth: 1,
                  borderColor: 'var(--color-gray-6)',
                  borderRadius: 'var(--radius-4)',
                  backgroundColor: 'transparent',
                }}
              >
                Clear Filters
              </Button>
            )}
          </Row>
        </Card>

        {/* Overall Metrics */}
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
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
        </Row>

        {/* Task Summary */}
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
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
        </Row>

        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          {/* Subcontractor Scores Table */}
          <Card style={{ flex: 1, minWidth: 400, overflow: 'hidden' }}>
            <Stack style={{ paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottomWidth: 1, borderColor: 'var(--color-gray-6)' }}>
              <H3>{getContractorLabel()} Compliance</H3>
            </Stack>
            <Stack>
              {loading ? (
                <Stack style={{ padding: 'var(--space-6)' }}>
                  <Stack style={{ gap: 'var(--space-3)' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Stack key={i} style={{ height: 48, backgroundColor: 'var(--color-gray-4)', borderRadius: 'var(--radius-2)' }} />
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Stack>
                  <Row style={{ backgroundColor: 'var(--color-gray-2)', paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Company
                    </Text>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Score
                    </Text>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Risk Level
                    </Text>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Open Tasks
                    </Text>
                  </Row>
                  <Stack>
                    {subcontractorScores.slice(0, 10).map((score) => (
                      <Row
                        key={score.id}
                        style={{
                          paddingLeft: 'var(--space-6)',
                          paddingRight: 'var(--space-6)',
                          paddingTop: 'var(--space-4)',
                          paddingBottom: 'var(--space-4)',
                          borderBottomWidth: 1,
                          borderColor: 'var(--color-gray-6)',
                        }}
                        data-testid="subcontractor-row"
                      >
                        <Text style={{ flex: 1, fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', whiteSpace: 'nowrap' }}>
                          {score.company_name}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)', whiteSpace: 'nowrap' }} data-testid="compliance-score">
                          {score.compliance_score}%
                        </Text>
                        <Stack style={{ flex: 1, alignItems: 'flex-start' }} data-testid="risk-badge-container">
                          <RiskBadge
                            level={score.risk_level as RiskLevel}
                            score={score.compliance_score}
                            size="sm"
                          />
                        </Stack>
                        <Text style={{ flex: 1, fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)', whiteSpace: 'nowrap' }}>
                          {score.open_tasks_count}
                        </Text>
                      </Row>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Expiring Policies */}
          <Card style={{ flex: 1, minWidth: 400, overflow: 'hidden' }}>
            <Stack style={{ paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottomWidth: 1, borderColor: 'var(--color-gray-6)' }}>
              <H3>
                Policies Expiring Soon (30 days)
              </H3>
            </Stack>
            <Stack>
              {loading ? (
                <Stack style={{ padding: 'var(--space-6)' }}>
                  <Stack style={{ gap: 'var(--space-3)' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Stack key={i} style={{ height: 48, backgroundColor: 'var(--color-gray-4)', borderRadius: 'var(--radius-2)' }} />
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Stack>
                  <Row style={{ backgroundColor: 'var(--color-gray-2)', paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {getContractorLabel()}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Policy Type
                    </Text>
                    <Text style={{ flex: 1, fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-gray-11)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Days Left
                    </Text>
                  </Row>
                  <Stack>
                    {expiringPolicies.slice(0, 10).map((policy) => (
                      <Row
                        key={policy.id}
                        style={{
                          paddingLeft: 'var(--space-6)',
                          paddingRight: 'var(--space-6)',
                          paddingTop: 'var(--space-4)',
                          paddingBottom: 'var(--space-4)',
                          borderBottomWidth: 1,
                          borderColor: 'var(--color-gray-6)',
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', whiteSpace: 'nowrap' }}>
                          {policy.subcontractor_name}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)', whiteSpace: 'nowrap' }}>
                          {policy.policy_type.replace(/_/g, ' ')}
                        </Text>
                        <Stack style={{ flex: 1, alignItems: 'flex-start' }}>
                          <Row
                            style={{
                              paddingLeft: 'var(--space-2)',
                              paddingRight: 'var(--space-2)',
                              paddingTop: 'var(--space-1)',
                              paddingBottom: 'var(--space-1)',
                              borderRadius: 9999,
                              backgroundColor:
                                policy.days_remaining <= 7
                                  ? 'var(--color-red-2)'
                                  : policy.days_remaining <= 14
                                    ? 'var(--color-yellow-2)'
                                    : 'var(--color-blue-2)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 'var(--font-size-1)',
                                fontWeight: 600,
                                color:
                                  policy.days_remaining <= 7
                                    ? 'var(--color-red-11)'
                                    : policy.days_remaining <= 14
                                      ? 'var(--color-yellow-11)'
                                      : 'var(--color-blue-11)',
                              }}
                            >
                              {policy.days_remaining} days
                            </Text>
                          </Row>
                        </Stack>
                      </Row>
                    ))}
                    {expiringPolicies.length === 0 && (
                      <Stack style={{ padding: 'var(--space-6)', alignItems: 'center' }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
                          No policies expiring in the next 30 days
                        </Text>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Card>
        </Row>

        {/* Activity Feed */}
        <Card style={{ overflow: 'hidden' }}>
          <Stack style={{ paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottomWidth: 1, borderColor: 'var(--color-gray-6)' }}>
            <H3>Recent Activity</H3>
          </Stack>
          <Stack>
            {loading ? (
              <Stack style={{ padding: 'var(--space-6)' }}>
                <Stack style={{ gap: 'var(--space-4)' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Row key={i} style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                      <Stack style={{ width: 32, height: 32, backgroundColor: 'var(--color-gray-4)', borderRadius: 9999 }} />
                      <Stack style={{ flex: 1, gap: 'var(--space-2)' }}>
                        <Stack style={{ height: 16, backgroundColor: 'var(--color-gray-4)', borderRadius: 'var(--radius-2)', width: '75%' }} />
                        <Stack style={{ height: 12, backgroundColor: 'var(--color-gray-4)', borderRadius: 'var(--radius-2)', width: '25%' }} />
                      </Stack>
                    </Row>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Stack>
                {activities.map((activity) => (
                  <Row
                    key={activity.id}
                    style={{
                      paddingLeft: 'var(--space-6)',
                      paddingRight: 'var(--space-6)',
                      paddingTop: 'var(--space-4)',
                      paddingBottom: 'var(--space-4)',
                      borderBottomWidth: 1,
                      borderColor: 'var(--color-gray-6)',
                    }}
                  >
                    <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                      <Stack
                        style={{
                          flexShrink: 0,
                          width: 8,
                          height: 8,
                          marginTop: 'var(--space-2)',
                          backgroundColor: 'var(--color-blue-9)',
                          borderRadius: 9999,
                        }}
                      />
                      <Stack style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>{activity.description}</Text>
                        <Row style={{ marginTop: 'var(--space-1)', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {activity.subcontractor_name && <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)' }}>{activity.subcontractor_name}</Text>}
                          {activity.subcontractor_name && <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)' }}>-</Text>}
                          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)' }}>{new Date(activity.timestamp).toLocaleString()}</Text>
                        </Row>
                      </Stack>
                    </Row>
                  </Row>
                ))}
                {activities.length === 0 && (
                  <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
                    <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
                      No recent activity
                    </Text>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </Stack>
  );
}
