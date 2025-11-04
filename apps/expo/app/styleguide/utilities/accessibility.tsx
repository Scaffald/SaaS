// @ts-nocheck
import React from 'react'
import { Paragraph, Text, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'

export default function AccessibilityPage() {
  return (
    <StyleguidePage
      title="Accessibility"
      description="Practices that ensure WCAG 2.1 AA compliance across the styleguide."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="a11y-focus"
          title="Focus states"
          description="Buttons, links, and form fields inherit Tamagui focus outlines to maintain 3:1 contrast."
        />
        <Paragraph fontSize={13} color="$color10">
          Use <Text fontFamily="monospace">focusStyle</Text> props or rely on the default focus theme provided by @app/ui.
        </Paragraph>
        <AnchorHeading
          id="a11y-aria"
          title="ARIA roles"
          description="Leverage aria-* props for tabs, modals, and tables."
        />
        <Paragraph fontSize={13} color="$color10">
          Tabs automatically set <Text fontFamily="monospace">role="tablist"</Text> while ResponsiveModal uses aria-modal and traps focus.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
