/**
 * ToolbarButton — iOS 26 toolbar action button
 *
 * Supports icon, text, filled (tinted), and back-chevron variants.
 * Used as an atomic building block inside NavigationBar and BottomToolbar.
 *
 * @example
 * ```tsx
 * <ToolbarButton icon={<Plus size={22} />} onPress={handleAdd} />
 * <ToolbarButton variant="text" label="Edit" onPress={handleEdit} />
 * <ToolbarButton variant="filled" label="Done" onPress={handleDone} />
 * <ToolbarButton variant="back" label="Back" onPress={handleBack} />
 * ```
 */

import type React from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '../Typography'
import type { ToolbarButtonProps } from './ToolbarButton.types'
import { getToolbarButtonStyles } from './ToolbarButton.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function ToolbarButton({
  icon,
  label,
  variant = 'icon',
  onPress,
  disabled = false,
  tintColor,
  style,
  accessibilityLabel,
  testID,
}: ToolbarButtonProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getToolbarButtonStyles, [theme] as const)

  const effectiveTint = tintColor ?? styles.tintColor

  const renderContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <View style={styles.iconButton}>
            {icon}
          </View>
        )

      case 'text':
        return (
          <View style={styles.textButton}>
            <Text style={{ ...styles.textLabel, ...(tintColor ? { color: tintColor } : undefined) }}>
              {label}
            </Text>
          </View>
        )

      case 'filled':
        return (
          <View
            style={[
              styles.filledButton,
              tintColor ? { backgroundColor: tintColor } : undefined,
            ]}
          >
            <Text style={styles.filledLabel}>{label}</Text>
          </View>
        )

      case 'back':
        return (
          <View style={styles.backButton}>
            <Text style={{ ...styles.backChevron, ...(tintColor ? { color: effectiveTint } : undefined) }}>
              ‹
            </Text>
            {label != null && (
              <Text style={{ ...styles.backLabel, ...(tintColor ? { color: effectiveTint } : undefined) }}>
                {label}
              </Text>
            )}
          </View>
        )
    }
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      style={[
        { opacity: disabled ? 0.4 : 1 },
        ({ pressed }) => pressed && !disabled ? { opacity: 0.6 } : undefined,
        style,
      ] as any}
    >
      {renderContent()}
    </Pressable>
  )
}
