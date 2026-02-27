import { SettingsToggleCard } from '@scaffald/ui'
import type { SettingsToggleCardProps } from '@scaffald/ui'
import { Plane } from 'lucide-react-native'

export interface OpenToTravelToggleProps
  extends Omit<SettingsToggleCardProps, 'icon' | 'title' | 'description' | 'enabled' | 'onToggleChange'> {
  /** Optional override for description */
  description?: string
  /** Whether the toggle is checked */
  checked?: boolean
  /** Callback when toggle state changes */
  onChange?: (checked: boolean) => void
}

/**
 * Shared "Open to travel" toggle card component
 * Used in both profile employment and resume wizard contexts
 */
export function OpenToTravelToggle({
  description = 'I am willing to travel for work opportunities',
  checked,
  onChange,
  ...settingsToggleCardProps
}: OpenToTravelToggleProps) {
  return (
    <SettingsToggleCard
      icon={Plane}
      title="Open to travel"
      description={description}
      enabled={checked}
      onToggleChange={onChange}
      {...settingsToggleCardProps}
    />
  )
}
