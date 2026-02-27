/**
 * CCPA Admin Request List Page
 * TASK-2: Implement CCPA Request List Page with Filtering and Search
 *
 * Work queue for all CCPA data subject requests with:
 * - Comprehensive filtering and search
 * - SLA clock display
 * - Bulk operations
 * - Row actions (view, process, assign)
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Stack,
  Row,
  Text,
  Button,
  Card,
  Heading,
  Input,
  Spinner,
  Modal,
  Select,
  colors,
  spacing,
} from '@scaffald/ui'
import Checkbox from '../../../../../ui/Checkbox'
import { useRouter, useSearchParams } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Status options for bulk status change
const BULK_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'Start Processing' },
  { value: 'completed', label: 'Mark Completed' },
  { value: 'denied', label: 'Deny Requests' },
  { value: 'cancelled', label: 'Cancel Requests' },
] as const

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

// Color mappings
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

const TYPE_LABELS: Record<string, string> = {
  access: 'Export',
  deletion: 'Deletion',
  correction: 'Correction',
  portability: 'Portability',
  opt_out: 'Opt Out',
  opt_in: 'Opt In',
}

const PAGE_SIZES = [25, 50, 100]

export default function CCPARequestListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filters from URL
  const initialStatus = searchParams.get('status') ?? 'all'
  const initialType = searchParams.get('type') ?? 'all'

  // State
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [typeFilter, setTypeFilter] = useState<string>(initialType)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(0)

  // Bulk operation modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string>('')
  const [bulkOperationNotes, setBulkOperationNotes] = useState<string>('')
  const [bulkOperationResult, setBulkOperationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Fetch requests
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.listRequests.useQuery(
    {
      status: statusFilter !== 'all' ? (statusFilter as CCPARequest['status']) : undefined,
      requestType: typeFilter !== 'all' ? (typeFilter as CCPARequest['type']) : undefined,
      sortBy: 'deadline_at',
      sortOrder: 'asc',
      limit: pageSize,
      offset: currentPage * pageSize,
    },
    { refetchInterval: 30000 }
  )

  // Mutations
  const approveRequest = trpc.ccpaAdmin.approveRequest.useMutation({
    onSuccess: () => refetch(),
  })

  const bulkUpdateStatus = trpc.ccpaAdmin.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      setBulkOperationResult({
        success: data.summary.failed === 0,
        message: data.summary.message,
      })
      refetch()
      clearSelection()
      setShowStatusModal(false)
      setSelectedBulkStatus('')
      setBulkOperationNotes('')
    },
    onError: (error) => {
      setBulkOperationResult({
        success: false,
        message: error.message || 'Failed to update request statuses',
      })
    },
  })

  const bulkAssign = trpc.ccpaAdmin.bulkAssign.useMutation({
    onSuccess: (data) => {
      setBulkOperationResult({
        success: data.summary.failed === 0,
        message: data.summary.message,
      })
      refetch()
      clearSelection()
      setShowAssignModal(false)
      setSelectedAssignee('')
      setBulkOperationNotes('')
    },
    onError: (error) => {
      setBulkOperationResult({
        success: false,
        message: error.message || 'Failed to assign requests',
      })
    },
  })

  // Fetch team members for assignment dropdown
  const { data: teamMembers } = trpc.ccpaAdmin.getTeamMembers.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Computed values
  const requests = useMemo(() => requestsData?.items ?? [], [requestsData])
  const totalCount = requestsData?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Filter by search query (client-side for now)
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests
    const query = searchQuery.toLowerCase()
    return requests.filter(
      (req) =>
        req.user_email.toLowerCase().includes(query) ||
        req.user_name.toLowerCase().includes(query) ||
        req.id.toLowerCase().includes(query)
    )
  }, [requests, searchQuery])

  // Filter by priority (client-side)
  const displayRequests = useMemo(() => {
    if (priorityFilter === 'all') return filteredRequests
    return filteredRequests.filter((req) => req.priority === priorityFilter)
  }, [filteredRequests, priorityFilter])

  // Helpers
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const formatSLAClock = useCallback((daysRemaining: number, isOverdue: boolean) => {
    if (isOverdue) {
      return `${Math.abs(daysRemaining)}d overdue`
    }
    return `${daysRemaining}d remaining`
  }, [])

  const getSLAColor = useCallback((daysRemaining: number, status: string) => {
    if (!['pending', 'in_progress'].includes(status)) return colors.text.light.secondary
    if (daysRemaining < 0) return colors.error[600]
    if (daysRemaining <= 7) return colors.error[600]
    if (daysRemaining <= 14) return colors.warning[600]
    return colors.success[600]
  }, [])

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === displayRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayRequests.map((r) => r.id)))
    }
  }, [displayRequests, selectedIds.size])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk operation handlers
  const handleBulkStatusChange = useCallback(async () => {
    if (!selectedBulkStatus || selectedIds.size === 0) return

    bulkUpdateStatus.mutate({
      requestIds: Array.from(selectedIds),
      newStatus: selectedBulkStatus as
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'denied'
        | 'cancelled',
      notes: bulkOperationNotes || undefined,
    })
  }, [selectedIds, selectedBulkStatus, bulkOperationNotes, bulkUpdateStatus])

  const handleBulkAssign = useCallback(async () => {
    if (!selectedAssignee || selectedIds.size === 0) return

    bulkAssign.mutate({
      requestIds: Array.from(selectedIds),
      assigneeId: selectedAssignee,
      notes: bulkOperationNotes || undefined,
    })
  }, [selectedIds, selectedAssignee, bulkOperationNotes, bulkAssign])

  const dismissResultNotification = useCallback(() => {
    setBulkOperationResult(null)
  }, [])

  // Action handlers
  const handleViewRequest = useCallback(
    (requestId: string) => {
      router.push(`/admin/ccpa/requests/${requestId}`)
    },
    [router]
  )

  const handleProcessRequest = useCallback(
    async (requestId: string) => {
      try {
        await approveRequest.mutateAsync({ requestId })
      } catch (err) {
        console.error('Failed to approve request:', err)
      }
    },
    [approveRequest]
  )

  const handleFilterChange = useCallback(
    (filterName: string, value: string) => {
      // Update URL params
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete(filterName)
      } else {
        params.set(filterName, value)
      }
      router.push(`/admin/ccpa/requests?${params.toString()}`)

      // Update local state
      switch (filterName) {
        case 'status':
          setStatusFilter(value)
          break
        case 'type':
          setTypeFilter(value)
          break
        case 'priority':
          setPriorityFilter(value)
          break
      }
      setCurrentPage(0)
    },
    [router, searchParams]
  )

  // Loading state
  if (isLoading) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading requests...
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
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
            Error loading requests
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            style={{ marginTop: spacing[12] }}
            size="sm"
            color="error"
            variant="filled"
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={2} style={{ marginBottom: spacing[8] }}>CCPA Requests</Heading>
          <Text color={colors.text.light.secondary}>
            {totalCount} total request{totalCount !== 1 ? 's' : ''} • {displayRequests.length}{' '}
            showing
          </Text>
        </Stack>
        <Button
          variant="outline"
          color="gray"
          onPress={() => router.push('/admin/ccpa')}
        >
          Back to Dashboard
        </Button>
      </Row>

      {/* Filters and Search */}
      <Card style={{ padding: spacing[16], marginBottom: spacing[16] }}>
        <Row style={{ flexWrap: 'wrap', gap: spacing[16], alignItems: 'flex-end' }}>
          {/* Search */}
          <Stack style={{ flex: 1, minWidth: 250 }}>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Search
            </Text>
            <Input
              placeholder="Search by email, name, or request ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              size="sm"
            />
          </Stack>

          {/* Status Filter */}
          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Status
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'pending', 'in_progress', 'completed', 'denied'].map((status) => (
                <Button
                  key={status}
                  onPress={() => handleFilterChange('status', status)}
                  size="xs"
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

          {/* Type Filter */}
          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Type
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'access', 'deletion', 'correction'].map((type) => (
                <Button
                  key={type}
                  onPress={() => handleFilterChange('type', type)}
                  size="xs"
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

          {/* Priority Filter */}
          <Stack>
            <Text size="xs" color={colors.text.light.secondary} style={{ marginBottom: spacing[4] }}>
              Priority
            </Text>
            <Row gap={spacing[8]}>
              {['all', 'urgent', 'high'].map((priority) => (
                <Button
                  key={priority}
                  onPress={() => handleFilterChange('priority', priority)}
                  size="xs"
                  color={priorityFilter === priority ? 'primary' : 'gray'}
                  variant={priorityFilter === priority ? 'filled' : 'outline'}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Button>
              ))}
            </Row>
          </Stack>
        </Row>
      </Card>

      {/* Bulk Operation Result Notification */}
      {bulkOperationResult && (
        <Card
          style={{
            padding: spacing[12],
            marginBottom: spacing[16],
            backgroundColor: bulkOperationResult.success ? colors.success[200] : colors.error[200],
            borderWidth: 1,
            borderColor: bulkOperationResult.success ? colors.success[400] : colors.error[400],
          }}
        >
          <Row alignItems="center" justifyContent="space-between">
            <Text color={bulkOperationResult.success ? colors.success[600] : colors.error[600]} weight="medium">
              {bulkOperationResult.message}
            </Text>
            <Button
              size="xs"
              variant="text"
              color={bulkOperationResult.success ? 'success' : 'error'}
              onPress={dismissResultNotification}
            >
              Dismiss
            </Button>
          </Row>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card
          style={{
            padding: spacing[12],
            marginBottom: spacing[16],
            backgroundColor: colors.info[200],
            borderWidth: 1,
            borderColor: colors.info[400],
          }}
        >
          <Row alignItems="center" justifyContent="space-between">
            <Text color={colors.info[600]} weight="medium">
              {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
            </Text>
            <Row gap={spacing[8]}>
              <Button
                size="xs"
                color="primary"
                variant="filled"
                onPress={() => setShowAssignModal(true)}
              >
                Assign All
              </Button>
              <Button
                size="xs"
                color="gray"
                variant="filled"
                onPress={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>
              <Button
                size="xs"
                color="success"
                variant="filled"
                disabled={bulkUpdateStatus.isPending}
                loading={bulkUpdateStatus.isPending}
                onPress={() => {
                  // Quick action: Start processing all selected pending requests
                  const pendingIds = Array.from(selectedIds).filter((id) => {
                    const req = displayRequests.find((r) => r.id === id)
                    return req?.status === 'pending'
                  })
                  if (pendingIds.length > 0) {
                    bulkUpdateStatus.mutate({
                      requestIds: pendingIds,
                      newStatus: 'in_progress',
                      notes: 'Bulk started processing',
                    })
                  }
                }}
              >
                {bulkUpdateStatus.isPending ? 'Processing...' : 'Start Processing'}
              </Button>
              <Button
                size="xs"
                variant="outline"
                color="gray"
                onPress={clearSelection}
              >
                Clear Selection
              </Button>
            </Row>
          </Row>
        </Card>
      )}

      {/* Assign Modal */}
      <Modal open={showAssignModal} onOpenChange={setShowAssignModal}>
        <Modal.Header>
          <Heading level={3}>
            Assign {selectedIds.size} Request{selectedIds.size !== 1 ? 's' : ''}
          </Heading>
        </Modal.Header>
        <Modal.Content>
          <Stack gap={spacing[16]}>
            <Select
              label="Select Team Member"
              value={selectedAssignee}
              onValueChange={setSelectedAssignee}
              placeholder="Choose assignee..."
              options={(teamMembers ?? []).map((member) => ({
                value: member.id,
                label: `${member.name} (${member.email})`,
              }))}
            />

            <Stack gap={spacing[8]}>
              <Text size="xs" color={colors.text.light.secondary}>
                Notes (optional)
              </Text>
              <Input
                placeholder="Add notes for the assignment..."
                value={bulkOperationNotes}
                onChangeText={setBulkOperationNotes}
                size="sm"
              />
            </Stack>
          </Stack>
        </Modal.Content>
        <Modal.Footer>
          <Row gap={spacing[12]} justifyContent="flex-end">
            <Button
              variant="outline"
              color="gray"
              onPress={() => {
                setShowAssignModal(false)
                setSelectedAssignee('')
                setBulkOperationNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="filled"
              disabled={!selectedAssignee || bulkAssign.isPending}
              loading={bulkAssign.isPending}
              onPress={handleBulkAssign}
            >
              {bulkAssign.isPending ? 'Assigning...' : 'Assign Requests'}
            </Button>
          </Row>
        </Modal.Footer>
      </Modal>

      {/* Status Change Modal */}
      <Modal open={showStatusModal} onOpenChange={setShowStatusModal}>
        <Modal.Header>
          <Heading level={3}>
            Change Status for {selectedIds.size} Request{selectedIds.size !== 1 ? 's' : ''}
          </Heading>
        </Modal.Header>
        <Modal.Content>
          <Stack gap={spacing[16]}>
            <Stack gap={spacing[8]}>
              <Text size="xs" color={colors.text.light.secondary}>
                New Status
              </Text>
              <Row gap={spacing[8]} style={{ flexWrap: 'wrap' }}>
                {BULK_STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    color={selectedBulkStatus === option.value ? 'primary' : 'gray'}
                    variant={selectedBulkStatus === option.value ? 'filled' : 'outline'}
                    onPress={() => setSelectedBulkStatus(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </Row>
            </Stack>

            <Stack gap={spacing[8]}>
              <Text size="xs" color={colors.text.light.secondary}>
                Notes (optional)
              </Text>
              <Input
                placeholder="Add notes for the status change..."
                value={bulkOperationNotes}
                onChangeText={setBulkOperationNotes}
                size="sm"
              />
            </Stack>

            <Card style={{ padding: spacing[12], backgroundColor: colors.warning[200], borderWidth: 1, borderColor: colors.warning[400] }}>
              <Text size="xs" color={colors.warning[600]}>
                Note: Status changes follow workflow rules. Invalid transitions (e.g., completed →
                pending) will be skipped and reported in the results.
              </Text>
            </Card>
          </Stack>
        </Modal.Content>
        <Modal.Footer>
          <Row gap={spacing[12]} justifyContent="flex-end">
            <Button
              variant="outline"
              color="gray"
              onPress={() => {
                setShowStatusModal(false)
                setSelectedBulkStatus('')
                setBulkOperationNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="filled"
              disabled={!selectedBulkStatus || bulkUpdateStatus.isPending}
              loading={bulkUpdateStatus.isPending}
              onPress={handleBulkStatusChange}
            >
              {bulkUpdateStatus.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </Row>
        </Modal.Footer>
      </Modal>

      {/* Requests Table */}
      <Card style={{ overflow: 'hidden' }}>
        <Stack>
          {/* Table Header */}
          <Row style={{ backgroundColor: colors.gray[100], paddingHorizontal: spacing[16], paddingVertical: spacing[12] }}>
            <Row style={{ width: 40, alignItems: 'center' }}>
              <Checkbox
                checked={selectedIds.size === displayRequests.length && displayRequests.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </Row>
            <Text style={{ flex: 1 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              User
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Type
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Status
            </Text>
            <Text style={{ width: 80 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Priority
            </Text>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              SLA Clock
            </Text>
            <Text style={{ width: 100 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Submitted
            </Text>
            <Text style={{ width: 150 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Actions
            </Text>
          </Row>

          {/* Table Body */}
          {displayRequests.length === 0 ? (
            <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }} color={colors.gray[300]} style={{ marginBottom: spacing[8] }}>
                No requests found
              </Text>
              <Text color={colors.text.light.secondary} style={{ textAlign: 'center' }}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No CCPA requests match your current filters'}
              </Text>
            </Stack>
          ) : (
            <Stack>
              {displayRequests.map((req) => (
                <Row
                  key={req.id}
                  style={{
                    backgroundColor:
                      req.is_overdue ? colors.error[200] : selectedIds.has(req.id) ? colors.primary[200] : 'transparent',
                    paddingHorizontal: spacing[16],
                    paddingVertical: spacing[12],
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.light.default,
                  }}
                >
                  {/* Checkbox */}
                  <Row style={{ width: 40, alignItems: 'center' }}>
                    <Checkbox
                      checked={selectedIds.has(req.id)}
                      onCheckedChange={() => toggleSelection(req.id)}
                    />
                  </Row>

                  {/* User */}
                  <Stack style={{ flex: 1 }}>
                    <Text weight="medium" color={colors.text.light.primary}>
                      {req.user_name}
                    </Text>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {req.user_email}
                    </Text>
                  </Stack>

                  {/* Type */}
                  <Row style={{ width: 100, alignItems: 'center' }}>
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
                  </Row>

                  {/* Status */}
                  <Row style={{ width: 100, alignItems: 'center' }}>
                    <Stack gap={spacing[4]}>
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
                  </Row>

                  {/* Priority */}
                  <Row style={{ width: 80, alignItems: 'center' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: PRIORITY_COLORS[req.priority]?.bg ?? colors.gray[100],
                      }}
                    >
                      <Text size="xs" color={PRIORITY_COLORS[req.priority]?.text ?? colors.text.light.secondary}>
                        {req.priority}
                      </Text>
                    </Row>
                  </Row>

                  {/* SLA Clock */}
                  <Row style={{ width: 120, alignItems: 'center' }}>
                    <Text
                      size="xs"
                      weight="medium"
                      color={getSLAColor(req.days_remaining, req.status)}
                    >
                      {['pending', 'in_progress'].includes(req.status)
                        ? formatSLAClock(req.days_remaining, req.is_overdue)
                        : '-'}
                    </Text>
                  </Row>

                  {/* Submitted */}
                  <Row style={{ width: 100, alignItems: 'center' }}>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {formatDate(req.created_at)}
                    </Text>
                  </Row>

                  {/* Actions */}
                  <Row style={{ width: 150, gap: spacing[8], alignItems: 'center' }}>
                    <Button
                      size="xs"
                      variant="text"
                      color="primary"
                      onPress={() => handleViewRequest(req.id)}
                    >
                      View
                    </Button>
                    {req.status === 'pending' && (
                      <Button
                        size="xs"
                        variant="text"
                        color="success"
                        onPress={() => handleProcessRequest(req.id)}
                        disabled={approveRequest.isPending}
                      >
                        Process
                      </Button>
                    )}
                  </Row>
                </Row>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Row style={{ marginTop: spacing[16], alignItems: 'center', justifyContent: 'space-between' }}>
          <Row gap={spacing[8]} alignItems="center">
            <Text size="xs" color={colors.text.light.secondary}>
              Rows per page:
            </Text>
            {PAGE_SIZES.map((size) => (
              <Button
                key={size}
                size="xs"
                color={pageSize === size ? 'primary' : 'gray'}
                variant={pageSize === size ? 'filled' : 'outline'}
                onPress={() => {
                  setPageSize(size)
                  setCurrentPage(0)
                }}
              >
                {size}
              </Button>
            ))}
          </Row>

          <Row gap={spacing[8]} alignItems="center">
            <Text size="xs" color={colors.text.light.secondary}>
              Page {currentPage + 1} of {totalPages}
            </Text>
            <Button
              size="xs"
              variant="outline"
              color="gray"
              disabled={currentPage === 0}
              onPress={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="gray"
              disabled={currentPage >= totalPages - 1}
              onPress={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </Row>
        </Row>
      )}
    </Stack>
  )
}
