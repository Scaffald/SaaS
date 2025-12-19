/**
 * REQ-6: CCPA Admin Dashboard
 * TASK-1: Create CCPA Admin Dashboard Page with Metrics and Filters
 *
 * Administrative interface for managing CCPA compliance:
 * - View compliance metrics with real-time data
 * - Manage data requests with filtering
 * - Monitor 45-day deadline compliance
 * - Quick actions for reports and navigation
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { YStack, XStack, Text, Button, Card, H2, H3 } from '@unicornlove/ui'
import { trpc } from '../../../../lib/trpc'
import { SLANotificationBanner } from '../../../../components/admin/CCPA/SLANotificationBanner'

// Types matching tRPC response
type CCPARequest = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: 'access' | 'deletion' | 'correction' | 'portability' | 'opt_out' | 'opt_in'
  status: 'pending' | 'in_progress' | 'completed' | 'denied' | 'cancelled'
  created_at: string
  updated_at: string
  deadline_at: string
  assigned_to?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  days_elapsed: number
  days_remaining: number
  is_overdue: boolean
}

// Status badge colors - using Tamagui color tokens
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '$yellow2', text: '$yellow11' },
  in_progress: { bg: '$blue2', text: '$blue11' },
  completed: { bg: '$green2', text: '$green11' },
  denied: { bg: '$red2', text: '$red11' },
  cancelled: { bg: '$gray2', text: '$gray11' },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '$gray2', text: '$gray11' },
  medium: { bg: '$blue2', text: '$blue11' },
  high: { bg: '$orange2', text: '$orange11' },
  urgent: { bg: '$red2', text: '$red11' },
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  access: { bg: '$blue2', text: '$blue11' },
  deletion: { bg: '$red2', text: '$red11' },
  correction: { bg: '$purple2', text: '$purple11' },
  portability: { bg: '$cyan2', text: '$cyan11' },
  opt_out: { bg: '$green2', text: '$green11' },
  opt_in: { bg: '$teal2', text: '$teal11' },
}

// Map request types for display
const TYPE_LABELS: Record<string, string> = {
  access: 'Export',
  deletion: 'Deletion',
  correction: 'Correction',
  portability: 'Portability',
  opt_out: 'Opt Out',
  opt_in: 'Opt In',
}

export default function CCPAAdminDashboard() {
  const navigate = useNavigate()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Fetch metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = trpc.ccpaAdmin.getMetrics.useQuery(
    { days: 30 },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  )

  // Fetch requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
  } = trpc.ccpaAdmin.listRequests.useQuery(
    {
      status: statusFilter !== 'all' ? (statusFilter as CCPARequest['status']) : undefined,
      requestType: typeFilter !== 'all' ? (typeFilter as CCPARequest['type']) : undefined,
      sortBy: 'deadline_at',
      sortOrder: 'asc',
      limit: 20,
    },
    { refetchInterval: 30000 }
  )

  // Mutations
  const approveRequest = trpc.ccpaAdmin.approveRequest.useMutation()

  // Computed values
  const requests = useMemo(() => requestsData?.items ?? [], [requestsData])

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false
      return true
    })
  }, [requests, priorityFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleViewRequest = (requestId: string) => {
    navigate(`/admin/ccpa/requests/${requestId}`)
  }

  const handleProcessRequest = async (requestId: string) => {
    try {
      await approveRequest.mutateAsync({ requestId })
    } catch (error) {
      console.error('Failed to approve request:', error)
    }
  }

  const handleAssignRequest = (requestId: string) => {
    // TODO: Open assignment modal
    console.log('Assign request:', requestId)
  }

  const loading = metricsLoading || requestsLoading
  const error = metricsError || requestsError

  if (loading) {
    return (
      <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
        <YStack opacity={0.5}>
          <YStack
            height={32}
            backgroundColor="$gray4"
            borderRadius="$2"
            width="33%"
            marginBottom="$4"
          />
          <XStack flexWrap="wrap" gap="$4" marginBottom="$8">
            {[1, 2, 3, 4].map((i) => (
              <YStack
                key={i}
                height={96}
                backgroundColor="$gray4"
                borderRadius="$2"
                flex={1}
                minWidth={200}
              />
            ))}
          </XStack>
          <XStack flexWrap="wrap" gap="$4">
            {[1, 2, 3].map((i) => (
              <YStack
                key={i}
                height={96}
                backgroundColor="$gray4"
                borderRadius="$2"
                flex={1}
                minWidth={200}
              />
            ))}
          </XStack>
        </YStack>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading CCPA dashboard
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            marginTop="$3"
            size="$3"
            backgroundColor="$red9"
            color="white"
            hoverStyle={{ backgroundColor: '$red10' }}
            onPress={() => window.location.reload()}
          >
            Retry
          </Button>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
      {/* Header */}
      <YStack marginBottom="$8">
        <H2 marginBottom="$2">CCPA Compliance Dashboard</H2>
        <Text color="$gray11">Monitor and manage CCPA data requests across your organization.</Text>
      </YStack>

      {/* SLA Notification Banner */}
      <SLANotificationBanner />

      {/* Compliance Metrics */}
      <YStack marginBottom="$8">
        <H3 marginBottom="$4">Compliance Metrics</H3>
        <XStack flexWrap="wrap" gap="$4">
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Total Requests
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">
              {metrics?.total_requests ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Pending
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$yellow11">
              {metrics?.pending_requests ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Processing
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$blue11">
              {metrics?.processing_requests ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Completed
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">
              {metrics?.completed_requests ?? 0}
            </Text>
          </Card>
        </XStack>

        <XStack flexWrap="wrap" gap="$4" marginTop="$4">
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Avg Processing Days
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">
              {metrics?.average_processing_days ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Compliance Rate
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">
              {((metrics?.compliance_rate ?? 1) * 100).toFixed(0)}%
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={200}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Overdue Requests
            </Text>
            <Text
              fontSize="$8"
              fontWeight="700"
              color={(metrics?.overdue_count ?? 0) > 0 ? '$red11' : '$green11'}
            >
              {metrics?.overdue_count ?? 0}
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
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">
              Status
            </Text>
            <XStack gap="$2">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <Button
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  size="$3"
                  backgroundColor={statusFilter === status ? '$blue9' : '$gray3'}
                  color={statusFilter === status ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: statusFilter === status ? '$blue10' : '$gray4' }}
                >
                  {status === 'in_progress'
                    ? 'Processing'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">
              Type
            </Text>
            <XStack gap="$2">
              {['all', 'access', 'deletion', 'correction'].map((type) => (
                <Button
                  key={type}
                  onPress={() => setTypeFilter(type)}
                  size="$3"
                  backgroundColor={typeFilter === type ? '$blue9' : '$gray3'}
                  color={typeFilter === type ? 'white' : '$gray11'}
                  hoverStyle={{ backgroundColor: typeFilter === type ? '$blue10' : '$gray4' }}
                >
                  {type === 'all'
                    ? 'All'
                    : (TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1))}
                </Button>
              ))}
            </XStack>
          </YStack>

          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1" display="block">
              Priority
            </Text>
            <XStack gap="$2">
              {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
                <Button
                  key={priority}
                  onPress={() => setPriorityFilter(priority)}
                  size="$3"
                  backgroundColor={priorityFilter === priority ? '$blue9' : '$gray3'}
                  color={priorityFilter === priority ? 'white' : '$gray11'}
                  hoverStyle={{
                    backgroundColor: priorityFilter === priority ? '$blue10' : '$gray4',
                  }}
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
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                User
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Type
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Status
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Priority
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Days
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Submitted
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Actions
              </Text>
            </XStack>
            {filteredRequests.length === 0 ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$gray11">No requests match your filters.</Text>
              </YStack>
            ) : (
              <YStack>
                {filteredRequests.map((req) => (
                  <XStack
                    key={req.id}
                    backgroundColor={req.is_overdue ? '$red2' : 'transparent'}
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                  >
                    <YStack flex={1}>
                      <Text fontWeight="500" color="$gray12">
                        {req.user_name}
                      </Text>
                      <Text fontSize="$2" color="$gray11">
                        {req.user_email}
                      </Text>
                    </YStack>
                    <YStack flex={1} alignItems="flex-start">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={TYPE_COLORS[req.type]?.bg ?? '$gray2'}
                      >
                        <Text fontSize="$2" color={TYPE_COLORS[req.type]?.text ?? '$gray11'}>
                          {TYPE_LABELS[req.type] ?? req.type}
                        </Text>
                      </XStack>
                    </YStack>
                    <YStack flex={1} alignItems="flex-start" gap="$2">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={STATUS_COLORS[req.status]?.bg ?? '$gray2'}
                      >
                        <Text fontSize="$2" color={STATUS_COLORS[req.status]?.text ?? '$gray11'}>
                          {req.status === 'in_progress' ? 'processing' : req.status}
                        </Text>
                      </XStack>
                      {req.is_overdue && (
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          backgroundColor="$red9"
                          borderRadius="$2"
                        >
                          <Text fontSize="$1" color="white">
                            OVERDUE
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                    <YStack flex={1} alignItems="flex-start">
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={PRIORITY_COLORS[req.priority]?.bg ?? '$gray2'}
                      >
                        <Text
                          fontSize="$2"
                          color={PRIORITY_COLORS[req.priority]?.text ?? '$gray11'}
                        >
                          {req.priority}
                        </Text>
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
                        onPress={() => handleViewRequest(req.id)}
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
                            onPress={() => handleProcessRequest(req.id)}
                            disabled={approveRequest.isPending}
                          >
                            <Text fontSize="$2">Process</Text>
                          </Button>
                          <Button
                            size="$2"
                            backgroundColor="transparent"
                            color="$purple11"
                            hoverStyle={{ backgroundColor: '$purple3' }}
                            onPress={() => handleAssignRequest(req.id)}
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
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={() => navigate('/admin/ccpa/reports')}
          >
            Generate Compliance Report
          </Button>
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => navigate('/admin/ccpa/requests')}
          >
            View All Requests
          </Button>
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => navigate('/admin/ccpa/breach')}
          >
            View Breach Notifications
          </Button>
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => navigate('/admin/ccpa/audit-log')}
          >
            Audit Log
          </Button>
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => navigate('/admin/ccpa/apps')}
          >
            OAuth App Configuration
          </Button>
        </XStack>
      </YStack>

      {/* CCPA Timeline Requirements */}
      <YStack
        padding="$4"
        backgroundColor="$blue2"
        borderWidth={1}
        borderColor="$blue6"
        borderRadius="$4"
      >
        <Text fontWeight="600" color="$blue11" marginBottom="$2">
          CCPA Timeline Requirements
        </Text>
        <YStack gap="$1">
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">10 days</Text> - Acknowledge receipt of request
          </Text>
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">45 days</Text> - Complete request (extendable by 45 days with
            notice)
          </Text>
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">12 months</Text> - Retain records of requests and responses
          </Text>
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">72 hours</Text> - Notify affected parties in case of data breach
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}
