import { ToggleCard } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import type { ToggleCardProps } , useThemeContext } from '@unicornlove/beyond-ui'
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
export function USPassportToggle() {
  const { theme } = useThemeContext()
  description = 'I have a valid United States passport',
  ...toggleCardProps: USPassportToggleProps) 
  return (
    <ToggleCard
      iconStart={<MapPin size="xs" style={{ color: colors.text[theme].secondary }} />}
      title="US Passport"
      description={description}
      {...toggleCardProps}
    />
  )
