import { SettingsToggleCard } from '@scaffald/ui'
import type { SettingsToggleCardProps } from '@scaffald/ui'
import { MapPin } from 'lucide-react-native'

export interface USPassportToggleProps
  extends Omit<SettingsToggleCardProps, 'icon' | 'title' | 'description' | 'enabled' | 'onToggleChange'> {
  /** Optional override for description */
  description?: string
  /** Whether the toggle is checked */
  checked?: boolean
  /** Callback when toggle state changes */
  onChange?: (checked: boolean) => void
}

/**
 * Shared "US Passport" toggle card component
 * Used in profile employment sections
 */
export function USPassportToggle({
  description = 'I have a valid United States passport',
  checked,
  onChange,
  ...settingsToggleCardProps
}: USPassportToggleProps) {
  return (
    <SettingsToggleCard
      icon={MapPin}
      title="US Passport"
      description={description}
      enabled={checked}
      onToggleChange={onChange}
      {...settingsToggleCardProps}
    />
  )
}
