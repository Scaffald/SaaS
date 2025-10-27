import { FieldError } from '@app/ui'
import { Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function ValidationPage() {
  return (
    <StyleguidePage
      title="Validation"
      description="Error states and inline validation cues using FieldError component."
    >
      <YStack gap="$6">
        <AnchorHeading description="Pair FieldError with inputs to mirror Bootstrap help text.">
          Inline errors
        </AnchorHeading>
        <ExampleBlock
          title="Field error"
          code={`<FieldError message="Email is required" />`}
        >
          <YStack gap="$2">
            <Text fontWeight="700">Email</Text>
            <FieldError message="Email is required" />
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
