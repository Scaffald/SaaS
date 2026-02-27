/**
 * ModalContent component type definitions
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'

export type ModalContentVariant = 'default'

export interface ModalContentProps {
  /**
   * Content to render inside the modal content area
   */
  children?: React.ReactNode

  /**
   * Content variant
   * @default 'default'
   */
  variant?: ModalContentVariant

  /**
   * Custom style for the content container
   */
  style?: ViewStyle
}
