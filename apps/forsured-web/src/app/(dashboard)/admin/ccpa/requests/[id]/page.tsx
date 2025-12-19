/**
 * REQ-6: CCPA Admin Request Detail Page
 * TASK-3: Build CCPA Request Detail Page with Timeline and Actions
 *
 * Comprehensive request detail view with:
 * - Request header with status and SLA info
 * - Subject information panel
 * - Timeline of all events
 * - Internal notes section
 * - Admin action buttons
 */

'use client'

import { useState, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H2,
  H3,
  TextArea,
  Spinner,
} from '@unicornlove/ui'
import { useRouter, useParams } from 'next/navigation'
import { trpc } from '../../../../../../lib/trpc'

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

const TYPE_LABELS: Record<string, string> = {
  access: 'Data Export',
  deletion: 'Data Deletion',
  correction: 'Data Correction',
  portability: 'Data Portability',
  opt_out: 'Opt Out',
  opt_in: 'Opt In',
}

export default function CCPARequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  // State
  const [newNote, setNewNote] = useState('')
  const [showDenyModal, setShowDenyModal] = useState(false)
  const [denyReason, setDenyReason] = useState('')

  // Queries
  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.getRequest.useQuery(
    { requestId },
    { enabled: !!requestId, refetchInterval: 30000 }
  )

  const { data: history = [] } = trpc.ccpaAdmin.getHistory.useQuery(
    { requestId },
    { enabled: !!requestId }
  )

  // Mutations
  const approveRequest = trpc.ccpaAdmin.approveRequest.useMutation({
    onSuccess: () => refetch(),
  })

  const updateStatus = trpc.ccpaAdmin.updateStatus.useMutation({
    onSuccess: () => {
      refetch()
      setShowDenyModal(false)
      setDenyReason('')
    },
  })

  const addNote = trpc.ccpaAdmin.addNote.useMutation({
    onSuccess: () => {
      refetch()
      setNewNote('')
    },
  })

  // Helpers
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const formatShortDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const getSLAColor = useCallback((daysRemaining: number, status: string) => {
    if (!['pending', 'in_progress'].includes(status)) return '$gray11'
    if (daysRemaining < 0) return '$red11'
    if (daysRemaining <= 7) return '$red11'
    if (daysRemaining <= 14) return '$orange11'
    return '$green11'
  }, [])

  // Handlers
  const handleApprove = useCallback(async () => {
    try {
      await approveRequest.mutateAsync({ requestId })
    } catch (err) {
      console.error('Failed to approve request:', err)
    }
  }, [approveRequest, requestId])

  const handleComplete = useCallback(async () => {
    try {
      await updateStatus.mutateAsync({
        requestId,
        status: 'completed',
        notes: 'Request completed successfully',
      })
    } catch (err) {
      console.error('Failed to complete request:', err)
    }
  }, [updateStatus, requestId])

  const handleDeny = useCallback(async () => {
    if (!denyReason.trim()) return
    try {
      await updateStatus.mutateAsync({
        requestId,
        status: 'denied',
        notes: denyReason,
      })
    } catch (err) {
      console.error('Failed to deny request:', err)
    }
  }, [updateStatus, requestId, denyReason])

  const handleCancel = useCallback(async () => {
    try {
      await updateStatus.mutateAsync({
        requestId,
        status: 'cancelled',
        notes: 'Request cancelled by admin',
      })
    } catch (err) {
      console.error('Failed to cancel request:', err)
    }
  }, [updateStatus, requestId])

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return
    try {
      await addNote.mutateAsync({
        requestId,
        note: newNote.trim(),
      })
    } catch (err) {
      console.error('Failed to add note:', err)
    }
  }, [addNote, requestId, newNote])

  // Loading state
  if (isLoading) {
    return (
      <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading request details...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (error || !request) {
    return (
      <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading request
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {error?.message || 'Request not found'}
          </Text>
          <XStack gap="$2" marginTop="$3">
            <Button
              size="$3"
              backgroundColor="$red9"
              color="white"
              hoverStyle={{ backgroundColor: '$red10' }}
              onPress={() => refetch()}
            >
              Retry
            </Button>
            <Button
              size="$3"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              onPress={() => router.push('/admin/ccpa/requests')}
            >
              Back to List
            </Button>
          </XStack>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <XStack alignItems="center" gap="$3" marginBottom="$2">
            <H2>{TYPE_LABELS[request.type] ?? request.type} Request</H2>
            <XStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor={STATUS_COLORS[request.status]?.bg ?? '$gray2'}
            >
              <Text fontWeight="600" color={STATUS_COLORS[request.status]?.text ?? '$gray11'}>
                {request.status === 'in_progress' ? 'Processing' : request.status.toUpperCase()}
              </Text>
            </XStack>
            {request.is_overdue && (
              <XStack
                paddingHorizontal="$3"
                paddingVertical="$1"
                backgroundColor="$red9"
                borderRadius="$2"
              >
                <Text fontWeight="600" color="white">
                  OVERDUE
                </Text>
              </XStack>
            )}
          </XStack>
          <Text color="$gray11">Request ID: {request.id}</Text>
        </YStack>
        <Button
          backgroundColor="$gray3"
          color="$gray11"
          hoverStyle={{ backgroundColor: '$gray4' }}
          onPress={() => router.push('/admin/ccpa/requests')}
        >
          Back to List
        </Button>
      </XStack>

      <XStack gap="$6" flexWrap="wrap">
        {/* Left Column */}
        <YStack flex={2} minWidth={400} gap="$6">
          {/* Subject Information */}
          <Card padding="$4">
            <H3 marginBottom="$4">Subject Information</H3>
            <YStack gap="$3">
              <XStack justifyContent="space-between">
                <Text color="$gray11">Name</Text>
                <Text fontWeight="500" color="$gray12">
                  {request.user_name}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Email</Text>
                <Text fontWeight="500" color="$gray12">
                  {request.user_email}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">User ID</Text>
                <Text fontWeight="500" color="$gray12" fontSize="$2">
                  {request.user_id ?? 'N/A'}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Verification</Text>
                <Text fontWeight="500" color="$gray12">
                  {request.verification_method ?? 'Pending'}
                </Text>
              </XStack>
              {request.verified_at && (
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Verified At</Text>
                  <Text fontWeight="500" color="$gray12">
                    {formatDate(request.verified_at)}
                  </Text>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* SLA Information */}
          <Card padding="$4">
            <H3 marginBottom="$4">SLA Information</H3>
            <YStack gap="$3">
              <XStack justifyContent="space-between">
                <Text color="$gray11">Submitted</Text>
                <Text fontWeight="500" color="$gray12">
                  {formatDate(request.created_at)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Days Elapsed</Text>
                <Text fontWeight="500" color="$gray12">
                  {request.days_elapsed} days
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Original Deadline</Text>
                <Text fontWeight="500" color="$gray12">
                  {formatShortDate(request.original_deadline_at)}
                </Text>
              </XStack>
              {request.extended_deadline_at && (
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Extended Deadline</Text>
                  <Text fontWeight="500" color="$orange11">
                    {formatShortDate(request.extended_deadline_at)}
                  </Text>
                </XStack>
              )}
              <XStack justifyContent="space-between">
                <Text color="$gray11">Days Remaining</Text>
                <Text fontWeight="600" color={getSLAColor(request.days_remaining, request.status)}>
                  {['pending', 'in_progress'].includes(request.status)
                    ? request.is_overdue
                      ? `${Math.abs(request.days_remaining)} days overdue`
                      : `${request.days_remaining} days`
                    : 'Resolved'}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Priority</Text>
                <XStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor={PRIORITY_COLORS[request.priority]?.bg ?? '$gray2'}
                >
                  <Text
                    fontWeight="500"
                    color={PRIORITY_COLORS[request.priority]?.text ?? '$gray11'}
                  >
                    {request.priority.toUpperCase()}
                  </Text>
                </XStack>
              </XStack>
              {request.completed_at && (
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Completed</Text>
                  <Text fontWeight="500" color="$green11">
                    {formatDate(request.completed_at)}
                  </Text>
                </XStack>
              )}
              {request.denial_reason && (
                <YStack marginTop="$2" padding="$3" backgroundColor="$red2" borderRadius="$2">
                  <Text fontWeight="500" color="$red11" marginBottom="$1">
                    Denial Reason
                  </Text>
                  <Text color="$red10">{request.denial_reason}</Text>
                </YStack>
              )}
            </YStack>
          </Card>

          {/* Timeline */}
          <Card padding="$4">
            <H3 marginBottom="$4">Timeline</H3>
            {history.length === 0 ? (
              <Text color="$gray11">No timeline events yet.</Text>
            ) : (
              <YStack gap="$3">
                {history.map((event, index) => (
                  <XStack
                    key={event.id}
                    gap="$3"
                    paddingBottom="$3"
                    borderBottomWidth={index < history.length - 1 ? 1 : 0}
                    borderColor="$borderColor"
                  >
                    <YStack
                      width={12}
                      height={12}
                      borderRadius={6}
                      backgroundColor={STATUS_COLORS[event.status]?.bg ?? '$gray4'}
                      marginTop="$1"
                    />
                    <YStack flex={1}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="500" color="$gray12">
                          Status: {event.status}
                        </Text>
                        <Text fontSize="$2" color="$gray10">
                          {formatDate(event.changed_at)}
                        </Text>
                      </XStack>
                      {event.notes && (
                        <Text fontSize="$2" color="$gray11" marginTop="$1">
                          {event.notes}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </Card>
        </YStack>

        {/* Right Column */}
        <YStack flex={1} minWidth={300} gap="$6">
          {/* Actions */}
          <Card padding="$4">
            <H3 marginBottom="$4">Actions</H3>
            <YStack gap="$3">
              {request.status === 'pending' && (
                <Button
                  backgroundColor="$blue9"
                  color="white"
                  hoverStyle={{ backgroundColor: '$blue10' }}
                  onPress={handleApprove}
                  disabled={approveRequest.isPending}
                >
                  {approveRequest.isPending ? 'Processing...' : 'Start Processing'}
                </Button>
              )}
              {request.status === 'in_progress' && (
                <Button
                  backgroundColor="$green9"
                  color="white"
                  hoverStyle={{ backgroundColor: '$green10' }}
                  onPress={handleComplete}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? 'Completing...' : 'Mark as Completed'}
                </Button>
              )}
              {['pending', 'in_progress'].includes(request.status) && (
                <>
                  <Button
                    backgroundColor="$red3"
                    color="$red11"
                    hoverStyle={{ backgroundColor: '$red4' }}
                    onPress={() => setShowDenyModal(true)}
                  >
                    Deny Request
                  </Button>
                  <Button
                    backgroundColor="$gray3"
                    color="$gray11"
                    hoverStyle={{ backgroundColor: '$gray4' }}
                    onPress={handleCancel}
                    disabled={updateStatus.isPending}
                  >
                    Cancel Request
                  </Button>
                </>
              )}
              {['completed', 'denied', 'cancelled'].includes(request.status) && (
                <Text color="$gray11" textAlign="center" padding="$2">
                  This request has been resolved and no actions are available.
                </Text>
              )}
            </YStack>
          </Card>

          {/* Internal Notes */}
          <Card padding="$4">
            <H3 marginBottom="$4">Internal Notes</H3>
            <YStack gap="$3">
              {/* Existing notes */}
              {request.internal_notes.length > 0 ? (
                <YStack gap="$2" marginBottom="$3">
                  {request.internal_notes.map((note, index) => (
                    <YStack key={index} padding="$3" backgroundColor="$gray2" borderRadius="$2">
                      <Text fontSize="$2" color="$gray12">
                        {note.text}
                      </Text>
                      <Text fontSize="$1" color="$gray10" marginTop="$1">
                        {formatDate(note.created_at)}
                      </Text>
                    </YStack>
                  ))}
                </YStack>
              ) : (
                <Text color="$gray11" marginBottom="$3">
                  No internal notes yet.
                </Text>
              )}

              {/* Add note form */}
              <YStack gap="$2">
                <TextArea
                  placeholder="Add a note..."
                  value={newNote}
                  onChangeText={setNewNote}
                  rows={3}
                />
                <Button
                  backgroundColor="$blue9"
                  color="white"
                  hoverStyle={{ backgroundColor: '$blue10' }}
                  onPress={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                >
                  {addNote.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </XStack>

      {/* Deny Modal */}
      {showDenyModal && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Card padding="$6" maxWidth={500} width="90%">
            <H3 marginBottom="$4">Deny Request</H3>
            <Text color="$gray11" marginBottom="$4">
              Please provide a reason for denying this request. This will be recorded in the request
              history.
            </Text>
            <TextArea
              placeholder="Enter denial reason..."
              value={denyReason}
              onChangeText={setDenyReason}
              rows={4}
              marginBottom="$4"
            />
            <XStack gap="$3" justifyContent="flex-end">
              <Button
                backgroundColor="$gray3"
                color="$gray11"
                hoverStyle={{ backgroundColor: '$gray4' }}
                onPress={() => {
                  setShowDenyModal(false)
                  setDenyReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                backgroundColor="$red9"
                color="white"
                hoverStyle={{ backgroundColor: '$red10' }}
                onPress={handleDeny}
                disabled={!denyReason.trim() || updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Denying...' : 'Deny Request'}
              </Button>
            </XStack>
          </Card>
        </YStack>
      )}
    </YStack>
  )
}
