/**
 * Shared Utilities
 * Reusable utility functions for common patterns across components
 */

export {
  getFormControlColors,
  getTextColor,
  getBorderColor,
  getBackgroundColor,
  getInteractiveBackgroundColor,
} from './colorConfig'
export type { FormControlColorState, FormControlColors } from './colorConfig'

export {
  getFocusRingStyle,
  getPlatformShadowStyle,
  getCombinedFocusStyle,
} from './focusRing'
export type { ShadowType } from './focusRing'

export {
  resolveResponsiveValue,
  isResponsiveValue,
  resolveResponsiveValues,
} from './responsive'
