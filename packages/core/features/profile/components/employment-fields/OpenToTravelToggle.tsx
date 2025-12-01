import { ToggleCard } from '@unicornlove/ui'
import type { ToggleCardProps } from '@unicornlove/ui'
import { Plane } from '@tamagui/lucide-icons'

export interface OpenToTravelToggleProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description'> {
  /** Optional override for description */
  description?: string
}

/**
 * Shared "Open to travel" toggle card component
 * Used in both profile employment and resume wizard contexts
 */
export function OpenToTravelToggle({
  description = 'I am willing to travel for work opportunities',
  ...toggleCardProps
}: OpenToTravelToggleProps) {
  return (
    <ToggleCard
      icon={<Plane size="$2" color="$color11" />}
      title="Open to travel"
      description={description}
      {...toggleCardProps}
    />
  )
}
