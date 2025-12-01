import { ToggleCard } from '@unicornlove/ui'
import type { ToggleCardProps } from '@unicornlove/ui'
import { Plane } from '@tamagui/lucide-icons'
import { YStack } from '@unicornlove/ui'
import { MaximumTravelDistanceCard } from './MaximumTravelDistanceCard'

export interface OpenToTravelCardProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description' | 'expandedContent'> {
  /** Optional override for description */
  description?: string
  /** Travel distance value (only used when checked is true) */
  travelDistanceValue?: number
  /** Callback when travel distance changes */
  onTravelDistanceChange?: (value: number) => void
  /** Optional override for minimum travel distance (default: 10) */
  minTravelDistance?: number
  /** Optional override for maximum travel distance (default: 250) */
  maxTravelDistance?: number
  /** Optional override for travel distance step (default: 5) */
  travelDistanceStep?: number
}

/**
 * Combined "Open to travel" toggle card with expandable travel distance slider
 * The travel distance slider only appears when "Open to travel" is toggled on
 * Used in both profile employment and resume wizard contexts
 */
export function OpenToTravelCard({
  description = 'I am willing to travel for work opportunities',
  checked,
  onCheckedChange,
  travelDistanceValue = 25,
  onTravelDistanceChange,
  minTravelDistance = 10,
  maxTravelDistance = 250,
  travelDistanceStep = 5,
  disabled = false,
  ...toggleCardProps
}: OpenToTravelCardProps) {
  return (
    <ToggleCard
      icon={<Plane size="$2" color="$color11" />}
      title="Open to travel"
      description={description}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      expandedContent={
        checked && onTravelDistanceChange ? (
          <YStack gap="$2" paddingTop="$3">
            <MaximumTravelDistanceCard
              value={travelDistanceValue}
              onValueChange={onTravelDistanceChange}
              min={minTravelDistance}
              max={maxTravelDistance}
              step={travelDistanceStep}
              disabled={disabled}
            />
          </YStack>
        ) : undefined
      }
      {...toggleCardProps}
    />
  )
}
