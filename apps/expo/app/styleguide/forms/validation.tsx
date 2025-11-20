// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { Input, Paragraph, Text, YStack } from '@app/ui'
import { useState } from 'react'

export default function FormValidationPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  return (
    <StyleguidePage
      title="Validation patterns"
      description="Inline, toast, and async validation guidelines referencing Scaffald utilities."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="validation-inline"
          title="Inline feedback"
          description="Leverage Tamagui tokens for success/error states and reuse FieldError for messaging."
        />
        <ExampleCard
          title="Email validation"
          description="Simple regex check with inline error copy."
          code={`const handleBlur = () => {
  if (!email.includes('@')) {
    setError('Enter a valid email address')
  }
}`}
        >
          <YStack gap="$2">
            <Input
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => {
                if (!email.includes('@')) {
                  setError('Enter a valid email address')
                } else {
                  setError('')
                }
              }}
            />
            {error ? (
              <Text fontSize={12} color="$red10">
                {error}
              </Text>
            ) : (
              <Paragraph fontSize={12} color="$color10">
                We send onboarding tips once per week.
              </Paragraph>
            )}
          </YStack>
        </ExampleCard>
        <AnchorHeading
          id="validation-async"
          title="Async states"
          description="Show optimistic loading indicators while validating with backend services."
        />
        <Paragraph fontSize={13} color="$color10">
          Tie tamagui <Text fontFamily="monospace">Spinner</Text> components to TRPC mutations for
          consistent loading states. Toasts from <Text fontFamily="monospace">@tamagui/toast</Text>{' '}
          provide global confirmation for success and failure flows.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
