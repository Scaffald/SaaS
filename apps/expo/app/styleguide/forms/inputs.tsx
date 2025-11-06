// @ts-nocheck
import React, { useState } from 'react'
import { Input, Paragraph, Text, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'
import { TodoCallout } from '../_components/TodoCallout'

export default function FormInputsPage() {
  const [value, setValue] = useState('')
  const [multiline, setMultiline] = useState('Requesting paid time off next Friday.')

  return (
    <StyleguidePage
      title="Text inputs"
      description="Bootstrap-style control sizing mapped to Tamagui tokens."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="inputs-basic"
          title="Basic fields"
          description="Use Tamagui Input with $2-$5 sizes to reflect Bootstrap’s small/large variants."
        />
        <ExampleCard
          title="Account details"
          description="Default, small, and large states plus disabled and error messaging."
          code={`<YStack gap="$3">
  <Input size="$3" placeholder="Full name" value={value} onChangeText={setValue} />
  <Input size="$2" placeholder="Small input" />
  <Input size="$5" placeholder="Large input" disabled />
</YStack>`}
        >
          <YStack gap="$3">
            <Input size="$3" placeholder="Full name" value={value} onChangeText={setValue} />
            <Input size="$2" placeholder="Small input" />
            <Input size="$5" placeholder="Large input" disabled />
            <YStack gap="$2">
              <Input size="$3" placeholder="Email address" value="invalid" />
              <Text fontSize={12} color="$red10">
                Inline error messaging mirrors FieldError styling.
              </Text>
            </YStack>
          </YStack>
        </ExampleCard>
        <AnchorHeading
          id="inputs-multiline"
          title="Textarea"
          description="Enable multiline on Input for Bootstrap-esque textareas."
        />
        <ExampleCard
          title="Manager notes"
          description="Textarea with helper copy and soft character counter."
          code={`<Input
  multiline
  numberOfLines={4}
  value={note}
  onChangeText={setNote}
/>`}
        >
          <YStack gap="$2">
            <Input multiline numberOfLines={4} value={multiline} onChangeText={setMultiline} />
            <Paragraph fontSize={12} color="$color10">
              {multiline.length}/280 characters
            </Paragraph>
          </YStack>
        </ExampleCard>
        <TodoCallout id="docgen-props" />
      </YStack>
    </StyleguidePage>
  )
}
