import { Button, Input, Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function SettingsExamplePage() {
  return (
    <StyleguidePage
      title="Settings"
      description="Form layout for account settings."
    >
      <YStack gap="$6">
        <AnchorHeading description="Group inputs in cards with actions.">
          Profile settings
        </AnchorHeading>
        <ExampleBlock
          title="Profile"
          code={`<YStack borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$5" gap="$3">\n  <Text fontWeight="700">Profile</Text>\n  <Input placeholder="Full name" />\n  <Input placeholder="Job title" />\n  <Button theme="primary">Save changes</Button>\n</YStack>`}
        >
          <YStack borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$5" gap="$3">
            <Text fontWeight="700">Profile</Text>
            <Input placeholder="Full name" />
            <Input placeholder="Job title" />
            <Button theme="primary">Save changes</Button>
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
