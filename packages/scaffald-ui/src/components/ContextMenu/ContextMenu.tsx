/**
 * ContextMenu component
 * iOS 26 glassmorphic context menu with quick actions and sectioned items
 *
 * @example
 * ```tsx
 * import { ContextMenu } from '@scaffald/ui'
 *
 * <ContextMenu
 *   visible={showMenu}
 *   onClose={() => setShowMenu(false)}
 *   quickActions={[
 *     { label: 'Copy', icon: <CopyIcon />, onPress: handleCopy },
 *     { label: 'Share', icon: <ShareIcon />, onPress: handleShare },
 *     { label: 'Delete', icon: <TrashIcon />, onPress: handleDelete, destructive: true },
 *   ]}
 *   sections={[
 *     {
 *       items: [
 *         { label: 'Edit', icon: <EditIcon />, onPress: handleEdit },
 *         { label: 'Duplicate', icon: <DuplicateIcon />, onPress: handleDuplicate },
 *       ],
 *     },
 *     {
 *       items: [
 *         { label: 'Delete', icon: <TrashIcon />, onPress: handleDelete, destructive: true },
 *       ],
 *     },
 *   ]}
 * >
 *   <Text>Long press me</Text>
 * </ContextMenu>
 * ```
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Modal,
  Pressable,
  Text,
  View,
  Animated,
  Platform,
} from 'react-native'
import type {
  ContextMenuProps,
  ContextMenuQuickAction,
  ContextMenuAction,
  ContextMenuSection,
} from './ContextMenu.types'
import { getContextMenuStyles } from './ContextMenu.styles'
import { useThemeContext } from '../../theme'

export function ContextMenu({
  children,
  visible,
  onClose,
  quickActions,
  sections,
  style,
}: ContextMenuProps) {
  const { theme } = useThemeContext()
  const styles = useMemo(() => getContextMenuStyles(theme), [theme])
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 22,
          stiffness: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
      ]).start()
    }
  }, [visible, fadeAnim, scaleAnim])

  const handleActionPress = useCallback(
    (onPress?: () => void) => {
      if (onPress) {
        onPress()
      }
      onClose()
    },
    [onClose]
  )

  const renderQuickAction = useCallback(
    (action: ContextMenuQuickAction, index: number) => (
      <Pressable
        key={index}
        style={({ pressed }) => [
          styles.quickActionButton,
          pressed && styles.quickActionButtonPressed,
        ]}
        onPress={() => handleActionPress(action.onPress)}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <View style={styles.quickActionIconArea}>
          {action.icon}
        </View>
        <Text
          style={
            action.destructive
              ? styles.quickActionLabelDestructive
              : styles.quickActionLabel
          }
          numberOfLines={1}
        >
          {action.label}
        </Text>
      </Pressable>
    ),
    [styles, handleActionPress]
  )

  const renderMenuItem = useCallback(
    (item: ContextMenuAction, index: number) => {
      const isDisabled = item.disabled === true
      const isDestructive = item.destructive === true
      const hasSubmenu = item.submenu != null && item.submenu.length > 0

      const labelStyle = isDisabled
        ? styles.menuItemLabelDisabled
        : isDestructive
          ? styles.menuItemLabelDestructive
          : styles.menuItemLabel

      const subtitleStyle = isDisabled
        ? styles.menuItemSubtitleDisabled
        : styles.menuItemSubtitle

      return (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.menuItem,
            pressed && !isDisabled && styles.menuItemPressed,
          ]}
          onPress={() => !isDisabled && handleActionPress(item.onPress)}
          disabled={isDisabled}
          accessibilityRole="menuitem"
          accessibilityLabel={item.label}
          accessibilityState={{ disabled: isDisabled }}
        >
          {/* Leading icon */}
          {item.icon != null && (
            <View style={styles.menuItemLeadingIcon}>
              {item.icon}
            </View>
          )}

          {/* Label and subtitle */}
          <View style={styles.menuItemContent}>
            <Text style={labelStyle} numberOfLines={1}>
              {item.label}
            </Text>
            {item.subtitle != null && (
              <Text style={subtitleStyle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>

          {/* Trailing: shortcut symbols or submenu arrow */}
          {(item.shortcut != null || hasSubmenu) && (
            <View style={styles.menuItemTrailing}>
              {item.shortcut != null
                ? item.shortcut.map((symbol, i) => (
                    <Text key={i} style={styles.menuItemShortcutText}>
                      {symbol}
                    </Text>
                  ))
                : (
                    <Text style={styles.menuItemSubmenuArrow}>
                      {'\u203A'}
                    </Text>
                  )}
            </View>
          )}
        </Pressable>
      )
    },
    [styles, handleActionPress]
  )

  const renderSection = useCallback(
    (section: ContextMenuSection, sectionIndex: number, totalSections: number) => {
      const isLast = sectionIndex === totalSections - 1
      return (
        <View key={sectionIndex}>
          {section.title != null && (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          <View style={styles.menuItemsSection}>
            {section.items.map((item, itemIndex) =>
              renderMenuItem(item, itemIndex)
            )}
          </View>
          {!isLast && (
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
            </View>
          )}
        </View>
      )
    },
    [styles, renderMenuItem]
  )

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          {/* Backdrop press to close */}
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close context menu"
          />

          {/* Context Menu Content */}
          <Animated.View
            style={[
              styles.container,
              {
                opacity: scaleAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
              style,
            ]}
            accessibilityRole="menu"
          >
            {/* Quick Actions Bar */}
            {quickActions != null && quickActions.length > 0 && (
              <>
                <View style={styles.quickActionsBar}>
                  {quickActions.map(renderQuickAction)}
                </View>
                {sections.length > 0 && (
                  <View style={styles.separatorContainer}>
                    <View style={styles.separatorLine} />
                  </View>
                )}
              </>
            )}

            {/* Sections */}
            {sections.map((section, index) =>
              renderSection(section, index, sections.length)
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  )
}

ContextMenu.displayName = 'ContextMenu'
