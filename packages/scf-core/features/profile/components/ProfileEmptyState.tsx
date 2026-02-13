import type { LucideIcon } from 'lucide-react-native'
import { Text, Stack } from '@scaffald/ui'

interface ProfileEmptyStateProps {
  icon: LucideIcon
  message: string
}

/**
 * Profile Empty State Component
 * Displays a consistent empty state across all profile sections
 */
export function ProfileEmptyState({ icon: Icon, message }: ProfileEmptyStateProps) {
  return (
    <Stack
      padding="md"
      align="center"
      gap={8}
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Icon size={48} color="$gray11" />
      <Text color="$gray11">{message}</Text>
    </Stack>
  )
}
