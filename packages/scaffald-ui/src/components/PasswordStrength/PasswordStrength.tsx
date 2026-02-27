/**
 * PasswordStrength component
 * Displays password strength indicator
 * Maps to Figma "Password Strength Base" component
 *
 * Supports two variants:
 * - Bar variant: Visual strength indicator with 4 bars
 * - Checklist variant: List of password requirements with checkmarks
 *
 * @example
 * ```tsx
 * import { PasswordStrength } from '@scaffald/ui'
 *
 * // Bar variant
 * <PasswordStrength variant="bar" strength="good" />
 *
 * // Checklist variant
 * <PasswordStrength
 *   variant="checklist"
 *   requirements={[
 *     { label: 'At least 8 characters', met: true },
 *     { label: 'Uppercase character', met: false },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { CheckIcon } from '../Icon'
import { CancelIcon } from '../Icon'
import type {
  PasswordStrengthProps,
  PasswordStrengthLevel,
  PasswordRequirement,
} from './PasswordStrength.types'

/**
 * Get strength level configuration
 */
function getStrengthConfig(strength: PasswordStrengthLevel) {
  switch (strength) {
    case 'too-weak':
      return {
        filledBars: 1,
        color: colors.error[500],
        label: 'Too weak',
        labelColor: colors.text.light.secondary,
      }
    case 'weak':
      return {
        filledBars: 2,
        color: colors.warning[400],
        label: 'Weak',
        labelColor: colors.text.light.secondary,
      }
    case 'good':
      return {
        filledBars: 3,
        color: colors.lime[500],
        label: 'Good',
        labelColor: colors.text.light.secondary,
      }
    case 'strong':
      return {
        filledBars: 4,
        color: colors.success[600],
        label: 'Strong',
        labelColor: colors.text.light.secondary,
      }
    default:
      return {
        filledBars: 0,
        color: colors.bg.light['200'],
        label: 'Password strength',
        labelColor: colors.text.light.secondary,
      }
  }
}

/**
 * PasswordStrength component
 */
export function PasswordStrength({
  variant = 'bar',
  strength = 'too-weak',
  requirements = [],
  checklistLabel = 'Must contain at least:',
  style,
  textStyle,
  width = 252,
}: PasswordStrengthProps) {
  if (variant === 'bar') {
    return (
      <PasswordStrengthBar
        strength={strength}
        style={style}
        textStyle={textStyle}
        width={width}
      />
    )
  }

  return (
    <PasswordStrengthChecklist
      requirements={requirements}
      label={checklistLabel}
      style={style}
      textStyle={textStyle}
      width={width}
    />
  )
}

/**
 * Bar variant component
 */
interface PasswordStrengthBarProps {
  strength: PasswordStrengthLevel
  style?: ViewStyle
  textStyle?: TextStyle
  width: number
}

function PasswordStrengthBar({
  strength,
  style,
  textStyle,
  width,
}: PasswordStrengthBarProps) {
  const config = getStrengthConfig(strength)
  const barHeight = 4
  const gap = spacing[4]

  return (
    <View style={[{ width, alignItems: 'flex-end', gap: spacing[6] }, style]}>
      {/* Bar indicator */}
      <View style={{ flexDirection: 'row', gap, width: '100%' }}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: barHeight,
              borderRadius: 999, // Fully rounded
              backgroundColor:
                index < config.filledBars
                  ? config.color
                  : colors.bg.light['200'],
            }}
          />
        ))}
      </View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          { color: config.labelColor, width: '100%', textAlign: 'right' },
          textStyle,
        ]}
      >
        {config.label}
      </Text>
    </View>
  )
}

/**
 * Checklist variant component
 */
interface PasswordStrengthChecklistProps {
  requirements: PasswordRequirement[]
  label: string
  style?: ViewStyle
  textStyle?: TextStyle
  width: number
}

function PasswordStrengthChecklist({
  requirements,
  label,
  style,
  textStyle,
  width,
}: PasswordStrengthChecklistProps) {
  const iconSize = 16

  return (
    <View style={[{ width, gap: spacing[8] }, style]}>
      {/* Label */}
      <Text style={[styles.label, { color: colors.text.light.secondary }, textStyle]}>
        {label}
      </Text>

      {/* Requirements list */}
      <View style={{ gap: spacing[4] }}>
        {requirements.map((req, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[6],
            }}
          >
            {/* Icon */}
            <View style={{ width: iconSize, height: iconSize }}>
              {req.met ? (
                <CheckIcon size={iconSize} color={colors.success[600]} />
              ) : (
                <CancelIcon size={iconSize} color={colors.text.light.tertiary} />
              )}
            </View>

            {/* Label text */}
            <Text
              style={[
                styles.requirementText,
                {
                  color: req.met
                    ? colors.success[600]
                    : colors.text.light.tertiary,
                },
              ]}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  requirementText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
})

