/**
 * CommandShortcut component
 * Displays keyboard shortcuts with proper formatting
 *
 * @example
 * ```tsx
 * import { CommandShortcut } from '@scaffald/ui'
 *
 * // Single key
 * <CommandShortcut variant="Single" keys={["Esc"]} />
 *
 * // Two-key combination (platform-aware)
 * <CommandShortcut variant="Double" keys={["⌘", "K"]} />
 *
 * // Arrow key
 * <CommandShortcut variant="Arrow" keys={["↑"]} />
 * ```
 */

import { View, Text, Platform } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import type { CommandShortcutProps } from './CommandShortcut.types'
import { colors } from '../../../tokens/colors'
import { fontFamily, fontSize, lineHeight, fontWeight } from '../../../tokens/typography'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'

/**
 * Map arrow key names to arrow symbols
 */
const ARROW_SYMBOLS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  '↑': '↑',
  '↓': '↓',
  '←': '←',
  '→': '→',
}

/**
 * Format a single key for display
 */
function formatKey(key: string): string {
  // Handle arrow keys
  if (ARROW_SYMBOLS[key]) {
    return ARROW_SYMBOLS[key]
  }

  // Handle modifier keys
  if (key === 'Meta' || key === '⌘' || key === 'Cmd') {
    return Platform.OS === 'ios' || Platform.OS === 'macos' ? '⌘' : 'Ctrl'
  }

  if (key === 'Control' || key === 'Ctrl') {
    return 'Ctrl'
  }

  if (key === 'Alt' || key === 'Option') {
    return Platform.OS === 'ios' || Platform.OS === 'macos' ? '⌥' : 'Alt'
  }

  if (key === 'Shift') {
    return '⇧'
  }

  // Return the key as-is (capitalized if single character)
  if (key.length === 1) {
    return key.toUpperCase()
  }

  return key
}

export function CommandShortcut({
  variant = 'Single',
  keys,
  style,
  textStyle,
}: CommandShortcutProps) {
  if (!keys || keys.length === 0) {
    return null
  }

  const formattedKeys = keys.map(formatKey)

  // Determine padding based on variant
  // Arrows: 2px horizontal, Text keys: 4px horizontal
  const paddingHorizontal = variant === 'Arrow' ? spacing[2] : spacing[4]

  // Container style
  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg.light.default,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    borderRadius: borderRadius.xs, // radius-xs = 6px
    paddingHorizontal,
    paddingVertical: spacing[0],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(variant === 'Arrow' && { width: 20, height: 20 }), // 20px size for arrows from Figma
    ...style,
  }

  // Text style
  const defaultTextStyle: TextStyle = {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
    color: colors.text.light.secondary,
    ...textStyle,
  }

  if (variant === 'Arrow') {
    // Arrow variant: just display the arrow symbol
    return (
      <View style={containerStyle}>
        <Text style={defaultTextStyle}>{formattedKeys[0]}</Text>
      </View>
    )
  }

  if (variant === 'Double' && formattedKeys.length >= 2) {
    // Double variant: display two keys with proper spacing
    return (
      <View style={containerStyle}>
        <Text style={defaultTextStyle}>{formattedKeys[0]}</Text>
        <Text style={[defaultTextStyle, { marginLeft: spacing[4] }]}>
          {formattedKeys[1]}
        </Text>
      </View>
    )
  }

  // Single variant: display single key
  return (
    <View style={containerStyle}>
      <Text style={defaultTextStyle}>{formattedKeys[0]}</Text>
    </View>
  )
}
