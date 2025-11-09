// @ts-nocheck
import React, { useState } from 'react'
import { Checkbox, Label, Paragraph, RadioGroup, Text, XStack, YStack } from 'tamagui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

export default function FormChoicePage() {
  const [checked, setChecked] = useState(true)
  const [radio, setRadio] = useState('standard')

  return (
    <StyleguidePage
      title="Checkboxes & radios"
      description="Boolean and mutually-exclusive controls styled with Tamagui primitives."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="checkboxes"
          title="Checkboxes"
          description="Stack horizontal or vertical; align with Bootstrap’s inline and block variants."
        />
        <ExampleCard
          title="Notification preferences"
          description="Inline alignment with helper descriptions."
          code={`<Checkbox checked={checked} onCheckedChange={setChecked}>
  <Checkbox.Indicator />
</Checkbox>`}
        >
          <YStack gap="$3">
            <XStack gap="$3" alignItems="center">
              <Checkbox size="$3" checked={checked} onCheckedChange={setChecked}>
                <Checkbox.Indicator>
                  <Text color="$color1">✓</Text>
                </Checkbox.Indicator>
              </Checkbox>
              <Label fontSize={13}>Send me security notifications</Label>
            </XStack>
            <Paragraph fontSize={12} color="$color10">
              Checkbox uses Tamagui focus rings for WCAG compliance.
            </Paragraph>
          </YStack>
        </ExampleCard>
        <AnchorHeading
          id="radios"
          title="Radio groups"
          description="RadioGroup mirrors Bootstrap’s segmented controls."
        />
        <ExampleCard
          title="Benefit tier"
          description="Use RadioGroup.Item with custom labels for Bootstrap look."
          code={`<RadioGroup value={radio} onValueChange={setRadio} orientation="horizontal">
  <RadioGroup.Item value="standard">
    <RadioGroup.Indicator />
  </RadioGroup.Item>
</RadioGroup>`}
        >
          <RadioGroup value={radio} onValueChange={setRadio} orientation="horizontal" gap="$4">
            <RadioOption value="standard" label="Standard" description="Core coverage" />
            <RadioOption value="plus" label="Plus" description="Adds dental" />
            <RadioOption value="premium" label="Premium" description="All benefits" />
          </RadioGroup>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}

type RadioOptionProps = {
  value: string
  label: string
  description: string
}

const RadioOption = ({ value, label, description }: RadioOptionProps) => (
  <YStack gap="$2" alignItems="center">
    <RadioGroup.Item
      value={value}
      size="$3"
      borderWidth={2}
      borderColor="$color8"
      pressStyle={{ backgroundColor: '$color5' }}
    >
      <RadioGroup.Indicator>
        <Text color="$color11">●</Text>
      </RadioGroup.Indicator>
    </RadioGroup.Item>
    <Text fontSize={13} color="$color11" fontWeight="600">
      {label}
    </Text>
    <Text fontSize={12} color="$color10">
      {description}
    </Text>
  </YStack>
)
