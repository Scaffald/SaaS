import { ToggleCard } from '@unicornlove/beyond-ui'
import type { ToggleCardProps } from '@unicornlove/beyond-ui'
import { Flag } from '@tamagui/lucide-icons'

export interface USResidentToggleProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description'> {
  /** Optional override for description */
  description?: string
}

/**
 * Shared "US Resident" toggle card component
 * Used in profile employment sections
 */
export function USResidentToggle({
  description = 'I am a resident of the United States',
  ...toggleCardProps
}: USResidentToggleProps) {
  return (
    <ToggleCard
      icon={<Flag size="$2" color="$color11" />}
      title="US Resident"
      description={description}
      {...toggleCardProps}
    />
  )
}
