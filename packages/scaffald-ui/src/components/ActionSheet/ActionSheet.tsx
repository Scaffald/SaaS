/**
 * ActionSheet component
 * iOS 26 glassmorphic action sheet with stacked pill buttons
 *
 * @example
 * ```tsx
 * import { ActionSheet } from '@scaffald/ui'
 *
 * <ActionSheet
 *   visible={showSheet}
 *   onClose={() => setShowSheet(false)}
 *   title="Delete Photo"
 *   description="This action cannot be undone."
 *   actions={[
 *     { label: 'Delete', onPress: handleDelete, destructive: true },
 *     { label: 'Save to Files', onPress: handleSave },
 *   ]}
 * />
 * ```
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Modal,
  Pressable,
  Text,
  View,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import type { ActionSheetProps } from './ActionSheet.types'
import { getActionSheetStyles } from './ActionSheet.styles'
import { useThemeContext } from '../../theme'

export function ActionSheet({
  visible,
  onClose,
  title,
  description,
  actions,
  cancelLabel = 'Cancel',
  style,
}: ActionSheetProps) {
  const { theme } = useThemeContext()
  const styles = useMemo(() => getActionSheetStyles(theme), [theme])
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 25,
          stiffness: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start()
    }
  }, [visible, fadeAnim, slideAnim])

  const handleActionPress = useCallback(
    (onPress: () => void) => {
      onPress()
      onClose()
    },
    [onClose]
  )

  const screenHeight = Dimensions.get('window').height

  return (
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
          accessibilityLabel="Close action sheet"
        />

        {/* Action Sheet Content */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight * 0.5, 0],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          {/* Title and Description */}
          {(title || description) && (
            <View style={styles.titleArea}>
              {title && <Text style={styles.titleText}>{title}</Text>}
              {description && (
                <Text style={styles.descriptionText}>{description}</Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && !action.disabled && styles.actionButtonPressed,
                ]}
                onPress={() =>
                  !action.disabled && handleActionPress(action.onPress)
                }
                disabled={action.disabled}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text
                  style={
                    action.disabled
                      ? styles.disabledText
                      : action.destructive
                        ? styles.destructiveText
                        : styles.actionText
                  }
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cancel Button */}
          {cancelLabel !== null && (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

ActionSheet.displayName = 'ActionSheet'
