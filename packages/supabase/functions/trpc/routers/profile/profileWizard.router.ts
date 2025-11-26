// @ts-nocheck
import { TRPCError } from '@trpc/server'
import {
  PROFILE_WIZARD_REQUIRED_STEPS,
  PROFILE_WIZARD_STEP_WEIGHTS,
  PROFILE_WIZARD_STEPS,
  type ProfileWizardProgress,
  type ProfileWizardSaveStepInput,
  type ProfileWizardStepData,
  type ProfileWizardStepId,
  profileWizardCompleteInputSchema,
  profileWizardDefaultProgress,
  profileWizardProgressSchema,
  profileWizardSaveStepInputSchema,
} from '@app/trpc/schemas'
import type { Context } from '../../context.ts'
import { protectedProcedure, t } from '../../middleware.ts'

const TOTAL_WIZARD_WEIGHT = PROFILE_WIZARD_STEPS.reduce(
  (total, step) => total + PROFILE_WIZARD_STEP_WEIGHTS[step],
  0
)

/**
 * Return true when a stored step payload satisfies completion requirements.
 */
type StepCompletionChecks = {
  [Step in ProfileWizardStepId]: (data: ProfileWizardStepData[Step] | undefined) => boolean
}

const STEP_COMPLETION_CHECKS: StepCompletionChecks = {
  general: (data) =>
    Boolean(data?.firstName?.trim() && data?.lastName?.trim() && data?.headline?.trim()),
  skills: (data) => {
    const skills = data?.skills
    return Array.isArray(skills) && skills.length >= 3
  },
  experience: (data) => Boolean(data?.jobTitle?.trim() && data?.companyName?.trim()),
  certifications: (data) =>
    Array.isArray(data?.certifications) &&
    data.certifications.some((cert) => Boolean(cert?.name?.trim() && cert?.issuer?.trim())),
  preferences: (data) =>
    Boolean(
      data?.locationPreference?.trim() ||
        data?.hourlyRate?.trim() ||
        data?.availability?.trim() ||
        data?.remotePreference
    ),
  education: (data) => Boolean(data?.degreeType?.trim() || data?.institutionName?.trim()),
}

function isStepComplete(step: ProfileWizardStepId, stepData: ProfileWizardStepData): boolean {
  const completionCheck = STEP_COMPLETION_CHECKS[step]
  return completionCheck(stepData[step])
}

function deriveCompletedSteps(stepData: ProfileWizardStepData): ProfileWizardStepId[] {
  return PROFILE_WIZARD_STEPS.filter((step) => isStepComplete(step, stepData))
}

function calculateCompletionPercentage(completedSteps: ProfileWizardStepId[]): number {
  if (TOTAL_WIZARD_WEIGHT === 0) {
    return 0
  }

  const earnedWeight = completedSteps.reduce(
    (total, step) => total + PROFILE_WIZARD_STEP_WEIGHTS[step],
    0
  )

  const percentage = (earnedWeight / TOTAL_WIZARD_WEIGHT) * 100
  return Math.min(100, Math.round(percentage))
}

const storedProgressSchema = profileWizardProgressSchema.deepPartial()

function normalizeProgress(
  progress: Partial<ProfileWizardProgress> | null | undefined
): ProfileWizardProgress {
  if (!progress) {
    return {
      ...profileWizardDefaultProgress,
      stepData: {} as ProfileWizardStepData,
    }
  }

  const parsedResult = storedProgressSchema.safeParse(progress)

  if (!parsedResult.success) {
    console.warn(
      '[profileWizard] Stored progress invalid, resetting to defaults',
      parsedResult.error
    )
    return {
      ...profileWizardDefaultProgress,
      stepData: {} as ProfileWizardStepData,
    }
  }

  const partialProgress = parsedResult.data
  const mergedStepData = {
    ...profileWizardDefaultProgress.stepData,
    ...(partialProgress.stepData ?? {}),
  } as ProfileWizardStepData

  const completedSteps = deriveCompletedSteps(mergedStepData)
  const effectiveCompletedSteps =
    partialProgress.completedSteps && partialProgress.completedSteps.length > 0
      ? partialProgress.completedSteps
      : completedSteps

  const completionPercentage = calculateCompletionPercentage(effectiveCompletedSteps)

  const currentStepCandidate = partialProgress.currentStep
  const lastCompletedStep =
    effectiveCompletedSteps.length > 0
      ? effectiveCompletedSteps[effectiveCompletedSteps.length - 1]
      : undefined

  const currentStep =
    currentStepCandidate && PROFILE_WIZARD_STEPS.includes(currentStepCandidate)
      ? currentStepCandidate
      : (lastCompletedStep ?? profileWizardDefaultProgress.currentStep)

  return {
    ...profileWizardDefaultProgress,
    ...partialProgress,
    currentStep,
    completedSteps: effectiveCompletedSteps,
    completionPercentage,
    lastSavedAt: partialProgress.lastSavedAt ?? profileWizardDefaultProgress.lastSavedAt,
    requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
    stepData: mergedStepData,
    completedAt: partialProgress.completedAt ?? profileWizardDefaultProgress.completedAt,
  }
}

async function loadStoredProgress(
  supabase: Context['supabase'],
  userId: string
): Promise<ProfileWizardProgress> {
  const { data, error } = await supabase
    .schema('core')
    .from('preferences')
    .select('wizard_progress')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[profileWizard] Failed to load wizard progress', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to load wizard progress',
    })
  }

  return normalizeProgress(data?.wizard_progress)
}

async function persistProgress(
  supabase: Context['supabase'],
  userId: string,
  next: ProfileWizardProgress
) {
  const payload = {
    user_id: userId,
    wizard_progress: next,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .schema('core')
    .from('preferences')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    console.error('[profileWizard] Failed to persist wizard progress', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to save wizard progress',
    })
  }
}

function mergeStepData(
  prevData: ProfileWizardStepData,
  update: ProfileWizardSaveStepInput
): ProfileWizardStepData {
  return {
    ...prevData,
    [update.step]: update.data,
  }
}

export const profileWizardRouter = t.router({
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    const progress = await loadStoredProgress(supabase, user.id)
    return progress
  }),

  saveStep: protectedProcedure
    .input(profileWizardSaveStepInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const existing = await loadStoredProgress(supabase, user.id)

      const stepData = mergeStepData(existing.stepData, input)

      const derivedCompletedSteps = deriveCompletedSteps(stepData)
      const completedSteps = input.skip
        ? derivedCompletedSteps.filter((step) => step !== input.step)
        : derivedCompletedSteps

      const lastSavedAt = new Date().toISOString()

      const nextProgress: ProfileWizardProgress = {
        ...existing,
        currentStep: input.step,
        stepData,
        completedSteps,
        completionPercentage: calculateCompletionPercentage(completedSteps),
        lastSavedAt,
        requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
      }

      await persistProgress(supabase, user.id, nextProgress)
      return nextProgress
    }),

  complete: protectedProcedure
    .input(profileWizardCompleteInputSchema.optional())
    .mutation(async ({ ctx }) => {
      const { supabase, user } = ctx
      const existing = await loadStoredProgress(supabase, user.id)

      const completedSteps = deriveCompletedSteps(existing.stepData)
      const completedAt = new Date().toISOString()

      const nextProgress: ProfileWizardProgress = {
        ...existing,
        currentStep: PROFILE_WIZARD_STEPS[PROFILE_WIZARD_STEPS.length - 1],
        completedSteps,
        completionPercentage: calculateCompletionPercentage(completedSteps),
        lastSavedAt: completedAt,
        completedAt,
        requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
      }

      await persistProgress(supabase, user.id, nextProgress)
      return nextProgress
    }),
})
