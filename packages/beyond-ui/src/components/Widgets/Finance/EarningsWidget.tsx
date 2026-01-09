/**
 * Earnings Widget component
 * Displays earnings visualization with donut chart
 *
 * @example
 * ```tsx
 * <EarningsWidget
 *   totalEarnings={10000}
 *   earningsData={[
 *     { label: 'Product A', value: 6000, color: '#3b82f6' },
 *     { label: 'Product B', value: 4000, color: '#10b981' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { DonutChart } from '../Charts'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export interface EarningsDataItem {
  label: string
  value: number
  color?: string
}

export interface EarningsWidgetProps {
  /**
   * Total earnings amount
   */
  totalEarnings?: number | string

  /**
   * Earnings breakdown data
   */
  earningsData?: EarningsDataItem[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function EarningsWidget({
  totalEarnings,
  earningsData = [],
  style,
}: EarningsWidgetProps) {
  const earningsValue =
    totalEarnings !== undefined
      ? typeof totalEarnings === 'number'
        ? `$${totalEarnings.toLocaleString()}`
        : totalEarnings
      : undefined

  return (
    <View style={[styles.container, style]}>
      {earningsValue && (
        <View style={styles.header}>
          <Text style={styles.title}>Total Earnings</Text>
          <Text style={styles.earnings}>{earningsValue}</Text>
        </View>
      )}

      {earningsData.length > 0 && (
        <View style={styles.chartSection}>
          <DonutChart
            data={earningsData.map((item) => ({
              value: item.value,
              label: item.label,
              color: item.color,
            }))}
            variant="vertical"
            showLabels={true}
          />

          <View style={styles.legend}>
            {earningsData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color || colors.primary[600] }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>${item.value.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    width: 420,
    minHeight: 326,
  },
  header: {
    flexDirection: 'column',
    gap: spacing[8],
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  earnings: {
    ...typographyVariants.h5SemiBold,
    color: colors.text.primary,
  },
  chartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
  },
  legend: {
    flexDirection: 'column',
    gap: spacing[12],
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text.secondary,
    flex: 1,
  },
  legendValue: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.primary,
  },
})
