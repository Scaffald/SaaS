/**
 * DeltaBadge component
 * Directional change indicator showing the difference between two values
 *
 * @example
 * ```tsx
 * <DeltaBadge current={4.2} previous={3.8} format="rating" />
 * // Renders: "+0.4 ▲" in green
 *
 * <DeltaBadge current={60} previous={75} format="percentage" />
 * // Renders: "-15% ▼" in red
 * ```
 */

import { View, Text } from 'react-native'
import type { DeltaBadgeProps } from './Chart.types'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export function DeltaBadge({
  current,
  previous,
  format = 'absolute',
  size = 'sm',
  style,
}: DeltaBadgeProps) {
  const delta = current - previous
  const isPositive = delta > 0.05
  const isNegative = delta < -0.05
  const isNeutral = !isPositive && !isNegative

  const badgeColor = isPositive
    ? colors.green[500]
    : isNegative
      ? colors.error[500]
      : colors.gray[400]

  const bgColor = isPositive
    ? colors.green[50]
    : isNegative
      ? colors.error[50]
      : colors.gray[100]

  const arrow = isPositive ? '▲' : isNegative ? '▼' : '—'

  let displayValue: string
  switch (format) {
    case 'percentage': {
      const pctDelta = previous !== 0 ? ((delta / previous) * 100) : 0
      displayValue = `${isPositive ? '+' : ''}${Math.round(pctDelta)}%`
      break
    }
    case 'rating':
      displayValue = `${isPositive ? '+' : ''}${delta.toFixed(1)}`
      break
    default:
      displayValue = `${isPositive ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(1)}`
  }

  const fontSize = size === 'sm' ? 11 : 13
  const paddingH = size === 'sm' ? 6 : 8
  const paddingV = size === 'sm' ? 2 : 4

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bgColor,
          borderRadius: 4,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: typography.caption.fontFamily,
          fontSize,
          fontWeight: '600',
          color: badgeColor,
        }}
      >
        {displayValue} {arrow}
      </Text>
    </View>
  )
}
