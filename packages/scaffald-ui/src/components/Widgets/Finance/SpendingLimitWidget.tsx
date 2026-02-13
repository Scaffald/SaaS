/**
 * Spending Limit Widget component
 * Displays spending limit information
 *
 * @example
 * ```tsx
 * <SpendingLimitWidget
 *   variant="Spending Limit 01"
 *   limit={10000}
 *   used={7500}
 *   remaining={2500}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { SpendingLimitWidgetProps } from './FinanceWidget.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function SpendingLimitWidget({
  variant = 'Spending Limit 01',
  limit,
  used,
  remaining,
  style,
}: SpendingLimitWidgetProps) {
  const limitValue = typeof limit === 'number' ? `$${limit.toLocaleString()}` : limit
  const usedValue = typeof used === 'number' ? `$${used.toLocaleString()}` : used
  const remainingValue =
    remaining !== undefined
      ? typeof remaining === 'number'
        ? `$${remaining.toLocaleString()}`
        : remaining
      : undefined

  const usagePercentage =
    typeof limit === 'number' && typeof used === 'number'
      ? Math.min(100, Math.round((used / limit) * 100))
      : 0

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>Spending Limit</Text>
        <Text style={styles.limit}>{limitValue}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${usagePercentage}%` }]} />
        </View>
        <View style={styles.amountsRow}>
          <Text style={styles.used}>Used: {usedValue}</Text>
          {remainingValue && <Text style={styles.remaining}>Remaining: {remainingValue}</Text>}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  header: {
    flexDirection: 'column',
    gap: spacing[4],
  },
  label: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  limit: {
    ...typographyVariants.subtitleSemiBold,
    color: colors.text.primary,
  },
  progressSection: {
    flexDirection: 'column',
    gap: spacing[8],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  used: {
    ...typographyVariants.captionRegular,
    color: colors.text.secondary,
  },
  remaining: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
})
