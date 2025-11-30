import { formatDate } from '@app/core/features/profile/utils/date-formatting'
import { DashboardWidget } from '@scaffald/tamagui-ui'
import { AlertTriangle, Eye, RefreshCcw } from '@tamagui/lucide-icons'
import { memo, useMemo } from 'react'
import { Button, Progress, Text, XStack, YStack } from 'tamagui'

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
      <YStack gap="$4">
        <XStack justify="space-between" items="flex-start" gap="$4" flexWrap="wrap">
          <YStack gap="$1" flex={1}>
            <Text fontSize="$5" fontWeight="600" color="$color12">
              {packageLabel}
            </Text>
            <Text fontSize="$2" color="$color10">
              Started {formatDate(check.created_at)}
            </Text>
            {estimatedCompletion && (
              <Text fontSize="$2" color="$color10">
                Est. completion {formatDate(estimatedCompletion)}
              </Text>
            )}
          </YStack>

          <YStack gap="$2" items="flex-end">
            <XStack
              px="$3"
              py="$1"
              bg={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              rounded="$3"
              items="center"
              gap="$2"
            >
              <Text fontSize="$2" fontWeight="600" color={statusColors.text}>
                {statusMeta.label}
              </Text>
            </XStack>
            {check.expires_at && (
              <XStack items="center" gap="$2">
                {expirationWarning && <AlertTriangle size={14} color="$yellow10" />}
                <Text fontSize="$2" color={expirationWarning ? '$yellow10' : '$color10'}>
                  {expired
                    ? `Expired ${formatDate(check.expires_at)}`
                    : `Expires ${formatDate(check.expires_at)}${
                        daysRemaining !== null && daysRemaining >= 0
                          ? ` (${daysRemaining} days)`
                          : ''
                      }`}
                </Text>
              </XStack>
            )}
          </YStack>
        </XStack>

        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <Text fontSize="$3" fontWeight="500" color="$color12">
              Progress
            </Text>
            <Text fontSize="$2" color="$color10">
              {progress}%
            </Text>
          </XStack>
          <Progress value={progress} max={100} bg="$color3" size="$1">
            <Progress.Indicator animation="bouncy" bg={statusColors.border} />
          </Progress>
          <Text fontSize="$2" color="$color10">
            {statusMeta.description}
          </Text>
        </YStack>

        <XStack gap="$2" flexWrap="wrap">
          <Button
            size="$3"
            icon={Eye}
            onPress={() => onViewDetails(check)}
            accessibilityLabel="View background check details"
          >
            View details
          </Button>
          <Button
            size="$3"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => onRenew(check)}
            disabled={!renewalEligible}
          >
            Renew
          </Button>
          {onDispute && (
            <Button size="$3" variant="outlined" theme="warning" onPress={() => onDispute(check)}>
              Dispute
            </Button>
          )}
        </XStack>
      </YStack>
    </DashboardWidget>
  )
})
