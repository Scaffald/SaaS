/**
 * RangeSlider – single-value slider with size variants.
 * API-compatible with @unicornlove/ui RangeSlider; implemented via Slider.
 */

import { View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Slider } from './Slider'
import type { RangeSliderProps } from './RangeSlider.types'

const trackSizeStyles: Record<NonNullable<RangeSliderProps['size']>, ViewStyle> = {
  small: { height: 8, minWidth: 120 },
  medium: { height: 10, minWidth: 180 },
  large: { height: 12, minWidth: 220 },
}

const handleSizeStyles: Record<NonNullable<RangeSliderProps['size']>, ViewStyle> = {
  small: { width: 18, height: 18 },
  medium: { width: 22, height: 22 },
  large: { width: 26, height: 26 },
}

export function RangeSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  size = 'medium',
  testID,
}: RangeSliderProps) {
  return (
    <View testID={testID}>
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        showIndicator={false}
        trackStyle={trackSizeStyles[size]}
        handleStyle={handleSizeStyles[size]}
      />
    </View>
  )
}
