import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { DashboardWidget } from '@scaffald/ui'
import { AlertTriangle, Eye, RefreshCcw } from 'lucide-react-native'
import { memo, useMemo } from 'react'
import { Button, Progress, Text, Row, Stack } from '@scaffald/ui'

import {
  type BackgroundCheckSummary,
  daysUntilExpiration,
  getStatusMetadata,
  getStatusProgress,
  getStatusToneColors,
  hasExpired,
  isRenewalEligible,
  shouldShowExpirationWarning,
} from './status.utils'

interface CheckStatusCardProps {
  check: BackgroundCheckSummary
  onViewDetails: (check: BackgroundCheckSummary) => void
  onRenew: (check: BackgroundCheckSummary) => void
  onDispute?: (check: BackgroundCheckSummary) => void
}

export const CheckStatusCard = memo(function CheckStatusCard({
  check,
  onViewDetails,
  onRenew,
  onDispute,
}: CheckStatusCardProps) {
  const statusMeta = getStatusMetadata(check.status)
  const statusColors = getStatusToneColors(statusMeta.tone)
  const progress = getStatusProgress(check.status)
  const expirationWarning = shouldShowExpirationWarning(check.expires_at)
  const expired = hasExpired(check.expires_at)
  const daysRemaining = daysUntilExpiration(check.expires_at)

  const estimatedCompletion = useMemo(() => {
    if (!check.metadata || typeof check.metadata !== 'object') return null
    if ('estimated_completion_date' in check.metadata) {
      const raw = (check.metadata as Record<string, unknown>).estimated_completion_date
      return typeof raw === 'string' ? raw : null
    }
    return null
  }, [check.metadata])

  const packageLabel =
    check.package?.display_name ??
    check.package?.slug?.replace(/-/g, ' ').toUpperCase() ??
    'Background Check'

  const renewalEligible = isRenewalEligible(check.status, check.expires_at)

  return (
    <DashboardWidget>
      <Stack gap={16}>
        <Row justify="space-between" align="flex-start" gap={16} flexWrap="wrap">
          <Stack gap={4} flex={1}>
            <Text color="$gray11">{packageLabel}</Text>
            <Text color="$gray11">Started {formatDate(check.created_at)}</Text>
            {estimatedCompletion && (
              <Text color="$gray11">Est. completion {formatDate(estimatedCompletion)}</Text>
            )}
          </Stack>

          <Stack gap={8} align="flex-end">
            <Row
              paddingHorizontal={12}
              paddingVertical={4}
              backgroundColor={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              borderRadius={12}
              align="center"
              gap={8}
            >
              <Text color={statusColors.text}>{statusMeta.label}</Text>
            </Row>
            {check.expires_at && (
              <Row align="center" gap={8}>
                {expirationWarning && <AlertTriangle size="md" color="$yellow10" />}
                <Text color={expirationWarning ? '$yellow10' : '$color10'}>
                  {expired
                    ? `Expired ${formatDate(check.expires_at)}`
                    : `Expires ${formatDate(check.expires_at)}${
                        daysRemaining !== null && daysRemaining >= 0
                          ? ` (${daysRemaining} days)`
                          : ''
                      }`}
                </Text>
              </Row>
            )}
          </Stack>
        </Row>

        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text color="$gray11">Progress</Text>
            <Text color="$gray11">{progress}%</Text>
          </Row>
          <Progress value={progress} max={100} backgroundColor="$color3" size={4}>
            <Progress.Indicator animation="bouncy" backgroundColor={statusColors.border} />
          </Progress>
          <Text color="$gray11">{statusMeta.description}</Text>
        </Stack>

        <Row gap={8} flexWrap="wrap">
          <Button
            size="sm"
            iconStart={Eye}
            onPress={() => onViewDetails(check)}
            accessibilityLabel="View background check details"
          >
            View details
          </Button>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
            onPress={() => onRenew(check)}
            disabled={!renewalEligible}
          >
            Renew
          </Button>
          {onDispute && (
            <Button size="sm" variant="outline" theme="warning" onPress={() => onDispute(check)}>
              Dispute
            </Button>
          )}
        </Row>
      </Stack>
    </DashboardWidget>
  )
})
