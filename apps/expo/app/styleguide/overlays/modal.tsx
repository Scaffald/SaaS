import { useState } from 'react'
import { Button, Dialog, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function ModalPage() {
  const [open, setOpen] = useState(false)

  return (
    <StyleguidePage
      title="Modal"
      description="Accessible modal dialog using Tamagui Dialog with focus trapping."
    >
      <YStack gap="$6">
        <AnchorHeading description="Dialog handles aria attributes out of the box.">
          Dialog
        </AnchorHeading>
        <ExampleBlock
          title="Modal"
          code={`<Dialog open={open} onOpenChange={setOpen}>\n  <Dialog.Trigger asChild>\n    <Button theme="primary">Launch demo</Button>\n  </Dialog.Trigger>\n  <Dialog.Portal>\n    <Dialog.Overlay />\n    <Dialog.Content>...</Dialog.Content>\n  </Dialog.Portal>\n</Dialog>`}
        >
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button theme="primary">Launch demo</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay backgroundColor="rgba(0,0,0,0.5)" />
              <Dialog.Content
                bordered
                elevate
                padding="$5"
                borderRadius="$6"
                gap="$3"
                maxWidth={400}
              >
                <Dialog.Title>Invite teammates</Dialog.Title>
                <Dialog.Description>
                  Share access with collaborators. They will receive an email invitation.
                </Dialog.Description>
                <Button onPress={() => setOpen(false)}>Close</Button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
