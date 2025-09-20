import { Paragraph, XStack, YStack } from '@my/ui'

export type LegalBulletListProps = {
  items: string[]
}

export const LegalBulletList = ({ items }: LegalBulletListProps) => {
  if (!items.length) return null

  return (
    <YStack gap="$2">
      {items.map((item) => (
        <XStack key={item} gap="$2" alignItems="flex-start">
          <Paragraph color="$gray10">-</Paragraph>
          <Paragraph f={1}>{item}</Paragraph>
        </XStack>
      ))}
    </YStack>
  )
}
