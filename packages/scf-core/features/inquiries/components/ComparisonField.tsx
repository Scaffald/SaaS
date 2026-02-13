import { Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ComparisonFieldProps {
  label: string
  value: string
  isDifferent: boolean
  description?: string
}

export function ComparisonField({ label, value, isDifferent, description }: ComparisonFieldProps) {
  return (
    <Stack
      backgroundColor={isDifferent ? '$yellow2' : 'transparent'}
      padding={8}
      borderRadius={8}
      gap={4}
    >
      <Row justify="space-between" align="center">
        <Text color="gray">
          {label}
        </Text>
        <Text color={isDifferent ? '$yellow11' : '$color12'}>
          {value}
        </Text>
      </Row>
      {description && (
        <Text color="gray">
          {description}
        </Text>
      )}
    </Stack>
  )
}
