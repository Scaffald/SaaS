/**
 * Breadcrumb component
 * Navigation breadcrumb showing hierarchical path
 * This is essentially a Stepper with different semantics for navigation use cases
 *
 * @example
 * ```tsx
 * import { Breadcrumb } from '@scaffald/ui'
 *
 * <Breadcrumb
 *   items={[
 *     { label: 'Home' },
 *     { label: 'Products' },
 *     { label: 'Current Page' },
 *   ]}
 *   currentIndex={2}
 * />
 * ```
 */

import { Stepper } from './Stepper'
import type { StepperProps } from './Stepper.types'

export interface BreadcrumbProps extends Omit<StepperProps, 'steps' | 'currentStep'> {
  /**
   * Breadcrumb items (same as steps but with different semantic meaning)
   */
  items: StepperProps['steps']

  /**
   * Current breadcrumb index (0-based)
   */
  currentIndex: number
}

/**
 * Breadcrumb component - a semantic variant of Stepper for navigation
 * By default, Breadcrumb is interactive (clickable) for navigation use cases
 */
export function Breadcrumb({ items, currentIndex, interactive = true, ...stepperProps }: BreadcrumbProps) {
  return <Stepper steps={items} currentStep={currentIndex} interactive={interactive} {...stepperProps} />
}

