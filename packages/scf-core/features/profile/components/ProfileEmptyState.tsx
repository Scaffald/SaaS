import type { LucideIcon } from 'lucide-react-native'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ProfileEmptyStateProps {
  icon: LucideIcon
  message: string
}

/**
 * Profile Empty State Component
 * Displays a consistent empty state across all profile sections
 */
export function ProfileEmptyState({ icon: Icon, message }: ProfileEmptyStateProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack
      padding="md"
      align="center"
      gap={8}
      backgroundColor={colors.bg[t].default}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[t].default}
    >
      <Icon size={48} color={colors.text[t].secondary} />
      <Text style={{ color: colors.text[t].secondary }}>{message}</Text>
    </Stack>
  )
}
