import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Sheet, Text, YStack } from 'tamagui'
import { EnhancedProfileCompletionWidget } from './EnhancedProfileCompletionWidget'
import { ProfileCompletionModal } from './ProfileCompletionModal'
import { ProfileWizard } from '@app/core/features/profile-wizard/components/ProfileWizard'
import { useCompletionStatus } from '../hooks/useCompletionStatus'

const SESSION_MODAL_KEY = 'profile_completion_modal_dismissed'

export function ProfileCompletionExperience() {
  const { status, isLoading } = useCompletionStatus()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'first-login' | 'progress-reminder'>('progress-reminder')
  const dismissedThisSessionRef = useRef(false)

  useEffect(() => {
    if (!status || isLoading) return

    if (dismissedThisSessionRef.current) return

    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_MODAL_KEY) : null
    const hasDismissedThisSession = stored === 'true'

    if (!hasDismissedThisSession && status.shouldShowWizard) {
      setModalMode(status.modalMode ?? 'progress-reminder')
      setIsModalOpen(true)
      dismissedThisSessionRef.current = true
    }
  }, [status, isLoading])

  const benefitMessage = useMemo(() => {
    if (!status) return 'Complete your profile to unlock more opportunities.'
    if (status.incompleteSections.includes('skills')) {
      return 'Add at least five skills to surface in more recruiter searches.'
    }
    if (status.incompleteSections.includes('experience')) {
      return 'Share your latest experience so employers can see your impact.'
    }
    return 'Complete your profile to unlock badges and appear in featured searches.'
  }, [status])

  const dismissModal = useCallback(() => {
    setIsModalOpen(false)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_MODAL_KEY, 'true')
    }
  }, [])

  const handleStartWizard = useCallback(() => {
    dismissModal()
    setIsWizardOpen(true)
  }, [dismissModal])

  return (
    <YStack gap="$4">
      <EnhancedProfileCompletionWidget
        onStartWizard={() => setIsWizardOpen(true)}
        onOpenImport={() => {
          // TODO: wire resume import flow
        }}
      />

      <ProfileCompletionModal
        open={isModalOpen}
        mode={modalMode}
        completionPercentage={status?.completionPercentage ?? 0}
        benefitMessage={benefitMessage}
        onStartWizard={handleStartWizard}
        onUploadResume={() => {
          dismissModal()
          // TODO: trigger resume upload modal when available
        }}
        onDismiss={dismissModal}
      />

      <Sheet
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        snapPoints={[90]}
        modal
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background">
          <Sheet.Handle />
          <YStack p="$4" gap="$4" flex={1}>
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="700">
                Complete Your Profile
              </Text>
              <Text color="$color11">We’ll auto-save as you go. You can exit anytime.</Text>
            </YStack>
            <ProfileWizard
              onSuccess={() => setIsWizardOpen(false)}
              onCancel={() => setIsWizardOpen(false)}
            />
            <Button size="$4" variant="outlined" onPress={() => setIsWizardOpen(false)}>
              Close
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}


