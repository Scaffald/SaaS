import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Sheet, Text, YStack } from 'tamagui'
import { EnhancedProfileCompletionWidget } from './EnhancedProfileCompletionWidget'
import { ProfileCompletionModal } from './ProfileCompletionModal'
import { ProfileWizard } from '@app/core/features/profile-wizard/components/ProfileWizard'
import { useCompletionStatus } from '../hooks/useCompletionStatus'
import { useCompletionNudges } from '../hooks/useCompletionNudges'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { ROUTES } from '@app/core/constants/routes'

const SESSION_MODAL_KEY = 'profile_completion_modal_dismissed'

export function ProfileCompletionExperience() {
  const { status, isLoading, refetch } = useCompletionStatus()
  const {
    currentBenefit,
    advanceMessage,
    hasMultiple,
    isLoading: isBenefitLoading,
  } = useCompletionNudges()
  const dismissNudgeMutation = api.profile.dismissNudge.useMutation()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'first-login' | 'progress-reminder'>('progress-reminder')
  const dismissedThisSessionRef = useRef(false)
  const router = useRouter()

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
    if (currentBenefit) return currentBenefit.description
    if (!status) return 'Complete your profile to unlock more opportunities.'
    if (status.incompleteSections.includes('skills')) {
      return 'Add at least five skills to surface in more recruiter searches.'
    }
    if (status.incompleteSections.includes('experience')) {
      return 'Share your latest experience so employers can see your impact.'
    }
    return 'Complete your profile to unlock badges and appear in featured searches.'
  }, [currentBenefit, status])

  const recordDismiss = useCallback(
    (reason: string) => {
      dismissNudgeMutation.mutate({
        nudgeId: 'profile-wizard-modal',
        reason,
      })
    },
    [dismissNudgeMutation],
  )

  const dismissModal = useCallback(
    (reason: string = 'user_dismissed_modal') => {
      setIsModalOpen(false)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_MODAL_KEY, 'true')
      }
      recordDismiss(reason)
    },
    [recordDismiss],
  )

  const handleStartWizard = useCallback(() => {
    dismissModal('started_wizard')
    setIsWizardOpen(true)
  }, [dismissModal])

  const handleWidgetStart = useCallback(() => {
    setIsWizardOpen(true)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_MODAL_KEY, 'true')
    }
  }, [])

  const navigateToImportReview = useCallback(() => {
    dismissModal('opened_import_review')
    setIsWizardOpen(false)
    router.push(ROUTES.DASHBOARD_PROFILE_IMPORT_REVIEW.path)
  }, [dismissModal, router])

  const handleWizardClosed = useCallback(() => {
    setIsWizardOpen(false)
    void refetch()
  }, [refetch])

  const handleViewProfile = useCallback(() => {
    router.push(ROUTES.DASHBOARD_PROFILE_GENERAL.path)
  }, [router])

  return (
    <YStack gap="$4">
      <EnhancedProfileCompletionWidget
        onStartWizard={handleWidgetStart}
        onOpenImport={navigateToImportReview}
        currentBenefit={currentBenefit}
        advanceBenefit={advanceMessage}
        hasMultipleBenefits={hasMultiple}
        isBenefitLoading={isBenefitLoading}
      />

      <ProfileCompletionModal
        open={isModalOpen}
        mode={modalMode}
        completionPercentage={status?.completionPercentage ?? 0}
        benefitMessage={benefitMessage}
        onStartWizard={handleStartWizard}
        onUploadResume={navigateToImportReview}
        onDismiss={() => dismissModal('user_dismissed_modal')}
      />

      <Sheet
        open={isWizardOpen}
        onOpenChange={(value) => {
          setIsWizardOpen(value)
          if (!value) {
            void refetch()
          }
        }}
        snapPoints={[90]}
        modal
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="$background" aria-label="Profile completion wizard">
          <Sheet.Handle />
          <YStack p="$4" gap="$4" flex={1}>
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="700">
                Complete Your Profile
              </Text>
              <Text color="$color11">We’ll auto-save as you go. You can exit anytime.</Text>
            </YStack>
            <ProfileWizard
              onSuccess={handleWizardClosed}
              onCancel={handleWizardClosed}
              onUploadResume={navigateToImportReview}
              onViewProfile={handleViewProfile}
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


