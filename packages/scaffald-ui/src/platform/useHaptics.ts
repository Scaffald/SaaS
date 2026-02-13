/**
 * useHaptics hook
 * Provides haptic feedback for native platforms
 *
 * On iOS: Uses Haptic Engine (UIImpactFeedbackGenerator)
 * On Android: Uses Vibration API
 * On Web: Falls back to no-op (or Vibration API if available)
 *
 * @example
 * ```tsx
 * import { useHaptics } from '@scaffald/ui'
 *
 * function Button() {
 *   const haptics = useHaptics()
 *
 *   const handlePress = () => {
 *     haptics.impact('light')
 *     // Handle press...
 *   }
 *
 *   return <Pressable onPress={handlePress}>...</Pressable>
 * }
 * ```
 */

import { useCallback, useMemo } from 'react'
import { Vibration } from 'react-native'
import { Platform } from './Platform'

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
export type HapticNotificationType = 'success' | 'warning' | 'error'

export interface UseHapticsReturn {
  /**
   * Trigger impact haptic feedback
   * @param style The intensity/style of the impact
   */
  impact: (style?: HapticImpactStyle) => void

  /**
   * Trigger notification haptic feedback
   * @param type The type of notification
   */
  notification: (type: HapticNotificationType) => void

  /**
   * Trigger selection change haptic feedback
   */
  selection: () => void

  /**
   * Whether haptics are available on this platform
   */
  isAvailable: boolean
}

// Try to import expo-haptics if available
let ExpoHaptics: any = null
try {
  ExpoHaptics = require('expo-haptics')
} catch {
  // expo-haptics not installed
}

/**
 * Vibration patterns for different haptic styles (Android fallback)
 */
const VIBRATION_PATTERNS: {
  light: number
  medium: number
  heavy: number
  rigid: number
  soft: number
  success: number[]
  warning: number[]
  error: number[]
  selection: number
} = {
  light: 10,
  medium: 20,
  heavy: 40,
  rigid: 15,
  soft: 5,
  success: [0, 50, 50, 50],
  warning: [0, 100, 50, 100],
  error: [0, 100, 50, 100, 50, 100],
  selection: 5,
}

/**
 * Hook for haptic feedback across platforms
 */
export function useHaptics(): UseHapticsReturn {
  const isAvailable = useMemo(() => {
    // Haptics available on native platforms
    if (Platform.isNative) {
      return true
    }
    // On web, check for Vibration API
    if (Platform.isWeb && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      return true
    }
    return false
  }, [])

  const impact = useCallback(
    (style: HapticImpactStyle = 'medium') => {
      if (!isAvailable) return

      // Use expo-haptics if available (best experience on iOS)
      if (ExpoHaptics) {
        const styleMap: Record<HapticImpactStyle, any> = {
          light: ExpoHaptics.ImpactFeedbackStyle?.Light,
          medium: ExpoHaptics.ImpactFeedbackStyle?.Medium,
          heavy: ExpoHaptics.ImpactFeedbackStyle?.Heavy,
          rigid: ExpoHaptics.ImpactFeedbackStyle?.Rigid,
          soft: ExpoHaptics.ImpactFeedbackStyle?.Soft,
        }
        ExpoHaptics.impactAsync?.(styleMap[style] ?? ExpoHaptics.ImpactFeedbackStyle?.Medium)
        return
      }

      // Fallback to Vibration API
      const pattern = VIBRATION_PATTERNS[style]
      if (Platform.isNative) {
        Vibration.vibrate(pattern)
      } else if (Platform.isWeb && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    },
    [isAvailable]
  )

  const notification = useCallback(
    (type: HapticNotificationType) => {
      if (!isAvailable) return

      // Use expo-haptics if available
      if (ExpoHaptics) {
        const typeMap: Record<HapticNotificationType, any> = {
          success: ExpoHaptics.NotificationFeedbackType?.Success,
          warning: ExpoHaptics.NotificationFeedbackType?.Warning,
          error: ExpoHaptics.NotificationFeedbackType?.Error,
        }
        ExpoHaptics.notificationAsync?.(typeMap[type] ?? ExpoHaptics.NotificationFeedbackType?.Success)
        return
      }

      // Fallback to Vibration API
      const pattern = VIBRATION_PATTERNS[type]
      if (Platform.isNative) {
        Vibration.vibrate(pattern)
      } else if (Platform.isWeb && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    },
    [isAvailable]
  )

  const selection = useCallback(() => {
    if (!isAvailable) return

    // Use expo-haptics if available
    if (ExpoHaptics) {
      ExpoHaptics.selectionAsync?.()
      return
    }

    // Fallback to Vibration API
    const pattern = VIBRATION_PATTERNS.selection
    if (Platform.isNative) {
      Vibration.vibrate(pattern)
    } else if (Platform.isWeb && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [isAvailable])

  return {
    impact,
    notification,
    selection,
    isAvailable,
  }
}
