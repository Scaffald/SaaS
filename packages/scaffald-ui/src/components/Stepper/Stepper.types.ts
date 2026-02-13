/**
 * Stepper component types
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type React from 'react'

export type StepStatus = 'completed' | 'current' | 'next'
export type StepperColor = 'primary' | 'gray'

export interface StepData {
  /**
   * Unique identifier for the step
   */
  id?: string | number

  /**
   * Step label text
   */
  label: string

  /**
   * Optional description text shown below the label
   */
  description?: string

  /**
   * Optional custom content to render in place of standard label/description
   */
  content?: React.ReactNode

  /**
   * Optional callback when step is clicked (only used if interactive)
   */
  onPress?: () => void

  /**
   * Whether this specific step is disabled (only applies if interactive)
   */
  disabled?: boolean
}

export interface StepProps {
  /**
   * Current status of the step
   */
  status: StepStatus

  /**
   * Step number (displayed for current and next steps)
   */
  stepNumber: number

  /**
   * Step label
   */
  label: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Color variant
   * @default 'primary'
   */
  color?: StepperColor

  /**
   * Whether to show description
   * @default false
   */
  showDescription?: boolean

  /**
   * Whether the step is interactive (clickable/hoverable)
   * @default false
   */
  interactive?: boolean

  /**
   * Callback when step is pressed (only used if interactive)
   */
  onPress?: () => void

  /**
   * Whether the step is disabled (only applies if interactive)
   * @default false
   */
  disabled?: boolean

  /**
   * Custom style for the step container
   */
  style?: ViewStyle

  /**
   * Custom style for the label text
   */
  labelStyle?: TextStyle

  /**
   * Custom style for the description text
   */
  descriptionStyle?: TextStyle
}

export interface StepperProps {
  /**
   * Array of step data
   */
  steps: StepData[]

  /**
   * Current active step index (0-based)
   */
  currentStep: number

  /**
   * Color variant
   * @default 'primary'
   */
  color?: StepperColor

  /**
   * Whether to show descriptions for all steps
   * @default false
   */
  showDescription?: boolean

  /**
   * Whether steps are interactive (clickable/hoverable)
   * When true, steps can be clicked for navigation
   * When false, stepper is purely informational
   * @default false
   */
  interactive?: boolean

  /**
   * Callback when any step is clicked
   * Receives the step index as parameter
   * Only called if interactive is true
   */
  onStepPress?: (stepIndex: number) => void

  /**
   * Custom style for the stepper container
   */
  style?: ViewStyle

  /**
   * Custom style for individual steps
   */
  stepStyle?: ViewStyle
}

