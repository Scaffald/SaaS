/**
 * EditMenu component
 * iOS 26 floating glassmorphic edit menu for text selection actions
 *
 * @example
 * ```tsx
 * import { EditMenu } from '@scaffald/ui'
 *
 * <EditMenu
 *   visible={showMenu}
 *   actions={[
 *     { label: 'Copy', onPress: handleCopy },
 *     { label: 'Paste', onPress: handlePaste },
 *     { label: 'Delete', onPress: handleDelete, destructive: true },
 *   ]}
 *   onMore={() => setShowFullMenu(true)}
 * />
 * ```
 */

import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { EditMenuProps } from './EditMenu.types'
import { getEditMenuStyles } from './EditMenu.styles'
import { useThemeContext } from '../../theme'

export function EditMenu({ visible, actions, onMore, style }: EditMenuProps) {
  const { theme } = useThemeContext()
  const styles = useMemo(() => getEditMenuStyles(theme), [theme])

  if (!visible) return null

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="toolbar"
      accessibilityLabel="Edit menu"
    >
      {/* Action items with separators */}
      <View style={styles.actionsRow}>
        {actions.map((action, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Separator before all items except the first */}
            {index > 0 && <View style={styles.separator} />}

            <Pressable
              style={styles.actionItem}
              onPress={action.onPress}
              disabled={action.disabled}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: action.disabled }}
            >
              <Text
                style={
                  action.disabled
                    ? styles.disabledLabel
                    : action.destructive
                      ? styles.destructiveLabel
                      : styles.actionLabel
                }
              >
                {action.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* More button */}
      {onMore && (
        <Pressable
          style={({ pressed }) => [
            styles.moreButton,
            pressed && styles.moreButtonPressed,
          ]}
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Text style={styles.moreIcon}>{'\u203A'}</Text>
        </Pressable>
      )}
    </View>
  )
}

EditMenu.displayName = 'EditMenu'
