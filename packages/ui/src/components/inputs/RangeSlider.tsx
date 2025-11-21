import { useCallback, useState } from 'react'
import { styled, View } from 'tamagui'

interface LayoutEvent {
  nativeEvent: {
    layout: {
      width: number
      height: number
    }
  }
}

interface PressEvent {
  nativeEvent: {
    locationX: number
    locationY: number
  }
}

export interface RangeSliderProps {
  /** Current value of the slider */
  value: number
  /** Callback when value changes */
  onValueChange: (value: number) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step size for value changes */
  step?: number
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Size of the slider */
  size?: 'small' | 'medium' | 'large'
  /** Optional test ID for testing */
  testID?: string
}

const SliderTrack = styled(View, {
  position: 'relative',
  bg: '$color4',
  rounded: 6,
  variants: {
    size: {
      small: {
        height: 8,
        minWidth: 120,
      },
      medium: {
        height: 10,
        minWidth: 180,
      },
      large: {
        height: 12,
        minWidth: 220,
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        bg: '$color3',
      },
      false: {
        opacity: 1,
      },
    },
  } as const,
})

const SliderTrackActive = styled(View, {
  position: 'absolute',
  bg: '$color10',
  rounded: 6,
  variants: {
    size: {
      small: {
        height: 8,
      },
      medium: {
        height: 10,
      },
      large: {
        height: 12,
      },
    },
  } as const,
})

const SliderThumb = styled(View, {
  position: 'absolute',
  bg: 'white',
  rounded: 50,
  borderWidth: 2,
  borderColor: '$color10',
  cursor: 'pointer',
  animation: '100ms',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  variants: {
    size: {
      small: {
        width: 18,
        height: 18,
        t: -5,
      },
      medium: {
        width: 22,
        height: 22,
        t: -6,
      },
      large: {
        width: 26,
        height: 26,
        t: -7,
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        borderColor: '$color4',
      },
      false: {
        opacity: 1,
        cursor: 'pointer',
      },
    },
  } as const,
  hoverStyle: {
    scale: 1.1,
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  pressStyle: {
    scale: 0.95,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
})

/**
 * RangeSlider - A custom animated range slider component
 *
 * Features:
 * - Smooth animations for value changes
 * - Multiple sizes (small, medium, large)
 * - Disabled state support
 * - Cross-platform compatible
 * - Touch-friendly thumb design
 * - Proper accessibility support
 *
 * @example
 * ```tsx
 * <RangeSlider
 *   value={50}
 *   onValueChange={setValue}
 *   min={0}
 *   max={100}
 *   step={5}
 *   size="medium"
 * />
 * ```
 */
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
  const [trackWidth, setTrackWidth] = useState(0)

  // Ensure value is a valid number and within bounds
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : min
  const clampedValue = Math.max(min, Math.min(max, safeValue))

  // Calculate percentage position of the thumb
  const percentage = ((clampedValue - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Calculate thumb position
  const thumbPosition = (trackWidth * clampedPercentage) / 100

  // Calculate active track width
  const activeTrackWidth = (trackWidth * clampedPercentage) / 100

  const handleTrackLayout = useCallback((event: LayoutEvent) => {
    const { width } = event.nativeEvent.layout
    setTrackWidth(width)
  }, [])

  const handleTrackPress = useCallback(
    (event: PressEvent) => {
      if (disabled) return

      const { locationX } = event.nativeEvent
      const newPercentage = (locationX / trackWidth) * 100
      const newValue = min + (newPercentage / 100) * (max - min)

      // Snap to step
      const steppedValue = Math.round(newValue / step) * step
      const clampedValue = Math.max(min, Math.min(max, steppedValue))

      onValueChange(clampedValue)
    },
    [disabled, trackWidth, min, max, step, onValueChange]
  )

  const handleThumbPress = useCallback(() => {
    if (disabled) return
  }, [disabled])

  const handleThumbRelease = useCallback(() => {
    // Handle thumb release
  }, [])

  return (
    <SliderTrack
      size={size}
      disabled={disabled}
      onLayout={handleTrackLayout}
      onPress={handleTrackPress}
      testID={testID}
      aria-value={{
        min,
        max,
        now: clampedValue,
      }}
    >
      <SliderTrackActive
        size={size}
        style={{
          width: activeTrackWidth,
        }}
      />
      <SliderThumb
        size={size}
        disabled={disabled}
        style={{
          left: thumbPosition,
        }}
        onPress={handleThumbPress}
        onPressIn={handleThumbPress}
        onPressOut={handleThumbRelease}
        aria-label={`Slider thumb at ${value}`}
      />
    </SliderTrack>
  )
}
