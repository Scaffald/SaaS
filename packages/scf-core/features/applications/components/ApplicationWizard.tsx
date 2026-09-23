import type { ApplicationStepType, AttachmentMetadata } from '@scf/schemas'
import { ApplicationStep } from '@scf/schemas'
import { useTrackEngagementMutation } from '@scf/core/utils/engagement-sdk-hooks'
import { useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { SaveStatusIndicator, useThemeContext, useToast } from '@scaffald/ui'
import { AlertCircle } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
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
  onViewApplication,
  onReturnToJobs,
}: ApplicationWizardProps) {
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

  // SC-103: pull the job's configured custom questions instead of the
  // previously-hardcoded empty array. The SDK's `Job` type now exposes
  // `custom_application_questions` (column added in migration 145, returned
  // by GET /v1/jobs/:id via `select("*")`). Falls back to [] for jobs that
  // haven't configured any questions.
  const { data: jobDetails } = useJobDetails(jobId)
  const customQuestions = useMemo<CustomQuestion[]>(
    () => jobDetails?.custom_application_questions ?? [],
    [jobDetails?.custom_application_questions]
  )

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
    <Stack gap={20}>
      {/* Where you are in the form, and whether the draft is safe. The role
          and the employer are no longer repeated here: applying is its own
          screen now (#829), and the screen header states both above this. */}
      <Stack gap={12}>
        <Row justify="flex-end" width="100%">
          <SaveStatusIndicator
            status={isSaving ? 'saving' : saveError ? 'error' : lastSavedAt ? 'saved' : 'idle'}
            lastSavedAt={lastSavedAt || undefined}
            error={saveError || undefined}
          />
        </Row>

        <ProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          steps={steps}
        />
      </Stack>

      {/* Error Display */}
      {submitError && (
        <Row
          gap={8}
          align="center"
          padding="sm"
          borderRadius={8}
          borderWidth={1}
          borderColor={colors.border[theme].error}
          style={{ backgroundColor: colors.bg[theme].subtle }}
        >
          <AlertCircle size={20} color={colors.fg[theme].error} />
          <Text style={{ color: colors.text[theme].secondary, flex: 1, minWidth: 0 }}>
            {submitError.message || 'An error occurred'}
          </Text>
        </Row>
      )}

      {/* The page already scrolls (DashboardLayout); a second scroll view here
          made the form a box inside a box and clipped the submit button. */}
      <Stack>
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
    </Stack>
  )
}
