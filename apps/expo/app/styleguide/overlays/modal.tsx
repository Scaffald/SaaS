// @ts-nocheck
import React, { useState } from 'react'
import { Button, Paragraph, Text, YStack } from '@app/ui'
import { ResponsiveModal } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

export default function ModalPage() {
  const [open, setOpen] = useState(false)

  return (
    <StyleguidePage
      title="Modal"
      description="ResponsiveModal from @app/ui provides Bootstrap-style dialogs with focus trap support."
    >
      <YStack gap="$6">
        <AnchorHeading id="modal-basic" title="Basic modal" description="Desktop centers the dialog while mobile slides up." />
        <ExampleCard
          title="Invite member"
          description="Trigger button opens ResponsiveModal."
          code={`<ResponsiveModal open={open} onOpenChange={setOpen}>
  <ResponsiveModal.Trigger>
    <Button>Invite</Button>
  </ResponsiveModal.Trigger>
  <ResponsiveModal.Content>
    ...
  </ResponsiveModal.Content>
</ResponsiveModal>`}
        >
          <ResponsiveModal open={open} onOpenChange={setOpen} size="md">
            <ResponsiveModal.Trigger asChild>
              <Button onPress={() => setOpen(true)}>Open modal</Button>
            </ResponsiveModal.Trigger>
            <ResponsiveModal.Content>
              <YStack gap="$3">
                <Text fontSize={16} fontWeight="600" color="$color11">
                  Invite teammate
                </Text>
                <Paragraph fontSize={13} color="$color10">
                  Share access to compliance dashboards and assign onboarding tasks.
                </Paragraph>
                <Button onPress={() => setOpen(false)}>Send invite</Button>
              </YStack>
            </ResponsiveModal.Content>
          </ResponsiveModal>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
