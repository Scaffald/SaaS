import type { ApplicationStepType, AttachmentMetadata } from '@app/schemas'
import { ApplicationStep } from '@app/schemas'
import { api } from '@app/core/utils/api'
import { SaveStatusIndicator } from '@unicornlove/ui'
import { AlertCircle } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui'
import { useApplicationForm } from '../hooks/useApplicationForm'
import type { Attachments } from './AttachmentsStep'
import { AttachmentsStep } from './AttachmentsStep'
import type { CustomQuestion } from './CustomQuestionsStep'
import { CustomQuestionsStep } from './CustomQuestionsStep'
import { ProgressIndicator } from './ProgressIndicator'
import { ReviewStep } from './ReviewStep'
import { ScreeningStep } from './ScreeningStep'
import { SuccessStep } from './SuccessStep'

export interface ApplicationWizardProps {
  /**
   * Job ID to apply for
   */
  jobId: string

  /**
   * Job title for display
   */
  jobTitle: string

  /**
   * Organization name for display
   */
  organizationName: string

  /**
   * Callback when application is successfully submitted
   */
  onSuccess?: (applicationId: string) => void

  /**
   * Callback when user cancels the wizard
   */
  onCancel?: () => void

  /**
   * Callback when user wants to view their application
   */
  onViewApplication?: (applicationId: string) => void

  /**
   * Callback when user wants to return to jobs
   */
  onReturnToJobs?: () => void
}

/**
 * ApplicationWizard - Multi-step application form container
 *
 * Features:
 * - Step-by-step wizard navigation
 * - Progress indicator
 * - Auto-save functionality
 * - Error handling
 * - Success confirmation
 */
export function ApplicationWizard({
  jobId,
  jobTitle,
  organizationName,
  onSuccess,
  onCancel,
  onViewApplication,
  onReturnToJobs,
}: ApplicationWizardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null)

  const {
    currentStep,
    screeningAnswers,
    customQuestionAnswers,
    attachments,
    updateScreeningAnswers,
    updateAllAttachments,
    nextStep,
    previousStep,
    submitApplication,
    isSubmitting,
    submitError,
    completedSteps,
    isEditMode,
    applicationId,
    isSaving,
    lastSavedAt,
    saveError,
  } = useApplicationForm(jobId)

  // TODO: Fetch actual custom questions for this job
  const customQuestions: CustomQuestion[] = [] // Replace with actual data fetch

  // Track application started for engagement analytics
  const trackEventMutation = api.engagement.trackEvent.useMutation()

  useEffect(() => {
    // Track when application wizard is opened (application started)
    try {
      trackEventMutation.mutate({
        eventType: 'application.started',
        targetType: 'job',
        targetId: jobId,
        metadata: {
          job_title: jobTitle,
          organization_name: organizationName,
        },
      })
    } catch (error) {
      // Silent error handling - don't impact user flow
      console.warn('Failed to track application started:', error)
    }
  }, [jobId, jobTitle, organizationName, trackEventMutation.mutate])

  // Define application steps - only include custom questions if there are any
  const steps: Array<{ id: ApplicationStepType; label: string }> = [
    { id: ApplicationStep.SCREENING, label: 'Screening' },
    ...(customQuestions.length > 0
      ? [{ id: ApplicationStep.CUSTOM_QUESTIONS, label: 'Questions' }]
      : []),
    { id: ApplicationStep.ATTACHMENTS, label: 'Documents' },
    { id: ApplicationStep.REVIEW, label: 'Review' },
  ]

  // Handle successful submission
  const handleSubmit = async () => {
    try {
      const result = await submitApplication()
      if (result.success && result.applicationId) {
        // Track application submitted for engagement analytics
        try {
          trackEventMutation.mutate({
            eventType: 'application.submitted',
            targetType: 'job',
            targetId: jobId,
            metadata: {
              job_title: jobTitle,
              organization_name: organizationName,
              application_id: result.applicationId,
            },
          })
        } catch (error) {
          // Silent error handling - don't impact user flow
          console.warn('Failed to track application submitted:', error)
        }

        setSubmittedApplicationId(result.applicationId)
        onSuccess?.(result.applicationId)
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel?.()
  }

  // Show success step after submission
  if (submittedApplicationId) {
    return (
      <SuccessStep
        applicationId={submittedApplicationId}
        jobTitle={jobTitle}
        organizationName={organizationName}
        onViewApplication={onViewApplication}
        onReturnToJobs={onReturnToJobs}
      />
    )
  }

  return (
    <YStack flex={1} bg="$background">
      {/* Header */}
      <YStack
        p="$4"
        bg="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        gap="$3"
      >
        <XStack justify="space-between" items="flex-start" width="100%">
          <YStack gap="$1" flex={1}>
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              {isEditMode ? 'Update Application' : 'Apply'} to {jobTitle}
            </Text>
            <Text fontSize="$3" color="$color11">
              {organizationName}
            </Text>
          </YStack>
          {/* Save Status Indicator */}
          <SaveStatusIndicator
            status={isSaving ? 'saving' : saveError ? 'error' : lastSavedAt ? 'saved' : 'idle'}
            lastSavedAt={lastSavedAt || undefined}
            error={saveError || undefined}
          />
        </XStack>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          steps={steps}
        />
      </YStack>

      {/* Error Display */}
      {submitError && (
        <YStack p="$4" bg="$red2" borderBottomWidth={1} borderBottomColor="$red7">
          <XStack gap="$2" items="center">
            <AlertCircle size={20} color="$red10" />
            <Text fontSize="$3" color="$red11" flex={1}>
              {submitError.message || 'An error occurred'}
            </Text>
          </XStack>
        </YStack>
      )}

      {/* Main Content */}
      <ScrollView flex={1}>
        <YStack p="$4" items="center">
          {currentStep === 'screening' && (
            <ScreeningStep
              answers={screeningAnswers}
              onAnswersChange={updateScreeningAnswers}
              onContinue={() => {
                // Skip custom questions if there are none
                if (customQuestions.length === 0) {
                  nextStep('attachments')
                } else {
                  nextStep('custom_questions')
                }
              }}
              isSubmitting={isSubmitting}
              requiredSkills={[]}
              optionalSkills={[]}
            />
          )}

          {currentStep === 'custom_questions' && customQuestions.length > 0 && (
            <CustomQuestionsStep
              questions={customQuestions}
              answers={customQuestionAnswers}
              onAnswersChange={(answers) => {
                // TODO: Implement updateCustomQuestionAnswers in useApplicationForm
                console.log('Custom question answers:', answers)
              }}
              onPrevious={() => previousStep('screening')}
              onContinue={() => nextStep('attachments')}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 'attachments' && (
            <AttachmentsStep
              attachments={attachments as Attachments}
              onAttachmentsChange={(newAttachments) => {
                // Convert Attachments type to Record<string, AttachmentMetadata>
                const attachmentsRecord: Record<string, AttachmentMetadata> = {}
                if (newAttachments.resume) attachmentsRecord.resume = newAttachments.resume
                if (newAttachments.cover_letter)
                  attachmentsRecord.cover_letter = newAttachments.cover_letter
                if (newAttachments.portfolio) attachmentsRecord.portfolio = newAttachments.portfolio
                updateAllAttachments(attachmentsRecord)
              }}
              onPrevious={() => {
                // Go back to custom questions if they exist, otherwise to screening
                if (customQuestions.length > 0) {
                  previousStep('custom_questions')
                } else {
                  previousStep('screening')
                }
              }}
              onContinue={() => nextStep('review')}
              isSubmitting={isSubmitting}
              applicationId={applicationId}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              screeningAnswers={screeningAnswers}
              customQuestionAnswers={customQuestionAnswers}
              attachments={attachments}
              onEdit={(section) => {
                if (section === 'screening') previousStep('screening')
                else if (section === 'questions') previousStep('custom_questions')
                else if (section === 'attachments') previousStep('attachments')
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
            />
          )}
        </YStack>
      </ScrollView>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <YStack
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          bg="rgba(0,0,0,0.5)"
          items="center"
          justify="center"
          p="$4"
        >
          <YStack
            bg="$background"
            rounded="$4"
            p="$6"
            gap="$4"
            maxW={400}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <YStack gap="$2">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Cancel Application?
              </Text>
              <Text fontSize="$3" color="$color11">
                Your progress has been auto-saved. You can return to complete your application
                later.
              </Text>
            </YStack>

            <XStack gap="$3" justify="flex-end">
              <Button size="$4" variant="outlined" onPress={() => setShowCancelConfirm(false)}>
                Keep Editing
              </Button>
              <Button size="$4" theme="error" onPress={confirmCancel}>
                Exit Application
              </Button>
            </XStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}
