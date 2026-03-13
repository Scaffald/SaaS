import { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import { Text, Stack, Row, Card, Button, Input, H4, Spinner } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  useVerificationQueue,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
} from '@scf/core/utils/office-communities-sdk-hooks'
import type { PendingVerification } from '@scaffald/sdk/resources/office-communities'

export function OfficeCommunityVerificationScreen() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useVerificationQueue({ limit: 50 })
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const approveMutation = useApproveVerificationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office', 'communities', 'verification-queue'] })
    },
  })

  const rejectMutation = useRejectVerificationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office', 'communities', 'verification-queue'] })
      setRejectingId(null)
      setRejectReason('')
    },
  })

  const handleApprove = useCallback(
    async (membershipId: string) => {
      setProcessingIds((prev) => new Set(prev).add(membershipId))
      try {
        await approveMutation.mutateAsync(membershipId)
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(membershipId)
          return next
        })
      }
    },
    [approveMutation]
  )

  const handleReject = useCallback(
    async (membershipId: string) => {
      setProcessingIds((prev) => new Set(prev).add(membershipId))
      try {
        await rejectMutation.mutateAsync({ membershipId, reason: rejectReason || undefined })
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(membershipId)
          return next
        })
      }
    },
    [rejectMutation, rejectReason]
  )

  const queue = data?.data ?? []
  const total = data?.total ?? 0

  if (isLoading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading verification queue...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Text color="$red10">Failed to load verification queue</Text>
      </Stack>
    )
  }

  return (
    <ScrollView>
      <Stack gap={16} style={{ padding: 16 }}>
        <Row align="center" justify="space-between">
          <H4>Community Verification Queue</H4>
          <Stack
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: '#f3f4f6',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500' }}>{total} pending</Text>
          </Stack>
        </Row>

        {queue.length === 0 ? (
          <Card variant="outlined">
            <Stack align="center" style={{ padding: 32 }}>
              <Text color="$gray11">No pending verification requests</Text>
            </Stack>
          </Card>
        ) : (
          queue.map((item: PendingVerification) => (
            <VerificationCard
              key={item.membership_id}
              item={item}
              isProcessing={processingIds.has(item.membership_id)}
              isRejecting={rejectingId === item.membership_id}
              rejectReason={rejectingId === item.membership_id ? rejectReason : ''}
              onApprove={() => handleApprove(item.membership_id)}
              onStartReject={() => {
                setRejectingId(item.membership_id)
                setRejectReason('')
              }}
              onCancelReject={() => setRejectingId(null)}
              onConfirmReject={() => handleReject(item.membership_id)}
              onRejectReasonChange={setRejectReason}
            />
          ))
        )}
      </Stack>
    </ScrollView>
  )
}

function VerificationCard({
  item,
  isProcessing,
  isRejecting,
  rejectReason,
  onApprove,
  onStartReject,
  onCancelReject,
  onConfirmReject,
  onRejectReasonChange,
}: {
  item: PendingVerification
  isProcessing: boolean
  isRejecting: boolean
  rejectReason: string
  onApprove: () => void
  onStartReject: () => void
  onCancelReject: () => void
  onConfirmReject: () => void
  onRejectReasonChange: (val: string) => void
}) {
  const vd = item.verification_data

  return (
    <Card variant="outlined">
      <Stack gap={12} style={{ padding: 16 }}>
        {/* Header */}
        <Row align="center" justify="space-between">
          <Stack gap={2}>
            <Text style={{ fontWeight: '600', fontSize: 15 }}>
              {item.display_name || 'Unknown User'}
            </Text>
            {item.email && (
              <Text color="$gray11" style={{ fontSize: 12 }}>
                {item.email}
              </Text>
            )}
          </Stack>
          <Stack
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: '#dbeafe',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500' }}>{item.community_name}</Text>
          </Stack>
        </Row>

        {/* Verification Data */}
        <Stack
          gap={8}
          style={{
            padding: 12,
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: '500', fontSize: 13 }}>License Information</Text>
          <Row gap={24}>
            <Stack gap={2}>
              <Text color="$gray11" style={{ fontSize: 11 }}>
                State
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{vd?.state || 'N/A'}</Text>
            </Stack>
            <Stack gap={2}>
              <Text color="$gray11" style={{ fontSize: 11 }}>
                License #
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{vd?.license_number || 'N/A'}</Text>
            </Stack>
            <Stack gap={2}>
              <Text color="$gray11" style={{ fontSize: 11 }}>
                Type
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{vd?.license_type || 'N/A'}</Text>
            </Stack>
          </Row>
          <Text color="$gray11" style={{ fontSize: 11 }}>
            Submitted: {vd?.submitted_at ? new Date(vd.submitted_at).toLocaleDateString() : 'N/A'}
          </Text>
        </Stack>

        <Text color="$gray11" style={{ fontSize: 11 }}>
          Joined: {new Date(item.joined_at).toLocaleDateString()}
        </Text>

        {/* Reject form */}
        {isRejecting && (
          <Stack gap={8}>
            <Input
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChangeText={onRejectReasonChange}
            />
            <Row gap={8}>
              <Button
                variant="filled"
                color="error"
                size="sm"
                onPress={onConfirmReject}
                disabled={isProcessing}
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
              <Button variant="outline" size="sm" onPress={onCancelReject}>
                Cancel
              </Button>
            </Row>
          </Stack>
        )}

        {/* Action buttons */}
        {!isRejecting && (
          <Row gap={8} justify="flex-end">
            <Button
              variant="outline"
              color="error"
              size="sm"
              onPress={onStartReject}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button
              variant="filled"
              color="primary"
              size="sm"
              onPress={onApprove}
              disabled={isProcessing}
            >
              {isProcessing ? 'Approving...' : 'Approve'}
            </Button>
          </Row>
        )}
      </Stack>
    </Card>
  )
}
