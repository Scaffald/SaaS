import type { ComponentType } from 'react'

export interface RangeSliderProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  testID?: string
  ariaLabel?: string
}

declare const RangeSlider: ComponentType<RangeSliderProps>

export { RangeSlider }
export type { RangeSliderProps }

