// @ts-nocheck
import React, { useState } from 'react'
import { Button, Text, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

export default function TooltipPopoverPage() {
  const [visible, setVisible] = useState(false)

  return (
    <StyleguidePage
      title="Tooltips & popovers"
      description="Hover and click overlays for additional context."
    >
      <YStack gap="$6">
        <AnchorHeading id="tooltip-basic" title="Tooltip" description="Lightweight hover label." />
        <ExampleCard
          title="Simple tooltip"
          description="Demo uses button text change to simulate tooltip visibility."
          code={`const [visible, setVisible] = useState(false)
<Button onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
  Hover me
</Button>`}
        >
          <YStack gap="$2">
            <Button
              onHoverIn={() => setVisible(true)}
              onHoverOut={() => setVisible(false)}
              backgroundColor="$color3"
              color="$color11"
            >
              Hover me
            </Button>
            {visible ? (
              <YStack padding="$2" borderRadius="$3" backgroundColor="$color11">
                <Text fontSize={12} color="$color1">
                  Tooltip placeholder
                </Text>
              </YStack>
            ) : null}
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
