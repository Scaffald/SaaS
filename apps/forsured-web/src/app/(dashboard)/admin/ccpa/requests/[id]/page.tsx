/**
 * CCPA Admin Request Detail Page
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
  Stack,
  Row,
  Text,
  Button,
  Card,
  Heading,
  Spinner,
  Modal,
  colors,
  spacing,
} from '@unicornlove/beyond-ui'
import Textarea from '../../../../../../components/Common/Textarea'
import { useRouter, useParams } from 'next/navigation'
import { trpc } from '../../../../../../lib/trpc'

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
    if (!['pending', 'in_progress'].includes(status)) return colors.text.light.secondary
    if (daysRemaining < 0) return colors.error[600]
    if (daysRemaining <= 7) return colors.error[600]
    if (daysRemaining <= 14) return colors.warning[600]
    return colors.success[600]
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
      <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading request details...
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Error state
  if (error || !request) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
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
            Error loading request
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error?.message || 'Request not found'}
          </Text>
          <Row gap={spacing[8]} style={{ marginTop: spacing[12] }}>
            <Button
              size="sm"
              color="error"
              variant="filled"
              onPress={() => refetch()}
            >
              Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="gray"
              onPress={() => router.push('/admin/ccpa/requests')}
            >
              Back to List
            </Button>
          </Row>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Row alignItems="center" gap={spacing[12]} style={{ marginBottom: spacing[8] }}>
            <Heading level={2}>{TYPE_LABELS[request.type] ?? request.type} Request</Heading>
            <Row
              style={{
                paddingHorizontal: spacing[12],
                paddingVertical: spacing[4],
                borderRadius: 8,
                backgroundColor: STATUS_COLORS[request.status]?.bg ?? colors.gray[100],
              }}
            >
              <Text weight="semibold" color={STATUS_COLORS[request.status]?.text ?? colors.text.light.secondary}>
                {request.status === 'in_progress' ? 'Processing' : request.status.toUpperCase()}
              </Text>
            </Row>
            {request.is_overdue && (
              <Row
                style={{
                  paddingHorizontal: spacing[12],
                  paddingVertical: spacing[4],
                  backgroundColor: colors.error[500],
                  borderRadius: 8,
                }}
              >
                <Text weight="semibold" color="white">
                  OVERDUE
                </Text>
              </Row>
            )}
          </Row>
          <Text color={colors.text.light.secondary}>Request ID: {request.id}</Text>
        </Stack>
        <Button
          variant="outline"
          color="gray"
          onPress={() => router.push('/admin/ccpa/requests')}
        >
          Back to List
        </Button>
      </Row>

      <Row gap={spacing[24]} style={{ flexWrap: 'wrap' }}>
        {/* Left Column */}
        <Stack style={{ flex: 2, minWidth: 400 }} gap={spacing[24]}>
          {/* Subject Information */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Subject Information</Heading>
            <Stack gap={spacing[12]}>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Name</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {request.user_name}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Email</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {request.user_email}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>User ID</Text>
                <Text weight="medium" color={colors.text.light.primary} size="xs">
                  {request.user_id ?? 'N/A'}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Verification</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {request.verification_method ?? 'Pending'}
                </Text>
              </Row>
              {request.verified_at && (
                <Row justifyContent="space-between">
                  <Text color={colors.text.light.secondary}>Verified At</Text>
                  <Text weight="medium" color={colors.text.light.primary}>
                    {formatDate(request.verified_at)}
                  </Text>
                </Row>
              )}
            </Stack>
          </Card>

          {/* SLA Information */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>SLA Information</Heading>
            <Stack gap={spacing[12]}>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Submitted</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {formatDate(request.created_at)}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Days Elapsed</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {request.days_elapsed} days
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Original Deadline</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {formatShortDate(request.original_deadline_at)}
                </Text>
              </Row>
              {request.extended_deadline_at && (
                <Row justifyContent="space-between">
                  <Text color={colors.text.light.secondary}>Extended Deadline</Text>
                  <Text weight="medium" color={colors.warning[600]}>
                    {formatShortDate(request.extended_deadline_at)}
                  </Text>
                </Row>
              )}
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Days Remaining</Text>
                <Text weight="semibold" color={getSLAColor(request.days_remaining, request.status)}>
                  {['pending', 'in_progress'].includes(request.status)
                    ? request.is_overdue
                      ? `${Math.abs(request.days_remaining)} days overdue`
                      : `${request.days_remaining} days`
                    : 'Resolved'}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Priority</Text>
                <Row
                  style={{
                    paddingHorizontal: spacing[8],
                    paddingVertical: spacing[4],
                    borderRadius: 8,
                    backgroundColor: PRIORITY_COLORS[request.priority]?.bg ?? colors.gray[100],
                  }}
                >
                  <Text
                    weight="medium"
                    color={PRIORITY_COLORS[request.priority]?.text ?? colors.text.light.secondary}
                  >
                    {request.priority.toUpperCase()}
                  </Text>
                </Row>
              </Row>
              {request.completed_at && (
                <Row justifyContent="space-between">
                  <Text color={colors.text.light.secondary}>Completed</Text>
                  <Text weight="medium" color={colors.success[600]}>
                    {formatDate(request.completed_at)}
                  </Text>
                </Row>
              )}
              {request.denial_reason && (
                <Stack style={{ marginTop: spacing[8], padding: spacing[12], backgroundColor: colors.error[200], borderRadius: 8 }}>
                  <Text weight="medium" color={colors.error[600]} style={{ marginBottom: spacing[4] }}>
                    Denial Reason
                  </Text>
                  <Text color={colors.error[500]}>{request.denial_reason}</Text>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Timeline */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Timeline</Heading>
            {history.length === 0 ? (
              <Text color={colors.text.light.secondary}>No timeline events yet.</Text>
            ) : (
              <Stack gap={spacing[12]}>
                {history.map((event, index) => (
                  <Row
                    key={event.id}
                    gap={spacing[12]}
                    style={{
                      paddingBottom: spacing[12],
                      borderBottomWidth: index < history.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border.light.default,
                    }}
                  >
                    <Stack
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: STATUS_COLORS[event.status]?.bg ?? colors.gray[200],
                        marginTop: spacing[4],
                      }}
                    />
                    <Stack style={{ flex: 1 }}>
                      <Row justifyContent="space-between" alignItems="center">
                        <Text weight="medium" color={colors.text.light.primary}>
                          Status: {event.status}
                        </Text>
                        <Text size="xs" color={colors.text.light.tertiary}>
                          {formatDate(event.changed_at)}
                        </Text>
                      </Row>
                      {event.notes && (
                        <Text size="xs" color={colors.text.light.secondary} style={{ marginTop: spacing[4] }}>
                          {event.notes}
                        </Text>
                      )}
                    </Stack>
                  </Row>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>

        {/* Right Column */}
        <Stack style={{ flex: 1, minWidth: 300 }} gap={spacing[24]}>
          {/* Actions */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Actions</Heading>
            <Stack gap={spacing[12]}>
              {request.status === 'pending' && (
                <Button
                  color="primary"
                  variant="filled"
                  onPress={handleApprove}
                  disabled={approveRequest.isPending}
                  loading={approveRequest.isPending}
                >
                  {approveRequest.isPending ? 'Processing...' : 'Start Processing'}
                </Button>
              )}
              {request.status === 'in_progress' && (
                <Button
                  color="success"
                  variant="filled"
                  onPress={handleComplete}
                  disabled={updateStatus.isPending}
                  loading={updateStatus.isPending}
                >
                  {updateStatus.isPending ? 'Completing...' : 'Mark as Completed'}
                </Button>
              )}
              {['pending', 'in_progress'].includes(request.status) && (
                <>
                  <Button
                    variant="outline"
                    color="error"
                    onPress={() => setShowDenyModal(true)}
                  >
                    Deny Request
                  </Button>
                  <Button
                    variant="outline"
                    color="gray"
                    onPress={handleCancel}
                    disabled={updateStatus.isPending}
                  >
                    Cancel Request
                  </Button>
                </>
              )}
              {['completed', 'denied', 'cancelled'].includes(request.status) && (
                <Text color={colors.text.light.secondary} style={{ textAlign: 'center', padding: spacing[8] }}>
                  This request has been resolved and no actions are available.
                </Text>
              )}
            </Stack>
          </Card>

          {/* Internal Notes */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Internal Notes</Heading>
            <Stack gap={spacing[12]}>
              {/* Existing notes */}
              {request.internal_notes.length > 0 ? (
                <Stack gap={spacing[8]} style={{ marginBottom: spacing[12] }}>
                  {request.internal_notes.map((note, index) => (
                    <Stack key={index} style={{ padding: spacing[12], backgroundColor: colors.gray[100], borderRadius: 8 }}>
                      <Text size="xs" color={colors.text.light.primary}>
                        {note.text}
                      </Text>
                      <Text size="xs" color={colors.text.light.tertiary} style={{ marginTop: spacing[4] }}>
                        {formatDate(note.created_at)}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[12] }}>
                  No internal notes yet.
                </Text>
              )}

              {/* Add note form */}
              <Stack gap={spacing[8]}>
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  color="primary"
                  variant="filled"
                  onPress={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                  loading={addNote.isPending}
                >
                  {addNote.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Row>

      {/* Deny Modal */}
      <Modal open={showDenyModal} onOpenChange={setShowDenyModal}>
        <Modal.Header>
          <Heading level={3}>Deny Request</Heading>
        </Modal.Header>
        <Modal.Content>
          <Stack gap={spacing[16]}>
            <Text color={colors.text.light.secondary}>
              Please provide a reason for denying this request. This will be recorded in the request
              history.
            </Text>
            <Textarea
              placeholder="Enter denial reason..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              rows={4}
            />
          </Stack>
        </Modal.Content>
        <Modal.Footer>
          <Row gap={spacing[12]} justifyContent="flex-end">
            <Button
              variant="outline"
              color="gray"
              onPress={() => {
                setShowDenyModal(false)
                setDenyReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="filled"
              onPress={handleDeny}
              disabled={!denyReason.trim() || updateStatus.isPending}
              loading={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Denying...' : 'Deny Request'}
            </Button>
          </Row>
        </Modal.Footer>
      </Modal>
    </Stack>
  )
}
