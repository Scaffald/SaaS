import { ToggleCard } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import type { ToggleCardProps } , useThemeContext } from '@unicornlove/beyond-ui'
import { Flag } from 'lucide-react-native'

export interface USResidentToggleProps
  extends Omit<ToggleCardProps, 'icon' | 'title' | 'description'> {
  /** Optional override for description */
  description?: string
}

/**
 * Shared "US Resident" toggle card component
 * Used in profile employment sections
 */
export function USResidentToggle() {
  const { theme } = useThemeContext()
  description = 'I am a resident of the United States',
  ...toggleCardProps: USResidentToggleProps) 
  return (
    <ToggleCard
      iconStart={<Flag size="xs" style={{ color: colors.text[theme].secondary }} />}
      title="US Resident"
      description={description}
      {...toggleCardProps}
    />
  )
