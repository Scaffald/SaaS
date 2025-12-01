import type { ComponentType } from 'react'

interface RadioProps {
  value: string
  checked?: boolean
  onPress?: () => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  label?: string
  children?: React.ReactNode
}

declare const Radio: ComponentType<RadioProps>

export { Radio }
export type { RadioProps }

