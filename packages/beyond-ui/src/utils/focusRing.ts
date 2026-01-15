/**
 * Focus Ring Utilities
 * Standardizes focus ring application across components
 *
 * This utility provides consistent focus ring styles that are applied
 * across interactive components like Checkbox, Radio, Toggle, Button,
 * Accordion, Input, SelectionCard, etc.
 *
 * @example
 * ```tsx
 * function Button({ disabled }) {
 *   const [isFocused, setIsFocused] = useState(false)
 *
 *   return (
 *     <Pressable
 *       style={[
 *         styles.button,
 *         getFocusRingStyle(isFocused, disabled, 'button'),
 *       ]}
 *     >
 *       Button Text
 *     </Pressable>
 *   )
 * }
 * ```
 */

import { Platform, type ViewStyle } from 'react-native'
import { boxShadows } from '../tokens/shadows'
import type { ThemeMode } from '../theme'

export type ShadowType = 'base' | 'button' | 'card' | 'dropdown'

/**
 * Get focus ring style for an element
 *
 * Only applies on web when element is focused and not disabled.
 * Returns empty object on native platforms.
 *
 * @param isFocused - Whether the element is focused
 * @param disabled - Whether the element is disabled
 * @param shadowType - Type of shadow to apply with focus ring
 * @returns ViewStyle with focus ring or empty object
 */
export function getFocusRingStyle(
  isFocused: boolean,
  disabled: boolean = false,
  shadowType: 'base' | 'button' = 'base'
): ViewStyle {
  // Don't show focus ring if not focused, disabled, or on native
  if (!isFocused || disabled || Platform.OS !== 'web') {
    return {}
  }

  // Combine focus ring with optional shadow
  const shadow =
    shadowType === 'button'
      ? `${boxShadows.focusBase}, ${boxShadows.button}`
      : boxShadows.focusBase

  return { boxShadow: shadow } as ViewStyle
}

/**
 * Get platform-specific shadow style
 *
 * On web, uses box-shadow. On native, uses elevation.
 * Does not include focus ring - use getFocusRingStyle for that.
 *
 * @param shadowType - Type of shadow to apply
 * @param _theme - Current theme mode (for future theming support)
 * @returns ViewStyle with platform-appropriate shadow
 */
export function getPlatformShadowStyle(
  shadowType: ShadowType,
  _theme?: ThemeMode
): ViewStyle {
  return Platform.select({
    web: {
      boxShadow: boxShadows[shadowType],
    } as ViewStyle,
    default: {
      // Native platforms use elevation
      elevation: shadowType === 'card' ? 2 : 1,
    } as ViewStyle,
  })
}

/**
 * Get combined focus ring and shadow style
 *
 * Convenience function that combines getFocusRingStyle and getPlatformShadowStyle.
 * Useful for elements that need both a base shadow and a focus ring.
 *
 * @param isFocused - Whether the element is focused
 * @param disabled - Whether the element is disabled
 * @param shadowType - Type of shadow to apply
 * @param theme - Current theme mode
 * @returns ViewStyle with combined shadow and focus ring
 */
export function getCombinedFocusStyle(
  isFocused: boolean,
  disabled: boolean,
  shadowType: ShadowType,
  theme?: ThemeMode
): ViewStyle {
  if (Platform.OS !== 'web') {
    return getPlatformShadowStyle(shadowType, theme)
  }

  // On web, combine base shadow with focus ring if focused
  const baseShadow = boxShadows[shadowType]

  if (!isFocused || disabled) {
    return { boxShadow: baseShadow } as ViewStyle
  }

  return {
    boxShadow: `${boxShadows.focusBase}, ${baseShadow}`,
  } as ViewStyle
}
