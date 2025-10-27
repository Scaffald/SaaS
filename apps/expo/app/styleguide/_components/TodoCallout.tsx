import { AlertTriangle } from '@tamagui/lucide-icons'
import { Paragraph, Text, XStack, YStack } from 'tamagui'

export type TodoCalloutProps = {
  id: string
  title: string
  description: string
  suggestion: string
}

export function TodoCallout({ id, title, description, suggestion }: TodoCalloutProps) {
  return (
    <YStack
      borderWidth={1}
      borderColor="$yellow7"
      backgroundColor="$yellow2"
      padding="$4"
      gap="$3"
      borderRadius="$5"
      data-approval-id={id}
    >
      <XStack gap="$3" alignItems="center">
        <AlertTriangle color="$yellow11" size={20} />
        <Text fontSize={14} fontWeight="700" gap="$2" display="flex">
          <Text fontFamily="monospace">{"//TODO:"}</Text> {title}
        </Text>
      </XStack>
      <Paragraph color="$gray11">{description}</Paragraph>
      <Paragraph color="$gray11" fontStyle="italic">
        Suggested default: {suggestion}
      </Paragraph>
      <Text fontSize={12} color="$gray9">
        This is net-new and requires approval.
      </Text>
    </YStack>
  )
}
