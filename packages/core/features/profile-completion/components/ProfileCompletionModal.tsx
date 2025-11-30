import { ResponsiveModal } from '@scaffald/neue-ui'
import { PartyPopper, UploadCloud } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'

type ModalMode = 'first-login' | 'progress-reminder'

interface ProfileCompletionModalProps {
  open: boolean
  mode: ModalMode
  completionPercentage: number
  benefitMessage: string
  onStartWizard: () => void
  onUploadResume: () => void
  onDismiss: () => void
}

export const ProfileCompletionModal = memo(function ProfileCompletionModal({
  open,
  mode,
  completionPercentage,
  benefitMessage,
  onStartWizard,
  onUploadResume,
  onDismiss,
}: ProfileCompletionModalProps) {
  const isFirstTime = mode === 'first-login'

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(value) => {
        if (!value) onDismiss()
      }}
      title={isFirstTime ? 'Welcome! Let’s build your profile' : 'Keep going — you’re close!'}
      size="medium"
    >
      <YStack gap="$4">
        <YStack gap="$2">
          <XStack gap="$2" items="center">
            <PartyPopper size={24} color="$blue10" />
            <Text fontSize="$5" fontWeight="700">
              {isFirstTime ? 'Finish in 5 minutes' : `You’re ${completionPercentage}% complete`}
            </Text>
          </XStack>

          <Paragraph color="$color11" aria-live="polite">
            {isFirstTime
              ? 'We’ll walk you through six quick steps so employers can get to know you. Auto-save is enabled, and you can come back anytime.'
              : benefitMessage}
          </Paragraph>
        </YStack>

        <YStack gap="$3">
          <Button size="$5" themeInverse onPress={onStartWizard}>
            {isFirstTime ? 'Start Wizard' : 'Continue Profile'}
          </Button>
          <Button size="$5" icon={UploadCloud} onPress={onUploadResume}>
            Upload Resume
          </Button>
          <Button size="$3" chromeless onPress={onDismiss}>
            {isFirstTime ? 'Skip and continue later' : 'Remind me later'}
          </Button>
        </YStack>
      </YStack>
    </ResponsiveModal>
  )
})
