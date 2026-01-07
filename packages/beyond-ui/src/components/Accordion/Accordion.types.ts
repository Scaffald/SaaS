/**
 * Accordion component types
 */

import type { ReactNode } from 'react'
import type { ViewStyle, TextStyle } from 'react-native'

// Accordion mode - controls how items behave
export type AccordionMode = 'single' | 'multiple'

// Accordion width variant
export type AccordionWidth = 'fluid' | 'constrained'

// Accordion item value type
export type AccordionValue = string | string[]

// Base accordion props
export interface AccordionProps {
  /** Current expanded value(s) - controlled mode */
  value?: AccordionValue
  /** Default expanded value(s) - uncontrolled mode */
  defaultValue?: AccordionValue
  /** Callback when value changes */
  onValueChange?: (value: AccordionValue) => void
  /** Mode: 'single' (one item open) or 'multiple' (many items open) */
  mode?: AccordionMode
  /** Width behavior: 'fluid' (stretches with content) or 'constrained' (fixed width) */
  width?: AccordionWidth
  /** Children accordion items */
  children: ReactNode
  /** Disabled state for all items */
  disabled?: boolean
  /** Custom container style */
  containerStyle?: ViewStyle
}

// Individual accordion item props
export interface AccordionItemProps {
  /** Unique value for this item */
  value: string
  /** Whether this item is disabled */
  disabled?: boolean
  /** Children (AccordionTrigger and AccordionContent) */
  children: ReactNode
  /** Custom container style */
  containerStyle?: ViewStyle
}

// Accordion trigger (header) props
export interface AccordionTriggerProps {
  /** Children - the header content */
  children: ReactNode
  /** Optional icon element to show before title */
  icon?: ReactNode
  /** Optional hint message (subtitle with icon) */
  hintMessage?: string
  /** Optional hint icon */
  hintIcon?: ReactNode
  /** Custom hint text color (e.g., for error states) */
  hintColor?: string
  /** Custom container style */
  containerStyle?: ViewStyle
  /** Custom title style */
  titleStyle?: TextStyle
  /** Custom hint style */
  hintStyle?: TextStyle
}

// Accordion content (body) props
export interface AccordionContentProps {
  /** Children - the content to show when expanded */
  children: ReactNode
  /** Custom container style */
  containerStyle?: ViewStyle
  /** Custom content style */
  contentStyle?: TextStyle
}

// Context type for accordion
export interface AccordionContextValue {
  value: AccordionValue
  onValueChange: (itemValue: string) => void
  mode: AccordionMode
  width: AccordionWidth
  disabled: boolean
}

// Context type for accordion item
export interface AccordionItemContextValue {
  isExpanded: boolean
  disabled: boolean
  value: string
}
