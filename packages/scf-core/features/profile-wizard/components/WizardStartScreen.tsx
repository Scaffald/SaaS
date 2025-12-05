import type { IconProps } from '@tamagui/helpers-icon'
import {
  Award,
  Briefcase,
  ChevronRight,
  Clock,
  GraduationCap,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  Zap,
} from '@tamagui/lucide-icons'
import { type ComponentType, memo } from 'react'
import { Button, Card, H3, Paragraph, Text, XStack, YStack } from '@unicornlove/ui'
import { PROFILE_WIZARD_STEP_META, PROFILE_WIZARD_STEPS } from '../utils/wizardSteps'

export interface WizardStartScreenProps {
  onStartWizard: () => void
  onUploadResume: () => void
  onSkip: () => void
  totalEstimatedMinutes?: number
  completionPercentage?: number
}

const ESTIMATED_MINUTES_FALLBACK = 6

export const WizardStartScreen = memo(function WizardStartScreen({
  onStartWizard,
  onUploadResume,
  onSkip,
  totalEstimatedMinutes,
  completionPercentage = 0,
}: WizardStartScreenProps) {
  const estimatedMinutes =
    totalEstimatedMinutes ??
    PROFILE_WIZARD_STEPS.reduce(
      (total, step) => total + PROFILE_WIZARD_STEP_META[step].estimatedTimeMinutes,
      0
    )

  const STEP_ICONS: Record<string, ComponentType<IconProps>> = {
    general: UserRound,
    skills: Sparkles,
    experience: Briefcase,
    certifications: Award,
    preferences: SlidersHorizontal,
    education: GraduationCap,
  }

  return (
    <YStack gap="$5" testID="profile-wizard-start-screen">
      <YStack gap="$3">
        <H3>Complete Your Profile in Minutes</H3>
        <Paragraph color="$color11">
          Unlock better job matches and visibility by finishing six quick steps. We&apos;ll guide
          you through the essentials and save your progress automatically.
        </Paragraph>
      </YStack>

      <Card bordered elevate backgroundColor="$color2">
        <Card.Header padded gap="$4">
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Zap size={20} color="$yellow10" />
              <Text fontSize="$3" fontWeight="600" color="$color12">
                Fast-Track Your Profile
              </Text>
            </XStack>
            <Paragraph color="$color11">
              You&apos;re {completionPercentage}% complete. Finish the wizard to unlock profile
              visibility, milestone badges, and curated job recommendations.
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <Text fontWeight="600" color="$color12">
              What you&apos;ll cover
            </Text>
            <YStack gap="$3">
              {PROFILE_WIZARD_STEPS.map((stepId) => {
                const meta = PROFILE_WIZARD_STEP_META[stepId]
                const StepIcon = STEP_ICONS[stepId] ?? Sparkles
                return (
                  <XStack key={stepId} gap="$3" alignItems="center">
                    <Card
                      backgroundColor="$color3"
                      borderColor="$color5"
                      borderWidth={1}
                      width={44}
                      height={44}
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="$4"
                    >
                      <StepIcon size={20} color="$blue10" />
                    </Card>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="600" color="$color12">
                        {meta.title}
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {meta.description}
                      </Text>
                    </YStack>
                    <Text fontSize="$2" color="$color10">
                      {meta.estimatedTimeMinutes} min
                    </Text>
                  </XStack>
                )
              })}
            </YStack>
          </YStack>
        </Card.Header>
      </Card>

      <YStack gap="$3">
        <Button size="$5" themeInverse iconAfter={ChevronRight} onPress={onStartWizard}>
          Start Wizard
        </Button>
        <Button size="$5" icon={Upload} onPress={onUploadResume}>
          Upload Resume
        </Button>
        <Button size="$3" chromeless onPress={onSkip}>
          Skip and Edit Later
        </Button>
      </YStack>

      <Card bordered backgroundColor="$color2">
        <Card.Header padded gap="$3">
          <XStack gap="$3" flexWrap="wrap">
            <XStack gap="$2" alignItems="center">
              <Clock size={18} color="$blue10" />
              <Text fontSize="$3" fontWeight="600" color="$color12">
                {estimatedMinutes || ESTIMATED_MINUTES_FALLBACK} minutes
              </Text>
            </XStack>
            <Text fontSize="$3" color="$color11">
              6 guided steps • Auto-save enabled • Resume anytime
            </Text>
          </XStack>
        </Card.Header>
      </Card>
    </YStack>
  )
})
