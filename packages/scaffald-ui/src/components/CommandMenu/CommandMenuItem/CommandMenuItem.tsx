/**
 * CommandMenuItem component
 * Individual item in the command menu list with support for avatars, icons, or empty state
 *
 * @example
 * ```tsx
 * import { CommandMenuItem } from '@scaffald/ui'
 *
 * // Avatar type with vertical orientation
 * <CommandMenuItem
 *   type="Avatar"
 *   textOrientation="Vertical"
 *   title="Anna Taylor"
 *   subtitle="@annataylor"
 *   avatar={{ src: "avatar.jpg", size: 32 }}
 *   shortcut={["⌘", "K"]}
 * />
 *
 * // Icon type with horizontal orientation
 * <CommandMenuItem
 *   type="Icon"
 *   textOrientation="Horizontal"
 *   title="Search Files"
 *   icon={SearchIcon}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, Platform, type ViewStyle } from 'react-native'
import type { CommandMenuItemProps, CommandMenuItemState } from './CommandMenuItem.types'
import { Avatar } from '../../Avatar'
import { CommandShortcut } from '../CommandShortcut'
import { colors } from '../../../tokens/colors'
import { fontFamily, fontSize, lineHeight, fontWeight } from '../../../tokens/typography'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'

/**
 * Get background color based on state
 */
function getBackgroundColor(state: CommandMenuItemState): string {
  switch (state) {
    case 'Hover':
      return colors.bg.light.subtle
    case 'Focused':
      return colors.bg.light.default
    default:
      return colors.bg.light.default
  }
}

export function CommandMenuItem({
  type = 'Empty',
  textOrientation = 'Vertical',
  title,
  subtitle,
  avatar,
  icon: IconComponent,
  shortcut,
  state: controlledState,
  showShortcut = true,
  style,
  textStyle,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...pressableProps
}: CommandMenuItemProps) {
  const [hoverState, setHoverState] = useState<CommandMenuItemState>('Default')
  const [pressedState, setPressedState] = useState(false)

  // Determine current state
  const currentState: CommandMenuItemState =
    controlledState ||
    (pressedState ? 'Focused' : hoverState)

  const backgroundColor = getBackgroundColor(currentState)

  // Handle press events for hover/focus states
  const handlePressIn = (event: any) => {
    setPressedState(true)
    onPressIn?.(event)
  }

  const handlePressOut = (event: any) => {
    setPressedState(false)
    onPressOut?.(event)
  }

  // Web hover handlers
  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && !controlledState && !disabled) {
      setHoverState('Hover')
    }
  }

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && !controlledState && !disabled) {
      setHoverState('Default')
    }
  }

  // Determine shortcut variant
  const shortcutVariant =
    shortcut && shortcut.length === 1
      ? 'Single'
      : shortcut && shortcut.length === 2
        ? 'Double'
        : 'Single'

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor,
    borderRadius: borderRadius.m, // radius-m = 10px
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  // Info container (left side with avatar/icon and text)
  const infoContainerStyle = {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[8],
    minWidth: 0,
    minHeight: 0,
  }

  // Text container style based on orientation
  const textContainerStyle = {
    flex: 1,
    gap: spacing[4],
    ...(textOrientation === 'Vertical'
      ? {
          flexDirection: 'column' as const,
          alignItems: 'flex-start' as const,
        }
      : {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
        }),
  }

  // Title style
  const titleStyle = {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.light.primary,
    ...textStyle,
  }

  // Subtitle style
  const subtitleStyle = {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
    color: colors.text.light.tertiary,
    ...textStyle,
  }

  // Render avatar, icon, or empty
  const renderLeftContent = () => {
    if (type === 'Avatar' && avatar) {
      return (
        <Avatar
          size={avatar.size || 32}
          src={avatar.src}
          initials={avatar.initials}
          alt={avatar.alt}
          showRing={false}
        />
      )
    }

    if (type === 'Icon' && IconComponent) {
      return (
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <IconComponent size={24} color={colors.text.light.secondary} />
        </View>
      )
    }

    return null
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      onHoverIn={handleMouseEnter}
      onHoverOut={handleMouseLeave}
      style={containerStyle}
      {...pressableProps}
    >
      <View style={infoContainerStyle}>
        {renderLeftContent()}
        <View style={textContainerStyle}>
          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={subtitleStyle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showShortcut && shortcut && shortcut.length > 0 && (
        <CommandShortcut variant={shortcutVariant} keys={shortcut} />
      )}
    </Pressable>
  )
}
