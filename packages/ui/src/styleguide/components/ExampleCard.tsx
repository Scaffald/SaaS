// @ts-nocheck
import type { ReactNode } from 'react'
import { Separator, Text, View, YStack } from 'tamagui'
import { CodeBlock } from './CodeBlock'

type ExampleCardProps = {
  title: string
  description?: string
  code: string
  children: ReactNode
}

export function ExampleCard({ title, description, code, children }: ExampleCardProps) {
  return (
    <YStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden" bg="$color1">
      <YStack padding="$4" gap="$3">
        <Text fontSize={16} fontWeight="600" color="$color12">
          {title}
        </Text>
        {description ? (
          <Text fontSize={13} color="$color10">
            {description}
          </Text>
        ) : null}
        <View padding="$4" bg="$color2" borderRadius="$4" borderWidth={1} borderColor="$color5">
          {children}
        </View>
      </YStack>
      <Separator borderColor="$color5" />
      <View padding="$4">
        <CodeBlock code={code} />
      </View>
    </YStack>
  )
}
