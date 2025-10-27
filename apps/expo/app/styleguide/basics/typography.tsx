import { Paragraph, SizableText, Text, YStack } from 'tamagui'
import { AnchorHeading, StyleguidePage } from '../_components'

const headingLevels = [
  { token: 'H1', fontSize: 32, lineHeight: 38, description: 'Marketing hero and page titles.' },
  { token: 'H2', fontSize: 24, lineHeight: 30, description: 'Section headings within docs and dashboards.' },
  { token: 'H3', fontSize: 18, lineHeight: 24, description: 'Sub-sections, cards, callouts.' },
]

export default function TypographyPage() {
  return (
    <StyleguidePage
      title="Typography"
      description="Mapping Bootstrap’s typographic scale onto Scaffald’s Inter font tokens."
    >
      <YStack gap="$6">
        <AnchorHeading description="Headings rely on Tamagui’s Inter font builder.">
          Headings
        </AnchorHeading>
        <YStack gap="$4">
          {headingLevels.map((heading) => (
            <YStack key={heading.token} gap="$2">
              <SizableText fontSize={heading.fontSize} lineHeight={heading.lineHeight} fontWeight="700">
                {heading.token} — {heading.description}
              </SizableText>
              <Text color="$gray11">Font size: {heading.fontSize}px · Line height: {heading.lineHeight}px</Text>
            </YStack>
          ))}
        </YStack>

        <AnchorHeading description="Body copy styles for long-form guidance.">
          Body copy
        </AnchorHeading>
        <Paragraph>
          Base copy uses <Text fontFamily="monospace">bodyFont</Text> from <Text fontFamily="monospace">packages/ui</Text> with a
          slight line-height multiplier for readability. For captions, drop to <Text fontFamily="monospace">$2</Text>.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
