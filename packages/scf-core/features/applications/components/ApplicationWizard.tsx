import type { ApplicationStepType, AttachmentMetadata } from '@scf/schemas'
import { ApplicationStep } from '@scf/schemas'
import { api } from '@scf/core/utils/api'
import { SaveStatusIndicator } from '@unicornlove/beyond-ui'
import { AlertCircle } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button, ScrollView, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
  }, [jobId, jobTitle, organizationName, trackEventMutation.mutate, trackEventMutation])

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
    <Stack flex={1} backgroundColor="$background">
      {/* Header */}
      <Stack
        padding="$4"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        gap="$3"
      >
        <Row justifyContent="space-between" alignItems="flex-start" width="100%">
          <Stack gap="$1" flex={1}>
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              {isEditMode ? 'Update Application' : 'Apply'} to {jobTitle}
            </Text>
            <Text fontSize="$3" color="$color11">
              {organizationName}
            </Text>
          </Stack>
          {/* Save Status Indicator */}
          <SaveStatusIndicator
            status={isSaving ? 'saving' : saveError ? 'error' : lastSavedAt ? 'saved' : 'idle'}
            lastSavedAt={lastSavedAt || undefined}
            error={saveError || undefined}
          />
        </Row>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          steps={steps}
        />
      </Stack>

      {/* Error Display */}
      {submitError && (
        <Stack
          padding="$4"
          backgroundColor="$red2"
          borderBottomWidth={1}
          borderBottomColor="$red7"
        >
          <Row gap="$2" alignItems="center">
            <AlertCircle size={20} color="$red10" />
            <Text fontSize="$3" color="$red11" flex={1}>
              {submitError.message || 'An error occurred'}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Main Content */}
      <ScrollView flex={1}>
        <Stack padding="$4" alignItems="center">
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
        </Stack>
      </ScrollView>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          padding="$4"
        >
          <Stack
            backgroundColor="$background"
            borderRadius="$4"
            padding="$6"
            gap="$4"
            maxWidth={400}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Stack gap="$2">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Cancel Application?
              </Text>
              <Text fontSize="$3" color="$color11">
                Your progress has been auto-saved. You can return to complete your application
                later.
              </Text>
            </Stack>

            <Row gap="$3" justifyContent="flex-end">
              <Button size="$4" variant="outlined" onPress={() => setShowCancelConfirm(false)}>
                Keep Editing
              </Button>
              <Button size="$4" theme="error" onPress={confirmCancel}>
                Exit Application
              </Button>
            </Row>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
