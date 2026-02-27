/**
 * Accessibility type definitions
 *
 * Types for accessibility-related props and configurations
 * following WCAG 2.1 AAA guidelines.
 */

/**
 * ARIA live politeness setting
 * - 'polite': Announces when user is idle (default for most cases)
 * - 'assertive': Interrupts user immediately (use sparingly)
 * - 'off': No announcement
 */
export type AriaLive = 'polite' | 'assertive' | 'off'

/**
 * ARIA atomic setting
 * - true: Announce entire region when any part changes
 * - false: Only announce changed content
 */
export type AriaAtomic = boolean

/**
 * ARIA relevant setting - what changes should be announced
 */
export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all' | 'additions text'

/**
 * Focusable element reference
 */
export interface FocusableElement {
  focus: () => void
  blur?: () => void
}

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  /** Whether the trap is active */
  enabled?: boolean
  /** Element to focus when trap activates */
  initialFocus?: React.RefObject<FocusableElement>
  /** Element to focus when trap deactivates */
  returnFocus?: React.RefObject<FocusableElement> | boolean
  /** Whether pressing Escape deactivates the trap */
  escapeDeactivates?: boolean
  /** Whether clicking outside deactivates the trap */
  clickOutsideDeactivates?: boolean
  /** Callback when trap activates */
  onActivate?: () => void
  /** Callback when trap deactivates */
  onDeactivate?: () => void
}

/**
 * Roving tabindex configuration
 */
export interface RovingTabIndexConfig {
  /** Orientation of the list (affects arrow key behavior) */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Whether to loop from last to first and vice versa */
  loop?: boolean
  /** Whether to focus on mount */
  autoFocus?: boolean
  /** Callback when selection changes */
  onSelect?: (index: number) => void
}

/**
 * Keyboard navigation keys
 */
export type NavigationKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'Enter'
  | 'Space'
  | 'Escape'
  | 'Tab'

/**
 * Accessibility role types (subset of valid roles)
 */
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'header'
  | 'summary'
  | 'imagebutton'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar'
  | 'grid'
  | 'list'
  | 'listitem'
  | 'tabpanel'

/**
 * Accessibility state for interactive elements
 */
export interface AccessibilityState {
  disabled?: boolean
  selected?: boolean
  checked?: boolean | 'mixed'
  busy?: boolean
  expanded?: boolean
}

/**
 * Common accessibility props that can be spread on components
 */
export interface AccessibilityProps {
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: AccessibilityRole
  accessibilityState?: AccessibilityState
  accessibilityValue?: {
    min?: number
    max?: number
    now?: number
    text?: string
  }
}
