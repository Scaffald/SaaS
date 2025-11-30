import { RangeSliderCard } from '@scaffald/neue-ui'
import type { RangeSliderCardProps } from '@scaffald/neue-ui'
import { Plane } from '@tamagui/lucide-icons'

export interface MaximumTravelDistanceCardProps
  extends Omit<
    RangeSliderCardProps,
    | 'icon'
    | 'title'
    | 'description'
    | 'min'
    | 'max'
    | 'step'
    | 'formatValue'
    | 'formatMin'
    | 'formatMax'
  > {
  /** Optional override for description */
  description?: string
  /** Optional override for minimum value (default: 10) */
  min?: number
  /** Optional override for maximum value (default: 250) */
  max?: number
  /** Optional override for step value (default: 5) */
  step?: number
}

/**
 * Shared "Maximum Travel Distance" range slider card component
 * Used in profile employment sections
 */
export function MaximumTravelDistanceCard({
  description = 'Select your maximum travel distance to find opportunities that match your preferences',
  min = 10,
  max = 250,
  step = 5,
  value = 25,
  ...rangeSliderCardProps
}: MaximumTravelDistanceCardProps) {
  return (
    <RangeSliderCard
      icon={<Plane size="$2" color="$color11" />}
      title="Maximum Travel Distance"
      description={description}
      value={value}
      min={min}
      max={max}
      step={step}
      formatValue={(v) => `${v} miles`}
      formatMin={(v) => `${v} miles`}
      formatMax={(v) => `${v}+ miles`}
      {...rangeSliderCardProps}
    />
  )
}
