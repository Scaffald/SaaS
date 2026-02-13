/**
 * Onboarding component types
 */

import type { ComponentType, FC } from 'react'

export interface OnboardingStepInfo {
  Content: FC
  backgroundImage?: string
}

export interface OnboardingProps {
  onOnboarded?: () => void
  autoSwipe?: boolean
  steps: OnboardingStepInfo[]
}

export interface OnboardingStepContentProps {
  icon: ComponentType<{ size?: number; color?: string }>
  title: string
  description: string
}

export interface OnboardingControlsProps {
  currentIdx: number
  onChange: (newIdx: number) => void
  stepsCount: number
  onFinish?: () => void
  skipLabel?: string
  continueLabel?: string
  getStartedLabel?: string
}
