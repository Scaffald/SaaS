import { XStack, Text } from '@app/ui'

interface ComparisonFieldProps {
  label: string
  value: string
  isDifferent: boolean
}

export function ComparisonField({ label, value, isDifferent }: ComparisonFieldProps) {
  return (
    <XStack
      justify="space-between"
      items="center"
      bg={isDifferent ? '$yellow2' : 'transparent'}
      p="$2"
      rounded="$2"
    >
      <Text fontSize="$3" color="$color11">
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="500" color={isDifferent ? '$yellow11' : '$color12'}>
        {value}
      </Text>
    </XStack>
  )
}

