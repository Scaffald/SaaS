/**
 * Modal component type definitions
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'

/**
 * Modal props
 */
export interface ModalProps {
  /**
   * Whether the modal is visible (controlled)
   */
  visible?: boolean

  /**
   * Default visibility for uncontrolled mode
   * @default false
   */
  defaultVisible?: boolean

  /**
   * Callback when modal should be closed
   */
  onClose?: () => void

  /**
   * Whether to close modal when backdrop is pressed
   * @default true
   */
  closeOnBackdropPress?: boolean

  /**
   * Whether to close modal when Escape key is pressed (web only)
   * @default true
   */
  closeOnEscapeKey?: boolean

  /**
   * Custom width for the modal
   * @default 520
   */
  width?: number | string

  /**
   * Custom style for the modal container
   */
  style?: ViewStyle

  /**
   * Content to render inside the modal
   */
  children?: React.ReactNode

  /**
   * Test ID for testing purposes
   */
  testID?: string
}
