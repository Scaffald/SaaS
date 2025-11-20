import { ArrowRight, Star, Trophy } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Button, Card, H3, Paragraph, Text, XStack, YStack } from 'tamagui'

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
    <YStack gap="$5" items="center" testID="profile-wizard-success-modal">
      <YStack gap="$3" items="center">
        <Trophy size={48} color="$yellow10" />
        <H3>Profile Complete!</H3>
        <Paragraph color="$color11" text="center" style={{ maxWidth: 400 }}>
          Amazing work—your profile is {completionPercentage}% complete. You&apos;re now ready to be
          discovered by top employers and collaborators.
        </Paragraph>
      </YStack>

      <Card bordered bg="$color2" style={{ maxWidth: 440, width: '100%' }}>
        <Card.Header padded gap="$3">
          <Text fontSize="$3" fontWeight="700" color="$color12">
            Benefits Unlocked
          </Text>
          <YStack gap="$2">
            {benefitsToShow.map((benefit) => (
              <XStack key={benefit} gap="$2" items="center">
                <Star size={18} color="$green9" />
                <Text fontSize="$3" color="$color11">
                  {benefit}
                </Text>
              </XStack>
            ))}
          </YStack>
        </Card.Header>
      </Card>

      <YStack gap="$3" style={{ width: '100%', maxWidth: 440 }}>
        <Button size="$5" themeInverse iconAfter={ArrowRight} onPress={onViewProfile}>
          View My Profile
        </Button>
        <Button size="$5" variant="outlined" onPress={onContinueEditing}>
          Continue Editing
        </Button>
      </YStack>
    </YStack>
  )
})
