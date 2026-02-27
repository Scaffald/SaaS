/**
 * Balance Widget component
 * Displays balance information with optional bar chart
 * Matches Figma design exactly
 *
 * @example
 * ```tsx
 * <BalanceWidget
 *   variant="Balance 01"
 *   title="Sales Revenue"
 *   amount="5.632"
 *   changeValue="+$23.53"
 *   changePeriod="this month"
 *   changeType="positive"
 *   chartData={[
 *     { value: 16, label: 'Jun' },
 *     { value: 36, label: 'Jul' },
 *     { value: 22, label: 'Aug' },
 *     { value: 6, label: 'Sep' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet, Platform } from 'react-native'
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg'
import type { BalanceWidgetProps } from './FinanceWidget.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { fontSize, fontWeight, lineHeight, letterSpacing } from '../../../tokens/typography'
import { borderRadius } from '../../../tokens/borders'

export function BalanceWidget({
  variant = 'Balance 01',
  title,
  amount,
  change,
  changeValue,
  changePeriod,
  changeType = 'positive',
  chartData,
  style,
}: BalanceWidgetProps) {
  const showChart = variant === 'Balance 01' && chartData && chartData.length > 0

  // Parse amount to extract currency symbol and value
  // If amount includes "$", split it; otherwise use as-is
  const amountString = typeof amount === 'number' ? amount.toString() : amount
  const amountParts = amountString.startsWith('$')
    ? { currency: '$', value: amountString.slice(1) }
    : { currency: '$', value: amountString }

  // Parse change if provided as single string, or use separate values
  let changeValueText = changeValue
  let changePeriodText = changePeriod
  if (change && !changeValue) {
    // Try to parse "+\$23.53 this month" format
    const changeMatch = change.match(/^([+\-$0-9.,]+)\s*(.+)$/)
    if (changeMatch) {
      changeValueText = changeMatch[1]
      changePeriodText = changeMatch[2]
    } else {
      changeValueText = change
    }
  }

  // Calculate bar heights from inset percentages (Figma uses inset from top)
  // Inset percentage means bar starts from that % from top
  const getBarHeight = (insetPercent: number) => {
    // Bar height = 100% - inset%
    return (100 - insetPercent) / 100
  }

  const getBarY = (insetPercent: number) => {
    // Y position = inset% of total height
    return (insetPercent / 100) * 50
  }

  return (
    <View style={[styles.container, style]}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Amount and chart section */}
      <View style={styles.contentSection}>
        <View style={styles.amountSection}>
          {/* Amount - split currency and value */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountCurrency}>{amountParts.currency}</Text>
            <Text style={styles.amountValue}>{amountParts.value}</Text>
          </View>

          {/* Change - split value and period */}
          {changeValueText && (
            <View style={styles.changeContainer}>
              <Text
                style={[
                  styles.changeValue,
                  changeType === 'positive' ? styles.changePositive : styles.changeNegative,
                ]}
              >
                {changeValueText}
              </Text>
              {changePeriodText && (
                <Text style={styles.changePeriod}> {changePeriodText}</Text>
              )}
            </View>
          )}
        </View>

        {/* Bar Chart */}
        {showChart && (
          <View style={styles.chartContainer}>
            {chartData.map((item, index) => {
              const isActive = index === chartData.length - 1
              // Use value as inset percentage (16, 36, 22, 6 from Figma)
              const insetPercent = item.value
              const barHeight = getBarHeight(insetPercent)
              const barY = getBarY(insetPercent)
              const barActualHeight = barHeight * 50

              return (
                <View key={index} style={styles.barItem}>
                  <View style={styles.barContainer}>
                    <Svg width={16} height={50} viewBox="0 0 16 50">
                      <Defs>
                        {isActive && (
                          <LinearGradient id={`barGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={colors.primary[500]} />
                            <Stop offset="100%" stopColor={colors.primary[600]} />
                          </LinearGradient>
                        )}
                      </Defs>
                      <Rect
                        x={0}
                        y={barY}
                        width={16}
                        height={barActualHeight}
                        fill={isActive ? `url(#barGradient-${index})` : colors.gray[200]}
                        rx={borderRadius.xxs}
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
    // Paragraph M/Medium: 16px, line-height 24px, Roboto Medium
    fontFamily: 'Roboto',
    fontSize: fontSize.md, // 16
    fontWeight: fontWeight.medium, // 500
    lineHeight: lineHeight.md, // 24
    letterSpacing: letterSpacing.normal, // 0
    color: colors.text.primary, // #141c25
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountCurrency: {
    // "$" - Roboto Medium, 14px, line-height 20px, gray #637083
    fontFamily: 'Roboto',
    fontSize: fontSize.sm, // 14
    fontWeight: fontWeight.medium, // 500
    lineHeight: lineHeight.sm, // 20
    letterSpacing: letterSpacing.normal,
    color: colors.gray[500], // #637083
    marginRight: 0,
  },
  amountValue: {
    // "5.632" - Roboto SemiBold, 24px, line-height 32px, tracking -0.24px
    fontFamily: 'Roboto',
    fontSize: fontSize.h6, // 24
    fontWeight: fontWeight.semibold, // 600
    lineHeight: lineHeight.h6, // 32
    letterSpacing: -0.24, // tracking -0.24px
    color: colors.text.primary, // #141c25
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  changeValue: {
    // "+$23.53" - Roboto Medium, 14px, line-height 20px
    fontFamily: 'Roboto',
    fontSize: fontSize.sm, // 14
    fontWeight: fontWeight.medium, // 500
    lineHeight: lineHeight.sm, // 20
    letterSpacing: letterSpacing.normal,
  },
  changePositive: {
    color: colors.success[500], // #10b978
  },
  changeNegative: {
    color: colors.error[500],
  },
  changePeriod: {
    // "this month" - Roboto Regular, 12px, line-height 16px, gray #344051
    fontFamily: 'Roboto',
    fontSize: fontSize.xs, // 12
    fontWeight: fontWeight.regular, // 400
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
    color: colors.text.secondary, // #344051
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
    overflow: 'hidden',
  },
  barLabel: {
    // Inter Medium, 10px, line-height 14px (using Roboto as fallback)
    fontFamily: Platform.select({ web: 'Inter, Roboto', default: 'Roboto' }),
    fontSize: 10,
    fontWeight: fontWeight.medium, // 500
    lineHeight: 14,
    letterSpacing: letterSpacing.normal,
  },
  barLabelActive: {
    color: colors.text.secondary, // #344051
  },
  barLabelInactive: {
    color: colors.text.disabled, // #97a1af
  },
})
