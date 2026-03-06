/**
 * Fear & Greed Index Widget component
 * Market sentiment indicator
 *
 * @example
 * ```tsx
 * <FearGreedIndexWidget
 *   value={45}
 *   label="Fear"
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { FearGreedIndexWidgetProps } from './CryptoWidget.types'
import { CircleChart } from '../Charts'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import type { ResolvedThemeMode } from '../../../tokens/colors'

export function FearGreedIndexWidget({
  value,
  label,
  style,
}: FearGreedIndexWidgetProps) {
  const { theme } = useThemeContext()
  const styles = getStyles(theme)
  const clampedValue = Math.max(0, Math.min(100, value))

  // Determine color based on value
  // 0-25: Extreme Fear (red), 26-45: Fear (orange), 46-55: Neutral (yellow), 56-75: Greed (light green), 76-100: Extreme Greed (green)
  const getColor = () => {
    if (clampedValue <= 25) return colors.error[500]
    if (clampedValue <= 45) return colors.warning[500]
    if (clampedValue <= 55) return colors.yellow[500]
    if (clampedValue <= 75) return colors.success[400]
    return colors.success[600]
  }

  const indexLabel = label || (clampedValue <= 25 ? 'Extreme Fear' : clampedValue <= 45 ? 'Fear' : clampedValue <= 55 ? 'Neutral' : clampedValue <= 75 ? 'Greed' : 'Extreme Greed')

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fear & Greed Index</Text>
        <Text style={styles.indexLabel}>{indexLabel}</Text>
      </View>

      <View style={styles.chartSection}>
        <CircleChart variant="vertical" value={clampedValue} color={getColor()} />
        <Text style={styles.value}>{clampedValue}</Text>
      </View>
    </View>
  )
}

function getStyles(theme: ResolvedThemeMode) {
  return StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[16],
    backgroundColor: colors.bg[theme].default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
    width: 367,
    minHeight: 232,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text[theme].primary,
  },
  indexLabel: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text[theme].secondary,
  },
  chartSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  value: {
    position: 'absolute',
    ...typographyVariants.h5SemiBold,
    color: colors.text[theme].primary,
  },
})
}
