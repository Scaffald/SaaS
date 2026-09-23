import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { AlertTriangle, Eye, RefreshCcw } from 'lucide-react-native'
import { memo, useMemo } from 'react'
import { Button, H3, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { CheckTimeline } from './CheckTimeline'
import {
  type BackgroundCheckSummary,
  daysUntilExpiration,
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

/**
 * One background check, on a hairline.
 *
 * It was a card with a tinted status pill, a percentage bar and three equal
 * buttons. The pill said "Partially Completed", the bar said 80%, and
 * neither said what was happening or when it would stop. The timeline does
 * that; what is left here is what the check is, when it expires, and the
 * three things a worker can do with it.
 */
export const CheckStatusCard = memo(function CheckStatusCard({
  check,
  onViewDetails,
  onRenew,
  onDispute,
}: CheckStatusCardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : ('light' as const)

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
    <Stack
      gap={16}
      paddingVertical={16}
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      <Row justify="space-between" align="flex-start" gap={16} wrap>
        <Stack gap={2} flex={1} minWidth={220}>
          {/* React Native defaults flexShrink to 0, so a long package name
              beside the expiry pushes the row wider than the column (#858). */}
          <H3 style={{ color: colors.text[t].primary }}>{packageLabel}</H3>
          <Text style={{ color: colors.text[t].secondary }}>
            Started {formatDate(check.created_at)}
            {estimatedCompletion ? ` · expected ${formatDate(estimatedCompletion)}` : ''}
          </Text>
        </Stack>

        {check.expires_at ? (
          <Row align="center" gap={8} wrap>
            {expirationWarning ? (
              <AlertTriangle size={16} color={colors.text[t].attention} />
            ) : null}
            <Text
              style={{
                color: expirationWarning ? colors.text[t].attention : colors.text[t].secondary,
              }}
            >
              {expired
                ? `Expired ${formatDate(check.expires_at)}`
                : `Expires ${formatDate(check.expires_at)}${
                    daysRemaining !== null && daysRemaining >= 0 ? ` · ${daysRemaining} days` : ''
                  }`}
            </Text>
          </Row>
        ) : null}
      </Row>

      <CheckTimeline status={check.status} />

      <Row gap={8} wrap>
        <Button
          size="sm"
          variant="filled"
          color="primary"
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
        {onDispute ? (
          <Button size="sm" variant="outline" onPress={() => onDispute(check)}>
            Dispute
          </Button>
        ) : null}
      </Row>
    </Stack>
  )
})
