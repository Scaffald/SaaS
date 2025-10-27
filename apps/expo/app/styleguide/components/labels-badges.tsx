import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const badges = [
  { label: 'New', color: '$green9' },
  { label: 'Beta', color: '$blue9' },
  { label: 'Deprecated', color: '$red9' },
]

export default function LabelsBadgesPage() {
  return (
    <StyleguidePage
      title="Labels & Badges"
      description="Inline callouts for metadata, matching Bootstrap label styling."
    >
      <YStack gap="$6">
        <AnchorHeading description="Badges are simple text wrappers with token-based colors.">
          Badges
        </AnchorHeading>
        <ExampleBlock
          title="Badge set"
          code={`<XStack gap="$2">\n  {badges.map((badge) => (\n    <YStack key={badge.label} backgroundColor={badge.color} paddingHorizontal="$2" paddingVertical={2} borderRadius="$3">\n      <Text color="$color" fontSize={12}>{badge.label}</Text>\n    </YStack>\n  ))}\n</XStack>`}
        >
          <XStack gap="$2">
            {badges.map((badge) => (
              <YStack
                key={badge.label}
                backgroundColor={badge.color}
                paddingHorizontal="$2"
                paddingVertical={2}
                borderRadius="$3"
              >
                <Text color="$color" fontSize={12} fontWeight="700">
                  {badge.label}
                </Text>
              </YStack>
            ))}
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
