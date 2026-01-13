/**
 * Large Balance Widget component
 * Full-featured balance display with chart
 *
 * @example
 * ```tsx
 * <LargeBalanceWidget
 *   title="Total Balance"
 *   amount="$50,000.00"
 *   change="+$1,234.56"
 *   changeType="positive"
 *   chartData={[...]}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { LinearChart } from '../Charts'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export interface LargeBalanceChartData {
  value: number
  label?: string
  color?: string
}

export interface LargeBalanceWidgetProps {
  /**
   * Widget title
   */
  title?: string

  /**
   * Currency amount (formatted string)
   */
  amount: string

  /**
   * Change value and period
   */
  change?: string

  /**
   * Change type
   * @default 'positive'
   */
  changeType?: 'positive' | 'negative'

  /**
   * Chart data for large chart
   */
  chartData?: LargeBalanceChartData[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function LargeBalanceWidget({
  title,
  amount,
  change,
  changeType = 'positive',
  chartData,
  style,
}: LargeBalanceWidgetProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.balanceSection}>
        <Text style={styles.amount}>{amount}</Text>
        {change && (
          <View style={styles.changeSection}>
            <View
              style={[
                styles.changeBadge,
                changeType === 'positive' ? styles.changeBadgePositive : styles.changeBadgeNegative,
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  changeType === 'positive' ? styles.changeTextPositive : styles.changeTextNegative,
                ]}
              >
                {change}
              </Text>
            </View>
          </View>
        )}
      </View>

      {chartData && chartData.length > 0 && (
        <View style={styles.chartSection}>
          <LinearChart
            variant="large"
            data={chartData.map((item) => ({
              value: item.value,
              label: item.label,
              color: item.color,
            }))}
            showLegend={true}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[24],
    width: 769,
    minHeight: 581,
    padding: spacing[24],
    backgroundColor: colors.bg.light.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  balanceSection: {
    flexDirection: 'column',
    gap: spacing[16],
  },
  amount: {
    ...typographyVariants.h4SemiBold,
    color: colors.text.primary,
  },
  changeSection: {
    flexDirection: 'column',
    gap: spacing[4],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: 6,
    gap: spacing[4],
  },
  changeBadgePositive: {
    backgroundColor: colors.success[50],
  },
  changeBadgeNegative: {
    backgroundColor: colors.error[50],
  },
  changeText: {
    ...typographyVariants.paragraphSMedium,
  },
  changeTextPositive: {
    color: colors.success[600],
  },
  changeTextNegative: {
    color: colors.error[600],
  },
  chartSection: {
    width: '100%',
  },
})
