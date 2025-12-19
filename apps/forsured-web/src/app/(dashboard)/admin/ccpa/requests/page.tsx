/**
 * REQ-6: CCPA Admin Request List Page
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
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H2,
  H3,
  Input,
  Checkbox,
  Spinner,
  Dialog,
  ResponsiveSelect,
} from '@unicornlove/ui'
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
    if (!['pending', 'in_progress'].includes(status)) return '$gray11'
    if (daysRemaining < 0) return '$red11'
    if (daysRemaining <= 7) return '$red11'
    if (daysRemaining <= 14) return '$orange11'
    return '$green11'
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
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading requests...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (error) {
    return (
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading requests
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
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H2 marginBottom="$2">CCPA Requests</H2>
          <Text color="$gray11">
            {totalCount} total request{totalCount !== 1 ? 's' : ''} • {displayRequests.length}{' '}
            showing
          </Text>
        </YStack>
        <Button
          backgroundColor="$gray3"
          color="$gray11"
          hoverStyle={{ backgroundColor: '$gray4' }}
          onPress={() => router.push('/admin/ccpa')}
        >
          Back to Dashboard
        </Button>
      </XStack>

      {/* Filters and Search */}
      <Card padding="$4" marginBottom="$4">
        <XStack flexWrap="wrap" gap="$4" alignItems="flex-end">
          {/* Search */}
          <YStack flex={1} minWidth={250}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Search
            </Text>
            <Input
              placeholder="Search by email, name, or request ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              size="$3"
            />
          </YStack>

          {/* Status Filter */}
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Status
            </Text>
            <XStack gap="$2">
              {['all', 'pending', 'in_progress', 'completed', 'denied'].map((status) => (
                <Button
                  key={status}
                  onPress={() => handleFilterChange('status', status)}
                  size="$2"
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

          {/* Type Filter */}
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Type
            </Text>
            <XStack gap="$2">
              {['all', 'access', 'deletion', 'correction'].map((type) => (
                <Button
                  key={type}
                  onPress={() => handleFilterChange('type', type)}
                  size="$2"
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

          {/* Priority Filter */}
          <YStack>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Priority
            </Text>
            <XStack gap="$2">
              {['all', 'urgent', 'high'].map((priority) => (
                <Button
                  key={priority}
                  onPress={() => handleFilterChange('priority', priority)}
                  size="$2"
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
      </Card>

      {/* Bulk Operation Result Notification */}
      {bulkOperationResult && (
        <Card
          padding="$3"
          marginBottom="$4"
          backgroundColor={bulkOperationResult.success ? '$green2' : '$red2'}
          borderWidth={1}
          borderColor={bulkOperationResult.success ? '$green6' : '$red6'}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text color={bulkOperationResult.success ? '$green11' : '$red11'} fontWeight="500">
              {bulkOperationResult.message}
            </Text>
            <Button
              size="$2"
              backgroundColor="transparent"
              color={bulkOperationResult.success ? '$green11' : '$red11'}
              hoverStyle={{ backgroundColor: bulkOperationResult.success ? '$green3' : '$red3' }}
              onPress={dismissResultNotification}
            >
              Dismiss
            </Button>
          </XStack>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card
          padding="$3"
          marginBottom="$4"
          backgroundColor="$blue2"
          borderWidth={1}
          borderColor="$blue6"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$blue11" fontWeight="500">
              {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
            </Text>
            <XStack gap="$2">
              <Button
                size="$2"
                backgroundColor="$blue9"
                color="white"
                hoverStyle={{ backgroundColor: '$blue10' }}
                onPress={() => setShowAssignModal(true)}
              >
                Assign All
              </Button>
              <Button
                size="$2"
                backgroundColor="$purple9"
                color="white"
                hoverStyle={{ backgroundColor: '$purple10' }}
                onPress={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>
              <Button
                size="$2"
                backgroundColor="$green9"
                color="white"
                hoverStyle={{ backgroundColor: '$green10' }}
                disabled={bulkUpdateStatus.isPending}
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
                size="$2"
                backgroundColor="$gray3"
                color="$gray11"
                hoverStyle={{ backgroundColor: '$gray4' }}
                onPress={clearSelection}
              >
                Clear Selection
              </Button>
            </XStack>
          </XStack>
        </Card>
      )}

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation={['quick', { opacity: { overshootClamping: true } }]}
            enterStyle={{ opacity: 0, scale: 0.9, y: -20 }}
            exitStyle={{ opacity: 0, scale: 0.95, y: 10 }}
            gap="$4"
            padding="$6"
            maxWidth={500}
          >
            <Dialog.Title>
              <H3>
                Assign {selectedIds.size} Request{selectedIds.size !== 1 ? 's' : ''}
              </H3>
            </Dialog.Title>

            <YStack gap="$4">
              <ResponsiveSelect
                label="Select Team Member"
                value={selectedAssignee}
                onValueChange={setSelectedAssignee}
                placeholder="Choose assignee..."
                options={(teamMembers ?? []).map((member) => ({
                  value: member.id,
                  label: `${member.name} (${member.email})`,
                }))}
              />

              <YStack gap="$2">
                <Text fontSize="$2" color="$gray11">
                  Notes (optional)
                </Text>
                <Input
                  placeholder="Add notes for the assignment..."
                  value={bulkOperationNotes}
                  onChangeText={setBulkOperationNotes}
                  size="$3"
                />
              </YStack>
            </YStack>

            <XStack gap="$3" justifyContent="flex-end" marginTop="$4">
              <Button
                backgroundColor="$gray3"
                color="$gray11"
                hoverStyle={{ backgroundColor: '$gray4' }}
                onPress={() => {
                  setShowAssignModal(false)
                  setSelectedAssignee('')
                  setBulkOperationNotes('')
                }}
              >
                Cancel
              </Button>
              <Button
                backgroundColor="$blue9"
                color="white"
                hoverStyle={{ backgroundColor: '$blue10' }}
                disabled={!selectedAssignee || bulkAssign.isPending}
                onPress={handleBulkAssign}
              >
                {bulkAssign.isPending ? 'Assigning...' : 'Assign Requests'}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation={['quick', { opacity: { overshootClamping: true } }]}
            enterStyle={{ opacity: 0, scale: 0.9, y: -20 }}
            exitStyle={{ opacity: 0, scale: 0.95, y: 10 }}
            gap="$4"
            padding="$6"
            maxWidth={500}
          >
            <Dialog.Title>
              <H3>
                Change Status for {selectedIds.size} Request{selectedIds.size !== 1 ? 's' : ''}
              </H3>
            </Dialog.Title>

            <YStack gap="$4">
              <YStack gap="$2">
                <Text fontSize="$2" color="$gray11">
                  New Status
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {BULK_STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      size="$3"
                      backgroundColor={selectedBulkStatus === option.value ? '$blue9' : '$gray3'}
                      color={selectedBulkStatus === option.value ? 'white' : '$gray11'}
                      hoverStyle={{
                        backgroundColor: selectedBulkStatus === option.value ? '$blue10' : '$gray4',
                      }}
                      onPress={() => setSelectedBulkStatus(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$2" color="$gray11">
                  Notes (optional)
                </Text>
                <Input
                  placeholder="Add notes for the status change..."
                  value={bulkOperationNotes}
                  onChangeText={setBulkOperationNotes}
                  size="$3"
                />
              </YStack>

              <Card padding="$3" backgroundColor="$orange2" borderWidth={1} borderColor="$orange6">
                <Text fontSize="$2" color="$orange11">
                  Note: Status changes follow workflow rules. Invalid transitions (e.g., completed →
                  pending) will be skipped and reported in the results.
                </Text>
              </Card>
            </YStack>

            <XStack gap="$3" justifyContent="flex-end" marginTop="$4">
              <Button
                backgroundColor="$gray3"
                color="$gray11"
                hoverStyle={{ backgroundColor: '$gray4' }}
                onPress={() => {
                  setShowStatusModal(false)
                  setSelectedBulkStatus('')
                  setBulkOperationNotes('')
                }}
              >
                Cancel
              </Button>
              <Button
                backgroundColor="$blue9"
                color="white"
                hoverStyle={{ backgroundColor: '$blue10' }}
                disabled={!selectedBulkStatus || bulkUpdateStatus.isPending}
                onPress={handleBulkStatusChange}
              >
                {bulkUpdateStatus.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Requests Table */}
      <Card overflow="hidden">
        <YStack>
          {/* Table Header */}
          <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
            <XStack width={40} alignItems="center">
              <Checkbox
                checked={selectedIds.size === displayRequests.length && displayRequests.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </XStack>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
              User
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Type
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Status
            </Text>
            <Text width={80} fontSize="$2" fontWeight="500" color="$gray11">
              Priority
            </Text>
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              SLA Clock
            </Text>
            <Text width={100} fontSize="$2" fontWeight="500" color="$gray11">
              Submitted
            </Text>
            <Text width={150} fontSize="$2" fontWeight="500" color="$gray11">
              Actions
            </Text>
          </XStack>

          {/* Table Body */}
          {displayRequests.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text fontSize="$6" color="$gray8" marginBottom="$2">
                No requests found
              </Text>
              <Text color="$gray11" textAlign="center">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No CCPA requests match your current filters'}
              </Text>
            </YStack>
          ) : (
            <YStack>
              {displayRequests.map((req) => (
                <XStack
                  key={req.id}
                  backgroundColor={
                    req.is_overdue ? '$red2' : selectedIds.has(req.id) ? '$blue2' : 'transparent'
                  }
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                  hoverStyle={{ backgroundColor: selectedIds.has(req.id) ? '$blue3' : '$gray2' }}
                >
                  {/* Checkbox */}
                  <XStack width={40} alignItems="center">
                    <Checkbox
                      checked={selectedIds.has(req.id)}
                      onCheckedChange={() => toggleSelection(req.id)}
                    />
                  </XStack>

                  {/* User */}
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$gray12">
                      {req.user_name}
                    </Text>
                    <Text fontSize="$2" color="$gray11">
                      {req.user_email}
                    </Text>
                  </YStack>

                  {/* Type */}
                  <XStack width={100} alignItems="center">
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
                  </XStack>

                  {/* Status */}
                  <XStack width={100} alignItems="center">
                    <YStack gap="$1">
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
                  </XStack>

                  {/* Priority */}
                  <XStack width={80} alignItems="center">
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={PRIORITY_COLORS[req.priority]?.bg ?? '$gray2'}
                    >
                      <Text fontSize="$2" color={PRIORITY_COLORS[req.priority]?.text ?? '$gray11'}>
                        {req.priority}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* SLA Clock */}
                  <XStack width={120} alignItems="center">
                    <Text
                      fontSize="$2"
                      fontWeight="500"
                      color={getSLAColor(req.days_remaining, req.status)}
                    >
                      {['pending', 'in_progress'].includes(req.status)
                        ? formatSLAClock(req.days_remaining, req.is_overdue)
                        : '-'}
                    </Text>
                  </XStack>

                  {/* Submitted */}
                  <XStack width={100} alignItems="center">
                    <Text fontSize="$2" color="$gray11">
                      {formatDate(req.created_at)}
                    </Text>
                  </XStack>

                  {/* Actions */}
                  <XStack width={150} gap="$2" alignItems="center">
                    <Button
                      size="$2"
                      backgroundColor="transparent"
                      color="$blue11"
                      hoverStyle={{ backgroundColor: '$blue3' }}
                      onPress={() => handleViewRequest(req.id)}
                    >
                      View
                    </Button>
                    {req.status === 'pending' && (
                      <Button
                        size="$2"
                        backgroundColor="transparent"
                        color="$green11"
                        hoverStyle={{ backgroundColor: '$green3' }}
                        onPress={() => handleProcessRequest(req.id)}
                        disabled={approveRequest.isPending}
                      >
                        Process
                      </Button>
                    )}
                  </XStack>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <XStack marginTop="$4" alignItems="center" justifyContent="space-between">
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$2" color="$gray11">
              Rows per page:
            </Text>
            {PAGE_SIZES.map((size) => (
              <Button
                key={size}
                size="$2"
                backgroundColor={pageSize === size ? '$blue9' : '$gray3'}
                color={pageSize === size ? 'white' : '$gray11'}
                hoverStyle={{ backgroundColor: pageSize === size ? '$blue10' : '$gray4' }}
                onPress={() => {
                  setPageSize(size)
                  setCurrentPage(0)
                }}
              >
                {size}
              </Button>
            ))}
          </XStack>

          <XStack gap="$2" alignItems="center">
            <Text fontSize="$2" color="$gray11">
              Page {currentPage + 1} of {totalPages}
            </Text>
            <Button
              size="$2"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              disabled={currentPage === 0}
              onPress={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="$2"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              disabled={currentPage >= totalPages - 1}
              onPress={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </XStack>
        </XStack>
      )}
    </YStack>
  )
}
