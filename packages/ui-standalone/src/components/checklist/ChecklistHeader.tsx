import { Text, YStack } from 'tamagui'
import type { ChecklistHeaderProps } from './types'

/**
 * ChecklistHeader - Header section with title and subtitle
 *
 * @param title - Main title text
 * @param subtitle - Descriptive subtitle text
 * @returns JSX element
 */
export const ChecklistHeader = ({ title, subtitle }: ChecklistHeaderProps) => {
  if (!title && !subtitle) return null

  return (
    <YStack gap="$2">
      {title && (
        <Text fontSize="$6" fontWeight="600" color="$color12">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text fontSize="$3" color="$color10" lineHeight="$1">
          {subtitle}
        </Text>
      )}
    </YStack>
  )
}
