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
import { Button, Card, CardHeader, H3, Text, Row, Stack } from '@scaffald/ui'
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
        <Text style={{ color: '#414e62' }}>
          Unlock better job matches and visibility by finishing six quick steps. We&apos;ll guide
          you through the essentials and save your progress automatically.
        </Text>
      </Stack>

      <Card variant="outlined">
        <CardHeader style={{ gap: 16 }}>
          <Stack gap={12}>
            <Row gap={8} align="center">
              <Zap size={20} color="#f59e0b" />
              <Text style={{ color: '#414e62' }}>Fast-Track Your Profile</Text>
            </Row>
            <Text style={{ color: '#414e62' }}>
              You&apos;re {completionPercentage}% complete. Finish the wizard to unlock profile
              visibility, milestone badges, and curated job recommendations.
            </Text>
          </Stack>

          <Stack gap={12}>
            <Text style={{ color: '#414e62' }}>What you&apos;ll cover</Text>
            <Stack gap={12}>
              {PROFILE_WIZARD_STEPS.map((stepId) => {
                const meta = PROFILE_WIZARD_STEP_META[stepId]
                const StepIcon = STEP_ICONS[stepId] ?? Sparkles
                return (
                  <Row key={stepId} gap={12} align="center">
                    <Stack
                      width={44}
                      height={44}
                      align="center"
                      justify="center"
                      borderRadius={16}
                      borderWidth={1}
                      borderColor="#e4e7ec"
                      backgroundColor="#f2f4f7"
                    >
                      <StepIcon size={20} color="#2563eb" />
                    </Stack>
                    <Stack flex={1}>
                      <Text style={{ color: '#414e62' }}>{meta.title}</Text>
                      <Text style={{ color: '#414e62' }}>{meta.description}</Text>
                    </Stack>
                    <Text style={{ color: '#414e62' }}>{meta.estimatedTimeMinutes} min</Text>
                  </Row>
                )
              })}
            </Stack>
          </Stack>
        </CardHeader>
      </Card>

      <Stack gap={12}>
        <Button size="lg" variant="filled" color="primary" iconEnd={ChevronRight} onPress={onStartWizard}>
          Start Wizard
        </Button>
        <Button size="lg" iconStart={Upload} onPress={onUploadResume}>
          Upload Resume
        </Button>
        <Button size="sm" variant="text" onPress={onSkip}>
          Skip and Edit Later
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardHeader style={{ gap: 12 }}>
          <Row gap={12} wrap>
            <Row gap={8} align="center">
              <Clock size={18} color="#2563eb" />
              <Text style={{ color: '#414e62' }}>{estimatedMinutes || ESTIMATED_MINUTES_FALLBACK} minutes</Text>
            </Row>
            <Text style={{ color: '#414e62' }}>6 guided steps • Auto-save enabled • Resume anytime</Text>
          </Row>
        </CardHeader>
      </Card>
    </Stack>
  )
})
