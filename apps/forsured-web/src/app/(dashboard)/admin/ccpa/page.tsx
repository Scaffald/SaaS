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

import { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H1, H2, H3, Spinner } from '@unicornlove/ui';

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

// Status badge colors - using Tamagui color tokens
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '$yellow2', text: '$yellow11' },
  processing: { bg: '$blue2', text: '$blue11' },
  completed: { bg: '$green2', text: '$green11' },
  failed: { bg: '$red2', text: '$red11' },
  cancelled: { bg: '$gray2', text: '$gray11' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '$gray2', text: '$gray11' },
  medium: { bg: '$blue2', text: '$blue11' },
  high: { bg: '$orange2', text: '$orange11' },
  urgent: { bg: '$red2', text: '$red11' },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  export: { bg: '$blue2', text: '$blue11' },
  deletion: { bg: '$red2', text: '$red11' },
  correction: { bg: '$purple2', text: '$purple11' },
  opt_out: { bg: '$green2', text: '$green11' },
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

    loadDashboardData();
  }, []);

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
      <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
        <YStack opacity={0.5}>
          <YStack height={32} backgroundColor="$gray4" borderRadius="$2" width="33%" marginBottom="$4" />
          <XStack flexWrap="wrap" gap="$4" marginBottom="$8">
            {[1, 2, 3, 4].map(i => (
              <YStack key={i} height={96} backgroundColor="$gray4" borderRadius="$2" flex={1} minWidth={200} />
            ))}
          </XStack>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
      {/* Header */}
      <YStack marginBottom="$8">
        <H2 marginBottom="$2">CCPA Compliance Dashboard</H2>
        <Text color="$gray11">
          Monitor and manage CCPA data requests across your organization.
        </Text>
      </YStack>

      {/* Overdue Warning */}
      {overdueRequests.length > 0 && (
        <YStack marginBottom="$6" padding="$4" backgroundColor="$red2" borderWidth={1} borderColor="$red6" borderRadius="$4">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$6" color="$red11">⚠️</Text>
            <YStack>
              <Text fontWeight="600" color="$red11">
                {overdueRequests.length} request(s) have exceeded the 45-day CCPA deadline
              </Text>
              <Text color="$red10" fontSize="$2">
                Immediate action required to maintain compliance.
              </Text>
            </YStack>
          </XStack>
        </YStack>
      )}

      {/* Compliance Metrics */}
      <YStack marginBottom="$8">
        <H3 marginBottom="$4">Compliance Metrics</H3>
        <XStack flexWrap="wrap" gap="$4">
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Total Requests</Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">{metrics?.total_requests}</Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Pending</Text>
            <Text fontSize="$8" fontWeight="700" color="$yellow11">{metrics?.pending_requests}</Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Processing</Text>
            <Text fontSize="$8" fontWeight="700" color="$blue11">{metrics?.processing_requests}</Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Completed</Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">{metrics?.completed_requests}</Text>
          </Card>
        </XStack>

        <XStack flexWrap="wrap" gap="$4" marginTop="$4">
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Avg Processing Days</Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">
              {metrics?.average_processing_days.toFixed(1)}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Compliance Rate</Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">
              {((metrics?.compliance_rate || 0) * 100).toFixed(0)}%
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">Overdue Requests</Text>
            <Text fontSize="$8" fontWeight="700" color={(metrics?.overdue_count || 0) > 0 ? '$red11' : '$green11'}>
              {metrics?.overdue_count}
            </Text>
          </Card>
        </XStack>
      </YStack>

      {/* Request Management */}
      <YStack marginBottom="$8">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <H3>Request Management</H3>
        </XStack>

        {/* Filters */}
        <XStack flexWrap="wrap" gap="$4" marginBottom="$4">
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">Status</Text>
            <XStack gap="$2">
              {['all', 'pending', 'processing', 'completed'].map(status => (
                <Button
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  size="$3"
                  backgroundColor={statusFilter === status ? '$blue9' : '$gray3'}
                  color={statusFilter === status ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: statusFilter === status ? '$blue10' : '$gray4' }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">Type</Text>
            <XStack gap="$2">
              {['all', 'export', 'deletion', 'correction'].map(type => (
                <Button
                  key={type}
                  onPress={() => setTypeFilter(type)}
                  size="$3"
                  backgroundColor={typeFilter === type ? '$blue9' : '$gray3'}
                  color={typeFilter === type ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: typeFilter === type ? '$blue10' : '$gray4' }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">Priority</Text>
            <XStack gap="$2">
              {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
                <Button
                  key={priority}
                  onPress={() => setPriorityFilter(priority)}
                  size="$3"
                  backgroundColor={priorityFilter === priority ? '$blue9' : '$gray3'}
                  color={priorityFilter === priority ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: priorityFilter === priority ? '$blue10' : '$gray4' }}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>
        </XStack>

        {/* Requests Table */}
        <Card overflow="hidden">
          <YStack>
            <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">User</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Type</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Status</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Priority</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Days</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Submitted</Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">Actions</Text>
            </XStack>
            {filteredRequests.length === 0 ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$gray11">No requests match your filters.</Text>
              </YStack>
            ) : (
              <YStack>
                {filteredRequests.map(req => (
                  <XStack
                    key={req.id}
                    backgroundColor={req.is_overdue ? '$red2' : 'transparent'}
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                  >
                    <YStack flex={1}>
                      <Text fontWeight="500" color="$gray12">{req.user_name}</Text>
                      <Text fontSize="$2" color="$gray11">{req.user_email}</Text>
                    </YStack>
                    <YStack flex={1} alignItems="flex-start">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={TYPE_COLORS[req.type].bg}
                      >
                        <Text fontSize="$2" color={TYPE_COLORS[req.type].text}>{req.type}</Text>
                      </XStack>
                    </YStack>
                    <YStack flex={1} alignItems="flex-start" gap="$2">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={STATUS_COLORS[req.status].bg}
                      >
                        <Text fontSize="$2" color={STATUS_COLORS[req.status].text}>{req.status}</Text>
                      </XStack>
                      {req.is_overdue && (
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          backgroundColor="$red9"
                          borderRadius="$2"
                        >
                          <Text fontSize="$1" color="white">OVERDUE</Text>
                        </XStack>
                      )}
                    </YStack>
                    <YStack flex={1} alignItems="flex-start">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={PRIORITY_COLORS[req.priority].bg}
                      >
                        <Text fontSize="$2" color={PRIORITY_COLORS[req.priority].text}>{req.priority}</Text>
                      </XStack>
                    </YStack>
                    <YStack flex={1} justifyContent="center">
                      <Text color="$gray11">{req.days_elapsed}</Text>
                    </YStack>
                    <YStack flex={1} justifyContent="center">
                      <Text color="$gray11">{formatDate(req.created_at)}</Text>
                    </YStack>
                    <XStack flex={1} gap="$2">
                      <Button
                        size="$2"
                        backgroundColor="transparent"
                        color="$blue11"
                        hoverStyle={{ backgroundColor: '$blue3' }}
                        onPress={() => {}}
                      >
                        <Text fontSize="$2">View</Text>
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="$2"
                            backgroundColor="transparent"
                            color="$green11"
                            hoverStyle={{ backgroundColor: '$green3' }}
                            onPress={() => {}}
                          >
                            <Text fontSize="$2">Process</Text>
                          </Button>
                          <Button
                            size="$2"
                            backgroundColor="transparent"
                            color="$purple11"
                            hoverStyle={{ backgroundColor: '$purple3' }}
                            onPress={() => {}}
                          >
                            <Text fontSize="$2">Assign</Text>
                          </Button>
                        </>
                      )}
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        </Card>
      </YStack>

      {/* Quick Actions */}
      <YStack marginBottom="$8">
        <H3 marginBottom="$4">Quick Actions</H3>
        <XStack flexWrap="wrap" gap="$3">
          <Button backgroundColor="$blue9" color="white" hoverStyle={{ backgroundColor: '$blue10' }} onPress={() => {}}>
            Generate Compliance Report
          </Button>
          <Button backgroundColor="$gray3" color="$gray11" hoverStyle={{ backgroundColor: '$gray4' }} onPress={() => {}}>
            Export All Requests
          </Button>
          <Button backgroundColor="$gray3" color="$gray11" hoverStyle={{ backgroundColor: '$gray4' }} onPress={() => {}}>
            View Breach Notifications
          </Button>
          <Button backgroundColor="$gray3" color="$gray11" hoverStyle={{ backgroundColor: '$gray4' }} onPress={() => {}}>
            Audit Log
          </Button>
        </XStack>
      </YStack>

      {/* CCPA Timeline Requirements */}
      <YStack padding="$4" backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4">
        <Text fontWeight="600" color="$blue11" marginBottom="$2">CCPA Timeline Requirements</Text>
        <YStack gap="$1">
          <Text fontSize="$2" color="$blue11">• <Text fontWeight="600">10 days</Text> - Acknowledge receipt of request</Text>
          <Text fontSize="$2" color="$blue11">• <Text fontWeight="600">45 days</Text> - Complete request (extendable by 45 days with notice)</Text>
          <Text fontSize="$2" color="$blue11">• <Text fontWeight="600">12 months</Text> - Retain records of requests and responses</Text>
          <Text fontSize="$2" color="$blue11">• <Text fontWeight="600">72 hours</Text> - Notify affected parties in case of data breach</Text>
        </YStack>
      </YStack>
    </YStack>
  );
}
