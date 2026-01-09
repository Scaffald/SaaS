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

import { View, Text, StyleSheet } from 'react-native'
import type { MetricWidgetProps } from './MetricWidget.types'
import { MiniLinearChart } from '../../Chart'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

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
          {/* Value */}
          <View style={styles.valueRow}>
            <Text style={styles.value}>{value}</Text>

            {/* Change indicator */}
            {change && (
              <View style={styles.changeContainer}>
                {changeType === 'positive' && (
                  <View style={styles.changeIndicator}>
                    <Text style={[styles.changeText, { color: getChangeColor() }]}>{change}</Text>
                  </View>
                )}
                {changeType === 'negative' && (
                  <View style={styles.changeIndicator}>
                    <Text style={[styles.changeText, { color: getChangeColor() }]}>{change}</Text>
                  </View>
                )}
                {changeType === 'neutral' && (
                  <Text style={[styles.changeText, { color: getChangeColor() }]}>{change}</Text>
                )}
              </View>
            )}
          </View>

          {/* Subtitle */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Chart */}
        {showChart && chartType === 'linear' && (
          <MiniLinearChart
            data={chartData || []}
            shadow={type === 'Chart 01' || type === 'Chart 02'}
            color={colors.primary[600]}
          />
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
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
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
    ...typographyVariants.subtitleSemiBold,
    color: colors.text.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 6,
    backgroundColor: colors.bg.light.default,
  },
  changeText: {
    ...typographyVariants.paragraphSMedium,
  },
  subtitle: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
})
