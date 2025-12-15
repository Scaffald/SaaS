/**
 * REQ-129: Manager Dashboard Page
 * Real-time compliance metrics and monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Card, H1, H2, H3, Input } from '@unicornlove/ui';
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
    <YStack minHeight="100vh" backgroundColor="$gray2">
      <YStack maxWidth={1120} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$8" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {/* Header */}
        <XStack marginBottom="$8" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$4">
          <YStack>
            <H1>{t('nav.dashboard')}</H1>
            <Text marginTop="$2" fontSize="$2" color="$gray11">
              Real-time compliance metrics across all projects and {getContractorLabel(true).toLowerCase()}
            </Text>
            <Text marginTop="$1" fontSize="$1" color="$gray10">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          </YStack>
          <Button
            onPress={handleExportCSV}
            backgroundColor="$blue9"
            color="white"
            fontSize="$2"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$blue10' }}
          >
            Export to CSV
          </Button>
        </XStack>

        {/* Search and Filters */}
        <Card padding="$6" marginBottom="$6">
          <XStack gap="$4" alignItems="center" flexWrap="wrap">
            <XStack flex={1} position="relative" minWidth={200}>
              <XStack
                position="absolute"
                left="$3"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
              >
                <Search size={20} color="$gray10" />
              </XStack>
              <Input
                type="text"
                placeholder={`Search ${getContractorLabel(true).toLowerCase()}...`}
                onChange={(value) => handleSearchChange(value)}
                paddingLeft="$10"
                flex={1}
                borderWidth={1}
                borderColor="$gray6"
                borderRadius="$4"
              />
            </XStack>
            {(filters.subcontractor_search || filters.status_filter || filters.project_ids) && (
              <Button
                onPress={() => setFilters({})}
                fontSize="$2"
                color="$gray11"
                borderWidth={1}
                borderColor="$gray6"
                borderRadius="$4"
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: '$gray3', color: '$gray12' }}
              >
                Clear Filters
              </Button>
            )}
          </XStack>
        </Card>

        {/* Overall Metrics */}
        <XStack flexWrap="wrap" gap="$6" marginBottom="$8">
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
        </XStack>

        {/* Task Summary */}
        <XStack flexWrap="wrap" gap="$6" marginBottom="$8">
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
        </XStack>

        <XStack flexWrap="wrap" gap="$6" marginBottom="$8">
          {/* Subcontractor Scores Table */}
          <Card flex={1} minWidth={400} overflow="hidden">
            <YStack paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderColor="$gray6">
              <H3>{getContractorLabel()} Compliance</H3>
            </YStack>
            <YStack>
              {loading ? (
                <YStack padding="$6">
                  <YStack gap="$3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <YStack key={i} height={48} backgroundColor="$gray4" borderRadius="$2" />
                    ))}
                  </YStack>
                </YStack>
              ) : (
                <YStack>
                  <XStack backgroundColor="$gray2" paddingHorizontal="$6" paddingVertical="$3">
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Company
                    </Text>
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Score
                    </Text>
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Status
                    </Text>
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Open Tasks
                    </Text>
                  </XStack>
                  <YStack>
                    {subcontractorScores.slice(0, 10).map((score) => (
                      <XStack
                        key={score.id}
                        paddingHorizontal="$6"
                        paddingVertical="$4"
                        borderBottomWidth={1}
                        borderColor="$gray6"
                        hoverStyle={{ backgroundColor: '$gray2' }}
                      >
                        <Text flex={1} fontSize="$2" fontWeight="500" color="$gray12" whiteSpace="nowrap">
                          {score.company_name}
                        </Text>
                        <Text flex={1} fontSize="$2" color="$gray12" whiteSpace="nowrap">
                          {score.compliance_score}
                        </Text>
                        <YStack flex={1} alignItems="flex-start">
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius={9999}
                            backgroundColor={
                              score.status === 'compliant'
                                ? '$green2'
                                : score.status === 'warning'
                                  ? '$yellow2'
                                  : '$red2'
                            }
                          >
                            <Text
                              fontSize="$1"
                              fontWeight="600"
                              color={
                                score.status === 'compliant'
                                  ? '$green11'
                                  : score.status === 'warning'
                                    ? '$yellow11'
                                    : '$red11'
                              }
                            >
                              {score.status}
                            </Text>
                          </XStack>
                        </YStack>
                        <Text flex={1} fontSize="$2" color="$gray11" whiteSpace="nowrap">
                          {score.open_tasks_count}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}
            </YStack>
          </Card>

          {/* Expiring Policies */}
          <Card flex={1} minWidth={400} overflow="hidden">
            <YStack paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderColor="$gray6">
              <H3>
                Policies Expiring Soon (30 days)
              </H3>
            </YStack>
            <YStack>
              {loading ? (
                <YStack padding="$6">
                  <YStack gap="$3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <YStack key={i} height={48} backgroundColor="$gray4" borderRadius="$2" />
                    ))}
                  </YStack>
                </YStack>
              ) : (
                <YStack>
                  <XStack backgroundColor="$gray2" paddingHorizontal="$6" paddingVertical="$3">
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      {getContractorLabel()}
                    </Text>
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Policy Type
                    </Text>
                    <Text flex={1} fontSize="$1" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                      Days Left
                    </Text>
                  </XStack>
                  <YStack>
                    {expiringPolicies.slice(0, 10).map((policy) => (
                      <XStack
                        key={policy.id}
                        paddingHorizontal="$6"
                        paddingVertical="$4"
                        borderBottomWidth={1}
                        borderColor="$gray6"
                        hoverStyle={{ backgroundColor: '$gray2' }}
                      >
                        <Text flex={1} fontSize="$2" fontWeight="500" color="$gray12" whiteSpace="nowrap">
                          {policy.subcontractor_name}
                        </Text>
                        <Text flex={1} fontSize="$2" color="$gray12" whiteSpace="nowrap">
                          {policy.policy_type.replace(/_/g, ' ')}
                        </Text>
                        <YStack flex={1} alignItems="flex-start">
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius={9999}
                            backgroundColor={
                              policy.days_remaining <= 7
                                ? '$red2'
                                : policy.days_remaining <= 14
                                  ? '$yellow2'
                                  : '$blue2'
                            }
                          >
                            <Text
                              fontSize="$1"
                              fontWeight="600"
                              color={
                                policy.days_remaining <= 7
                                  ? '$red11'
                                  : policy.days_remaining <= 14
                                    ? '$yellow11'
                                    : '$blue11'
                              }
                            >
                              {policy.days_remaining} days
                            </Text>
                          </XStack>
                        </YStack>
                      </XStack>
                    ))}
                    {expiringPolicies.length === 0 && (
                      <YStack padding="$6" alignItems="center">
                        <Text fontSize="$2" color="$gray11">
                          No policies expiring in the next 30 days
                        </Text>
                      </YStack>
                    )}
                  </YStack>
                </YStack>
              )}
            </YStack>
          </Card>
        </XStack>

        {/* Activity Feed */}
        <Card overflow="hidden">
          <YStack paddingHorizontal="$6" paddingVertical="$4" borderBottomWidth={1} borderColor="$gray6">
            <H3>Recent Activity</H3>
          </YStack>
          <YStack>
            {loading ? (
              <YStack padding="$6">
                <YStack gap="$4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <XStack key={i} alignItems="flex-start" gap="$3">
                      <YStack width={32} height={32} backgroundColor="$gray4" borderRadius={9999} />
                      <YStack flex={1} gap="$2">
                        <YStack height={16} backgroundColor="$gray4" borderRadius="$2" width="75%" />
                        <YStack height={12} backgroundColor="$gray4" borderRadius="$2" width="25%" />
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </YStack>
            ) : (
              <YStack>
                {activities.map((activity) => (
                  <XStack
                    key={activity.id}
                    paddingHorizontal="$6"
                    paddingVertical="$4"
                    borderBottomWidth={1}
                    borderColor="$gray6"
                    hoverStyle={{ backgroundColor: '$gray2' }}
                  >
                    <XStack alignItems="flex-start" gap="$3" flex={1} minWidth={0}>
                      <YStack
                        flexShrink={0}
                        width={8}
                        height={8}
                        marginTop="$2"
                        backgroundColor="$blue9"
                        borderRadius={9999}
                      />
                      <YStack flex={1} minWidth={0}>
                        <Text fontSize="$2" color="$gray12">{activity.description}</Text>
                        <XStack marginTop="$1" alignItems="center" gap="$2">
                          {activity.subcontractor_name && <Text fontSize="$1" color="$gray11">{activity.subcontractor_name}</Text>}
                          {activity.subcontractor_name && <Text fontSize="$1" color="$gray11">•</Text>}
                          <Text fontSize="$1" color="$gray11">{new Date(activity.timestamp).toLocaleString()}</Text>
                        </XStack>
                      </YStack>
                    </XStack>
                  </XStack>
                ))}
                {activities.length === 0 && (
                  <YStack padding="$8" alignItems="center">
                    <Text fontSize="$2" color="$gray11">
                      No recent activity
                    </Text>
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
