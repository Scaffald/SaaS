import type { ApplicationStepType, AttachmentMetadata } from '@scf/schemas'
import { ApplicationStep } from '@scf/schemas'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { SaveStatusIndicator, useThemeContext, useToast } from '@scaffald/ui'
import { AlertCircle } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import { ScrollView } from 'react-native'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const toast = useToast()

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

  // TODO: Fetch actual custom questions for this job (blocked on SDK Job type
  // exposing custom_application_questions — tracked separately).
  const customQuestions: CustomQuestion[] = []

  // SC-105: surface auto-save failures the user might otherwise miss. The
  // wizard's SaveStatusIndicator shows an icon, but a toast forces them to
  // notice before they leave the wizard with unsaved data on the server.
  const lastReportedSaveErrorRef = useRef<string | null>(null)
  useEffect(() => {
    if (saveError && saveError !== lastReportedSaveErrorRef.current) {
      lastReportedSaveErrorRef.current = saveError
      toast.show({
        title: "Couldn't save your progress",
        message:
          saveError === 'Failed to save'
            ? 'Your changes will be retried — check your connection.'
            : saveError,
        variant: 'error',
      })
    } else if (!saveError) {
      lastReportedSaveErrorRef.current = null
    }
  }, [saveError, toast])

  // Track application started for engagement analytics
  const trackEventMutation = useTrackEngagementMutation()
  const trackEventRef = useRef(trackEventMutation)
  trackEventRef.current = trackEventMutation

  useEffect(() => {
    // Track when application wizard is opened (application started)
    try {
      trackEventRef.current.mutate({
        eventType: 'application_start',
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
  }, [jobId, jobTitle, organizationName])

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
            eventType: 'application_complete',
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
    <Stack flex={1} style={{ backgroundColor: colors.bg[theme].default }}>
      {/* Header */}
      <Stack
        padding="md"
        style={{
          backgroundColor: colors.bg[theme].default,
          borderBottomColor: colors.border[theme].default,
          borderBottomWidth: 1,
        }}
        gap={12}
      >
        <Row justify="space-between" align="flex-start" width="100%">
          <Stack gap={4} flex={1}>
            <Text style={{ color: colors.text[theme].secondary }}>
              {isEditMode ? 'Update Application' : 'Apply'} to {jobTitle}
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>{organizationName}</Text>
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
          padding="md"
          style={{
            backgroundColor: theme === "light" ? colors.error[50] : colors.error[900],
            borderBottomColor: theme === "light" ? colors.error[300] : colors.error[700],
            borderBottomWidth: 1,
          }}
        >
          <Row gap={8} align="center">
            <AlertCircle size={24} color={theme === "light" ? colors.error[700] : colors.error[300]} />
            <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300], flex: 1 }}>
              {submitError.message || 'An error occurred'}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        <Stack padding="md" align="center">
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

          {currentStep === 'custom_questions' && (
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          align="center"
          justify="center"
          padding="md"
        >
          <Stack
            style={{
              backgroundColor: colors.bg[theme].default,
              borderColor: colors.border[theme].default,
              borderRadius: 16,
              maxWidth: 400,
              width: '100%',
              borderWidth: 1,
            }}
            padding="xl"
            gap={16}
          >
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>Cancel Application?</Text>
              <Text style={{ color: colors.text[theme].secondary }}>
                Your progress has been auto-saved. You can return to complete your application
                later.
              </Text>
            </Stack>

            <Row gap={12} justify="flex-end">
              <Button size="md" variant="outline" onPress={() => setShowCancelConfirm(false)}>
                Keep Editing
              </Button>
              <Button size="md" color="error" onPress={confirmCancel}>
                Exit Application
              </Button>
            </Row>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
