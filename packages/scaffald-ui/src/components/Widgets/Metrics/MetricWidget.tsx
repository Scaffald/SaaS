/**
 * Metric Widget component
 * Displays metric with optional chart, supporting 10 type variants
 *
 * @example
 * ```tsx
 * <MetricWidget
 *   type="Chart 01"
 *   title="New Subscriptions"
 *   value={32}
 *   change="+12%"
 *   changeType="positive"
 *   subtitle="vs. last period"
 *   chartData={[10, 20, 15, 30, 25]}
 * />
 * ```
 */

import { View, Text, StyleSheet, } from 'react-native'
import { ArrowUp, ArrowDown } from 'lucide-react-native'
import type { MetricWidgetProps } from './MetricWidget.types'
import { MiniLinearChart } from '../../Chart'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { fontSize, fontWeight, lineHeight, letterSpacing } from '../../../tokens/typography'

export function MetricWidget({
  type = 'Chart 01',
  title,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  chartData,
  chartType = 'linear',
  style,
}: MetricWidgetProps) {
  // Determine if chart should be shown
  const showChart = type.startsWith('Chart') && chartData && chartData.length > 0
  const isBlank = type.startsWith('Blank')
  const isInfo = type.startsWith('Info')
  const isNeutral = type === 'Neutral'

  // Get change color based on type
  const getChangeColor = () => {
    if (changeType === 'positive') return colors.success[500]
    if (changeType === 'negative') return colors.error[500]
    return colors.gray[500]
  }

  // Get container style based on type
  const getContainerStyle = () => {
    if (isBlank || isInfo || isNeutral) {
      return [styles.container, styles.simpleContainer]
    }
    return styles.container
  }

  return (
    <View style={[getContainerStyle(), style]}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Value and change section */}
      <View style={styles.valueSection}>
        <View style={styles.valueContainer}>
          {/* Value and change indicator row */}
          <View style={styles.valueRow}>
            <Text style={styles.value}>{value}</Text>

            {/* Change indicator with arrow icon */}
            {change && changeType !== 'neutral' && (
              <View style={styles.changeContainer}>
                {changeType === 'positive' && (
                  <ArrowUp size={16} color={colors.success[500]} />
                )}
                {changeType === 'negative' && (
                  <ArrowDown size={16} color={colors.error[500]} />
                )}
                <Text style={[styles.changeText, { color: getChangeColor() }]}>
                  {change}
                </Text>
              </View>
            )}
            {change && changeType === 'neutral' && (
              <Text style={[styles.changeText, { color: getChangeColor() }]}>
                {change}
              </Text>
            )}
          </View>

          {/* Subtitle */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Chart */}
        {showChart && chartType === 'linear' && (
          <View style={styles.chartContainer}>
            <MiniLinearChart
              data={chartData || []}
              shadow={type === 'Chart 01' || type === 'Chart 02'}
              color={colors.primary[600]}
            />
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
  simpleContainer: {
    gap: spacing[8],
  },
  title: {
    // Paragraph M/Medium: 16px, line-height 24px, Roboto Medium, text-right
    fontFamily: 'Roboto',
    fontSize: fontSize.md, // 16
    fontWeight: fontWeight.medium, // 500
    lineHeight: lineHeight.md, // 24
    letterSpacing: letterSpacing.normal, // 0
    color: colors.text.primary, // #141c25
    textAlign: 'right',
  },
  valueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  valueContainer: {
    flexDirection: 'column',
    gap: spacing[2],
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  value: {
    // Subtitle/SemiBold: 20px, line-height 28px, Roboto SemiBold
    fontFamily: 'Roboto',
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.semibold, // 600
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
    color: colors.text.primary, // #141c25
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  changeText: {
    // Paragraph S/Medium: 14px, line-height 20px, Roboto Medium
    fontFamily: 'Roboto',
    fontSize: fontSize.sm, // 14
    fontWeight: fontWeight.medium, // 500
    lineHeight: lineHeight.sm, // 20
    letterSpacing: letterSpacing.normal, // 0
  },
  subtitle: {
    // Caption/Regular: 12px, line-height 16px, Roboto Regular
    fontFamily: 'Roboto',
    fontSize: fontSize.xs, // 12
    fontWeight: fontWeight.regular, // 400
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal, // 0
    color: colors.text.tertiary, // #637083
  },
  chartContainer: {
    width: 112,
    height: 59,
  },
})
