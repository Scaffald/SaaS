/**
 * Step component
 * Individual step element for use in Stepper
 */

import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { StepProps } from './Stepper.types'
import { CheckIcon } from './StepperIcons'
import { useThemeContext } from '../../theme'

export function Step({
  status,
  stepNumber,
  label,
  description,
  color = 'primary',
  showDescription = false,
  interactive = false,
  onPress,
  disabled = false,
  style,
  labelStyle,
  descriptionStyle,
}: StepProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'
  const [isHovered, setIsHovered] = useState(false)

  // Get container styles based on interactive state
  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.container]

    if (interactive && !disabled) {
      // Add web-only styles for interactivity
      if (Platform.OS === 'web') {
        baseStyles.push({
          cursor: 'pointer',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition: 'opacity 0.2s ease',
        } as any)
      }
      if (isHovered) {
        baseStyles.push({
          opacity: 0.8,
        })
      }
    }

    if (disabled) {
      baseStyles.push({ opacity: 0.5 })
    }

    return baseStyles
  }

  // Get badge styles based on status and color
  const getBadgeStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [
      styles.badge,
      {
        width: 24,
        height: 24,
        borderRadius: borderRadius.max,
      },
    ]

    if (status === 'completed') {
      // Completed: filled background with checkmark
      if (color === 'primary') {
        baseStyles.push({ backgroundColor: colors.primary[500] })
      } else {
        baseStyles.push({
          backgroundColor: isLight ? colors.gray[900] : colors.gray[100],
        })
      }
    } else if (status === 'current') {
      // Current: gray background with step number
      baseStyles.push({
        backgroundColor: isLight ? colors.gray[200] : colors.gray[700],
        borderWidth: 0,
      })
    } else {
      // Next: border only with step number
      baseStyles.push({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isLight ? colors.border.light['200'] : colors.border.dark['200'],
      })
    }

    return baseStyles
  }

  // Get label styles based on status
  const getLabelStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.label]

    if (status === 'completed') {
      baseStyles.push({
        color: isLight ? colors.text.light.primary : colors.text.dark.primary,
        fontWeight: typography.body.fontWeight,
      })
    } else if (status === 'current') {
      baseStyles.push({
        color: isLight ? colors.text.light.primary : colors.text.dark.primary,
        fontWeight: typography.bodyMedium.fontWeight,
      })
    } else {
      baseStyles.push({
        color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
        fontWeight: typography.body.fontWeight,
      })
    }

    return baseStyles
  }

  // Get description styles
  const getDescriptionStyles = (): TextStyle[] => {
    return [
      styles.description,
      {
        color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
      },
    ]
  }

  // Get badge content
  const renderBadgeContent = () => {
    if (status === 'completed') {
      return <CheckIcon size={16} color={colors.white} />
    }
    return (
      <Text
        style={[
          styles.badgeText,
          {
            color:
              status === 'current'
                ? isLight
                  ? colors.text.light.primary
                  : colors.text.dark.primary
                : isLight
                  ? colors.text.light.tertiary
                  : colors.text.dark.tertiary,
          },
        ]}
      >
        {stepNumber}
      </Text>
    )
  }

  const content = (
    <>
      <View style={getBadgeStyles()}>{renderBadgeContent()}</View>

      <View style={styles.textContainer}>
        <Text style={[...getLabelStyles(), labelStyle]} numberOfLines={1}>
          {label}
        </Text>
        {showDescription && description && (
          <Text style={[...getDescriptionStyles(), descriptionStyle]} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>
    </>
  )

  if (interactive) {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ...getContainerStyles(),
          pressed && !disabled && { opacity: 0.7 },
          style,
        ]}
        {...(Platform.OS === 'web' && {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        })}
      >
        {content}
      </Pressable>
    )
  }

  return <View style={[...getContainerStyles(), style]}>{content}</View>
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[10],
  },
  badgeText: {
    fontFamily: typography.smallBold.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.smallBold.fontWeight,
    lineHeight: typography.small.lineHeight,
    textAlign: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    gap: spacing[2],
    flexShrink: 1,
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    textAlign: 'left',
  },
  description: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    textAlign: 'left',
  },
})

