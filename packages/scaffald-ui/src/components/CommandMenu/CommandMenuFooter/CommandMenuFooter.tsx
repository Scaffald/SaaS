/**
 * CommandMenuFooter component
 * Footer section displaying keyboard shortcut hints
 *
 * @example
 * ```tsx
 * import { CommandMenuFooter } from '@scaffald/ui'
 *
 * <CommandMenuFooter />
 *
 * // With custom hints
 * <CommandMenuFooter
 *   customHints={[
 *     { keys: ["⌘", "P"], label: "Print" }
 *   ]}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { CommandMenuFooterProps } from './CommandMenuFooter.types'
import { CommandShortcut } from '../CommandShortcut'
import { colors } from '../../../tokens/colors'
import { fontFamily, fontSize, lineHeight, fontWeight } from '../../../tokens/typography'
import { spacing } from '../../../tokens/spacing'

export function CommandMenuFooter({
  navigationHint = true,
  closeHint = true,
  customHints = [],
  style,
  textStyle,
}: CommandMenuFooterProps) {
  // Container style
  const containerStyle = {
    backgroundColor: colors.bg.light.default,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: spacing[20],
    padding: spacing[20],
    ...style,
  }

  // Hint group style (wrap + label)
  const hintGroupStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[8],
  }

  // Label text style
  const labelStyle = {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.light.secondary,
    ...textStyle,
  }

  const hints: Array<{ keys: string[]; label: string; variant?: 'Single' | 'Double' | 'Arrow' }> =
    []

  // Add navigation hints
  if (navigationHint) {
    // Arrow Up/Down + Enter
    hints.push({
      keys: ['↑', '↓'],
      label: 'Navigate',
      variant: 'Arrow',
    })
  }

  // Add close hint
  if (closeHint) {
    hints.push({
      keys: ['Esc'],
      label: 'Close',
      variant: 'Single',
    })
  }

  // Add custom hints
  hints.push(...customHints)

  if (hints.length === 0) {
    return null
  }

  return (
    <View style={containerStyle}>
      {hints.map((hint, index) => (
        <View key={index} style={hintGroupStyle}>
          {hint.variant === 'Arrow' && hint.keys.length >= 2 ? (
            // For navigation, show both arrows
            <View style={{ flexDirection: 'row', gap: spacing[4] }}>
              <CommandShortcut variant="Arrow" keys={[hint.keys[0]]} />
              <CommandShortcut variant="Arrow" keys={[hint.keys[1]]} />
            </View>
          ) : (
            <CommandShortcut
              variant={hint.variant || 'Single'}
              keys={hint.keys}
            />
          )}
          <Text style={labelStyle}>{hint.label}</Text>
        </View>
      ))}
    </View>
  )
}
