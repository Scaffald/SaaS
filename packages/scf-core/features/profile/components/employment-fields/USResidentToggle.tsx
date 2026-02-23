import { SettingsToggleCard } from '@scaffald/ui'
import type { SettingsToggleCardProps } from '@scaffald/ui'
import { Flag } from 'lucide-react-native'

export interface USResidentToggleProps
  extends Omit<SettingsToggleCardProps, 'icon' | 'title' | 'description' | 'enabled' | 'onToggleChange'> {
  /** Optional override for description */
  description?: string
  /** Whether the toggle is checked */
  checked?: boolean
  /** Callback when toggle state changes */
  onChange?: (checked: boolean) => void
}

/**
 * Shared "US Resident" toggle card component
 * Used in profile employment sections
 */
export function USResidentToggle({
  description = 'I am a resident of the United States',
  checked,
  onChange,
  ...settingsToggleCardProps
}: USResidentToggleProps) {
  return (
    <SettingsToggleCard
      icon={Flag}
      title="US Resident"
      description={description}
      enabled={checked}
      onToggleChange={onChange}
      {...settingsToggleCardProps}
    />
  )
}
