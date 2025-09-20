import { H2, Paragraph, YStack } from '@my/ui'
import type { ReactNode } from 'react'

export type LegalSectionProps = {
  title: string
  description?: string
  children?: ReactNode
}

export const LegalSection = ({ title, description, children }: LegalSectionProps) => {
  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <H2>{title}</H2>
        {description ? <Paragraph>{description}</Paragraph> : null}
      </YStack>
      {children}
    </YStack>
  )
}
