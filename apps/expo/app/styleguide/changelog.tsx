import { Paragraph, Text, YStack } from 'tamagui'
import { AnchorHeading, StyleguidePage } from './_components'

const entries = [
  {
    version: '0.1.0',
    date: '2025-10-27',
    description: 'Initial Bootstrap-inspired documentation shell with audit + approval queue.',
  },
]

export default function ChangelogPage() {
  return (
    <StyleguidePage
      title="Changelog"
      description="Track updates to the styleguide itself."
    >
      <YStack gap="$6">
        <AnchorHeading description="Latest shipped updates.">
          Releases
        </AnchorHeading>
        <YStack gap="$3">
          {entries.map((entry) => (
            <YStack key={entry.version} borderWidth={1} borderColor="$gray5" borderRadius="$5" padding="$4" gap="$2">
              <Text fontWeight="700">
                {entry.version} — {entry.date}
              </Text>
              <Paragraph color="$gray11">{entry.description}</Paragraph>
            </YStack>
          ))}
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
