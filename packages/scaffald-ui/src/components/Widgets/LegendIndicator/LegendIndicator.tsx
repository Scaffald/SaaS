/**
 * Legend Indicator component
 * Displays legend items with colored dots and labels
 *
 * @example
 * ```tsx
 * <LegendIndicator
 *   items={[
 *     { label: 'Current Period', color: '#10b981' },
 *     { label: 'Previous Period', color: '#af92d9' }
 *   ]}
 *   orientation="horizontal"
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import type { LegendIndicatorProps } from './LegendIndicator.types'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { fontSize, fontWeight, lineHeight, letterSpacing } from '../../../tokens/typography'

export function LegendIndicator({
  items,
  orientation = 'horizontal',
  style,
}: LegendIndicatorProps) {
  const containerStyle = orientation === 'vertical' ? styles.verticalContainer : styles.horizontalContainer

  return (
    <View style={[containerStyle, style]}>
      {items.map((item, index) => (
        <View
          key={index}
          style={orientation === 'vertical' ? styles.verticalItem : styles.horizontalItem}
        >
          <View style={styles.dotContainer}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={4} fill={item.color} />
            </Svg>
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[4],
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing[8],
  },
  horizontalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotContainer: {
    width: 24,
    height: 24,
    marginRight: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    // Caption/Regular: 12px, line-height 16px, Roboto Regular
    fontFamily: 'Roboto',
    fontSize: fontSize.xs, // 12
    fontWeight: fontWeight.regular, // 400
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal, // 0
    color: colors.text.secondary, // #344051 for active, #637083 for inactive
  },
})
