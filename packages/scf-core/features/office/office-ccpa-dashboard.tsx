/**
 * CCPA Admin Dashboard
 *
 * Admin dashboard for compliance team to:
 * - View and manage CCPA requests across all users
 * - Monitor compliance metrics
 * - Track request processing times
 * - Handle breach notifications
 * - Generate compliance reports
 */

import { useState } from 'react'
import { Button, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { api } from '@scf/core/utils/api'

/**
 * Request status type for admin view
 */
type AdminRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'appealed'

/**
 * CCPA request type for admin view
 */
interface AdminCCPARequest {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: 'export' | 'deletion' | 'correction' | 'opt_out' | 'opt_in'
  status: AdminRequestStatus
  created_at: string
  updated_at: string
  completed_at?: string
  assigned_to?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
  days_elapsed: number
  is_overdue: boolean
}

/**
 * Status badge colors
 */
const STATUS_COLORS: Record<AdminRequestStatus, { bg: string; text: string }> = {
  pending: { bg: '$yellow3', text: '$yellow11' },
  processing: { bg: '$blue3', text: '$blue11' },
  completed: { bg: '$green3', text: '$green11' },
  failed: { bg: '$red3', text: '$red11' },
  cancelled: { bg: '$color4', text: '$color11' },
  appealed: { bg: '$orange3', text: '$orange11' },
}

/**
 * Priority badge colors
 */
const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '$color4', text: '$color11' },
  medium: { bg: '$yellow3', text: '$yellow11' },
  high: { bg: '$orange3', text: '$orange11' },
  urgent: { bg: '$red3', text: '$red11' },
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: AdminRequestStatus }) {
  const colors = STATUS_COLORS[status]
  return (
    <Row
      backgroundColor={colors.bg}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={8}
    >
      <Text color={colors.text} textTransform="capitalize">
        {status}
      </Text>
    </Row>
  )
}

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: string }) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low
  return (
    <Row
      backgroundColor={colors.bg}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={8}
    >
      <Text color={colors.text} textTransform="capitalize">
        {priority}
      </Text>
    </Row>
  )
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  trend,
  color = '$color12',
}: {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  const trendColor = trend === 'up' ? '$green10' : trend === 'down' ? '$red10' : '$color11'

  return (
    <Stack
      padding={16}
      backgroundColor="$color2"
      borderRadius={12}
      borderWidth={1}
      borderColor="$borderColor"
      flex={1}
      minWidth={150}
      gap={4}
    >
      <Text color="gray">
        {label}
      </Text>
      <Text color={color}>
        {value}
      </Text>
      {trend && (
        <Text color={trendColor}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs last month
        </Text>
      )}
    </Stack>
  )
}

/**
 * Request row component for admin table
 */
function RequestRow({
  request,
  onAssign,
  onProcess,
  onView,
}: {
  request: AdminCCPARequest
  onAssign?: (id: string) => void
  onProcess?: (id: string) => void
  onView?: (id: string) => void
}) {
  return (
    <Row
      padding={12}
      backgroundColor={request.is_overdue ? '$red2' : '$color2'}
      borderRadius={8}
      borderWidth={1}
      borderColor={request.is_overdue ? '$red6' : '$borderColor'}
      align="center"
      gap={12}
      flexWrap="wrap"
    >
      {/* Request ID */}
      <Stack minWidth={100}>
        <Text color="gray">
          Request ID
        </Text>
        <Text>
          {request.id.slice(0, 8)}...
        </Text>
      </Stack>

      {/* User */}
      <Stack flex={1} minWidth={140}>
        <Text color="gray">
          User
        </Text>
        <Text>
          {request.user_name}
        </Text>
        <Text color="gray">
          {request.user_email}
        </Text>
      </Stack>

      {/* Type */}
      <Stack minWidth={100}>
        <Text color="gray">
          Type
        </Text>
        <Text textTransform="capitalize">
          {request.type.replace('_', ' ')}
        </Text>
      </Stack>

      {/* Status */}
      <Stack minWidth={100}>
        <Text color="gray">
          Status
        </Text>
        <StatusBadge status={request.status} />
      </Stack>

      {/* Priority */}
      <Stack minWidth={80}>
        <Text color="gray">
          Priority
        </Text>
        <PriorityBadge priority={request.priority} />
      </Stack>

      {/* Days Elapsed */}
      <Stack minWidth={80}>
        <Text color="gray">
          Days
        </Text>
        <Text
          color={request.is_overdue ? '$red10' : request.days_elapsed > 30 ? '$orange10' : '$color12'}
        >
          {request.days_elapsed}
          {request.is_overdue && ' (OVERDUE)'}
        </Text>
      </Stack>

      {/* Submitted */}
      <Stack flex={1} minWidth={120}>
        <Text color="gray">
          Submitted
        </Text>
        <Text>
          {formatDate(request.created_at)}
        </Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} minWidth={200} justify="flex-end">
        <Button size={8} variant="outline" onPress={() => onView?.(request.id)}>
          View
        </Button>
        {request.status === 'pending' && (
          <Button size={8} variant="outline" onPress={() => onAssign?.(request.id)}>
            Assign
          </Button>
        )}
        {(request.status === 'pending' || request.status === 'processing') && (
          <Button size={8} onPress={() => onProcess?.(request.id)}>
            Process
          </Button>
        )}
      </Row>
    </Row>
  )
}

/**
 * Filter bar component
 */
function FilterBar({
  statusFilter,
  typeFilter,
  priorityFilter,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
}: {
  statusFilter: string
  typeFilter: string
  priorityFilter: string
  onStatusChange: (status: string) => void
  onTypeChange: (type: string) => void
  onPriorityChange: (priority: string) => void
}) {
  return (
    <Row gap={12} flexWrap="wrap" align="center">
      <Stack gap={4}>
        <Text color="gray">
          Status
        </Text>
        <Row gap={8}>
          {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
            <Button
              key={status}
              size={8}
              variant={statusFilter === status ? undefined : 'outlined'}
              onPress={() => onStatusChange(status)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </Row>
      </Stack>

      <Stack gap={4}>
        <Text color="gray">
          Type
        </Text>
        <Row gap={8}>
          {['all', 'export', 'deletion', 'correction', 'opt_out'].map((type) => (
            <Button
              key={type}
              size={8}
              variant={typeFilter === type ? undefined : 'outlined'}
              onPress={() => onTypeChange(type)}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
            </Button>
          ))}
        </Row>
      </Stack>

      <Stack gap={4}>
        <Text color="gray">
          Priority
        </Text>
        <Row gap={8}>
          {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
            <Button
              key={priority}
              size={8}
              variant={priorityFilter === priority ? undefined : 'outlined'}
              onPress={() => onPriorityChange(priority)}
            >
              {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Button>
          ))}
        </Row>
      </Stack>
    </Row>
  )
}

/**
 * CCPA Admin Dashboard Component
 */
export function CCPAAdminDashboard() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [_selectedRequest, setSelectedRequest] = useState<string | null>(null)

  // Fetch compliance metrics
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = api.ccpa.getComplianceMetrics.useQuery()

  // Fetch all CCPA requests
  const {
    data: requests,
    isLoading: isLoadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = api.ccpa.getAdminRequests.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    limit: 50,
  })

  // Process request mutation
  const processRequest = api.ccpa.processRequest.useMutation({
    onSuccess: () => {
      refetchRequests()
    },
  })

  const isLoading = isLoadingMetrics || isLoadingRequests
  const hasError = metricsError || requestsError

  if (hasError) {
    return (
      <Stack padding={16} gap={16} align="center" justify="center" flex={1}>
        <Text color="$red10">
          Error Loading CCPA Dashboard
        </Text>
        <Text color="gray" textAlign="center">
          {metricsError?.message || requestsError?.message}
        </Text>
        <Button onPress={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </Stack>
    )
  }

  const handleViewRequest = (id: string) => {
    setSelectedRequest(id)
    // Open detail modal or navigate to detail page
  }

  const handleAssignRequest = (_id: string) => {
    // Open assignment modal
  }

  const handleProcessRequest = (id: string) => {
    processRequest.mutate({ requestId: id })
  }

  return (
    <ScrollView>
      <Stack padding={16} gap={24} maxWidth={1400} marginHorizontal="auto">
        {/* Page Header */}
        <Stack gap={8}>
          <Text>
            CCPA Compliance Dashboard
          </Text>
          <Text color="gray">
            Manage CCPA requests, monitor compliance metrics, and ensure regulatory compliance.
          </Text>
        </Stack>

        {/* Compliance Metrics */}
        <Stack gap={12}>
          <Text>
            Compliance Metrics
          </Text>
          {isLoading ? (
            <Row padding={24} justify="center">
              <Spinner size="lg" />
            </Row>
          ) : (
            <Row gap={12} flexWrap="wrap">
              <MetricCard
                label="Total Requests"
                value={metrics?.total_requests || 0}
                trend="neutral"
              />
              <MetricCard
                label="Pending"
                value={metrics?.pending_requests || 0}
                color={metrics?.pending_requests ? '$orange10' : '$color12'}
              />
              <MetricCard
                label="Processing"
                value={metrics?.processing_requests || 0}
                color="$blue10"
              />
              <MetricCard
                label="Completed"
                value={metrics?.completed_requests || 0}
                color="$green10"
                trend="up"
              />
              <MetricCard
                label="Avg Processing Days"
                value={`${metrics?.average_processing_days?.toFixed(1) || 0}`}
                color={
                  (metrics?.average_processing_days || 0) > 30
                    ? '$orange10'
                    : '$green10'
                }
              />
              <MetricCard
                label="Compliance Rate"
                value={`${((metrics?.compliance_rate || 0) * 100).toFixed(1)}%`}
                color={
                  (metrics?.compliance_rate || 0) >= 0.95
                    ? '$green10'
                    : (metrics?.compliance_rate || 0) >= 0.8
                    ? '$orange10'
                    : '$red10'
                }
              />
              <MetricCard
                label="Overdue Requests"
                value={metrics?.overdue_count || 0}
                color={metrics?.overdue_count ? '$red10' : '$green10'}
              />
            </Row>
          )}
        </Stack>

        {/* 45-Day Deadline Warning */}
        {(metrics?.overdue_count || 0) > 0 && (
          <Row
            padding={16}
            backgroundColor="$red2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$red6"
            gap={8}
            align="center"
          >
            <Text color="$red11">
              ATTENTION: {metrics?.overdue_count} request(s) have exceeded the 45-day CCPA deadline.
              Immediate action required.
            </Text>
          </Row>
        )}

        {/* Request Filters */}
        <Stack gap={12}>
          <Text>
            Request Management
          </Text>
          <FilterBar
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            priorityFilter={priorityFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onPriorityChange={setPriorityFilter}
          />
        </Stack>

        {/* Request List */}
        <Stack gap={8}>
          {isLoading ? (
            <Row padding={24} justify="center">
              <Spinner size="lg" />
            </Row>
          ) : requests?.requests?.length === 0 ? (
            <Stack
              padding={24}
              backgroundColor="$color2"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderColor"
              align="center"
              gap={8}
            >
              <Text color="gray">
                No requests match the current filters
              </Text>
            </Stack>
          ) : (
            requests?.requests?.map((request: AdminCCPARequest) => (
              <RequestRow
                key={request.id}
                request={request}
                onView={handleViewRequest}
                onAssign={handleAssignRequest}
                onProcess={handleProcessRequest}
              />
            ))
          )}
        </Stack>

        {/* Quick Actions */}
        <Stack gap={12}>
          <Text>
            Quick Actions
          </Text>
          <Row gap={12} flexWrap="wrap">
            <Button size={16}>
              Generate Compliance Report
            </Button>
            <Button size={16} variant="outline">
              Export All Requests
            </Button>
            <Button size={16} variant="outline">
              View Breach Notifications
            </Button>
            <Button size={16} variant="outline">
              Audit Log
            </Button>
          </Row>
        </Stack>

        {/* CCPA Timeline Requirements */}
        <Stack
          gap={12}
          padding={16}
          backgroundColor="$color2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text>
            CCPA Timeline Requirements
          </Text>
          <Stack gap={8}>
            <Row gap={8} align="center">
              <Stack width={8} height={8} borderRadius={4} backgroundColor="$blue10" />
              <Text color="gray">
                <Text>10 days</Text> - Acknowledge receipt of request
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack width={8} height={8} borderRadius={4} backgroundColor="$orange10" />
              <Text color="gray">
                <Text>45 days</Text> - Complete request (with possible 45-day extension)
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack width={8} height={8} borderRadius={4} backgroundColor="$green10" />
              <Text color="gray">
                <Text>12 months</Text> - Retain request records
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack width={8} height={8} borderRadius={4} backgroundColor="$red10" />
              <Text color="gray">
                <Text>72 hours</Text> - Notify users of data breaches
              </Text>
            </Row>
          </Stack>
        </Stack>
      </Stack>
    </ScrollView>
  )
}

export default CCPAAdminDashboard
