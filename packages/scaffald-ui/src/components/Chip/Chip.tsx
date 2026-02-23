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

import { View, Text, type GestureResponderEvent } from 'react-native'
import { AnimatedPressable } from '../../animation'
import { colors } from '../../tokens/colors'
import type { ChipProps } from './Chip.types'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { useStyles } from '../../hooks'
import { getChipStyles, getChipTextStyles, getChipSizeConfig, staticStyles as styles } from './Chip.styles'

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
  const sizeConfig = getChipSizeConfig(size)

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
  const chipStyles = useStyles(getChipStyles, [size, theme, selected, isHovered, isFocused, disabled] as const)

  // Get text styles
  const textStyles = useStyles(getChipTextStyles, [size, theme, selected, disabled] as const)

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
