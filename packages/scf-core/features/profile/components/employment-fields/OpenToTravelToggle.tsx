import { ToggleCard } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import type { ToggleCardProps } , useThemeContext } from '@unicornlove/beyond-ui'
import { Plane } from 'lucide-react-native'

export interface OpenToTravelToggleProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description'> {
  /** Optional override for description */
  description?: string
}

/**
 * Shared "Open to travel" toggle card component
 * Used in both profile employment and resume wizard contexts
 */
export function OpenToTravelToggle() {
  const { theme } = useThemeContext()
  description = 'I am willing to travel for work opportunities',
  ...toggleCardProps: OpenToTravelToggleProps) 
  return (
    <ToggleCard
      iconStart={<Plane size="xs" style={{ color: colors.text[theme].secondary }} />}
      title="Open to travel"
      description={description}
      {...toggleCardProps}
    />
  )
