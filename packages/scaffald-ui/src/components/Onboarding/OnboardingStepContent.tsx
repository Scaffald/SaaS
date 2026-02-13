/**
 * Single step content layout: icon, title, description
 */

import type { FC } from 'react'
import { Stack } from '../Layout'
import { H2, Paragraph } from '../Typography'
import { colors } from '../../tokens/colors'
import type { OnboardingStepContentProps } from './Onboarding.types'

export const OnboardingStepContent: FC<OnboardingStepContentProps> = ({
  icon: Icon,
  title,
  description,
}) => {
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
