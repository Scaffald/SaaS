import { Button, Input, Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function SignInExamplePage() {
  return (
    <StyleguidePage
      title="Sign-in"
      description="Authentication form pattern reused across the app."
    >
      <YStack gap="$6">
        <AnchorHeading description="Simple sign-in form with stacked inputs.">
          Form
        </AnchorHeading>
        <ExampleBlock
          title="Sign-in"
          code={`<YStack gap="$3" padding="$5" borderWidth={1} borderColor="$gray5" borderRadius="$6">\n  <Text fontSize={20} fontWeight="700">Welcome back</Text>\n  <Input placeholder="Email" />\n  <Input placeholder="Password" secureTextEntry />\n  <Button theme="primary">Sign in</Button>\n</YStack>`}
        >
          <YStack gap="$3" padding="$5" borderWidth={1} borderColor="$gray5" borderRadius="$6">
            <Text fontSize={20} fontWeight="700">
              Welcome back
            </Text>
            <Input placeholder="Email" />
            <Input placeholder="Password" secureTextEntry />
            <Button theme="primary">Sign in</Button>
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
