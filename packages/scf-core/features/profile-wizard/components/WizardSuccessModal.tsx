import { ArrowRight, Star, Trophy } from 'lucide-react-native'
import { memo } from 'react'
import { Button, Card, H3, Paragraph, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
        <Trophy size={48} color="$yellow10" />
        <H3>Profile Complete!</H3>
        <Paragraph color="gray" textAlign="center" style={{ maxWidth: 400 }}>
          Amazing work—your profile is {completionPercentage}% complete. You&apos;re now ready to be
          discovered by top employers and collaborators.
        </Paragraph>
      </Stack>

      <Card bordered backgroundColor="$color2" style={{ maxWidth: 440, width: '100%' }}>
        <Card.Header padded gap={12}>
          <Text color="gray">Benefits Unlocked</Text>
          <Stack gap={8}>
            {benefitsToShow.map((benefit) => (
              <Row key={benefit} gap={8} align="center">
                <Star size={18} color="$green9" />
                <Text color="gray">{benefit}</Text>
              </Row>
            ))}
          </Stack>
        </Card.Header>
      </Card>

      <Stack gap={12} style={{ width: '100%', maxWidth: 440 }}>
        <Button size={20} themeInverse iconAfter={ArrowRight} onPress={onViewProfile}>
          View My Profile
        </Button>
        <Button size={20} variant="outline" onPress={onContinueEditing}>
          Continue Editing
        </Button>
      </Stack>
    </Stack>
  )
})
