/**
 * Chip component
 * Interactive chip element for selections, filters, and actions
 *
 * @example
 * ```tsx
 * import { Chip } from '@scaffald/ui'
 *
 * // Basic chip
 * <Chip onPress={() => console.log('Pressed')}>
 *   Filter
 * </Chip>
 *
 * // Chip with icon and close button
 * <Chip
 *   type="icon"
 *   icon={FilterIcon}
 *   closeIcon
 *   onClose={() => console.log('Closed')}
 * >
 *   Active Filter
 * </Chip>
 *
 * // Selected chip
 * <Chip
 *   selected={isSelected}
 *   onPress={() => setIsSelected(!isSelected)}
 * >
 *   Selected Option
 * </Chip>
 * ```
 */

import { useMemo } from 'react'
import { View, Text, StyleSheet, type GestureResponderEvent } from 'react-native'
import { AnimatedPressable } from '../../animation'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ChipProps } from './Chip.types'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function Chip({
  children,
  type = 'default',
  size = 'md',
  disabled = false,
  selected = false,
  onPress,
  closeIcon = false,
  onClose,
  icon: Icon,
  avatar,
  flag,
  brandIcon,
  crypto,
  style,
  textStyle,
  ...pressableProps
}: ChipProps) {
  const { theme } = useThemeContext()
  const { isHovered, isFocused, interactiveProps } = useInteractiveState(disabled)

  const isLight = theme === 'light'

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 24,
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[4],
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      iconSize: 16,
      gap: spacing[4],
    },
    md: {
      height: 28,
      paddingHorizontal: spacing[8],
      paddingVertical: spacing[4],
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
      iconSize: 18,
      gap: spacing[4],
    },
    lg: {
      height: 32,
      paddingHorizontal: spacing[10],
      paddingVertical: spacing[4],
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
      iconSize: 20,
      gap: spacing[4],
    },
  }[size]

  const handlePress = () => {
    if (disabled) return
    onPress?.()
  }

  const handleClose = (e: GestureResponderEvent) => {
    e.stopPropagation()
    if (disabled) return
    onClose?.()
  }

  // Get chip container styles
  const chipStyles = useMemo(() => {
    const baseStyles: ViewStyle[] = [
      styles.chip,
      {
        height: sizeConfig.height,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        paddingVertical: sizeConfig.paddingVertical,
        gap: sizeConfig.gap,
      },
    ]

    // Background and border based on state
    if (isLight) {
      if (selected) {
        baseStyles.push({
          backgroundColor: colors.gray[900],
          borderColor: colors.gray[900],
          borderWidth: 1,
        })
      } else if (isHovered && !disabled) {
        baseStyles.push({
          backgroundColor: colors.bg.light.subtle,
          borderColor: colors.border.light['200'],
          borderWidth: 1,
        })
      } else {
        baseStyles.push({
          backgroundColor: colors.bg.light.default,
          borderColor: colors.border.light['200'],
          borderWidth: 1,
        })
      }
    } else {
      if (selected) {
        baseStyles.push({
          backgroundColor: colors.gray[100],
          borderColor: colors.gray[100],
          borderWidth: 1,
        })
      } else if (isHovered && !disabled) {
        baseStyles.push({
          backgroundColor: colors.bg.dark.subtle,
          borderColor: colors.border.dark['200'],
          borderWidth: 1,
        })
      } else {
        baseStyles.push({
          backgroundColor: colors.bg.dark.default,
          borderColor: colors.border.dark['200'],
          borderWidth: 1,
        })
      }
    }

    // Focus state
    if (isFocused && !disabled) {
      baseStyles.push(styles.focusRing)
    }

    // Disabled state
    if (disabled) {
      baseStyles.push({
        opacity: 0.4,
      })
    }

    return baseStyles
  }, [
    sizeConfig.height,
    sizeConfig.paddingHorizontal,
    sizeConfig.paddingVertical,
    sizeConfig.gap,
    isLight,
    selected,
    isHovered,
    disabled,
    isFocused,
  ])

  // Get text styles
  const textStyles = useMemo(() => {
    const baseTextStyles: TextStyle[] = [
      styles.text,
      {
        fontSize: sizeConfig.fontSize,
        lineHeight: sizeConfig.lineHeight,
      },
    ]

    if (isLight) {
      baseTextStyles.push({
        color: selected ? colors.text.light.quaternary : colors.text.light.primary,
      })
    } else {
      baseTextStyles.push({
        color: selected ? colors.text.dark.quaternary : colors.text.dark.primary,
      })
    }

    if (disabled) {
      baseTextStyles.push({
        color: isLight ? colors.text.light.disabled : colors.text.dark.disabled,
      })
    }

    return baseTextStyles
  }, [sizeConfig.fontSize, sizeConfig.lineHeight, isLight, selected, disabled])

  // Render leading content based on type
  const renderLeadingContent = () => {
    if (type === 'icon' && Icon) {
      return (
        <Icon
          size={sizeConfig.iconSize}
          color={
            selected ? colors.white : isLight ? colors.icon.light.default : colors.icon.dark.default
          }
        />
      )
    }

    if (type === 'avatar' && avatar) {
      return (
        <View style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}>{avatar}</View>
      )
    }

    if (type === 'flag' && flag) {
      return <View style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}>{flag}</View>
    }

    if (type === 'brand-icon' && brandIcon) {
      return (
        <View style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}>{brandIcon}</View>
      )
    }

    if (type === 'crypto' && crypto) {
      return (
        <View style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}>{crypto}</View>
      )
    }

    return null
  }

  // Render close icon (X shape)
  const renderCloseIcon = () => {
    if (!closeIcon) return null

    const iconColor = selected
      ? colors.white
      : isLight
        ? colors.icon.light.default
        : colors.icon.dark.default

    return (
      <AnimatedPressable
        onPress={handleClose}
        disabled={disabled}
        style={[
          styles.closeButton,
          {
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
          },
        ]}
        hitSlop={4}
      >
        <View style={styles.closeIconContainer}>
          {/* X icon - two crossing lines */}
          <View
            style={[
              styles.closeIconLine,
              styles.closeIconLine1,
              {
                backgroundColor: iconColor,
              },
            ]}
          />
          <View
            style={[
              styles.closeIconLine,
              styles.closeIconLine2,
              {
                backgroundColor: iconColor,
              },
            ]}
          />
        </View>
      </AnimatedPressable>
    )
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={style ? [...chipStyles, style] : chipStyles}
      {...interactiveProps}
      {...pressableProps}
    >
      {renderLeadingContent()}

      {typeof children === 'string' ? (
        <Text style={[...textStyles, textStyle]} numberOfLines={1}>
          {children}
        </Text>
      ) : (
        children
      )}

      {renderCloseIcon()}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.max, // Fully rounded (pill shape)
    borderWidth: 1,
  },
  focusRing: {
    shadowColor: colors.icon.light['300'],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  text: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
    padding: spacing[2],
  },
  closeIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeIconLine: {
    position: 'absolute',
    width: 10,
    height: 1.5,
    borderRadius: 0.75,
  },
  closeIconLine1: {
    transform: [{ rotate: '45deg' }],
  },
  closeIconLine2: {
    transform: [{ rotate: '-45deg' }],
  },
})
