import type { ComponentType } from 'react'

export interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  testID?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

declare const Checkbox: ComponentType<CheckboxProps>

export { Checkbox }
export type { CheckboxProps }

