import { Paragraph, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const steps = [
  'Invite collaborators',
  'Review portfolio',
  'Schedule kickoff call',
]

export default function ListsPage() {
  return (
    <StyleguidePage
      title="Lists"
      description="Ordered and unordered lists styled after Bootstrap list groups."
    >
      <YStack gap="$6">
        <AnchorHeading description="Use YStack with borders to mimic Bootstrap list groups.">
          List group
        </AnchorHeading>
        <ExampleBlock
          title="Action list"
          code={`<YStack borderWidth={1} borderColor="$gray4" borderRadius="$5">\n  {steps.map((step) => (\n    <Paragraph key={step} padding="$3" borderBottomWidth={1} borderColor="$gray4">{step}</Paragraph>\n  ))}\n</YStack>`}
        >
          <YStack borderWidth={1} borderColor="$gray4" borderRadius="$5">
            {steps.map((step, index) => (
              <Paragraph
                key={step}
                padding="$3"
                borderBottomWidth={index === steps.length - 1 ? 0 : 1}
                borderColor="$gray4"
              >
                {step}
              </Paragraph>
            ))}
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
