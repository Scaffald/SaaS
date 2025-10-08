import { useState } from 'react'
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui'
import { AlertCircle, X } from '@tamagui/lucide-icons'
import { ProgressIndicator } from './ProgressIndicator'
import { ScreeningStep } from './ScreeningStep'
import { CustomQuestionsStep } from './CustomQuestionsStep'
import { AttachmentsStep } from './AttachmentsStep'
import { ReviewStep } from './ReviewStep'
import { SuccessStep } from './SuccessStep'
import { useApplicationForm } from '../hooks/useApplicationForm'
import type { ApplicationStepType } from '@app/schemas'
import { ApplicationStep } from '@app/schemas'

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
    nextStep,
    previousStep,
    submitApplication,
    isSubmitting,
    submitError,
    completedSteps,
  } = useApplicationForm(jobId)

  // Define application steps
  const steps: Array<{ id: ApplicationStepType; label: string }> = [
    { id: ApplicationStep.SCREENING, label: 'Screening' },
    { id: ApplicationStep.CUSTOM_QUESTIONS, label: 'Questions' },
    { id: ApplicationStep.ATTACHMENTS, label: 'Documents' },
    { id: ApplicationStep.REVIEW, label: 'Review' },
  ]

  // Handle successful submission
  const handleSubmit = async () => {
    try {
      const result = await submitApplication()
      if (result.success && result.applicationId) {
        setSubmittedApplicationId(result.applicationId)
        onSuccess?.(result.applicationId)
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
    }
  }

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (completedSteps.length > 0) {
      setShowCancelConfirm(true)
    } else {
      onCancel?.()
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
        onViewApplication={
          onViewApplication ? () => onViewApplication(submittedApplicationId) : undefined
        }
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
        <XStack justify="space-between" items="center">
          <YStack gap="$1" flex={1}>
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Apply to {jobTitle}
            </Text>
            <Text fontSize="$3" color="$color11">
              {organizationName}
            </Text>
          </YStack>

          <Button size="$3" circular variant="outlined" icon={X} onPress={handleCancel} />
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
              onContinue={() => nextStep('custom_questions')}
            />
          )}

          {currentStep === 'custom_questions' && (
            <CustomQuestionsStep
              questions={[]}
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
              attachments={attachments}
              onAttachmentsChange={(newAttachments) => {
                // TODO: Implement updateAttachments in useApplicationForm
                console.log('Attachments updated:', newAttachments)
              }}
              onPrevious={() => previousStep('custom_questions')}
              onContinue={() => nextStep('review')}
              isSubmitting={isSubmitting}
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
              <Button size="$4" theme="red" onPress={confirmCancel}>
                Exit Application
              </Button>
            </XStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}
