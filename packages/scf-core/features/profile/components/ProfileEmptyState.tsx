import type { LucideIcon } from 'lucide-react-native'
import { Text, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface ProfileEmptyStateProps {
  icon: LucideIcon
  message: string
}

/**
 * Profile Empty State Component
 * Displays a consistent empty state across all profile sections
 */
export function ProfileEmptyState() {
  const { theme } = useThemeContext()icon: Icon, message : ProfileEmptyStateProps) 
  return (
    <Stack
      padding="md"
      align="center"
      gap={8}
      style={{ backgroundColor: colors.bg[theme].default }}
      borderRadius={16}
      borderWidth={1}
      style={{ borderColor: colors.border[theme].default }}
    >
      <Icon size={48} style={{ color: colors.text[theme].secondary }} />
      <Text style={{ color: colors.text[theme].secondary }}>{message}</Text>
    </Stack>
  )
