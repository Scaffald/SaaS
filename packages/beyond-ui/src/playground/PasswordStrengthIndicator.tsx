/**
 * Password Strength Indicator Component
 * Displays password strength with visual indicators and text
 */

import { View, Text, StyleSheet } from 'react-native'
import { spacing } from '../tokens/spacing'
import { colors } from '../tokens/colors'
import { fontSize, fontWeight, lineHeight, fontFamily } from '../tokens/typography'
import { radius } from '../tokens/borders'
import { useThemeContext } from './ThemeProvider'

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordStrengthIndicatorProps {
  strength?: PasswordStrength
  label?: string
}

export function PasswordStrengthIndicator({
  strength = 'good',
  label,
}: PasswordStrengthIndicatorProps) {
  const { theme } = useThemeContext()
  const strengthConfig = {
    weak: { filled: 1, color: colors.error[500], label: 'Weak' },
    fair: { filled: 2, color: colors.warning[500], label: 'Fair' },
    good: { filled: 3, color: '#84cc16', label: 'Good' }, // lime-500
    strong: { filled: 4, color: colors.success[500], label: 'Strong' },
  }

  const config = strengthConfig[strength]
  const displayLabel = label || config.label
  const textColor = theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary
  const emptyColor = theme === 'light' ? colors.bg.light[200] : colors.bg.dark[200]

  return (
    <View style={styles.container}>
      <View style={styles.indicators}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index < config.filled ? config.color : emptyColor,
              },
            ]}
          />
        ))}
      </View>
      {displayLabel && <Text style={[styles.label, { color: textColor }]}>{displayLabel}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[6],
    alignItems: 'flex-end',
    width: '100%',
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing[4],
    width: '100%',
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs,
    textAlign: 'right',
    width: '100%',
  },
})
