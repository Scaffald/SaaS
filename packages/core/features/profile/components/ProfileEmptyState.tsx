import { YStack, Text } from 'tamagui'
import type { IconProps } from '@tamagui/helpers-icon'
import type { ComponentType } from 'react'

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
    <YStack
      p="$4"
      items="center"
      gap="$2"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Icon size={48} color="$color11" />
      <Text color="$color11">{message}</Text>
    </YStack>
  )
}
