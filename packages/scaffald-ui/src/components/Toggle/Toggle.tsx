/**
 * Toggle component
 * Fully-featured toggle switch component mapped from Figma Forsured Design System
 *
 * Features smooth spring animations for the thumb sliding when Reanimated is available.
 * Falls back to static positioning when Reanimated is not installed.
 *
 * @example
 * ```tsx
 * import { Toggle } from '@scaffald/ui'
 *
 * // Basic toggle
 * <Toggle
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   label="Enable notifications"
 * />
 *
 * // Toggle with helper text
 * <Toggle
 *   checked={darkMode}
 *   onChange={setDarkMode}
 *   label="Dark Mode"
 *   helperText="Switch to dark theme"
 * />
 *
 * // Red-Green toggle (error/success states)
 * <Toggle
 *   checked={isActive}
 *   onChange={setIsActive}
 *   color="red-green"
 *   label="Status"
 * />
 * ```
 */

import { isReanimatedAvailable } from '../../animation'
import type { ToggleProps } from './Toggle.types'
import { ToggleAnimated } from './ToggleAnimated'
import { ToggleStatic } from './ToggleStatic'

export function Toggle(props: ToggleProps) {
  if (isReanimatedAvailable()) {
    return <ToggleAnimated {...props} />
  }
  return <ToggleStatic {...props} />
}

export type { ToggleProps, ToggleSize, ToggleColor, ToggleState } from './Toggle.types'
