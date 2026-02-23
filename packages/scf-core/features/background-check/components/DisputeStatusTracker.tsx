import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { RefreshCcw } from 'lucide-react-native'
import { useMemo } from 'react'
import {
  Button,
  Card,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  colors,
} from '@scaffald/ui'

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
  rejected: {
    label: 'Rejected',
    description: 'The original findings were confirmed after review.',
    tone: 'neutral',
  },
}

const TONE_COLORS: Record<
  DisputeStatusTone,
  { background: string; border: string; text: string }
> = {
  info: { background: colors.info[50], border: colors.info[400], text: colors.info[700] },
  warning: { background: colors.warning[50], border: colors.warning[400], text: colors.warning[700] },
  success: { background: colors.success[50], border: colors.success[400], text: colors.success[700] },
  danger: { background: colors.error[50], border: colors.error[400], text: colors.error[700] },
  neutral: { background: colors.gray[100], border: colors.gray[300], text: colors.gray[700] },
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
      <Stack gap={8} align="center" paddingVertical={16}>
        <Spinner size="sm" color="gray" />
        <Text color="$gray11">Loading dispute history…</Text>
      </Stack>
    )
  }

  if (!latestDispute) {
    return (
      <Card
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        radius="lg"
        padding="sm"
        style={{ gap: 8 }}
      >
        <Text color="$gray11">No disputes filed yet</Text>
        <Text color="$gray11">
          If you notice any inaccuracies in your results, you can submit a dispute for review.
        </Text>
      </Card>
    )
  }

  const statusMeta = getStatusMetadata(latestDispute.status)
  const toneColors = TONE_COLORS[statusMeta.tone]

  return (
    <Stack gap={12}>
      <Row justify="space-between" align="center">
        <Text color="$gray11">Dispute status</Text>
        <Button
          size="sm"
          variant="outline"
          iconStart={RefreshCcw}
          onPress={onRefresh}
          disabled={!onRefresh}
        >
          Refresh
        </Button>
      </Row>

      <Stack
        gap={8}
        padding="sm"
        backgroundColor={toneColors.background}
        borderColor={toneColors.border}
        borderWidth={1}
        borderRadius={16}
      >
        <Text color={toneColors.text}>{statusMeta.label}</Text>
        <Text color={toneColors.text}>{statusMeta.description}</Text>
        <Text color={toneColors.text}>
          Filed {formatDate(latestDispute.created_at)}
          {latestDispute.resolved_at ? ` • Resolved ${formatDate(latestDispute.resolved_at)}` : ''}
        </Text>
        <Text color={toneColors.text}>Reason: {latestDispute.dispute_reason}</Text>
      </Stack>

      <Card
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        radius="lg"
        padding="sm"
        style={{ gap: 12 }}
      >
        <Text color="$gray11">Dispute history</Text>

        {pendingCount > 0 ? (
          <Text color="$gray11">
            {pendingCount} dispute{pendingCount === 1 ? '' : 's'} currently awaiting review.
          </Text>
        ) : null}

        <Separator />

        <Stack gap={8}>
          {disputes.map((dispute) => {
            const meta = getStatusMetadata(dispute.status)
            const toneColors = TONE_COLORS[meta.tone]
            return (
              <Stack
                key={dispute.id}
                backgroundColor="$background"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
                paddingHorizontal={12}
                paddingVertical={8}
                gap={4}
              >
                <Row gap={8} align="center" wrap>
                  <Text color="$gray11">{meta.label}</Text>
                  <Text color={toneColors.text}>
                    {formatDate(dispute.created_at)}
                    {dispute.resolved_at ? ` • ${formatDate(dispute.resolved_at)}` : ''}
                  </Text>
                </Row>
                <Text color="$gray11">Reason: {dispute.dispute_reason}</Text>
                <Text color="$gray11">{dispute.dispute_details}</Text>
                {dispute.resolution ? (
                  <Text color="$gray11">
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
