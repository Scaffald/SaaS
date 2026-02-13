/**
 * EmptyState, ErrorState, LoadingState type definitions
 */

import type { ComponentType, ReactNode } from 'react'
import type { ButtonProps } from '../Button'

export interface EmptyStateProps {
  /** Icon component (receives size and color props) */
  icon?: ComponentType<{ size?: number; color?: string }>
  /** Primary message */
  title: string
  /** Optional description */
  description?: string
  /** Primary action */
  action?: {
    label: string
    onPress: () => void
  } & Partial<Pick<ButtonProps, 'variant' | 'size' | 'color'>>
  /** Secondary action */
  secondaryAction?: {
    label: string
    onPress: () => void
  } & Partial<Pick<ButtonProps, 'variant' | 'size' | 'color'>>
  /** Custom content below description */
  children?: ReactNode
}

export interface ErrorStateProps {
  /** Custom icon (defaults to error icon) */
  icon?: ReactNode
  /** Primary error message */
  title: string
  /** Optional description */
  description?: string
  /** Error for technical details (message shown) */
  error?: Error | string
  /** Retry callback */
  retry?: () => void
  /** Retry button label */
  retryText?: string
}

export interface LoadingStateProps {
  /** Optional loading message */
  message?: string
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg'
  /** Fullscreen layout */
  fullScreen?: boolean
}
