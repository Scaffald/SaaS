// @ts-nocheck
import React from 'react'
import { Button, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'
import { PropsTable } from '../_components/PropsTable'
import { TodoCallout } from '../_components/TodoCallout'

export default function ButtonsPage() {
  return (
    <StyleguidePage
      title="Buttons"
      description="Bootstrap categories (primary, info, success, warning, danger, inverse) mapped to Tamagui Button themes."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="buttons-variants"
          title="Variants"
          description="Use theme tokens to align with brand palette."
        />
        <ExampleCard
          title="Brand buttons"
          description="Primary CTA plus semantic variants."
          code={`<XStack gap="$3">
  <Button>Primary</Button>
  <Button backgroundColor="$color5">Secondary</Button>
  <Button backgroundColor="$color6" color="$color11">Inverse</Button>
</XStack>`}
        >
          <XStack gap="$3" flexWrap="wrap">
            <Button size="$3">Primary</Button>
            <Button size="$3" backgroundColor="$color5" color="$color12">
              Secondary
            </Button>
            <Button size="$3" backgroundColor="$color3" color="$color11">
              Ghost
            </Button>
            <Button size="$3" backgroundColor="$color9" color="$color1">
              Info
            </Button>
            <Button size="$3" backgroundColor="$color10" color="$color1">
              Success
            </Button>
            <Button size="$3" backgroundColor="$color8" color="$color1">
              Warning
            </Button>
            <Button size="$3" backgroundColor="$color7" color="$color1">
              Danger
            </Button>
          </XStack>
        </ExampleCard>
        <AnchorHeading id="buttons-sizing" title="Sizing" description="Bootstrap’s mini/small/large mapped to $2-$5 tokens." />
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          <Button size="$2">Small</Button>
          <Button size="$3">Default</Button>
          <Button size="$4">Large</Button>
        </XStack>
        <PropsTable
          title="Button props"
          note="Auto-generated docgen pending approval."
          props={[
            {
              name: 'size',
              type: "'$2' | '$3' | '$4' | '$5'",
              description: 'Controls padding and font sizing.',
            },
            {
              name: 'backgroundColor',
              type: 'string',
              description: 'Override theme color for semantic variants.',
            },
            {
              name: 'disabled',
              type: 'boolean',
              description: 'Disables interaction and lowers opacity.',
              defaultValue: 'false',
            },
          ]}
        />
        <TodoCallout id="docgen-props" />
      </YStack>
    </StyleguidePage>
  )
}
