import type { ReactNode } from 'react'
import { Slider, Text, type ThemeName, View, XStack, YStack } from 'tamagui'

export interface RangeSliderCardProps {
  /** Icon to display on the left side */
  icon?: ReactNode
  /** Main title text */
  title: string
  /** Optional description text below title */
  description?: string
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
  /** Whether the card is disabled */
  disabled?: boolean
  /** Width of the card (can be number or string like "100%") */
  width?: number | string
  /** Theme variant to apply */
  theme?: ThemeName
  /** Optional test ID for testing */
  testID?: string
  /** Function to format the current value for display */
  formatValue?: (value: number) => string
  /** Function to format the min value for display */
  formatMin?: (value: number) => string
  /** Function to format the max value for display */
  formatMax?: (value: number) => string
  /** Whether to show value labels below the slider */
  showLabels?: boolean
  /** Size of the slider */
  sliderSize?: 'small' | 'medium' | 'large'
}

/**
 * RangeSliderCard - A card component with a range slider
 *
 * Features:
 * - Card layout with icon, title, and description
 * - Integrated range slider with value labels
 * - Customizable value formatting
 * - Cross-platform compatible
 * - Smooth animations
 *
 * @example
 * ```tsx
 * <RangeSliderCard
 *   icon={<Plane size="$2" color="$color11" />}
 *   title="Maximum Travel Distance"
 *   description="Select your maximum travel distance"
 *   value={25}
 *   onValueChange={setValue}
 *   min={10}
 *   max={250}
 *   step={5}
 *   formatValue={(v) => `${v} miles`}
 *   formatMin={(v) => `${v} miles`}
 *   formatMax={(v) => `${v} miles`}
 * />
 * ```
 */
export function RangeSliderCard({
  icon,
  title,
  description,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  width = '100%',
  theme,
  testID,
  formatValue,
  formatMin,
  formatMax,
  showLabels = true,
  sliderSize = 'medium',
}: RangeSliderCardProps) {
  // Default formatting functions
  const defaultFormatValue = (v: number) => v.toString()
  const defaultFormatMin = (v: number) => v.toString()
  const defaultFormatMax = (v: number) => v.toString()

  const formatValueFn = formatValue ?? defaultFormatValue
  const formatMinFn = formatMin ?? defaultFormatMin
  const formatMaxFn = formatMax ?? defaultFormatMax

  // Ensure value is within bounds
  const clampedValue = Math.max(min, Math.min(max, value))

  const sizeTokens: Record<
    NonNullable<RangeSliderCardProps['sliderSize']>,
    { track: number; thumb: number }
  > = {
    small: { track: 6, thumb: 10 },
    medium: { track: 8, thumb: 12 },
    large: { track: 10, thumb: 14 },
  } as const

  const resolvedSliderSize: NonNullable<RangeSliderCardProps['sliderSize']> = sliderSize ?? 'medium'
  const { track, thumb } = sizeTokens[resolvedSliderSize]

  return (
    <YStack
      {...(typeof width === 'number' ? { width } : { flex: 1, minWidth: 0 })}
      testID={testID}
      bg="$background"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      px="$4"
      py="$3"
      gap="$2.5"
      theme={theme}
      opacity={disabled ? 0.5 : 1}
    >
      {/* Header: Icon, Title, Description */}
      <XStack gap="$2.5" items="flex-start">
        {icon && (
          <View shrink={0} pt="$0.5">
            {icon}
          </View>
        )}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            {title}
          </Text>
          {description && (
            <Text color="$color11" lineHeight="$1" fontSize="$3">
              {description}
            </Text>
          )}
        </YStack>
      </XStack>

      {/* Slider */}
      <YStack gap="$5" pt="$4" pb="$4">
        <Slider
          value={[clampedValue]}
          onValueChange={(values) => {
            const newValue = values[0]
            onValueChange(newValue)
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          flex={1}
          height={16}
          testID={testID ? `${testID}-slider` : undefined}
        >
          <Slider.Track bg="$color4" rounded="$1" height={track}>
            <Slider.TrackActive bg="$blue9" rounded="$1" />
          </Slider.Track>
          <Slider.Thumb
            index={0}
            circular
            bg="white"
            borderWidth={2}
            borderColor="$blue9"
            width={thumb}
            height={thumb}
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            hoverStyle={{
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              borderColor: '$blue10',
            }}
            pressStyle={{
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        </Slider>

        {/* Value Labels */}
        {showLabels && (
          <XStack justify="space-between" items="center">
            <Text fontSize="$2" color="$color9">
              {formatMinFn(min)}
            </Text>
            <Text fontSize="$3" fontWeight="600" color="$blue10">
              {formatValueFn(clampedValue)}
            </Text>
            <Text fontSize="$2" color="$color9">
              {formatMaxFn(max)}
            </Text>
          </XStack>
        )}
      </YStack>
    </YStack>
  )
}
