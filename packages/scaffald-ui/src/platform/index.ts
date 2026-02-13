/**
 * Platform abstraction layer for Beyond UI
 *
 * Provides unified APIs for platform-specific functionality,
 * reducing scattered Platform.OS checks throughout components.
 *
 * @example
 * ```tsx
 * import {
 *   Platform,
 *   usePlatform,
 *   useHaptics,
 *   useFocusVisible,
 *   useHoverState,
 *   useAccessibilityInfo,
 * } from '@scaffald/ui'
 *
 * function MyComponent() {
 *   const { isWeb, isNative } = usePlatform()
 *   const { isHovered, hoverProps } = useHoverState()
 *   const haptics = useHaptics()
 *
 *   const handlePress = () => {
 *     haptics.impact('light')
 *     // Handle press...
 *   }
 *
 *   return (
 *     <Pressable
 *       {...hoverProps}
 *       onPress={handlePress}
 *       style={[styles.button, isHovered && styles.hovered]}
 *     >
 *       Press me
 *     </Pressable>
 *   )
 * }
 * ```
 */

// Core platform utilities
export { Platform, type PlatformOS, type PlatformSelectOptions } from './Platform'

// Platform detection hook
export { usePlatform, type UsePlatformReturn } from './usePlatform'

// Haptic feedback
export {
  useHaptics,
  type UseHapticsReturn,
  type HapticImpactStyle,
  type HapticNotificationType,
} from './useHaptics'

// Web-specific hooks
export {
  useFocusVisible,
  isFocusVisibleActive,
  type UseFocusVisibleReturn,
  type FocusVisibleProps,
} from './web/useFocusVisible'
export {
  useHoverState,
  type UseHoverStateReturn,
  type UseHoverStateOptions,
  type HoverProps,
} from './web/useHoverState'

// Native-specific hooks
export { useAccessibilityInfo, type UseAccessibilityInfoReturn } from './native/useAccessibilityInfo'
