/**
 * Shared component types and prop naming conventions
 *
 * This file documents the standard prop naming conventions and shared types
 * used across the Beyond-UI component library.
 *
 * ## Prop Naming Conventions
 *
 * ### Variant vs Type vs State vs Status
 *
 * - **`variant`**: Style/appearance variants (e.g., 'filled', 'outlined', 'linear', 'light')
 *   - Used for visual style differences
 *   - Examples: Button `variant="filled"`, Alert `variant="linear"`
 *
 * - **`type`**: Content/semantic types (e.g., 'success', 'error', 'info', 'warning')
 *   - Used for semantic meaning or content categorization
 *   - Examples: Alert `type="error"`, StatusIndicator `type="success"`
 *   - Can also be used for style variants when appropriate (e.g., Input `type="classic"` vs `type="line"`)
 *
 * - **`state`**: Interactive states (e.g., 'default', 'hover', 'focused', 'disabled', 'error')
 *   - Used for user interaction states
 *   - Examples: Input `state="focused"`, BreadcrumbItem `state="active"`
 *
 * - **`status`**: Progress/process states (e.g., 'completed', 'current', 'pending', 'in-progress')
 *   - Used for process or workflow states
 *   - Examples: Stepper `status="completed"`, FileUpload `status="uploading"`
 *
 * ### Icon Props
 *
 * - **`icon`**: Single icon component prop
 *   - Used when there's only one icon or the primary icon
 *   - Type: `React.ComponentType<{ size: number; color: string }>`
 *   - Examples: `InputLabel`, `InputHelperText`
 *
 * - **`iconStart`**: Icon displayed at the start (left/top)
 *   - Used in components with directional icons
 *   - Examples: Button, Tabs
 *
 * - **`iconEnd`**: Icon displayed at the end (right/bottom)
 *   - Used in components with directional icons
 *   - Examples: Button, Tabs
 *
 * - **`showIcon`**: Boolean to control icon visibility
 *   - Used to show/hide icons conditionally
 *   - Examples: `InputHelperText showIcon={true}`, `HintMessage showIcon={false}`
 *
 * ### Label and Helper Text Props
 *
 * - **`label`**: Primary label text (string)
 * - **`helperText`**: Helper/description text (string)
 * - **`error`**: Error message (string) or error state (boolean)
 * - **`required`**: Show required asterisk (boolean)
 * - **`note`**: Optional note text, e.g., "(optional)" (string)
 *
 * ### Size Props
 *
 * - **`size`**: Component size variant
 *   - Common values: 'sm' | 'md' | 'lg'
 *   - Some components may use 'xs' or 'xl'
 *
 * ### Color Props
 *
 * - **`color`**: Color variant or semantic color
 *   - Examples: 'primary', 'gray', 'red', 'green'
 *   - May be combined with `variant` for full styling
 *
 * ## Common Type Definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

/**
 * Common size variants
 */
export type ComponentSize = 'sm' | 'md' | 'lg'

/**
 * Extended size variants (when needed)
 */
export type ExtendedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Common color variants
 */
export type ColorVariant = 'primary' | 'gray' | 'success' | 'error' | 'warning' | 'info'

/**
 * Common semantic types
 */
export type SemanticType = 'default' | 'success' | 'error' | 'warning' | 'info'

/**
 * Common interactive states
 */
export type InteractiveState = 'default' | 'hover' | 'focused' | 'disabled' | 'error'

/**
 * Common style variants
 */
export type StyleVariant = 'filled' | 'outlined' | 'linear' | 'light' | 'blank'

/**
 * Icon component type
 * Standard icon component interface that accepts size and color props
 */
export type IconComponent = React.ComponentType<{ size: number; color: string }>

/**
 * Common style prop types
 */
export interface BaseComponentProps {
  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style (when applicable)
   */
  textStyle?: TextStyle
}

/**
 * Label component props (shared pattern)
 */
export interface LabelProps extends BaseComponentProps {
  /**
   * Label text
   */
  children: string

  /**
   * Show required asterisk
   * @default false
   */
  required?: boolean

  /**
   * Optional note text (e.g., "(optional)")
   */
  note?: string

  /**
   * Show info icon
   * @default false
   */
  showIcon?: boolean

  /**
   * Icon component
   */
  icon?: IconComponent

  /**
   * Label type/state
   * @default 'default'
   */
  type?: 'default' | 'error' | 'disabled'
}

/**
 * Helper text component props (shared pattern)
 */
export interface HelperTextProps extends BaseComponentProps {
  /**
   * Helper text content
   */
  children: string

  /**
   * Helper text type/state
   * @default 'default'
   */
  type?: 'default' | 'error' | 'warning' | 'disabled'

  /**
   * Show icon before text
   * @default false
   */
  showIcon?: boolean

  /**
   * Icon component
   */
  icon?: IconComponent
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark'

