import type { IconProps } from '@tamagui/helpers-icon'
import type { ComponentType } from 'react'
import { Text, Stack } from '@unicornlove/beyond-ui'

interface ProfileEmptyStateProps {
  icon: ComponentType<IconProps>
  message: string
}

/**
 * Profile Empty State Component
 * Displays a consistent empty state across all profile sections
 */
export function ProfileEmptyState({ icon: Icon, message }: ProfileEmptyStateProps) {
  return (
    <Stack
      padding="$4"
      alignItems="center"
      gap="$2"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Icon size={48} color="$color11" />
      <Text color="$color11">{message}</Text>
    </Stack>
  )
}
