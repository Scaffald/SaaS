import { ToggleCard } from '@scaffald/ui'
import type { ToggleCardProps } from '@scaffald/ui'
import { MapPin } from 'lucide-react-native'

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
      iconStart={<MapPin size="sm" color="$gray11" />}
      title="US Passport"
      description={description}
      {...toggleCardProps}
    />
  )
}
