import { useState, useCallback } from 'react'
import type {
  ApplicationCreateInput,
  ApplicationStepType,
  ScreeningAnswers,
  CustomQuestionAnswer,
  AttachmentMetadata,
} from '@app/schemas'
import { api } from '@app/core/utils/api'

export interface ApplicationFormState {
  jobId: string
  currentStep: ApplicationStepType
  completedSteps: ApplicationStepType[]
  screeningAnswers: Partial<ScreeningAnswers>
  customQuestionAnswers: CustomQuestionAnswer[]
  attachments: Record<string, AttachmentMetadata>
  isDirty: boolean
  isSaving: boolean
  applicationId?: string
}

const INITIAL_STATE: Omit<ApplicationFormState, 'jobId'> = {
  currentStep: 'screening',
  completedSteps: [],
  screeningAnswers: {},
  customQuestionAnswers: [],
  attachments: {},
  isDirty: false,
  isSaving: false,
}

/**
 * Hook for managing application form state and operations
 */
export function useApplicationForm(jobId: string) {
  const [state, setState] = useState<ApplicationFormState>({
    ...INITIAL_STATE,
    jobId,
  })

  // API mutations
  const submitMutation = api.applications.submit.useMutation()
  const updateStepMutation = api.applications.updateStep.useMutation()

  /**
   * Update screening answers
   */
  const updateScreeningAnswers = useCallback(
    (answers: Partial<ScreeningAnswers>) => {
      setState((prev) => ({
        ...prev,
        screeningAnswers: { ...prev.screeningAnswers, ...answers },
        isDirty: true,
      }))
    },
    []
  )

  /**
   * Update custom question answers
   */
  const updateCustomQuestionAnswers = useCallback(
    (answers: CustomQuestionAnswer[]) => {
      setState((prev) => ({
        ...prev,
        customQuestionAnswers: answers,
        isDirty: true,
      }))
    },
    []
  )

  /**
   * Update attachments
   */
  const updateAttachments = useCallback(
    (type: string, metadata: AttachmentMetadata) => {
      setState((prev) => ({
        ...prev,
        attachments: { ...prev.attachments, [type]: metadata },
        isDirty: true,
      }))
    },
    []
  )

  /**
   * Move to next step
   */
  const nextStep = useCallback(
    async (step: ApplicationStepType) => {
      // Mark current step as completed
      setState((prev) => ({
        ...prev,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
        currentStep: step,
      }))

      // Auto-save progress if application exists
      if (state.applicationId && state.isDirty) {
        await saveProgress()
      }
    },
    [state.applicationId, state.isDirty]
  )

  /**
   * Go back to previous step
   */
  const previousStep = useCallback((step: ApplicationStepType) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }))
  }, [])

  /**
   * Save progress for current step
   */
  const saveProgress = useCallback(async () => {
    if (!state.applicationId) return

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      const data: Record<string, unknown> = {}

      // Include relevant data for current step
      if (state.currentStep === 'screening') {
        Object.assign(data, state.screeningAnswers)
      } else if (state.currentStep === 'custom_questions') {
        data.custom_question_answers = state.customQuestionAnswers
      } else if (state.currentStep === 'attachments') {
        data.attachments = state.attachments
      }

      await updateStepMutation.mutateAsync({
        application_id: state.applicationId,
        step: state.currentStep,
        data,
      })

      setState((prev) => ({ ...prev, isDirty: false, isSaving: false }))
    } catch (error) {
      console.error('Failed to save progress:', error)
      setState((prev) => ({ ...prev, isSaving: false }))
      throw error
    }
  }, [state, updateStepMutation])

  /**
   * Submit complete application
   */
  const submitApplication = useCallback(async () => {
    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      const applicationData: ApplicationCreateInput = {
        job_id: jobId,
        current_location: state.screeningAnswers.current_location || '',
        willing_to_relocate: state.screeningAnswers.willing_to_relocate || false,
        years_experience: state.screeningAnswers.years_experience || 0,
        is_authorized_to_work: state.screeningAnswers.is_authorized_to_work || false,
        earliest_start_date: state.screeningAnswers.earliest_start_date || '',
        custom_question_answers: state.customQuestionAnswers,
        attachments: state.attachments,
        completed_steps: state.completedSteps,
        is_complete: true,
      }

      const result = await submitMutation.mutateAsync(applicationData)

      setState((prev) => ({
        ...prev,
        isSaving: false,
        isDirty: false,
        applicationId: result.id,
      }))

      return result
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false }))
      throw error
    }
  }, [jobId, state, submitMutation])

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      jobId,
    })
  }, [jobId])

  return {
    // State
    ...state,

    // Actions
    updateScreeningAnswers,
    updateCustomQuestionAnswers,
    updateAttachments,
    nextStep,
    previousStep,
    saveProgress,
    submitApplication,
    reset,

    // Loading states
    isSubmitting: submitMutation.isLoading || state.isSaving,
    submitError: submitMutation.error,
  }
}
