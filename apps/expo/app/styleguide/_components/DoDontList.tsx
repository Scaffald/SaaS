import { CheckCircle, XCircle } from '@tamagui/lucide-icons'
import { Paragraph, Text, XStack, YStack } from 'tamagui'

export type DoDontItem = {
  do: string
  dont: string
}

export type DoDontListProps = {
  items: DoDontItem[]
}

export function DoDontList({ items }: DoDontListProps) {
  return (
    <XStack gap="$4" flexWrap="wrap">
      <YStack flex={1} minWidth={160} gap="$3">
        <Text fontWeight="700" color="$green11">
          Do
        </Text>
        {items.map((item) => (
          <XStack key={`do-${item.do}`} gap="$2" alignItems="flex-start">
            <CheckCircle color="$green11" size={16} />
            <Paragraph flex={1}>{item.do}</Paragraph>
          </XStack>
        ))}
      </YStack>
      <YStack flex={1} minWidth={160} gap="$3">
        <Text fontWeight="700" color="$red11">
          Don’t
        </Text>
        {items.map((item) => (
          <XStack key={`dont-${item.dont}`} gap="$2" alignItems="flex-start">
            <XCircle color="$red11" size={16} />
            <Paragraph flex={1}>{item.dont}</Paragraph>
          </XStack>
        ))}
      </YStack>
    </XStack>
  )
}
