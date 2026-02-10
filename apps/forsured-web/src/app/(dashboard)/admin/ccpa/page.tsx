/**
 * CCPA Admin Dashboard
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
import { Stack, Row, Text, Button, Card, Heading, colors, spacing } from '@unicornlove/beyond-ui'
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

// Status badge colors - using Beyond UI color tokens
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.warning[200], text: colors.warning[600] },
  in_progress: { bg: colors.primary[200], text: colors.primary[600] },
  completed: { bg: colors.success[200], text: colors.success[600] },
  denied: { bg: colors.error[200], text: colors.error[600] },
  cancelled: { bg: colors.gray[100], text: colors.text.light.secondary },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: colors.gray[100], text: colors.text.light.secondary },
  medium: { bg: colors.primary[200], text: colors.primary[600] },
  high: { bg: colors.warning[200], text: colors.warning[600] },
  urgent: { bg: colors.error[200], text: colors.error[600] },
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  access: { bg: colors.primary[200], text: colors.primary[600] },
  deletion: { bg: colors.error[200], text: colors.error[600] },
  correction: { bg: colors.purple[200], text: colors.purple[600] },
  portability: { bg: colors.info[200], text: colors.info[600] },
  opt_out: { bg: colors.success[200], text: colors.success[600] },
  opt_in: { bg: colors.success[200], text: colors.success[600] },
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
      <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
        <Stack style={{ opacity: 0.5 }}>
          <Stack
            style={{
              height: 32,
              backgroundColor: colors.gray[200],
              borderRadius: 8,
              width: '33%',
              marginBottom: spacing[16],
            }}
          />
          <Row style={{ flexWrap: 'wrap', gap: spacing[16], marginBottom: spacing[32] }}>
            {[1, 2, 3, 4].map((i) => (
              <Stack
                key={i}
                style={{
                  height: 96,
                  backgroundColor: colors.gray[200],
                  borderRadius: 8,
                  flex: 1,
                  minWidth: 200,
                }}
              />
            ))}
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: spacing[16] }}>
            {[1, 2, 3].map((i) => (
              <Stack
                key={i}
                style={{
                  height: 96,
                  backgroundColor: colors.gray[200],
                  borderRadius: 8,
                  flex: 1,
                  minWidth: 200,
                }}
              />
            ))}
          </Row>
        </Stack>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
        <Stack
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text weight="semibold" color={colors.error[600]}>
            Error loading CCPA dashboard
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            style={{ marginTop: spacing[12] }}
            size="sm"
            color="error"
            variant="filled"
            onPress={() => window.location.reload()}
          >
            Retry
          </Button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Heading level={2} style={{ marginBottom: spacing[8] }}>CCPA Compliance Dashboard</Heading>
        <Text color={colors.text.light.secondary}>Monitor and manage CCPA data requests across your organization.</Text>
      </Stack>

      {/* SLA Notification Banner */}
      <SLANotificationBanner />

      {/* Compliance Metrics */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Heading level={3} style={{ marginBottom: spacing[16] }}>Compliance Metrics</Heading>
        <Row style={{ flexWrap: 'wrap', gap: spacing[16] }}>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Total Requests
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
              {metrics?.total_requests ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Pending
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[600]}>
              {metrics?.pending_requests ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Processing
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.primary[600]}>
              {metrics?.processing_requests ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Completed
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.success[600]}>
              {metrics?.completed_requests ?? 0}
            </Text>
          </Card>
        </Row>

        <Row style={{ flexWrap: 'wrap', gap: spacing[16], marginTop: spacing[16] }}>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Avg Processing Days
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
              {metrics?.average_processing_days ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Compliance Rate
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.success[600]}>
              {((metrics?.compliance_rate ?? 1) * 100).toFixed(0)}%
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Overdue Requests
            </Text>
            <Text
              style={{ fontSize: 32, fontWeight: '700' }}
              color={(metrics?.overdue_count ?? 0) > 0 ? colors.error[600] : colors.success[600]}
            >
              {metrics?.overdue_count ?? 0}
            </Text>
          </Card>
        </Row>
      </Stack>

      {/* Request Management */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[16] }}>
          <Heading level={3}>Request Management</Heading>
        </Row>

        {/* Filters */}
        <Row style={{ flexWrap: 'wrap', gap: spacing[16], marginBottom: spacing[16] }}>
          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Status
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <Button
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  size="sm"
                  color={statusFilter === status ? 'primary' : 'gray'}
                  variant={statusFilter === status ? 'filled' : 'outline'}
                >
                  {status === 'in_progress'
                    ? 'Processing'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>

          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Type
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'access', 'deletion', 'correction'].map((type) => (
                <Button
                  key={type}
                  onPress={() => setTypeFilter(type)}
                  size="sm"
                  color={typeFilter === type ? 'primary' : 'gray'}
                  variant={typeFilter === type ? 'filled' : 'outline'}
                >
                  {type === 'all'
                    ? 'All'
                    : (TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1))}
                </Button>
              ))}
            </Row>
          </Stack>

          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Priority
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
                <Button
                  key={priority}
                  onPress={() => setPriorityFilter(priority)}
                  size="sm"
                  color={priorityFilter === priority ? 'primary' : 'gray'}
                  variant={priorityFilter === priority ? 'filled' : 'outline'}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>
        </Row>

        {/* Requests Table */}
        <Card style={{ overflow: 'hidden' }}>
          <Stack>
            <Row style={{ backgroundColor: colors.gray[100], paddingHorizontal: spacing[16], paddingVertical: spacing[12] }}>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                User
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Type
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Status
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Priority
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Days
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Submitted
              </Text>
              <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
                Actions
              </Text>
            </Row>
            {filteredRequests.length === 0 ? (
              <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
                <Text color={colors.text.light.secondary}>No requests match your filters.</Text>
              </Stack>
            ) : (
              <Stack>
                {filteredRequests.map((req) => (
                  <Row
                    key={req.id}
                    style={{
                      backgroundColor: req.is_overdue ? colors.error[200] : 'transparent',
                      paddingHorizontal: spacing[16],
                      paddingVertical: spacing[12],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.light.default,
                    }}
                  >
                    <Stack style={{ flex: 1 }}>
                      <Text weight="medium" color={colors.text.light.primary}>
                        {req.user_name}
                      </Text>
                      <Text size="xs" color={colors.text.light.secondary}>
                        {req.user_email}
                      </Text>
                    </Stack>
                    <Stack style={{ flex: 1, alignItems: 'flex-start' }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: TYPE_COLORS[req.type]?.bg ?? colors.gray[100],
                        }}
                      >
                        <Text size="xs" color={TYPE_COLORS[req.type]?.text ?? colors.text.light.secondary}>
                          {TYPE_LABELS[req.type] ?? req.type}
                        </Text>
                      </Row>
                    </Stack>
                    <Stack style={{ flex: 1, alignItems: 'flex-start' }} gap={spacing[8]}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: STATUS_COLORS[req.status]?.bg ?? colors.gray[100],
                        }}
                      >
                        <Text size="xs" color={STATUS_COLORS[req.status]?.text ?? colors.text.light.secondary}>
                          {req.status === 'in_progress' ? 'processing' : req.status}
                        </Text>
                      </Row>
                      {req.is_overdue && (
                        <Row
                          style={{
                            paddingHorizontal: spacing[8],
                            paddingVertical: spacing[4],
                            backgroundColor: colors.error[500],
                            borderRadius: 8,
                          }}
                        >
                          <Text size="xs" color="white">
                            OVERDUE
                          </Text>
                        </Row>
                      )}
                    </Stack>
                    <Stack style={{ flex: 1, alignItems: 'flex-start' }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: PRIORITY_COLORS[req.priority]?.bg ?? colors.gray[100],
                        }}
                      >
                        <Text
                          size="xs"
                          color={PRIORITY_COLORS[req.priority]?.text ?? colors.text.light.secondary}
                        >
                          {req.priority}
                        </Text>
                      </Row>
                    </Stack>
                    <Stack style={{ flex: 1, justifyContent: 'center' }}>
                      <Text color={colors.text.light.secondary}>{req.days_elapsed}</Text>
                    </Stack>
                    <Stack style={{ flex: 1, justifyContent: 'center' }}>
                      <Text color={colors.text.light.secondary}>{formatDate(req.created_at)}</Text>
                    </Stack>
                    <Row style={{ flex: 1, gap: spacing[8] }}>
                      <Button
                        size="sm"
                        variant="text"
                        color="primary"
                        onPress={() => handleViewRequest(req.id)}
                      >
                        View
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="text"
                            color="success"
                            onPress={() => handleProcessRequest(req.id)}
                            disabled={approveRequest.isPending}
                          >
                            Process
                          </Button>
                          <Button
                            size="sm"
                            variant="text"
                            color="gray"
                            onPress={() => handleAssignRequest(req.id)}
                          >
                            Assign
                          </Button>
                        </>
                      )}
                    </Row>
                  </Row>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Quick Actions */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Heading level={3} style={{ marginBottom: spacing[16] }}>Quick Actions</Heading>
        <Row style={{ flexWrap: 'wrap', gap: spacing[12] }}>
          <Button
            color="primary"
            variant="filled"
            onPress={() => navigate('/admin/ccpa/reports')}
          >
            Generate Compliance Report
          </Button>
          <Button
            variant="outline"
            color="gray"
            onPress={() => navigate('/admin/ccpa/requests')}
          >
            View All Requests
          </Button>
          <Button
            variant="outline"
            color="gray"
            onPress={() => navigate('/admin/ccpa/breach')}
          >
            View Breach Notifications
          </Button>
          <Button
            variant="outline"
            color="gray"
            onPress={() => navigate('/admin/ccpa/audit-log')}
          >
            Audit Log
          </Button>
          <Button
            variant="outline"
            color="gray"
            onPress={() => navigate('/admin/ccpa/apps')}
          >
            OAuth App Configuration
          </Button>
        </Row>
      </Stack>

      {/* CCPA Timeline Requirements */}
      <Stack
        style={{
          padding: spacing[16],
          backgroundColor: colors.info[200],
          borderWidth: 1,
          borderColor: colors.info[400],
          borderRadius: spacing[16],
        }}
      >
        <Text weight="semibold" color={colors.info[600]} style={{ marginBottom: spacing[8] }}>
          CCPA Timeline Requirements
        </Text>
        <Stack gap={spacing[4]}>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">10 days</Text> - Acknowledge receipt of request
          </Text>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">45 days</Text> - Complete request (extendable by 45 days with
            notice)
          </Text>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">12 months</Text> - Retain records of requests and responses
          </Text>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">72 hours</Text> - Notify affected parties in case of data breach
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
