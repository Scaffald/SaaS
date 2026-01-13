/**
 * Balance Widget component
 * Displays balance information with optional bar chart
 *
 * @example
 * ```tsx
 * <BalanceWidget
 *   variant="Balance 01"
 *   title="Sales Revenue"
 *   amount="$5.632"
 *   change="+$23.53 this month"
 *   changeType="positive"
 *   chartData={[
 *     { value: 16, label: 'Jun' },
 *     { value: 36, label: 'Jul' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import type { BalanceWidgetProps } from './FinanceWidget.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function BalanceWidget({
  variant = 'Balance 01',
  title,
  amount,
  change,
  changeType = 'positive',
  chartData,
  style,
}: BalanceWidgetProps) {
  const showChart = variant === 'Balance 01' && chartData && chartData.length > 0

  // Normalize chart data
  const normalizedChartData = chartData
    ? chartData.map((item) => {
        const maxValue = Math.max(...chartData.map((d) => d.value), 1)
        return {
          ...item,
          normalizedValue: (item.value / maxValue) * 100,
        }
      })
    : []

  return (
    <View style={[styles.container, style]}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Amount and chart section */}
      <View style={styles.contentSection}>
        <View style={styles.amountSection}>
          {/* Amount */}
          <Text style={styles.amount}>{amount}</Text>

          {/* Change */}
          {change && (
            <Text
              style={[
                styles.change,
                changeType === 'positive' ? styles.changePositive : styles.changeNegative,
              ]}
            >
              {change}
            </Text>
          )}
        </View>

        {/* Bar Chart */}
        {showChart && (
          <View style={styles.chartContainer}>
            {normalizedChartData.map((item, index) => {
              const isActive = index === normalizedChartData.length - 1
              const barColor = isActive ? colors.primary[500] : colors.gray[200]

              return (
                <View key={index} style={styles.barItem}>
                  <View style={styles.barContainer}>
                    <Svg width={16} height={50} viewBox="0 0 16 50">
                      <Rect
                        x={0}
                        y={50 - item.normalizedValue * 0.5}
                        width={16}
                        height={item.normalizedValue * 0.5}
                        fill={barColor}
                        rx={4}
                        stroke={colors.bg.light.default}
                        strokeWidth={1}
                      />
                    </Svg>
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      isActive ? styles.barLabelActive : styles.barLabelInactive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
    textAlign: 'right',
  },
  contentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  amountSection: {
    flexDirection: 'column',
    gap: spacing[2],
    flex: 1,
  },
  amount: {
    ...typographyVariants.subtitleSemiBold,
    color: colors.text.primary,
  },
  change: {
    ...typographyVariants.captionRegular,
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.error[500],
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[12],
  },
  barItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[4],
    width: 16,
  },
  barContainer: {
    width: 16,
    height: 50,
  },
  barLabel: {
    ...typographyVariants.captionMedium,
  },
  barLabelActive: {
    color: colors.text.secondary,
  },
  barLabelInactive: {
    color: colors.text.disabled,
  },
})
