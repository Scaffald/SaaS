/**
 * Toast component
 * Individual toast notification element
 */

import type React from 'react'
import { useEffect, useRef, useMemo, useCallback } from 'react'
import { View, Pressable, Animated, StyleSheet, type ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows, } from '../../tokens/shadows'
import { Text, } from '../Typography'
import { Row } from '../Layout'
import { Button } from '../Button'
import type { ToastProps, ToastVariant } from './Toast.types'

// ============================================================================
// Constants
// ============================================================================

const VARIANT_COLORS: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  info: {
    bg: colors.info[50],
    border: colors.info[200],
    icon: colors.info[600],
  },
  success: {
    bg: colors.success[50],
    border: colors.success[200],
    icon: colors.success[600],
  },
  warning: {
    bg: colors.warning[50],
    border: colors.warning[200],
    icon: colors.warning[600],
  },
  error: {
    bg: colors.error[50],
    border: colors.error[200],
    icon: colors.error[600],
  },
}

const DEFAULT_ICONS: Record<ToastVariant, string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠',
  error: '✕',
}

// ============================================================================
// Toast Component
// ============================================================================

/**
 * Toast - Individual toast notification
 *
 * @example
 * <Toast
 *   id="toast-1"
 *   variant="success"
 *   title="Success"
 *   message="Your changes have been saved"
 *   onDismiss={() => {}}
 * />
 */
export function Toast({
  id,
  title,
  message,
  variant = 'info',
  duration = 5000,
  dismissible = true,
  icon,
  action,
  onDismiss,
  style,
  testID,
}: ToastProps): React.ReactElement {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateAnim = useRef(new Animated.Value(-20)).current

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, translateAnim])

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss()
    })
  }, [fadeAnim, translateAnim, onDismiss])

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, handleDismiss])

  const variantColors = VARIANT_COLORS[variant]

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: variantColors.bg,
      borderColor: variantColors.border,
      borderWidth: 1,
      borderRadius: borderRadius.m,
      padding: spacing[12],
      ...shadows.m,
    }),
    [variantColors]
  )

  const iconStyle = useMemo<ViewStyle>(
    () => ({
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: variantColors.icon,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [variantColors]
  )

  const renderIcon = () => {
    if (icon) {
      return <View style={iconStyle}>{icon}</View>
    }

    return (
      <View style={iconStyle}>
        <Text style={{ color: colors.white, fontSize: 12 }}>{DEFAULT_ICONS[variant]}</Text>
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Row gap={12} align="flex-start">
        {renderIcon()}

        <View style={styles.content}>
          {title && (
            <Text weight="semibold" style={styles.title}>
              {title}
            </Text>
          )}
          {typeof message === 'string' ? (
            <Text size="sm" color="secondary">
              {message}
            </Text>
          ) : (
            message
          )}

          {action && (
            <View style={styles.actionContainer}>
              <Button size="sm" variant="text" onPress={action.onPress}>
                {action.label}
              </Button>
            </View>
          )}
        </View>

        {dismissible && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss notification"
            accessibilityRole="button"
          >
            <Text color="secondary">✕</Text>
          </Pressable>
        )}
      </Row>
    </Animated.View>
  )
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: {
    marginBottom: spacing[4],
  },
  actionContainer: {
    marginTop: spacing[8],
  },
  dismissButton: {
    padding: spacing[4],
    marginLeft: spacing[8],
    marginTop: -spacing[4],
    marginRight: -spacing[4],
  },
})
