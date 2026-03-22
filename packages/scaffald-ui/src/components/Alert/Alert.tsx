/**
 * Alert component
 * iOS 26 glassmorphic modal alert with backward-compatible inline mode
 *
 * When `primaryAction`, `destructiveAction`, or `secondaryAction` props are provided
 * the alert renders as an iOS 26 modal overlay.  Otherwise the legacy inline style
 * is used for full backward compatibility.
 *
 * @example
 * ```tsx
 * import { Alert } from '@scaffald/ui'
 *
 * // iOS 26 modal alert with stacked buttons
 * <Alert
 *   visible={show}
 *   onClose={() => setShow(false)}
 *   title="Delete Photo"
 *   description="This action cannot be undone."
 *   destructiveAction={{ label: 'Delete', onPress: handleDelete }}
 *   secondaryAction={{ label: 'Cancel', onPress: () => setShow(false) }}
 * />
 *
 * // iOS 26 modal with text fields and side-by-side buttons
 * <Alert
 *   visible={show}
 *   onClose={() => setShow(false)}
 *   title="Sign In"
 *   textFields={[
 *     { value: email, placeholder: 'Email', onChangeText: setEmail },
 *     { value: password, placeholder: 'Password', onChangeText: setPassword, secureTextEntry: true },
 *   ]}
 *   primaryAction={{ label: 'Sign In', onPress: handleSignIn }}
 *   secondaryAction={{ label: 'Cancel', onPress: () => setShow(false) }}
 *   layout="side-by-side"
 * />
 *
 * // Legacy inline alert (backward compatible)
 * <Alert
 *   title="Information"
 *   description="This is an informational message"
 *   type="info"
 *   actions={[
 *     { label: 'Undo', onPress: () => console.log('Undo') },
 *     { label: 'View', onPress: () => console.log('View') },
 *   ]}
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native'
import type { AlertProps, AlertAction } from './Alert.types'
import { useThemeContext } from '../../theme'
import { getAlertStyles } from './Alert.styles'
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
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  X,
} from 'lucide-react-native'

export function Alert(props: AlertProps) {
  const {
    primaryAction,
    destructiveAction,
    secondaryAction,
    textFields,
    layout,
  } = props

  // Determine whether to render as iOS 26 modal or legacy inline
  const isModal = !!(primaryAction || destructiveAction || secondaryAction || textFields)

  if (isModal) {
    return <AlertModal {...props} />
  }

  return <AlertInline {...props} />
}

// ─── iOS 26 Modal Alert ──────────────────────────────────────────────────────

function AlertModal({
  title,
  description,
  primaryAction,
  destructiveAction,
  secondaryAction,
  layout = 'stacked',
  textFields,
  visible,
  defaultVisible = true,
  onClose,
  dismissible = true,
  style,
  titleStyle,
  descriptionStyle,
}: AlertProps) {
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const isControlled = visible !== undefined
  const isVisible = isControlled ? visible : internalVisible

  const { theme } = useThemeContext()
  const styles = useMemo(() => getAlertStyles(theme), [theme])

  const handleClose = () => {
    if (!isControlled) setInternalVisible(false)
    onClose?.()
  }

  // Collect buttons in render order
  const buttons: { action: AlertAction; variant: 'primary' | 'destructive' | 'secondary' }[] = []

  if (layout === 'side-by-side') {
    // Side-by-side: secondary on left, primary on right
    if (secondaryAction) buttons.push({ action: secondaryAction, variant: 'secondary' })
    if (primaryAction) buttons.push({ action: primaryAction, variant: 'primary' })
    if (destructiveAction) buttons.push({ action: destructiveAction, variant: 'destructive' })
  } else {
    // Stacked: primary first, then destructive, then secondary
    if (primaryAction) buttons.push({ action: primaryAction, variant: 'primary' })
    if (destructiveAction) buttons.push({ action: destructiveAction, variant: 'destructive' })
    if (secondaryAction) buttons.push({ action: secondaryAction, variant: 'secondary' })
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? handleClose : undefined}
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}
        onPress={dismissible ? handleClose : undefined}
        accessibilityRole="button"
        accessibilityLabel="Close alert"
      >
        <Pressable
          style={[styles.container, style]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
        >
          {/* Title & Description */}
          <View style={styles.textArea}>
            <Text
              style={[styles.title, titleStyle]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            {description ? (
              <Text style={[styles.description, descriptionStyle]}>
                {description}
              </Text>
            ) : null}
          </View>

          {/* Text Fields */}
          {textFields && textFields.length > 0 && (
            <View style={styles.textFieldsContainer}>
              {textFields.map((field, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.textFieldSeparator} />}
                  <TextInput
                    style={styles.textFieldInput}
                    value={field.value}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.labels[theme].tertiary}
                    onChangeText={field.onChangeText}
                    secureTextEntry={field.secureTextEntry}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Buttons */}
          {buttons.length > 0 && (
            <View
              style={
                layout === 'side-by-side'
                  ? styles.buttonsSideBySide
                  : styles.buttonsStacked
              }
            >
              {buttons.map(({ action, variant }) => {
                const bgStyle =
                  variant === 'primary'
                    ? styles.buttonPrimary
                    : variant === 'destructive'
                      ? styles.buttonDestructive
                      : styles.buttonSecondary

                const textStyle =
                  variant === 'primary'
                    ? styles.buttonPrimaryText
                    : variant === 'destructive'
                      ? styles.buttonDestructiveText
                      : styles.buttonSecondaryText

                return (
                  <Pressable
                    key={action.label}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    style={({ pressed }) => [
                      styles.buttonBase,
                      bgStyle,
                      layout === 'side-by-side' && styles.buttonSideBySideItem,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[textStyle, action.style]}>
                      {action.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Legacy Inline Alert (backward compatible) ───────────────────────────────

function AlertInline({
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
        return (
          <AlertTriangle size={iconSize} color={iconColor} fill={iconColor} />
        )
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
        inlineStyles.container,
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
          borderTopColor: isLight
            ? colors.border.light.default
            : colors.border.dark.default,
          borderRightColor: isLight
            ? colors.border.light.default
            : colors.border.dark.default,
          borderBottomColor: isLight
            ? colors.border.light.default
            : colors.border.dark.default,
        },
        style,
      ]}
    >
      {/* Header row with icon, content, and close button */}
      <View style={inlineStyles.header}>
        {/* Icon */}
        <View style={inlineStyles.iconContainer}>{renderIcon()}</View>

        {/* Content area */}
        <View
          style={[
            inlineStyles.contentArea,
            actionsPosition === 'right' &&
              limitedActions.length > 0 &&
              inlineStyles.contentAreaWithRightActions,
          ]}
        >
          {/* Title and description */}
          <View style={inlineStyles.textContainer}>
            <Text
              style={[inlineStyles.title, { color: titleColor }, titleStyle]}
            >
              {title}
            </Text>
            {description && (
              <Text
                style={[
                  inlineStyles.description,
                  { color: descriptionColor },
                  descriptionStyle,
                ]}
              >
                {description}
              </Text>
            )}
          </View>

          {/* Actions - bottom position */}
          {actionsPosition === 'bottom' && limitedActions.length > 0 && (
            <View style={inlineStyles.actionsBottom}>
              {renderActions(limitedActions, actionColor)}
            </View>
          )}
        </View>

        {/* Actions - right position */}
        {actionsPosition === 'right' && limitedActions.length > 0 && (
          <View style={inlineStyles.actionsRight}>
            {renderActions(limitedActions, actionColor)}
          </View>
        )}

        {/* Close button */}
        {dismissible && (
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close alert"
            style={({ pressed }) => [
              inlineStyles.closeButton,
              pressed && inlineStyles.closeButtonPressed,
            ]}
          >
            <X size={24} color={closeColor} />
          </Pressable>
        )}
      </View>
    </View>
  )

  // Render action buttons
  function renderActions(
    actionList: typeof limitedActions,
    color: string
  ) {
    return actionList.map((action) => (
      <Pressable
        key={action.label}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={({ pressed }) => [
          inlineStyles.actionButton,
          pressed && inlineStyles.actionButtonPressed,
        ]}
      >
        <Text style={[inlineStyles.actionText, { color }, action.style]}>
          {action.label}
        </Text>
      </Pressable>
    ))
  }
}

const inlineStyles = StyleSheet.create({
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
