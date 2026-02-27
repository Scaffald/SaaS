import {
  useCreateJobApplicationMutation,
  useMyApplicationForJob,
  useUpdateJobApplicationMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import type {
  ApplicationCreateInput,
  ApplicationStepType,
  AttachmentMetadata,
  CustomQuestionAnswer,
  ScreeningAnswers,
} from '@scf/schemas'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  lastSavedAt?: Date | null
  saveError?: string | null
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
 * @param jobId - The job ID to apply for
 * @param existingApplicationId - Optional application ID if editing existing application
 */
export function useApplicationForm(jobId: string, existingApplicationId?: string) {
  const [state, setState] = useState<ApplicationFormState>({
    ...INITIAL_STATE,
    jobId,
    applicationId: existingApplicationId,
  })

  // API mutations (now fully SDK-based)
  const submitMutation = useCreateJobApplicationMutation()
  const createDraftMutation = useCreateJobApplicationMutation()
  const updateMutation = useUpdateJobApplicationMutation()
  const updateStepMutation = useUpdateJobApplicationMutation()

  // Load existing application data if in edit mode (SDK)
  const { data: existingApp } = useMyApplicationForJob(jobId, {
    enabled: !existingApplicationId && !!jobId,
  })

  // Pre-populate form with existing data when available
  useEffect(() => {
    if (existingApp) {
      setState((prev) => ({
        ...prev,
        applicationId: existingApp.id,
        screeningAnswers: {
          current_location: existingApp.current_location || '',
          willing_to_relocate: existingApp.willing_to_relocate ?? false,
          years_experience: existingApp.years_experience ?? 0,
          is_authorized_to_work: existingApp.is_authorized_to_work ?? false,
          earliest_start_date: existingApp.earliest_start_date || '',
        },
        customQuestionAnswers: existingApp.custom_question_answers || [],
        attachments: existingApp.attachments || {},
        isDirty: false,
        lastSavedAt: existingApp.updated_at ? new Date(existingApp.updated_at) : null,
      }))
    }
  }, [existingApp])

  /**
   * Create a draft application if one doesn't exist
   */
  const createDraft = useCallback(async () => {
    if (state.applicationId) return state.applicationId

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      const draftData: ApplicationCreateInput = {
        job_id: jobId,
        current_location: state.screeningAnswers.current_location || '',
        willing_to_relocate: state.screeningAnswers.willing_to_relocate || false,
        years_experience: state.screeningAnswers.years_experience || 0,
        is_authorized_to_work: state.screeningAnswers.is_authorized_to_work || false,
        earliest_start_date: state.screeningAnswers.earliest_start_date || '',
        custom_question_answers: state.customQuestionAnswers,
        attachments: state.attachments,
        completed_steps: state.completedSteps,
        is_complete: false, // Draft, not complete
      }

      // Use SDK applications.create for drafts
      const result = await createDraftMutation.mutateAsync(draftData)

      const applicationId = result?.id
      if (!applicationId) {
        throw new Error('Failed to create application: no ID returned')
      }

      setState((prev) => ({
        ...prev,
        applicationId,
        isSaving: false,
        isDirty: false,
        lastSavedAt: new Date(),
        saveError: null,
      }))

      return applicationId
    } catch (error) {
      console.error('Failed to create draft:', error)
      setState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Failed to save',
      }))
      throw error
    }
  }, [jobId, state, createDraftMutation.mutateAsync, createDraftMutation])

  /**
   * Save progress for current step
   */
  const saveProgress = useCallback(async () => {
    // Create draft if needed
    let appId = state.applicationId
    if (!appId) {
      try {
        appId = await createDraft()
      } catch (_error) {
        // If draft creation fails, we can't save
        return
      }
    }

    if (!appId) return

    setState((prev) => ({ ...prev, isSaving: true, saveError: null }))

    try {
      const data: Record<string, unknown> = {}

      // Include all relevant data, not just current step
      Object.assign(data, {
        current_location: state.screeningAnswers.current_location,
        willing_to_relocate: state.screeningAnswers.willing_to_relocate,
        years_experience: state.screeningAnswers.years_experience,
        is_authorized_to_work: state.screeningAnswers.is_authorized_to_work,
        earliest_start_date: state.screeningAnswers.earliest_start_date,
        custom_question_answers: state.customQuestionAnswers,
        attachments: state.attachments,
      })

      await updateStepMutation.mutateAsync({
        id: appId,
        params: {
          ...data,
          completed_steps: [...state.completedSteps, state.currentStep],
        } as Parameters<typeof updateStepMutation.mutateAsync>[0]['params'],
      })

      setState((prev) => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSavedAt: new Date(),
        saveError: null,
      }))
    } catch (error) {
      console.error('Failed to save progress:', error)
      setState((prev) => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Failed to save',
      }))
      throw error
    }
  }, [state, updateStepMutation, createDraft])

  /**
   * Update screening answers
   */
  const updateScreeningAnswers = useCallback((answers: Partial<ScreeningAnswers>) => {
    setState((prev) => ({
      ...prev,
      screeningAnswers: { ...prev.screeningAnswers, ...answers },
      isDirty: true,
    }))
  }, [])

  /**
   * Update custom question answers
   */
  const updateCustomQuestionAnswers = useCallback((answers: CustomQuestionAnswer[]) => {
    setState((prev) => ({
      ...prev,
      customQuestionAnswers: answers,
      isDirty: true,
    }))
  }, [])

  /**
   * Update attachments
   */
  const updateAttachments = useCallback((type: string, metadata: AttachmentMetadata) => {
    setState((prev) => ({
      ...prev,
      attachments: { ...prev.attachments, [type]: metadata },
      isDirty: true,
    }))
  }, [])

  /**
   * Update all attachments at once
   */
  const updateAllAttachments = useCallback((attachments: Record<string, AttachmentMetadata>) => {
    setState((prev) => ({
      ...prev,
      attachments,
      isDirty: true,
    }))
  }, [])

  /**
   * Move to next step
   */
  const nextStep = useCallback(
    async (step: ApplicationStepType) => {
      // Auto-save before navigation if dirty
      if (state.isDirty) {
        try {
          await saveProgress()
        } catch (error) {
          // Continue navigation even if save fails
          console.error('Failed to save before navigation:', error)
        }
      }

      // Mark current step as completed
      setState((prev) => ({
        ...prev,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
        currentStep: step,
      }))
    },
    [state.isDirty, saveProgress]
  )

  /**
   * Go back to previous step
   */
  const previousStep = useCallback(
    async (step: ApplicationStepType) => {
      // Auto-save before navigation if dirty
      if (state.isDirty) {
        try {
          await saveProgress()
        } catch (error) {
          // Continue navigation even if save fails
          console.error('Failed to save before navigation:', error)
        }
      }

      setState((prev) => ({
        ...prev,
        currentStep: step,
      }))
    },
    [state.isDirty, saveProgress]
  )

  // Debounced auto-save (500ms delay)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!state.isDirty || state.isSaving) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
      return
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout for debounced save
    debounceTimeoutRef.current = setTimeout(() => {
      saveProgress().catch((error) => {
        console.error('Auto-save failed:', error)
      })
    }, 500) as unknown as NodeJS.Timeout

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [state.isDirty, state.isSaving, saveProgress])

  // Interval-based auto-save (30 seconds)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!state.isDirty || state.isSaving) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Set up interval for periodic saves
    intervalRef.current = setInterval(() => {
      if (state.isDirty && !state.isSaving) {
        saveProgress().catch((error) => {
          console.error('Interval auto-save failed:', error)
        })
      }
    }, 30000) as unknown as NodeJS.Timeout // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isDirty, state.isSaving, saveProgress])

  /**
   * Submit complete application (create or update)
   */
  const submitApplication = useCallback(async () => {
    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      // If we have an applicationId, update existing application (SDK)
      if (state.applicationId) {
        const params = {
          current_location: state.screeningAnswers.current_location,
          willing_to_relocate: state.screeningAnswers.willing_to_relocate,
          years_experience: state.screeningAnswers.years_experience,
          is_authorized_to_work: state.screeningAnswers.is_authorized_to_work,
          earliest_start_date: state.screeningAnswers.earliest_start_date,
          custom_question_answers: state.customQuestionAnswers,
          attachments: state.attachments,
        }

        const result = await updateMutation.mutateAsync({
          id: state.applicationId,
          params,
        })

        setState((prev) => ({
          ...prev,
          isSaving: false,
          isDirty: false,
        }))

        return {
          success: true,
          applicationId: state.applicationId,
          ...result,
        }
      }

      // Otherwise create new application (complete submission)
      // submitMutation requires all fields and is_complete: true
      const applicationData = {
        job_id: jobId,
        current_location: state.screeningAnswers.current_location || '',
        willing_to_relocate: state.screeningAnswers.willing_to_relocate || false,
        years_experience: state.screeningAnswers.years_experience || 0,
        is_authorized_to_work: state.screeningAnswers.is_authorized_to_work || false,
        earliest_start_date: state.screeningAnswers.earliest_start_date || '',
        custom_question_answers: state.customQuestionAnswers,
        attachments: state.attachments,
        completed_steps: state.completedSteps,
        is_complete: true as const, // Literal true required by submitMutation
      }

      const result = await submitMutation.mutateAsync(applicationData)

      setState((prev) => ({
        ...prev,
        isSaving: false,
        isDirty: false,
        applicationId: result.id,
      }))

      return { success: true, applicationId: result.id, ...result }
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false }))
      throw error
    }
  }, [jobId, state, submitMutation, updateMutation])

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
    updateAllAttachments,
    nextStep,
    previousStep,
    saveProgress,
    submitApplication,
    reset,

    // Loading states
    isSubmitting: submitMutation.isPending || updateMutation.isPending || state.isSaving,
    submitError: submitMutation.error || updateMutation.error,

    // Edit mode flag
    isEditMode: !!state.applicationId,

    // Auto-save state
    lastSavedAt: state.lastSavedAt,
    saveError: state.saveError,
  }
}
