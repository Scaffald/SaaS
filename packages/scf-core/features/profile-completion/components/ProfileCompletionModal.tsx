import { ResponsiveModal } from '@scaffald/ui'
import { PartyPopper, UploadCloud } from 'lucide-react-native'
import { memo } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'

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
      title={isFirstTime ? 'Welcome! Let\u2019s build your profile' : 'Keep going \u2014 you\u2019re close!'}
      size="md"
    >
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={8} align="center">
            <PartyPopper size={24} color="#2563eb" />
            <Text>
              {isFirstTime ? 'Finish in 5 minutes' : `You're ${completionPercentage}% complete`}
            </Text>
          </Row>

          <Text style={{ color: '#414e62' }} aria-live="polite">
            {isFirstTime
              ? 'We\u2019ll walk you through six quick steps so employers can get to know you. Auto-save is enabled, and you can come back anytime.'
              : benefitMessage}
          </Text>
        </Stack>

        <Stack gap={12}>
          <Button size="lg" variant="filled" color="primary" onPress={onStartWizard}>
            {isFirstTime ? 'Start Wizard' : 'Continue Profile'}
          </Button>
          <Button size="lg" iconStart={UploadCloud} onPress={onUploadResume}>
            Upload Resume
          </Button>
          <Button size="sm" variant="text" onPress={onDismiss}>
            {isFirstTime ? 'Skip and continue later' : 'Remind me later'}
          </Button>
        </Stack>
      </Stack>
    </ResponsiveModal>
  )
})
