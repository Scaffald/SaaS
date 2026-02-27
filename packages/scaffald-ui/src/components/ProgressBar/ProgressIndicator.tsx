/**
 * ProgressIndicator component
 * Displays progress percentage with optional icon
 */

import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import type { ProgressIndicatorProps } from './ProgressBar.types'
import { SpinnerIcon, CheckCircleIcon, CancelIcon } from './ProgressIndicatorIcons'
import { useThemeContext } from '../../theme'

export function ProgressIndicator({
  value,
  iconType = 'spinner',
  customText,
  showText = true,
  style,
  textStyle,
}: ProgressIndicatorProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))

  // Get text color
  const getTextColor = () => {
    return isLight ? colors.text.light.primary : colors.text.dark.primary
  }

  // Render icon based on type
  const renderIcon = () => {
    if (iconType === 'none') return null

    switch (iconType) {
      case 'spinner':
        return <SpinnerIcon size={24} />
      case 'check':
        return <CheckCircleIcon size={24} />
      case 'cancel':
        return <CancelIcon size={24} />
      default:
        return <SpinnerIcon size={24} />
    }
  }

  // Get display text
  const getDisplayText = () => {
    if (customText !== undefined) {
      return customText
    }
    return `${Math.round(clampedValue)}%`
  }

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]} numberOfLines={1}>
          {getDisplayText()}
        </Text>
      )}
      {renderIcon()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  text: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    textAlign: 'right',
  },
})

