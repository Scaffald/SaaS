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
  useThemeContext,
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

type ToneColors = { background: string; border: string; text: string }

// One step per tone, read per theme: the light steps (50/400/700) sat the
// tone's text at 2:1 on a dark page.
const toneColors = (tone: DisputeStatusTone, theme: 'light' | 'dark'): ToneColors => {
  const dark = theme === 'dark'
  const ramp = (scale: Record<number, string>): ToneColors => ({
    background: dark ? scale[900] : scale[50],
    border: dark ? scale[700] : scale[400],
    text: dark ? scale[300] : scale[700],
  })
  switch (tone) {
    case 'info':
      return ramp(colors.info)
    case 'warning':
      return ramp(colors.warning)
    case 'success':
      return ramp(colors.success)
    case 'danger':
      return ramp(colors.error)
    default:
      return {
        background: colors.bg[theme].muted,
        border: colors.border[theme].default,
        text: colors.text[theme].secondary,
      }
  }
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

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
        <Spinner variant="ios" size="sm" color="gray" />
        <Text color={colors.text[t].secondary}>Loading dispute history…</Text>
      </Stack>
    )
  }

  if (!latestDispute) {
    return (
      <Card
        backgroundColor={colors.bg[t].muted}
        borderColor={colors.border[t].default}
        borderWidth={1}
        radius="lg"
        padding="sm"
        style={{ gap: 8 }}
      >
        <Text color={colors.text[t].secondary}>No disputes filed yet</Text>
        <Text color={colors.text[t].secondary}>
          If you notice any inaccuracies in your results, you can submit a dispute for review.
        </Text>
      </Card>
    )
  }

  const statusMeta = getStatusMetadata(latestDispute.status)
  const tone = toneColors(statusMeta.tone, t)

  return (
    <Stack gap={12}>
      <Row justify="space-between" align="center">
        <Text color={colors.text[t].secondary}>Dispute status</Text>
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
        backgroundColor={tone.background}
        borderColor={tone.border}
        borderWidth={1}
        borderRadius={16}
      >
        <Text color={tone.text}>{statusMeta.label}</Text>
        <Text color={tone.text}>{statusMeta.description}</Text>
        <Text color={tone.text}>
          Filed {formatDate(latestDispute.created_at)}
          {latestDispute.resolved_at ? ` • Resolved ${formatDate(latestDispute.resolved_at)}` : ''}
        </Text>
        <Text color={tone.text}>Reason: {latestDispute.dispute_reason}</Text>
      </Stack>

      <Card
        backgroundColor={colors.bg[t].muted}
        borderColor={colors.border[t].default}
        borderWidth={1}
        radius="lg"
        padding="sm"
        style={{ gap: 12 }}
      >
        <Text color={colors.text[t].secondary}>Dispute history</Text>

        {pendingCount > 0 ? (
          <Text color={colors.text[t].secondary}>
            {pendingCount} dispute{pendingCount === 1 ? '' : 's'} currently awaiting review.
          </Text>
        ) : null}

        <Separator />

        <Stack gap={8}>
          {disputes.map((dispute) => {
            const meta = getStatusMetadata(dispute.status)
            const tone = toneColors(meta.tone, t)
            return (
              <Stack
                key={dispute.id}
                backgroundColor={colors.bg[t].default}
                borderColor={colors.border[t].default}
                borderWidth={1}
                borderRadius={12}
                paddingHorizontal={12}
                paddingVertical={8}
                gap={4}
              >
                <Row gap={8} align="center" wrap>
                  <Text color={colors.text[t].secondary}>{meta.label}</Text>
                  <Text color={tone.text}>
                    {formatDate(dispute.created_at)}
                    {dispute.resolved_at ? ` • ${formatDate(dispute.resolved_at)}` : ''}
                  </Text>
                </Row>
                <Text color={colors.text[t].secondary}>Reason: {dispute.dispute_reason}</Text>
                <Text color={colors.text[t].secondary}>{dispute.dispute_details}</Text>
                {dispute.resolution ? (
                  <Text color={colors.text[t].secondary}>
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
