/**
 * Alert component
 * Versatile alert/notification component with multiple types and styles
 *
 * @example
 * ```tsx
 * import { Alert } from '@scaffald/ui'
 *
 * // Basic info alert
 * <Alert title="Information" description="This is an informational message" />
 *
 * // Success alert with actions
 * <Alert
 *   type="success"
 *   variant="filled"
 *   title="Success!"
 *   description="Your changes have been saved"
 *   actions={[
 *     { label: 'Undo', onPress: () => console.log('Undo') },
 *     { label: 'View', onPress: () => console.log('View') }
 *   ]}
 * />
 *
 * // Controlled dismissible alert
 * <Alert
 *   title="Warning"
 *   type="warning"
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { AlertProps } from './Alert.types'
import { useThemeContext } from '../../theme'
import {
  getBackgroundColor,
  getTextColor,
  getIconColor,
  getCloseIconColor,
  getActionTextColor,
  getAlertColors,
} from './Alert.utils'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { colors } from '../../tokens/colors'
import { borderWidth } from '../../tokens/borders'

// Import Lucide icons
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, Sparkles, X } from 'lucide-react-native'

export function Alert({
  title,
  type = 'info',
  variant = 'linear',
  description,
  actions = [],
  actionsPosition = 'bottom',
  visible,
  defaultVisible = true,
  onClose,
  dismissible = true,
  style,
  titleStyle,
  descriptionStyle,
}: AlertProps) {
  // Controlled/uncontrolled visibility state
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const isControlled = visible !== undefined
  const isVisible = isControlled ? visible : internalVisible

  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  // Limit actions to max 2
  const limitedActions = actions.slice(0, 2)

  // Warn if more than 2 actions provided
  if (actions.length > 2 && __DEV__) {
    console.warn(
      `Alert: Maximum 2 actions are supported. Provided ${actions.length} actions. Only the first 2 will be rendered.`
    )
  }

  // Handle close/dismiss
  const handleClose = () => {
    if (!isControlled) {
      setInternalVisible(false)
    }
    onClose?.()
  }

  // Get icon component based on type
  const renderIcon = () => {
    const iconColor = getIconColor(variant, type)
    const iconSize = 24

    switch (type) {
      case 'info':
        return <AlertCircle size={iconSize} color={iconColor} fill={iconColor} />
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} fill={iconColor} />
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} fill={iconColor} />
      case 'error':
        return <XCircle size={iconSize} color={iconColor} fill={iconColor} />
      case 'ai':
        return <Sparkles size={iconSize} color={iconColor} fill={iconColor} />
      default:
        return <AlertCircle size={iconSize} color={iconColor} fill={iconColor} />
    }
  }

  // Get colors for current variant
  const backgroundColor = getBackgroundColor(variant, type, theme)
  const titleColor = getTextColor(variant, theme, 'title')
  const descriptionColor = getTextColor(variant, theme, 'description')
  const closeColor = getCloseIconColor(variant, theme)
  const actionColor = getActionTextColor(variant, type, theme)
  const alertColors = getAlertColors(type)

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderRadius: borderRadius.l,
        },
        // Add border styles for linear variant
        variant === 'linear' && {
          borderLeftWidth: 4,
          borderLeftColor: alertColors.border,
          borderTopWidth: borderWidth.thin,
          borderRightWidth: borderWidth.thin,
          borderBottomWidth: borderWidth.thin,
          borderTopColor: isLight ? colors.border.light.default : colors.border.dark.default,
          borderRightColor: isLight ? colors.border.light.default : colors.border.dark.default,
          borderBottomColor: isLight ? colors.border.light.default : colors.border.dark.default,
        },
        style,
      ]}
    >
      {/* Header row with icon, content, and close button */}
      <View style={styles.header}>
        {/* Icon */}
        <View style={styles.iconContainer}>{renderIcon()}</View>

        {/* Content area */}
        <View
          style={[
            styles.contentArea,
            actionsPosition === 'right' &&
              limitedActions.length > 0 &&
              styles.contentAreaWithRightActions,
          ]}
        >
          {/* Title and description */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: titleColor }, titleStyle]}>{title}</Text>
            {description && (
              <Text style={[styles.description, { color: descriptionColor }, descriptionStyle]}>
                {description}
              </Text>
            )}
          </View>

          {/* Actions - bottom position */}
          {actionsPosition === 'bottom' && limitedActions.length > 0 && (
            <View style={styles.actionsBottom}>{renderActions(limitedActions, actionColor)}</View>
          )}
        </View>

        {/* Actions - right position */}
        {actionsPosition === 'right' && limitedActions.length > 0 && (
          <View style={styles.actionsRight}>{renderActions(limitedActions, actionColor)}</View>
        )}

        {/* Close button */}
        {dismissible && (
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close alert"
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <X size={24} color={closeColor} />
          </Pressable>
        )}
      </View>
    </View>
  )

  // Render action buttons
  function renderActions(actionList: typeof limitedActions, color: string) {
    return actionList.map((action) => (
      <Pressable
        key={action.label}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      >
        <Text style={[styles.actionText, { color }, action.style]}>{action.label}</Text>
      </Pressable>
    ))
  }
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  iconContainer: {
    paddingTop: 2, // Align with title baseline
  },
  contentArea: {
    flex: 1,
    gap: spacing[12],
  },
  contentAreaWithRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing[4],
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  actionsBottom: {
    flexDirection: 'row',
    gap: spacing[20],
    alignItems: 'center',
    paddingBottom: spacing[6],
  },
  actionsRight: {
    flexDirection: 'column',
    gap: spacing[4],
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: 0,
    borderRadius: borderRadius.s,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 0,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
})
