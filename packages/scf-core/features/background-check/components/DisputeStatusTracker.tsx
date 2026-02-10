import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { RefreshCcw } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import {
  Button,
  Card,
  type ColorTokens,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

import type { BackgroundCheckDispute } from '../hooks/useDispute'

interface DisputeStatusTrackerProps {
  disputes: BackgroundCheckDispute[]
  isLoading: boolean
  onRefresh?: () => void
}

type DisputeStatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

const STATUS_METADATA: Record<
  NonNullable<BackgroundCheckDispute['status']>,
  { label: string; description: string; tone: DisputeStatusTone }
> = {
  pending: {
    label: 'Waiting for review',
    description: 'Our compliance team received your dispute and will begin review shortly.',
    tone: 'info',
  },
  under_review: {
    label: 'Under review',
    description: 'Compliance is actively reviewing your dispute.',
    tone: 'warning',
  },
  resolved: {
    label: 'Resolved',
    description: 'The dispute has been resolved and any updates are reflected in your results.',
    tone: 'success',
  },
  upheld: {
    label: 'Upheld',
    description: 'The original findings were confirmed after review.',
    tone: 'neutral',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This dispute was cancelled. You can file a new one if needed.',
    tone: 'neutral',
  },
}

const TONE_COLORS: Record<
  DisputeStatusTone,
  { background: ColorTokens; border: ColorTokens; text: ColorTokens }
> = {
  info: { background: '$blue3', border: '$blue7', text: '$blue11' },
  warning: { background: '$yellow3', border: '$yellow8', text: '$yellow11' },
  success: { background: '$green3', border: '$green8', text: '$green11' },
  danger: { background: '$red3', border: '$red8', text: '$red11' },
  neutral: { background: '$color3', border: '$color6', text: '$color11' },
}

function getStatusMetadata(status: BackgroundCheckDispute['status']) {
  if (!status) {
    return {
      label: 'Unknown status',
      description: 'We could not determine the current status of this dispute.',
      tone: 'neutral' as const,
    }
  }
  return (
    STATUS_METADATA[status] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
      description: 'Status information coming soon.',
      tone: 'neutral' as const,
    }
  )
}

export function DisputeStatusTracker({
  disputes,
  isLoading,
  onRefresh,
}: DisputeStatusTrackerProps) {
  const latestDispute = disputes.length > 0 ? disputes[0] : null

  const pendingCount = useMemo(
    () =>
      disputes.filter(
        (dispute) => dispute.status === 'pending' || dispute.status === 'under_review'
      ).length,
    [disputes]
  )

  if (isLoading) {
    return (
      <Stack gap="$2" alignItems="center" paddingVertical="$4">
        <Spinner size="small" color="$color10" />
        <Text fontSize="$2" color="$color10">
          Loading dispute history…
        </Text>
      </Stack>
    )
  }

  if (!latestDispute) {
    return (
      <Card
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
        padding="$3"
        gap="$2"
      >
        <Text fontSize="$3" fontWeight="600" color="$color12">
          No disputes filed yet
        </Text>
        <Text fontSize="$2" color="$color10">
          If you notice any inaccuracies in your results, you can submit a dispute for review.
        </Text>
      </Card>
    )
  }

  const statusMeta = getStatusMetadata(latestDispute.status)
  const toneColors = TONE_COLORS[statusMeta.tone]

  return (
    <Stack gap="$3">
      <Row justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Dispute status
        </Text>
        <Button
          size="$2"
          variant="outlined"
          icon={RefreshCcw}
          onPress={onRefresh}
          disabled={!onRefresh}
        >
          Refresh
        </Button>
      </Row>

      <Stack
        gap="$2"
        padding="$3"
        backgroundColor={toneColors.background}
        borderColor={toneColors.border}
        borderWidth={1}
        borderRadius="$4"
      >
        <Text fontSize="$3" fontWeight="600" color={toneColors.text}>
          {statusMeta.label}
        </Text>
        <Text fontSize="$2" color={toneColors.text}>
          {statusMeta.description}
        </Text>
        <Text fontSize="$2" color={toneColors.text}>
          Filed {formatDate(latestDispute.created_at)}
          {latestDispute.resolved_at ? ` • Resolved ${formatDate(latestDispute.resolved_at)}` : ''}
        </Text>
        <Text fontSize="$2" color={toneColors.text}>
          Reason: {latestDispute.dispute_reason}
        </Text>
      </Stack>

      <Card
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
        padding="$3"
        gap="$3"
      >
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Dispute history
        </Text>

        {pendingCount > 0 ? (
          <Text fontSize="$2" color="$color10">
            {pendingCount} dispute{pendingCount === 1 ? '' : 's'} currently awaiting review.
          </Text>
        ) : null}

        <Separator />

        <Stack gap="$2">
          {disputes.map((dispute) => {
            const meta = getStatusMetadata(dispute.status)
            const colors = TONE_COLORS[meta.tone]
            return (
              <Stack
                key={dispute.id}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
                gap="$1"
              >
                <Row gap="$2" alignItems="center" flexWrap="wrap">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    {meta.label}
                  </Text>
                  <Text fontSize="$2" color={colors.text}>
                    {formatDate(dispute.created_at)}
                    {dispute.resolved_at ? ` • ${formatDate(dispute.resolved_at)}` : ''}
                  </Text>
                </Row>
                <Text fontSize="$2" color="$color10">
                  Reason: {dispute.dispute_reason}
                </Text>
                <Text fontSize="$2" color="$color10">
                  {dispute.dispute_details}
                </Text>
                {dispute.resolution ? (
                  <Text fontSize="$2" color="$color10">
                    Resolution: {dispute.resolution}
                    {dispute.resolution_notes ? ` — ${dispute.resolution_notes}` : ''}
                  </Text>
                ) : null}
              </Stack>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}
