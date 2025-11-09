// @ts-nocheck
import React, { useState } from 'react'
import { Button, Input, Paragraph, Text, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'

export default function SignInExamplePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <StyleguidePage
      title="Sign-in"
      description="Bootstrap-style authentication layout using Tamagui components."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="sign-in-form"
          title="Form"
          description="Centered card with inputs and helper links."
        />
        <YStack
          borderWidth={1}
          borderColor="$color6"
          borderRadius="$4"
          padding="$5"
          maxWidth={360}
          gap="$3"
        >
          <Text fontSize={18} fontWeight="600" color="$color11">
            Welcome back
          </Text>
          <Input placeholder="Email" value={email} onChangeText={setEmail} />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button>Sign in</Button>
          <Paragraph fontSize={12} color="$color10">
            Forgot password? <Text color="$color9">Reset it here</Text>.
          </Paragraph>
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
