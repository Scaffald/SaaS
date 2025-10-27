import { Input, Label, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function InputsPage() {
  return (
    <StyleguidePage
      title="Inputs"
      description="Text inputs styled with Tamagui tokens and matching Bootstrap 2 states."
    >
      <YStack gap="$6">
        <AnchorHeading description="Default inputs include focus outlines and border radii.">
          Base input
        </AnchorHeading>
        <ExampleBlock
          title="Text field"
          code={`<Label htmlFor="email">Email</Label>\n<Input id="email" placeholder="you@example.com" />`}
        >
          <YStack gap="$2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" />
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
