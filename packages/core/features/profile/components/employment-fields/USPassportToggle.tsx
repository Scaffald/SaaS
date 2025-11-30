import { ToggleCard } from '@scaffald/tamagui-ui'
import type { ToggleCardProps } from '@scaffald/tamagui-ui'
import { MapPin } from '@tamagui/lucide-icons'

export interface USPassportToggleProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description'> {
  /** Optional override for description */
  description?: string
}

/**
 * Shared "US Passport" toggle card component
 * Used in profile employment sections
 */
export function USPassportToggle({
  description = 'I have a valid United States passport',
  ...toggleCardProps
}: USPassportToggleProps) {
  return (
    <ToggleCard
      icon={<MapPin size="$2" color="$color11" />}
      title="US Passport"
      description={description}
      {...toggleCardProps}
    />
  )
}

