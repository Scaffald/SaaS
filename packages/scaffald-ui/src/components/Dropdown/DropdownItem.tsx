/**
 * Dropdown Item component
 * Individual menu item for Dropdown component
 * Mapped from Figma Forsured Design System
 */

import { Pressable, Text, View } from 'react-native'
import type { DropdownItemProps, DropdownItemState } from './Dropdown.types'
import { getDropdownStyles } from './Dropdown.styles'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

/**
 * Simple right arrow icon for submenu indicator
 */
function SubmenuArrowIcon({ size, color }: { size: number; color: string }) {
  // Simple right arrow using View borders
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: size / 3,
          borderBottomWidth: size / 3,
          borderLeftWidth: size / 2,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
          borderRightColor: 'transparent',
        }}
      />
    </View>
  )
}

/**
 * Placeholder Toggle component (until proper Toggle is implemented)
 */
function PlaceholderToggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange?.(!value)}
      disabled={disabled}
      style={toggleContainerStyle}
    >
      <View
        style={[
          toggleTrackStyle,
          value && { backgroundColor: colors.primary[500] },
          disabled && { opacity: 0.5 },
        ]}
      >
        <View style={[toggleThumbStyle, value && { transform: [{ translateX: 16 }] }]} />
      </View>
    </Pressable>
  )
}

const toggleContainerStyle = {
  padding: spacing[2],
}

const toggleTrackStyle = {
  width: 32,
  height: 16,
  borderRadius: 8,
  backgroundColor: colors.gray[300],
  justifyContent: 'center' as const,
  paddingHorizontal: 2,
}

const toggleThumbStyle = {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.white,
}

export function DropdownItem({
  children,
  type = 'menu-item',
  state: controlledState,
  checked = false,
  selected = false,
  disabled = false,
  icon: Icon,
  avatar,
  flag,
  showToggle = false,
  toggleValue = false,
  onToggleChange,
  badge,
  shortcut,
  hasSubmenu = false,
  onPress,
  style,
  textStyle,
  ...pressableProps
}: DropdownItemProps) {
  const styles = getDropdownStyles()

  // Determine actual state
  const actualState: DropdownItemState = disabled
    ? 'disabled'
    : controlledState || (selected ? 'active' : 'default')

  const isDisabled = actualState === 'disabled' || disabled
  const isSelected = selected || checked || actualState === 'active'

  // Build item styles based on state
  const itemStyles = [
    styles.item,
    actualState === 'hover' && styles.itemHover,
    isSelected && styles.itemActive,
    isDisabled && {
      opacity: 0.5,
    },
    style,
  ]

  const textStyles = [
    styles.itemText,
    isDisabled && {
      color: colors.text.light.disabled,
    },
    textStyle,
  ]

  // Determine what to render in the leading position (priority: flag > avatar > icon > checkbox)
  const renderLeadingContent = () => {
    if (flag) {
      return <View style={{ width: 20, height: 20 }}>{flag}</View>
    }
    if (avatar) {
      return <View style={styles.avatar}>{avatar}</View>
    }
    if (Icon) {
      return <Icon size={20} color={styles.iconColor} />
    }
    if (checked) {
      return (
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={checkboxCheckmarkStyle}>✓</Text>}
        </View>
      )
    }
    // Reserve space even if nothing is shown
    return <View style={{ width: 20, height: 20 }} />
  }

  // Render trailing content (shortcut, badge, toggle, submenu arrow)
  const renderTrailingContent = () => {
    if (showToggle) {
      return (
        <PlaceholderToggle
          value={toggleValue}
          onValueChange={onToggleChange}
          disabled={isDisabled}
        />
      )
    }
    if (badge) {
      return (
        <View style={styles.badge}>
          {typeof badge === 'string' ? <Text style={styles.badgeText}>{badge}</Text> : badge}
        </View>
      )
    }
    if (shortcut) {
      return <Text style={styles.shortcut}>{shortcut}</Text>
    }
    if (hasSubmenu) {
      return (
        <View style={styles.submenuArrow}>
          <SubmenuArrowIcon size={20} color={styles.iconColor} />
        </View>
      )
    }
    return null
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...itemStyles,
        pressed && !isDisabled && actualState !== 'hover' && styles.itemHover,
      ]}
      {...pressableProps}
    >
      {/* Leading content (flag, avatar, icon, or checkbox) */}
      {renderLeadingContent()}

      {/* Item Text */}
      <Text style={textStyles} numberOfLines={1}>
        {children}
      </Text>

      {/* Trailing content (toggle, badge, shortcut, or submenu arrow) */}
      {renderTrailingContent()}
    </Pressable>
  )
}

const checkboxCheckmarkStyle = {
  color: colors.white,
  fontSize: 14,
  fontWeight: 'bold' as const,
}
