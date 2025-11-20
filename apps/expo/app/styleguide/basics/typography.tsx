// @ts-nocheck

import { AnchorHeading, StyleguidePage } from '@app/styleguide'
import { Paragraph, Text, YStack } from '@app/ui'

const headings = [
  { token: 'h1', size: 40, label: 'Display / H1' },
  { token: 'h2', size: 32, label: 'Headline / H2' },
  { token: 'h3', size: 24, label: 'Section / H3' },
  { token: 'h4', size: 20, label: 'Subheading / H4' },
]

const bodyCopy = [
  { label: 'Body / large', size: 16 },
  { label: 'Body / default', size: 14 },
  { label: 'Caption', size: 12 },
]

export default function TypographyPage() {
  return (
    <StyleguidePage
      title="Typography"
      description="Map Bootstrap’s typography scale to the Inter font loaded via Expo."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="typography-headings"
          title="Headings"
          description="Use Inter Bold for display styles."
        />
        <YStack gap="$4">
          {headings.map((item) => (
            <YStack key={item.token} gap={8}>
              <Text fontSize={item.size} fontWeight="700" color="$color12">
                {item.label}
              </Text>
              <Text fontSize={12} color="$color10">
                Token: <Text fontFamily="monospace">{`$${item.token}`}</Text>
              </Text>
            </YStack>
          ))}
        </YStack>
        <AnchorHeading
          id="typography-body"
          title="Body copy"
          description="Regular Inter for paragraphs and captions."
        />
        <YStack gap="$3">
          {bodyCopy.map((item) => (
            <YStack key={item.label} gap={6}>
              <Paragraph fontSize={item.size} color="$color11">
                {item.label} — “Design systems keep product teams shipping fast.”
              </Paragraph>
              <Text fontSize={12} color="$color10">
                Token: <Text fontFamily="monospace">{`$body-${item.size}`}</Text>
              </Text>
            </YStack>
          ))}
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
