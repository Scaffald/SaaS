import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { DashboardWidget } from '@scaffald/ui'
import { AlertTriangle, Eye, RefreshCcw } from 'lucide-react-native'
import { memo, useMemo } from 'react'
import { Button, ProgressBarBase, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  const statusMeta = getStatusMetadata(check.status)
  const statusColors = getStatusToneColors(statusMeta.tone, t)
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
        <Row justify="space-between" align="flex-start" gap={16} wrap>
          <Stack gap={4} flex={1}>
            <Text style={{ color: colors.text[t].secondary }}>{packageLabel}</Text>
            <Text style={{ color: colors.text[t].secondary }}>Started {formatDate(check.created_at)}</Text>
            {estimatedCompletion && (
              <Text style={{ color: colors.text[t].secondary }}>Est. completion {formatDate(estimatedCompletion)}</Text>
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
                {expirationWarning && <AlertTriangle size={20} color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]} />}
                <Text style={{ color: expirationWarning ? (t === 'dark' ? colors.yellow[300] : colors.yellow[600]) : colors.text[t].secondary }}>
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
            <Text style={{ color: colors.text[t].secondary }}>Progress</Text>
            <Text style={{ color: colors.text[t].secondary }}>{progress}%</Text>
          </Row>
          <ProgressBarBase value={progress} color="primary" />
          <Text style={{ color: colors.text[t].secondary }}>{statusMeta.description}</Text>
        </Stack>

        <Row gap={8} wrap>
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
            <Button size="sm" variant="outline" onPress={() => onDispute(check)}>
              Dispute
            </Button>
          )}
        </Row>
      </Stack>
    </DashboardWidget>
  )
})
