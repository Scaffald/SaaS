import type { ComponentType } from 'react'
import { Stack, H2, Paragraph } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

export type AuthOnboardingStepContentProps = {
  icon: ComponentType<{ size?: number; color?: string }>
  title: string
  description: string
}

export function AuthOnboardingStepContent({
  icon: Icon,
  title,
  description,
}: AuthOnboardingStepContentProps) {
  return (
    <Stack
      align="center"
      padding={32}
      flex={1}
      justify="center"
      style={{ maxWidth: 520, alignSelf: 'center' }}
    >
      <Icon size={96} color={colors.gray[700]} />
      <H2
        style={{
          marginTop: 20,
          fontSize: 24,
          color: colors.gray[900],
          textAlign: 'center',
        }}
      >
        {title}
      </H2>
      <Paragraph
        style={{
          marginTop: 16,
          textAlign: 'center',
          color: colors.gray[700],
          lineHeight: 24,
        }}
      >
        {description}
      </Paragraph>
    </Stack>
  )
}
