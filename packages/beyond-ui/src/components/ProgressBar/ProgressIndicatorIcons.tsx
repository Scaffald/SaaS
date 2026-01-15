/**
 * Icons for ProgressIndicator component
 */

import { View, ActivityIndicator } from 'react-native'
import { CheckIcon } from '../Stepper/StepperIcons'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'

interface SpinnerIconProps {
  size?: number
  color?: string
}

/**
 * Spinner icon (loading indicator)
 */
export function SpinnerIcon({ size = 24, color }: SpinnerIconProps) {
  const { theme } = useThemeContext()
  const spinnerColor = color || (theme === 'light' ? colors.gray[300] : colors.gray[600])

  return <ActivityIndicator size="small" color={spinnerColor} />
}

interface CheckCircleIconProps {
  size?: number
  color?: string
}

/**
 * Check circle icon (success)
 */
export function CheckCircleIcon({ size = 24, color = '#10b978' }: CheckCircleIconProps) {
  // Simple check circle using View borders for now
  // This should ideally be an SVG, but for React Native compatibility we'll use a simple implementation
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CheckIcon size={size * 0.5} color={colors.white} />
    </View>
  )
}

interface CancelIconProps {
  size?: number
  color?: string
}

/**
 * Cancel/X icon
 */
export function CancelIcon({ size = 24, color }: CancelIconProps) {
  const { theme } = useThemeContext()
  const iconColor = color || (theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary)

  // Simple X icon using View borders
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* X shape - two crossing lines */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.6,
          height: 1.5,
          backgroundColor: iconColor,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.6,
          height: 1.5,
          backgroundColor: iconColor,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  )
}

