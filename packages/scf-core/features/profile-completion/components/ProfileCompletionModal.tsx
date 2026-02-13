import { ResponsiveModal } from '@unicornlove/beyond-ui'
import { PartyPopper, UploadCloud } from 'lucide-react-native'
import { memo } from 'react'
import { Button, Paragraph, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      size="md"
    >
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={8} align="center">
            <PartyPopper size={24} color="$blue10" />
            <Text>
              {isFirstTime ? 'Finish in 5 minutes' : `You’re ${completionPercentage}% complete`}
            </Text>
          </Row>

          <Paragraph color="$gray11" aria-live="polite">
            {isFirstTime
              ? 'We’ll walk you through six quick steps so employers can get to know you. Auto-save is enabled, and you can come back anytime.'
              : benefitMessage}
          </Paragraph>
        </Stack>

        <Stack gap={12}>
          <Button size="lg" themeInverse onPress={onStartWizard}>
            {isFirstTime ? 'Start Wizard' : 'Continue Profile'}
          </Button>
          <Button size="lg" iconStart={UploadCloud} onPress={onUploadResume}>
            Upload Resume
          </Button>
          <Button size="sm" chromeless onPress={onDismiss}>
            {isFirstTime ? 'Skip and continue later' : 'Remind me later'}
          </Button>
        </Stack>
      </Stack>
    </ResponsiveModal>
  )
})
