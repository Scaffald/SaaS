import { Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function UtilitiesPage() {
  return (
    <StyleguidePage
      title="Utilities"
      description="Utility props mirrored from Bootstrap 2 but powered by Tamagui token-aware shorthands."
    >
      <YStack gap="$6">
        <AnchorHeading description="Spacing utilities use Tamagui shorthands like mx, py, gap.">
          Spacing helpers
        </AnchorHeading>
        <ExampleBlock
          title="Padding + margin"
          code={`<YStack gap="$3">\n  <XStack padding="$3" backgroundColor="$gray3">p-$3</XStack>\n  <XStack marginVertical="$2" backgroundColor="$gray3">my-$2</XStack>\n  <XStack gap="$2">\n    <Text>gap utilities</Text>\n    <Text>keep layout</Text>\n  </XStack>\n</YStack>`}
        >
          <YStack gap="$3">
            <XStack padding="$3" backgroundColor="$gray3" borderRadius="$3">
              <Text>p-$3</Text>
            </XStack>
            <XStack marginVertical="$2" backgroundColor="$gray3" borderRadius="$3">
              <Text>my-$2</Text>
            </XStack>
            <XStack gap="$2">
              <Text>gap utilities</Text>
              <Text>keep layout</Text>
            </XStack>
          </YStack>
        </ExampleBlock>

        <AnchorHeading description="Quick text color helpers for semantic emphasis.">
          Text color
        </AnchorHeading>
        <XStack gap="$3" flexWrap="wrap">
          {['$color', '$gray10', '$green10', '$red10'].map((token) => (
            <Text key={token} color={token} fontWeight="600">
              text-{token.replace('$', '')}
            </Text>
          ))}
        </XStack>
      </YStack>
    </StyleguidePage>
  )
}
