import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Input,
  Lane,
  ListToolbar,
  ScreenHeader,
  Spinner,
  Stack,
  Row,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  useVerificationQueue,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
} from '@scf/core/utils/office-communities-sdk-hooks'
import type { PendingVerification } from '@scaffald/sdk/resources/office-communities'

/**
 * The community verification queue (#839).
 *
 * This was a column of bordered cards, each repeating a "License Information"
 * sub-panel on its own tinted ground — a box inside a box inside a scroll
 * view, with the two decisions at the bottom right of each. Ten pending
 * requests were ten uneven blocks you could not scan.
 *
 * Rows on hairlines instead, the same `Lane` the pipeline and the employer's
 * job list use: how long they have waited leads, because that is the number
 * that says act; the licence details sit in columns; Approve and Reject are
 * the row's actions rather than the end of a card.
 */
export function OfficeCommunityVerificationScreen() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useVerificationQueue({ limit: 50 })
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [search, setSearch] = useState('')

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

  const queue = useMemo(() => data?.data ?? [], [data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return queue
    return queue.filter((item: PendingVerification) =>
      [item.display_name, item.email, item.community_name, item.verification_data?.license_number]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    )
  }, [queue, search])

  if (isLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ minHeight: 300 }}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Loading the verification queue…</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack align="center" justify="center" gap={8} style={{ minHeight: 300 }}>
        <Text style={{ color: colors.fg[t].error }}>We couldn't load the verification queue.</Text>
        <Text style={{ color: colors.text[t].secondary }}>Please try again.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Screening"
        title="Community verification"
        tip="Each person here is waiting to be let into a trade community. Approving confirms their licence; rejecting asks them for more."
      />

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, community or licence number…"
        onClearAll={search ? () => setSearch('') : undefined}
        resultCount={visible.length}
        resultNoun="request"
      />

      {visible.length === 0 ? (
        <Stack align="center" gap={8} paddingVertical={48}>
          <Text style={{ color: colors.text[t].secondary }}>
            {queue.length === 0 ? 'Nothing is waiting to be verified.' : 'No request matches that.'}
          </Text>
          {queue.length > 0 ? (
            <Button size="sm" variant="outline" onPress={() => setSearch('')}>
              Clear the search
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Stack gap={0}>
          {visible.map((item: PendingVerification) => (
            <VerificationRow
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
          ))}
        </Stack>
      )}
    </Stack>
  )
}

/** Whole days since they joined — how long this decision has been outstanding. */
function daysWaiting(joinedAt: string, now = new Date()): number | null {
  const joined = new Date(joinedAt)
  if (Number.isNaN(joined.getTime())) return null
  const days = Math.floor((now.getTime() - joined.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}

function VerificationRow({
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const vd = item.verification_data
  const waited = daysWaiting(item.joined_at)

  const licence = [vd?.license_type, vd?.license_number].filter(Boolean).join(' · ')

  return (
    <Stack>
      <Lane
        age={waited != null ? `${waited}d` : undefined}
        ageLabel="waiting"
        // A week without an answer is long enough to be worth flagging.
        overdue={(waited ?? 0) >= 7}
        title={item.display_name || 'Unknown user'}
        subtitle={[item.email, item.community_name].filter(Boolean).join(' · ') || undefined}
        columns={[
          <Stack key="licence" gap={2} style={LICENCE_CELL}>
            <Text style={{ color: colors.text[t].secondary }}>{licence || 'No licence given'}</Text>
            {vd?.state ? <Text style={{ color: colors.text[t].tertiary }}>{vd.state}</Text> : null}
          </Stack>,
        ]}
        actions={
          isRejecting ? undefined : (
            <Row gap={8}>
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
                variant="outline"
                color="primary"
                size="sm"
                onPress={onApprove}
                disabled={isProcessing}
              >
                {isProcessing ? 'Approving…' : 'Approve'}
              </Button>
            </Row>
          )
        }
      />

      {/*
        Rejecting opens under the row it belongs to rather than replacing the
        row's actions in place, so the person being rejected stays on screen
        while the reason is written.
      */}
      {isRejecting ? (
        <Stack
          gap={8}
          paddingVertical={12}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
        >
          <Text style={{ color: colors.text[t].secondary }}>
            Why is {item.display_name || 'this person'} being rejected? They will see this.
          </Text>
          <Input
            placeholder="Reason (optional)"
            value={rejectReason}
            onChangeText={onRejectReasonChange}
          />
          <Row gap={8}>
            <Button
              variant="outline"
              color="error"
              size="sm"
              onPress={onConfirmReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
            <Button variant="outline" size="sm" onPress={onCancelReject} disabled={isProcessing}>
              Cancel
            </Button>
          </Row>
        </Stack>
      ) : null}
    </Stack>
  )
}

/** Fixed so the licence column lines up down the list rather than per-row. */
const LICENCE_CELL = { width: 200 } as const
