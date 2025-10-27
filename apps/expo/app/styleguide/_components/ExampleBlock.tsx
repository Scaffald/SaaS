import type { ReactNode } from 'react'
import { Paragraph, Separator, Text, YStack } from 'tamagui'
import { CodeBlock } from './CodeBlock'

export type ExampleBlockProps = {
  title: string
  description?: string
  children: ReactNode
  code: string
}

export function ExampleBlock({ title, description, children, code }: ExampleBlockProps) {
  return (
    <YStack borderWidth={1} borderColor="$gray6" borderRadius="$6" overflow="hidden">
      <YStack padding="$4" backgroundColor="$color">
        <Text fontWeight="700" fontSize={15}>
          {title}
        </Text>
        {description && (
          <Paragraph fontSize={13} color="$gray11" marginTop="$2">
            {description}
          </Paragraph>
        )}
      </YStack>
      <Separator />
      <YStack padding="$4" gap="$4" backgroundColor="$gray1">
        <YStack borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$4" backgroundColor="$color">
          {children}
        </YStack>
        <CodeBlock code={code} />
      </YStack>
    </YStack>
  )
}
