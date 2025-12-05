import { Text, XStack, YStack } from '@unicornlove/ui'

interface ComparisonFieldProps {
  label: string
  value: string
  isDifferent: boolean
  description?: string
}

export function ComparisonField({ label, value, isDifferent, description }: ComparisonFieldProps) {
  return (
    <YStack
      backgroundColor={isDifferent ? '$yellow2' : 'transparent'}
      padding="$2"
      borderRadius="$2"
      gap="$1"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$3" color="$color11">
          {label}
        </Text>
        <Text fontSize="$3" fontWeight="500" color={isDifferent ? '$yellow11' : '$color12'}>
          {value}
        </Text>
      </XStack>
      {description && (
        <Text fontSize="$2" color="$color10">
          {description}
        </Text>
      )}
    </YStack>
  )
}
