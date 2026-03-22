/**
 * ToolbarButtonGroup — iOS 26 grouped toolbar buttons
 *
 * Renders 1-7 toolbar buttons in a row, optionally inside a glass pill container.
 * Used in both top and bottom toolbars.
 *
 * @example
 * ```tsx
 * <ToolbarButtonGroup
 *   buttons={[
 *     { key: 'share', icon: <Share size={22} />, onPress: handleShare },
 *     { key: 'bookmark', icon: <Bookmark size={22} />, onPress: handleBookmark },
 *   ]}
 *   position="bottom"
 *   glass
 * />
 * ```
 */

import type React from 'react'
import { View } from 'react-native'
import { ToolbarButton } from '../ToolbarButton'
import type { ToolbarButtonGroupProps } from './ToolbarButtonGroup.types'
import { getToolbarButtonGroupStyles } from './ToolbarButtonGroup.styles'
import { useStyles } from '../../hooks'
import { useThemeContext } from '../../theme'

export function ToolbarButtonGroup({
  buttons,
  position = 'bottom',
  glass = false,
  style,
  testID,
}: ToolbarButtonGroupProps): React.ReactElement {
  const { theme } = useThemeContext()
  const styles = useStyles(getToolbarButtonGroupStyles, [theme] as const)

  const content = (
    <View style={styles.row} testID={testID}>
      {buttons.map((btn) => (
        <ToolbarButton
          key={btn.key}
          icon={btn.icon}
          label={btn.label}
          variant={btn.variant}
          onPress={btn.onPress}
          disabled={btn.disabled}
          tintColor={btn.tintColor}
          accessibilityLabel={btn.accessibilityLabel}
        />
      ))}
    </View>
  )

  if (glass) {
    return <View style={[styles.container, style]}>{content}</View>
  }

  return <View style={style}>{content}</View>
}
