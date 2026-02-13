import { ROUTES } from '@scf/core/constants/routes'
import { ProfileWizard } from '@scf/core/features/profile-wizard/components/ProfileWizard'
import { useDismissNudgeMutation } from '@scf/core/utils/profile-completion-sdk-hooks'
import { Sheet } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Text, Stack } from '@unicornlove/beyond-ui'
import type { PersonalizedBenefit } from '../hooks/useCompletionNudges'
import { useCompletionNudges } from '../hooks/useCompletionNudges'
import type { CompletionStatus } from '../hooks/useCompletionStatus'
import { useCompletionStatus } from '../hooks/useCompletionStatus'
import { EnhancedProfileCompletionWidget } from './EnhancedProfileCompletionWidget'
import { ProfileCompletionModal } from './ProfileCompletionModal'

const SESSION_MODAL_KEY = 'profile_completion_modal_dismissed'

export function ProfileCompletionExperience() {
  const { status, isLoading, refetch } = useCompletionStatus()
  const {
    currentBenefit,
    advanceMessage,
    retreatMessage,
    goToMessage,
    currentIndex,
    totalCount,
    hasMultiple,
    isLoading: isBenefitLoading,
  } = useCompletionNudges()
  const dismissNudgeMutation = useDismissNudgeMutation()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'first-login' | 'progress-reminder'>(
    'progress-reminder'
  )
  const dismissedThisSessionRef = useRef(false)
  const previousWizardOpenRef = useRef(isWizardOpen)
  const router = useRouter()

  useEffect(() => {
    if (!status || isLoading) return

    if (dismissedThisSessionRef.current) return

    const stored =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_MODAL_KEY) : null
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

  useEffect(() => {
    const wasOpen = previousWizardOpenRef.current
    if (wasOpen && !isWizardOpen) {
      void refetch()
    }
    previousWizardOpenRef.current = isWizardOpen
  }, [isWizardOpen, refetch])

  const recordDismiss = useCallback(
    (reason: string) => {
      dismissNudgeMutation.mutate({
        nudgeId: 'profile-wizard-modal',
        reason,
      })
    },
    [dismissNudgeMutation]
  )

  const dismissModal = useCallback(
    (reason = 'user_dismissed_modal') => {
      setIsModalOpen(false)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_MODAL_KEY, 'true')
      }
      dismissedThisSessionRef.current = true
      recordDismiss(reason)
    },
    [recordDismiss]
  )

  const handleModalDismiss = useCallback(() => {
    dismissModal('user_dismissed_modal')
  }, [dismissModal])

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

  const handleUploadResume = useCallback(() => {
    dismissModal('opened_import_review')
    setIsWizardOpen(false)
    router.push(ROUTES.DASHBOARD.PROFILE.IMPORT_REVIEW.path)
  }, [dismissModal, router])

  const handleWizardClosed = useCallback(() => {
    setIsWizardOpen(false)
  }, [])

  const handleViewProfile = useCallback(() => {
    router.push(ROUTES.DASHBOARD.PROFILE.GENERAL.path)
  }, [router])

  return (
    <Stack gap={16}>
      <ProfileCompletionExperienceWidgetSection
        status={status}
        isStatusLoading={isLoading}
        currentBenefit={currentBenefit}
        advanceBenefit={advanceMessage}
        retreatBenefit={retreatMessage}
        goToBenefit={goToMessage}
        currentBenefitIndex={currentIndex}
        totalBenefits={totalCount}
        hasMultipleBenefits={hasMultiple}
        isBenefitLoading={isBenefitLoading}
        onStartWizard={handleWidgetStart}
        onOpenImport={handleUploadResume}
      />

      <ProfileCompletionExperienceModal
        open={isModalOpen}
        mode={modalMode}
        completionPercentage={status?.completionPercentage ?? 0}
        benefitMessage={benefitMessage}
        onStartWizard={handleStartWizard}
        onUploadResume={handleUploadResume}
        onDismiss={handleModalDismiss}
      />

      <ProfileCompletionWizardSheet
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onClose={handleWizardClosed}
        onUploadResume={handleUploadResume}
        onViewProfile={handleViewProfile}
      />
    </Stack>
  )
}

interface ProfileCompletionExperienceWidgetSectionProps {
  status: CompletionStatus | null
  isStatusLoading: boolean
  currentBenefit: PersonalizedBenefit | null
  advanceBenefit: () => void
  retreatBenefit: () => void
  goToBenefit: (index: number) => void
  currentBenefitIndex: number
  totalBenefits: number
  hasMultipleBenefits: boolean
  isBenefitLoading: boolean
  onStartWizard: () => void
  onOpenImport: () => void
}

const ProfileCompletionExperienceWidgetSection = memo(
  function ProfileCompletionExperienceWidgetSection({
    status,
    isStatusLoading,
    currentBenefit,
    advanceBenefit,
    retreatBenefit,
    goToBenefit,
    currentBenefitIndex,
    totalBenefits,
    hasMultipleBenefits,
    isBenefitLoading,
    onStartWizard,
    onOpenImport,
  }: ProfileCompletionExperienceWidgetSectionProps) {
    return (
      <EnhancedProfileCompletionWidget
        onStartWizard={onStartWizard}
        onOpenImport={onOpenImport}
        currentBenefit={currentBenefit}
        advanceBenefit={advanceBenefit}
        retreatBenefit={retreatBenefit}
        goToBenefit={goToBenefit}
        currentBenefitIndex={currentBenefitIndex}
        totalBenefits={totalBenefits}
        hasMultipleBenefits={hasMultipleBenefits}
        isBenefitLoading={isBenefitLoading}
        completionStatus={status}
        isStatusLoading={isStatusLoading}
      />
    )
  }
)

interface ProfileCompletionExperienceModalProps {
  open: boolean
  mode: 'first-login' | 'progress-reminder'
  completionPercentage: number
  benefitMessage: string
  onStartWizard: () => void
  onUploadResume: () => void
  onDismiss: () => void
}

const ProfileCompletionExperienceModal = memo(function ProfileCompletionExperienceModal({
  open,
  mode,
  completionPercentage,
  benefitMessage,
  onStartWizard,
  onUploadResume,
  onDismiss,
}: ProfileCompletionExperienceModalProps) {
  return (
    <ProfileCompletionModal
      open={open}
      mode={mode}
      completionPercentage={completionPercentage}
      benefitMessage={benefitMessage}
      onStartWizard={onStartWizard}
      onUploadResume={onUploadResume}
      onDismiss={onDismiss}
    />
  )
})

interface ProfileCompletionWizardSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  onClose: () => void
  onUploadResume: () => void
  onViewProfile: () => void
}

const ProfileCompletionWizardSheet = memo(function ProfileCompletionWizardSheet({
  open,
  onOpenChange,
  onClose,
  onUploadResume,
  onViewProfile,
}: ProfileCompletionWizardSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[90]} modal dismissOnSnapToBottom>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$background" aria-label="Profile completion wizard">
        <Sheet.Handle />
        <Stack padding={16} gap={16} flex={1}>
          <Stack gap={8}>
            <Text>
              Complete Your Profile
            </Text>
            <Text color="gray">We’ll auto-save as you go. You can exit anytime.</Text>
          </Stack>
          {open ? (
            <ProfileWizard
              onSuccess={onClose}
              onCancel={onClose}
              onUploadResume={onUploadResume}
              onViewProfile={onViewProfile}
            />
          ) : null}
          <Button size={16} variant="outline" onPress={onClose}>
            Close
          </Button>
        </Stack>
      </Sheet.Frame>
    </Sheet>
  )
})
