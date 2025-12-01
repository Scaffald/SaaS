// @ts-nocheck
import type { ReactNode } from 'react'
import { Paragraph, Text, YStack } from 'tamagui'

export type StyleguidePageProps = {
  title: string
  description?: string
  children: ReactNode
  leadIn?: ReactNode
}

export function StyleguidePage({ title, description, children, leadIn }: StyleguidePageProps) {
  return (
    <YStack gap="$5" width="100%" self="center" style={{ maxWidth: 960 }}>
      <YStack gap="$3">
        <Text fontSize={40} fontWeight="700" color="$color12">
          {title}
        </Text>
        {description ? (
          <Paragraph fontSize={16} color="$color10">
            {description}
          </Paragraph>
        ) : null}
        {leadIn}
      </YStack>
      {children}
    </YStack>
  )
}
