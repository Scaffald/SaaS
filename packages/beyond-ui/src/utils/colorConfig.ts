/**
 * Color Configuration Utilities
 * Centralizes theme-dependent color resolution
 *
 * This utility eliminates duplicated color calculation logic across
 * form controls like Checkbox, Radio, Toggle, SelectionCard, Input, etc.
 *
 * @example
 * ```tsx
 * function Checkbox({ color, checked, error, disabled }) {
 *   const { theme } = useThemeContext()
 *   const [isHovered, setIsHovered] = useState(false)
 *
 *   const colors = getFormControlColors(color, theme, {
 *     checked,
 *     error,
 *     disabled,
 *     hovered: isHovered,
 *   })
 *
 *   // Use colors.border, colors.background, colors.iconColor
 * }
 * ```
 */

import { colors } from '../tokens/colors'
import type { ThemeMode } from '../theme'

export interface FormControlColorState {
  checked?: boolean
  error?: boolean
  disabled?: boolean
  hovered?: boolean
  focused?: boolean
}

export interface FormControlColors {
  border: string
  background: string
  backgroundHover?: string
  iconColor: string
}

/**
 * Get colors for form controls (Checkbox, Radio, Toggle)
 *
 * @param color - Color variant ('primary' or 'gray')
 * @param theme - Current theme mode
 * @param state - Control state (checked, error, disabled, hovered, focused)
 * @returns Color configuration for the control
 */
export function getFormControlColors(
  color: 'primary' | 'gray',
  theme: ThemeMode,
  state: FormControlColorState
): FormControlColors {
  const { checked, error, disabled, hovered } = state

  // Error state takes precedence
  if (error && !disabled) {
    return {
      border: colors.border[theme].error,
      background: checked ? colors.error[500] : colors.bg[theme].default,
      backgroundHover: hovered && checked ? colors.error[600] : undefined,
      iconColor: colors.bg[theme].default,
    }
  }

  // Primary color variant
  if (color === 'primary') {
    return {
      border: checked ? colors.primary[500] : colors.border[theme].default,
      background: checked ? colors.primary[500] : colors.bg[theme].default,
      backgroundHover: hovered && checked ? colors.primary[600] : undefined,
      iconColor: colors.bg[theme].default,
    }
  }

  // Gray color variant (default)
  return {
    border: checked ? colors.gray[700] : colors.border[theme].default,
    background: checked ? colors.gray[700] : colors.bg[theme].default,
    backgroundHover: hovered && checked ? colors.gray[800] : undefined,
    iconColor: colors.bg[theme].default,
  }
}

/**
 * Get text color based on semantic meaning
 *
 * @param semantic - Semantic text type
 * @param theme - Current theme mode
 * @returns Text color
 */
export function getTextColor(
  semantic: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'error',
  theme: ThemeMode
): string {
  if (semantic === 'error') {
    return colors.error[500]
  }

  return colors.text[theme][semantic] || colors.text[theme].primary
}

/**
 * Get border color based on semantic meaning
 *
 * @param semantic - Semantic border type
 * @param theme - Current theme mode
 * @returns Border color
 */
export function getBorderColor(
  semantic: 'default' | 'emphasis' | 'error',
  theme: ThemeMode
): string {
  if (semantic === 'error') {
    return colors.border[theme].error
  }

  return colors.border[theme][semantic]
}

/**
 * Get background color based on semantic meaning
 *
 * @param semantic - Semantic background type
 * @param theme - Current theme mode
 * @returns Background color
 */
export function getBackgroundColor(
  semantic: 'default' | 'subtle' | 'muted' | 'emphasis',
  theme: ThemeMode
): string {
  return colors.bg[theme][semantic]
}

/**
 * Get interactive background color (handles hover states)
 *
 * @param baseColor - Base background color
 * @param isHovered - Whether element is hovered
 * @param theme - Current theme mode
 * @returns Background color for current state
 */
export function getInteractiveBackgroundColor(
  baseColor: string,
  isHovered: boolean,
  theme: ThemeMode
): string {
  if (!isHovered) {
    return baseColor
  }

  // For hover states, use emphasis background
  // This is a simplified approach - can be enhanced based on specific needs
  return colors.bg[theme].emphasis
}
