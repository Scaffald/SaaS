import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { StyleguidePage, AnchorHeading, ExampleBlock } from '../_components'

const columns = Array.from({ length: 12 }, (_, index) => index + 1)

export default function GridPage() {
  return (
    <StyleguidePage
      title="Grid & Layout"
      description="Responsive 12-column layout utilities that mirror Bootstrap 2 while using Tamagui’s stack primitives."
    >
      <YStack gap="$6">
        <AnchorHeading description="Fixed-width containers with 12 equal columns.">
          Fixed grid
        </AnchorHeading>
        <ExampleBlock
          title="Desktop grid"
          description="Each column uses flex-basis percentages to emulate the original Bootstrap grid."
          code={`<XStack flexWrap="wrap" gap="$2">\n  {[...Array(12)].map((_, index) => (\n    <YStack\n      key={index}\n      width="8.333%"\n      minWidth={80}\n      padding="$3"\n      backgroundColor="$blue4"\n      borderRadius="$3"\n      alignItems="center"\n    >\n      <Text fontWeight="700">col-{index + 1}</Text>\n    </YStack>\n  ))}\n</XStack>`}
        >
          <XStack flexWrap="wrap" gap="$2">
            {columns.map((column) => (
              <YStack
                key={column}
                width="8.333%"
                minWidth={80}
                padding="$3"
                backgroundColor="$blue4"
                borderRadius="$3"
                alignItems="center"
              >
                <Text fontWeight="700">col-{column}</Text>
              </YStack>
            ))}
          </XStack>
        </ExampleBlock>

        <AnchorHeading description="Fluid containers adjust their column basis under 640px.">
          Fluid behavior
        </AnchorHeading>
        <Paragraph>
          Use the <Text fontFamily="monospace">$xs</Text> media query shorthands supplied by Tamagui to stack columns on
          narrow screens. The <Text fontFamily="monospace">$gtSm</Text> breakpoints keep parity with Bootstrap’s 768px width.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
