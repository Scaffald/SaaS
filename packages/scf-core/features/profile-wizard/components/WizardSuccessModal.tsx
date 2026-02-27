import { ArrowRight, Star, Trophy } from 'lucide-react-native'
import { memo } from 'react'
import { Button, Card, CardHeader, H3, Text, Row, Stack } from '@scaffald/ui'

export interface WizardSuccessModalProps {
  completionPercentage: number
  unlockedBenefits: string[]
  onViewProfile: () => void
  onContinueEditing: () => void
}

const DEFAULT_BENEFITS = [
  'Profile now visible in search',
  'Eligible for personalized job recommendations',
  'Milestone badge unlocked',
]

export const WizardSuccessModal = memo(function WizardSuccessModal({
  completionPercentage,
  unlockedBenefits,
  onViewProfile,
  onContinueEditing,
}: WizardSuccessModalProps) {
  const benefitsToShow = unlockedBenefits.length > 0 ? unlockedBenefits : DEFAULT_BENEFITS

  return (
    <Stack gap={20} align="center" testID="profile-wizard-success-modal">
      <Stack gap={12} align="center">
        <Trophy size={48} color="#f59e0b" />
        <H3>Profile Complete!</H3>
        <Text style={{ color: '#414e62', textAlign: 'center', maxWidth: 400 }}>
          Amazing work—your profile is {completionPercentage}% complete. You&apos;re now ready to be
          discovered by top employers and collaborators.
        </Text>
      </Stack>

      <Card variant="outlined" style={{ maxWidth: 440, width: '100%' }}>
        <CardHeader style={{ gap: 12 }}>
          <Text style={{ color: '#414e62' }}>Benefits Unlocked</Text>
          <Stack gap={8}>
            {benefitsToShow.map((benefit) => (
              <Row key={benefit} gap={8} align="center">
                <Star size={18} color="#16a34a" />
                <Text style={{ color: '#414e62' }}>{benefit}</Text>
              </Row>
            ))}
          </Stack>
        </CardHeader>
      </Card>

      <Stack gap={12} style={{ width: '100%', maxWidth: 440 }}>
        <Button size="lg" variant="filled" color="primary" iconEnd={ArrowRight} onPress={onViewProfile}>
          View My Profile
        </Button>
        <Button size="lg" variant="outline" onPress={onContinueEditing}>
          Continue Editing
        </Button>
      </Stack>
    </Stack>
  )
})
