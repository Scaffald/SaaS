import {
  Award,
  Briefcase,
  ChevronRight,
  Clock,
  GraduationCap,
  type LucideIcon,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  Zap,
} from 'lucide-react-native'
import { memo } from 'react'
import { Button, Card, H3, Paragraph, Text, Row, Stack } from '@scaffald/ui'
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

  const STEP_ICONS: Record<string, LucideIcon> = {
    general: UserRound,
    skills: Sparkles,
    experience: Briefcase,
    certifications: Award,
    preferences: SlidersHorizontal,
    education: GraduationCap,
  }

  return (
    <Stack gap={20} testID="profile-wizard-start-screen">
      <Stack gap={12}>
        <H3>Complete Your Profile in Minutes</H3>
        <Paragraph color="$gray11">
          Unlock better job matches and visibility by finishing six quick steps. We&apos;ll guide
          you through the essentials and save your progress automatically.
        </Paragraph>
      </Stack>

      <Card bordered elevate backgroundColor="$color2">
        <Card.Header padded gap={16}>
          <Stack gap={12}>
            <Row gap={8} align="center">
              <Zap size="lg" color="$yellow10" />
              <Text color="$gray11">Fast-Track Your Profile</Text>
            </Row>
            <Paragraph color="$gray11">
              You&apos;re {completionPercentage}% complete. Finish the wizard to unlock profile
              visibility, milestone badges, and curated job recommendations.
            </Paragraph>
          </Stack>

          <Stack gap={12}>
            <Text color="$gray11">What you&apos;ll cover</Text>
            <Stack gap={12}>
              {PROFILE_WIZARD_STEPS.map((stepId) => {
                const meta = PROFILE_WIZARD_STEP_META[stepId]
                const StepIcon = STEP_ICONS[stepId] ?? Sparkles
                return (
                  <Row key={stepId} gap={12} align="center">
                    <Card
                      backgroundColor="$color3"
                      borderColor="$color5"
                      borderWidth={1}
                      width={44}
                      height={44}
                      align="center"
                      justify="center"
                      borderRadius={16}
                    >
                      <StepIcon size="lg" color="$blue10" />
                    </Card>
                    <Stack flex={1}>
                      <Text color="$gray11">{meta.title}</Text>
                      <Text color="$gray11">{meta.description}</Text>
                    </Stack>
                    <Text color="$gray11">{meta.estimatedTimeMinutes} min</Text>
                  </Row>
                )
              })}
            </Stack>
          </Stack>
        </Card.Header>
      </Card>

      <Stack gap={12}>
        <Button size="lg" themeInverse iconAfter={ChevronRight} onPress={onStartWizard}>
          Start Wizard
        </Button>
        <Button size="lg" iconStart={Upload} onPress={onUploadResume}>
          Upload Resume
        </Button>
        <Button size="sm" chromeless onPress={onSkip}>
          Skip and Edit Later
        </Button>
      </Stack>

      <Card bordered backgroundColor="$color2">
        <Card.Header padded gap={12}>
          <Row gap={12} flexWrap="wrap">
            <Row gap={8} align="center">
              <Clock size={18} color="$blue10" />
              <Text color="$gray11">{estimatedMinutes || ESTIMATED_MINUTES_FALLBACK} minutes</Text>
            </Row>
            <Text color="$gray11">6 guided steps • Auto-save enabled • Resume anytime</Text>
          </Row>
        </Card.Header>
      </Card>
    </Stack>
  )
})
