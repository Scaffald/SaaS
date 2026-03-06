/**
 * Profile Wizard REST API
 * Manages user profile wizard progress (save step, complete, get progress).
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.ts'
import {
  PROFILE_WIZARD_STEPS,
  PROFILE_WIZARD_STEP_WEIGHTS,
  PROFILE_WIZARD_REQUIRED_STEPS,
  type ProfileWizardProgress,
  type ProfileWizardStepData,
  type ProfileWizardStepId,
  type ProfileWizardSaveStepInput,
  profileWizardDefaultProgress,
  profileWizardSaveStepInputSchema,
} from '../lib/profile-wizard-schema.ts'

const app = new Hono()
app.use('*', authMiddleware)

const TOTAL_WIZARD_WEIGHT = PROFILE_WIZARD_STEPS.reduce(
  (total, step) => total + PROFILE_WIZARD_STEP_WEIGHTS[step],
  0
)

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
  return STEP_COMPLETION_CHECKS[step](stepData[step])
}

function deriveCompletedSteps(stepData: ProfileWizardStepData): ProfileWizardStepId[] {
  return PROFILE_WIZARD_STEPS.filter((step) => isStepComplete(step, stepData))
}

function calculateCompletionPercentage(completedSteps: ProfileWizardStepId[]): number {
  if (TOTAL_WIZARD_WEIGHT === 0) return 0
  const earnedWeight = completedSteps.reduce(
    (total, step) => total + PROFILE_WIZARD_STEP_WEIGHTS[step],
    0
  )
  return Math.min(100, Math.round((earnedWeight / TOTAL_WIZARD_WEIGHT) * 100))
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase row type
async function loadStoredProgress(supabase: any, userId: string): Promise<ProfileWizardProgress> {
  const { data, error } = await supabase
    .schema('core')
    .from('preferences')
    .select('wizard_progress')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Unable to load wizard progress')
  }

  const stored = data?.wizard_progress as Partial<ProfileWizardProgress> | null | undefined
  if (!stored) return { ...profileWizardDefaultProgress, stepData: {} as ProfileWizardStepData }

  const mergedStepData = {
    ...profileWizardDefaultProgress.stepData,
    ...(stored.stepData ?? {}),
  } as ProfileWizardStepData

  const completedSteps = deriveCompletedSteps(mergedStepData)
  const effectiveCompletedSteps =
    stored.completedSteps && stored.completedSteps.length > 0
      ? stored.completedSteps
      : completedSteps

  const completionPercentage = calculateCompletionPercentage(effectiveCompletedSteps)
  const lastCompletedStep =
    effectiveCompletedSteps.length > 0
      ? effectiveCompletedSteps[effectiveCompletedSteps.length - 1]
      : undefined
  const currentStep =
    stored.currentStep && PROFILE_WIZARD_STEPS.includes(stored.currentStep)
      ? stored.currentStep
      : (lastCompletedStep ?? profileWizardDefaultProgress.currentStep)

  return {
    ...profileWizardDefaultProgress,
    ...stored,
    currentStep,
    completedSteps: effectiveCompletedSteps,
    completionPercentage,
    lastSavedAt: stored.lastSavedAt ?? profileWizardDefaultProgress.lastSavedAt,
    requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
    stepData: mergedStepData,
    completedAt: stored.completedAt ?? profileWizardDefaultProgress.completedAt,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase client type
async function persistProgress(supabase: any, userId: string, next: ProfileWizardProgress) {
  const { error } = await supabase
    .schema('core')
    .from('preferences')
    .upsert(
      { user_id: userId, wizard_progress: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw new Error('Unable to save wizard progress')
}

/**
 * GET /v1/profile-wizard/progress
 * Get the current user's profile wizard progress
 */
app.get('/progress', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const progress = await loadStoredProgress(supabase, user.id)
    return c.json(progress)
  } catch {
    return c.json({ error: 'Failed to load wizard progress' }, 500)
  }
})

/**
 * POST /v1/profile-wizard/save-step
 * Save a wizard step
 */
app.post('/save-step', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const parsed = profileWizardSaveStepInputSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const input: ProfileWizardSaveStepInput = parsed.data

  try {
    const existing = await loadStoredProgress(supabase, user.id)
    const stepData = { ...existing.stepData, [input.step]: input.data } as ProfileWizardStepData

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
    return c.json(nextProgress)
  } catch {
    return c.json({ error: 'Failed to save wizard step' }, 500)
  }
})

/**
 * POST /v1/profile-wizard/complete
 * Mark the wizard as complete
 */
app.post('/complete', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  try {
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
    return c.json(nextProgress)
  } catch {
    return c.json({ error: 'Failed to complete wizard' }, 500)
  }
})

export default app
