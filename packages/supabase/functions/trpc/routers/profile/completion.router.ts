import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  PROFILE_WIZARD_STEP_WEIGHTS,
  PROFILE_WIZARD_STEPS,
  type ProfileWizardStepId,
} from '@app/trpc/schemas'
import type { Context } from '../../context'
import { protectedProcedure, t } from '../../middleware'

function formatErrorPayload(error: unknown): string {
  if (error instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    }
    const errorRecord = error as Record<string, unknown>

    if (typeof errorRecord.code === 'string') {
      serialized.code = errorRecord.code
    }
    if (typeof errorRecord.details === 'string') {
      serialized.details = errorRecord.details
    }
    if (typeof errorRecord.hint === 'string') {
      serialized.hint = errorRecord.hint
    }

    try {
      return JSON.stringify(serialized)
    } catch {
      return `${error.name}: ${error.message}`
    }
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

const COMPLETION_MILESTONES = [25, 50, 75, 100] as const
type CompletionMilestoneThreshold = (typeof COMPLETION_MILESTONES)[number]

const completionHistorySchema = z.object({
  milestones: z.record(z.string(), z.string()).optional(),
  history: z
    .array(
      z.object({
        percentage: z.number(),
        recordedAt: z.string(),
      })
    )
    .optional(),
  lastPercentage: z.number().optional(),
  updatedAt: z.string().optional(),
})

type CompletionHistoryState = {
  milestones: Record<string, string>
  history: Array<{ percentage: number; recordedAt: string }>
  lastPercentage?: number
  updatedAt?: string
}

const nudgeHistorySchema = z.object({
  dismissed: z
    .record(
      z.string(),
      z.object({
        dismissedAt: z.string(),
        reason: z.string().optional(),
      })
    )
    .optional(),
  lastDismissedAt: z.string().optional(),
})

type NudgeHistoryState = {
  dismissed: Record<string, { dismissedAt: string; reason?: string }>
  lastDismissedAt?: string
}

interface SectionStatus {
  id: ProfileWizardStepId
  title: string
  weight: number
  completed: boolean
  missingFields: string[]
}

export interface CompletionStatusPayload {
  completionPercentage: number
  milestoneBadges: Array<{
    id: string
    threshold: CompletionMilestoneThreshold
    achieved: boolean
    reachedAt: string | null
  }>
  sectionProgress: SectionStatus[]
  incompleteSections: ProfileWizardStepId[]
  hasReachedFiftyPercent: boolean
  milestoneHistory: Record<string, string>
  nudgeStatus: {
    dismissed: Record<string, { dismissedAt: string; reason?: string }>
    lastDismissedAt: string | null
    shouldPrompt: boolean
  }
  summary: {
    completedWeight: number
    remainingWeight: number
    nextMilestone: CompletionMilestoneThreshold | null
  }
  updatedAt: string
}

interface CompletionComputationResult {
  status: CompletionStatusPayload
  completionHistory: CompletionHistoryState
  nudgeHistory: NudgeHistoryState
  userTypes: string[]
  shouldPersistHistory: boolean
  updatedHistoryPayload: CompletionHistoryState
}

function parseCompletionHistory(raw: unknown): CompletionHistoryState {
  const parsed = completionHistorySchema.safeParse(raw ?? {})
  if (!parsed.success) {
    return { milestones: {}, history: [] }
  }

  return {
    milestones: parsed.data.milestones ?? {},
    history: parsed.data.history ?? [],
    lastPercentage: parsed.data.lastPercentage,
    updatedAt: parsed.data.updatedAt,
  }
}

function parseNudgeHistory(raw: unknown): NudgeHistoryState {
  const parsed = nudgeHistorySchema.safeParse(raw ?? {})
  if (!parsed.success) {
    return { dismissed: {} }
  }

  return {
    dismissed: parsed.data.dismissed ?? {},
    lastDismissedAt: parsed.data.lastDismissedAt,
  }
}

function getSectionStatuses(
  profileData: Record<string, unknown> | null,
  skillsData: unknown[],
  certificationsData: unknown[],
  educationData: unknown[],
  experienceData: unknown[]
) {
  const profile = profileData ?? {}

  const SECTION_TITLES: Record<ProfileWizardStepId, string> = {
    general: 'General Info',
    skills: 'Core Skills',
    experience: 'Recent Experience',
    certifications: 'Certifications',
    preferences: 'Work Preferences',
    education: 'Education',
  }

  const generalMissing: string[] = []
  if (!(`${profile.first_name ?? ''}`.trim().length > 0)) {
    generalMissing.push('first_name')
  }
  if (!(`${profile.last_name ?? ''}`.trim().length > 0)) {
    generalMissing.push('last_name')
  }
  if (!(`${profile.headline ?? ''}`.trim().length > 0)) {
    generalMissing.push('headline')
  }
  const generalComplete = generalMissing.length === 0

  const skillsCount = Array.isArray(skillsData) ? skillsData.length : 0
  const skillsMissing = skillsCount >= 3 ? [] : ['skills>=3']
  const skillsComplete = skillsMissing.length === 0

  const experienceComplete =
    Array.isArray(experienceData) &&
    experienceData.some((entry) => {
      if (!entry || typeof entry !== 'object') return false
      const record = entry as Record<string, unknown>
      return (
        `${record.job_title ?? ''}`.trim().length > 0 &&
        `${record.company_name ?? ''}`.trim().length > 0
      )
    })
  const experienceMissing = experienceComplete ? [] : ['experience_entry']

  const certificationEntriesExist =
    Array.isArray(certificationsData) && certificationsData.length > 0
  const certificationsComplete = certificationEntriesExist
  const certificationsMissing = certificationsComplete ? [] : ['certification_entry']

  const preferredLocations = Array.isArray(profile.preferred_work_locations)
    ? (profile.preferred_work_locations as unknown[])
    : []
  const hasPreferredLocation = preferredLocations.length > 0
  const hasAddress = `${profile.address ?? ''}`.trim().length > 0
  const preferencesComplete = hasPreferredLocation || hasAddress
  const preferencesMissing = preferencesComplete ? [] : ['work_location_or_address']

  const educationLevel = `${profile.education_level ?? ''}`.trim().length > 0
  const educationEntriesExist = Array.isArray(educationData) && educationData.length > 0
  const educationComplete = educationLevel || educationEntriesExist
  const educationMissing = educationComplete ? [] : ['education_entry']

  const sectionMap: Record<ProfileWizardStepId, SectionStatus> = {
    general: {
      id: 'general',
      title: SECTION_TITLES.general,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.general,
      completed: generalComplete,
      missingFields: generalMissing,
    },
    skills: {
      id: 'skills',
      title: SECTION_TITLES.skills,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.skills,
      completed: skillsComplete,
      missingFields: skillsMissing,
    },
    experience: {
      id: 'experience',
      title: SECTION_TITLES.experience,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.experience,
      completed: experienceComplete,
      missingFields: experienceMissing,
    },
    certifications: {
      id: 'certifications',
      title: SECTION_TITLES.certifications,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.certifications,
      completed: certificationsComplete,
      missingFields: certificationsMissing,
    },
    preferences: {
      id: 'preferences',
      title: SECTION_TITLES.preferences,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.preferences,
      completed: preferencesComplete,
      missingFields: preferencesMissing,
    },
    education: {
      id: 'education',
      title: SECTION_TITLES.education,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.education,
      completed: educationComplete,
      missingFields: educationMissing,
    },
  }

  return PROFILE_WIZARD_STEPS.map((step) => sectionMap[step])
}

export function calculateMilestones(
  completionPercentage: number,
  existingMilestones: Record<string, string>,
  timestamp: string
) {
  const milestones: CompletionStatusPayload['milestoneBadges'] = []
  const updatedMilestones = { ...existingMilestones }
  let milestonesUpdated = false

  for (const threshold of COMPLETION_MILESTONES) {
    const stored = existingMilestones[String(threshold)] ?? null
    let reachedAt = stored
    const achieved = completionPercentage >= threshold
    if (achieved && !reachedAt) {
      reachedAt = timestamp
      updatedMilestones[String(threshold)] = timestamp
      milestonesUpdated = true
    }

    milestones.push({
      id: `milestone-${threshold}`,
      threshold,
      achieved,
      reachedAt,
    })
  }

  return { milestones, updatedMilestones, milestonesUpdated }
}

function calculateSummary(sections: SectionStatus[]): CompletionStatusPayload['summary'] {
  const completedWeight = sections.reduce(
    (total, section) => (section.completed ? total + section.weight : total),
    0
  )
  const totalWeight = sections.reduce((total, section) => total + section.weight, 0)
  const remainingWeight = Math.max(totalWeight - completedWeight, 0)
  const currentPercentage = Math.round((completedWeight / totalWeight) * 100)
  const nextMilestone =
    COMPLETION_MILESTONES.find((threshold) => threshold > currentPercentage) ?? null

  return {
    completedWeight,
    remainingWeight,
    nextMilestone,
  }
}

async function fetchCompletionData(supabase: Context['supabase'], userId: string) {
  const profilePromise = supabase
    .schema('core')
    .from('profile')
    .select(`
      first_name,
      last_name,
      address,
      location,
      availability,
      preferred_work_locations,
      education_level
    `)
    .eq('user_id', userId)
    .maybeSingle()

  const skillsPromise = supabase
    .schema('core')
    .from('user_skills')
    .select('id')
    .eq('user_id', userId)

  const certificationsPromise = supabase
    .schema('core')
    .from('user_certifications')
    .select('id')
    .eq('user_id', userId)

  const educationPromise = supabase
    .schema('core')
    .from('user_education')
    .select('institution_name')
    .eq('user_id', userId)

  const experiencePromise = supabase
    .schema('core')
    .from('user_experience')
    .select('job_title, company_name')
    .eq('user_id', userId)

  const preferencesPromise = supabase
    .schema('core')
    .from('preferences')
    .select('completion_history, nudge_history, user_types')
    .eq('user_id', userId)
    .maybeSingle()

  const userPromise = supabase
    .schema('core')
    .from('users')
    .select('headline')
    .eq('id', userId)
    .maybeSingle()

  const [
    { data: profileData, error: profileError },
    { data: skillsData, error: skillsError },
    { data: certificationsData, error: certificationsError },
    { data: educationData, error: educationError },
    { data: experienceData, error: experienceError },
    { data: preferencesData, error: preferencesError },
    { data: userData, error: userError },
  ] = await Promise.all([
    profilePromise,
    skillsPromise,
    certificationsPromise,
    educationPromise,
    experiencePromise,
    preferencesPromise,
    userPromise,
  ])

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError
  }
  if (skillsError && skillsError.code !== 'PGRST116') {
    throw skillsError
  }
  if (certificationsError && certificationsError.code !== 'PGRST116') {
    throw certificationsError
  }
  if (educationError && educationError.code !== 'PGRST116') {
    throw educationError
  }
  if (experienceError && experienceError.code !== 'PGRST116') {
    throw experienceError
  }
  if (preferencesError && preferencesError.code !== 'PGRST116') {
    throw preferencesError
  }
  if (userError && userError.code !== 'PGRST116') {
    throw userError
  }

  const profileRecord: Record<string, unknown> = profileData ? { ...profileData } : {}

  const userHeadline =
    userData && typeof userData === 'object' && 'headline' in userData
      ? (userData as Record<string, unknown>).headline
      : undefined

  if (userHeadline !== undefined) {
    profileRecord.headline = userHeadline
  }

  const normalizedProfileData = Object.keys(profileRecord).length > 0 ? profileRecord : null

  return {
    profileData: normalizedProfileData,
    skillsData: skillsData ?? [],
    certificationsData: certificationsData ?? [],
    educationData: educationData ?? [],
    experienceData: experienceData ?? [],
    preferencesData: preferencesData ?? null,
  }
}

function computeCompletionStatus({
  profileData,
  skillsData,
  certificationsData,
  educationData,
  experienceData,
  preferencesData,
  timestamp,
}: {
  profileData: Record<string, unknown> | null
  skillsData: unknown[]
  certificationsData: unknown[]
  educationData: unknown[]
  experienceData: unknown[]
  preferencesData: Record<string, unknown> | null
  timestamp: string
}): CompletionComputationResult {
  const sections = getSectionStatuses(
    profileData,
    skillsData,
    certificationsData,
    educationData,
    experienceData
  )

  const completionPercentage = sections.reduce((total, section) => {
    return total + (section.completed ? section.weight : 0)
  }, 0)

  const completionHistory = parseCompletionHistory(preferencesData?.completion_history)
  const nudgeHistory = parseNudgeHistory(preferencesData?.nudge_history)

  const { milestones, updatedMilestones, milestonesUpdated } = calculateMilestones(
    completionPercentage,
    completionHistory.milestones,
    timestamp
  )

  const historyEntries = [...completionHistory.history]
  const lastRecorded = historyEntries[historyEntries.length - 1]
  if (!lastRecorded || lastRecorded.percentage !== completionPercentage) {
    historyEntries.push({ percentage: completionPercentage, recordedAt: timestamp })
  }
  // Keep only the latest 50 entries to prevent unbounded growth
  const trimmedHistory = historyEntries.slice(-50)

  const updatedHistoryPayload: CompletionHistoryState = {
    milestones: updatedMilestones,
    history: trimmedHistory,
    lastPercentage: completionPercentage,
    updatedAt: timestamp,
  }

  const shouldPersistHistory =
    milestonesUpdated || completionHistory.lastPercentage !== completionPercentage

  const incompleteSections = sections
    .filter((section) => !section.completed)
    .map((section) => section.id)

  const summary = calculateSummary(sections)

  const status: CompletionStatusPayload = {
    completionPercentage,
    milestoneBadges: milestones,
    sectionProgress: sections,
    incompleteSections,
    hasReachedFiftyPercent: completionPercentage >= 50,
    milestoneHistory: updatedMilestones,
    nudgeStatus: {
      dismissed: nudgeHistory.dismissed,
      lastDismissedAt: nudgeHistory.lastDismissedAt ?? null,
      shouldPrompt: completionPercentage < 50 && incompleteSections.length > 0,
    },
    summary,
    updatedAt: timestamp,
  }

  const userTypesArray = Array.isArray(preferencesData?.user_types)
    ? (preferencesData?.user_types as string[]).filter(Boolean)
    : []

  return {
    status,
    completionHistory,
    nudgeHistory,
    userTypes: userTypesArray.length > 0 ? userTypesArray : ['worker'],
    shouldPersistHistory,
    updatedHistoryPayload,
  }
}

const dismissNudgeInputSchema = z.object({
  nudgeId: z.string().min(1),
  reason: z.string().max(512).optional(),
})

type PersonalizedBenefit = {
  id: string
  title: string
  description: string
  relatedSection: ProfileWizardStepId
  userType: 'worker' | 'employer' | 'customer' | 'general'
  opportunityCount: number
}

async function evaluateCompletion({
  supabase,
  userId,
  persistHistory,
}: {
  supabase: Context['supabase']
  userId: string
  persistHistory: boolean
}) {
  const timestamp = new Date().toISOString()
  const {
    profileData,
    skillsData,
    certificationsData,
    educationData,
    experienceData,
    preferencesData,
  } = await fetchCompletionData(supabase, userId)

  const computation = computeCompletionStatus({
    profileData,
    skillsData,
    certificationsData,
    educationData,
    experienceData,
    preferencesData,
    timestamp,
  })

  if (persistHistory && computation.shouldPersistHistory) {
    const { error: persistError } = await supabase.schema('core').from('preferences').upsert(
      {
        user_id: userId,
        completion_history: computation.updatedHistoryPayload,
        updated_at: timestamp,
      },
      { onConflict: 'user_id' }
    )

    if (persistError) {
      console.error('[profileCompletion] Failed to persist completion history', persistError)
    }
  }

  return {
    status: computation.status,
    preferencesData,
    computation,
    rawData: {
      profileData,
      skillsData,
      certificationsData,
      educationData,
      experienceData,
    },
    timestamp,
  }
}

function generatePersonalizedBenefits(
  userTypes: string[],
  sections: SectionStatus[]
): PersonalizedBenefit[] {
  const incomplete = sections.filter((section) => !section.completed)

  const benefits: PersonalizedBenefit[] = []

  const baseMessages: Record<
    ProfileWizardStepId,
    {
      worker: PersonalizedBenefit
      employer: PersonalizedBenefit
      customer: PersonalizedBenefit
      general: PersonalizedBenefit
    }
  > = {
    general: {
      worker: {
        id: 'worker-general',
        title: 'Complete your headline',
        description:
          'Workers with a clear headline are 3x more likely to receive direct outreach from hiring managers.',
        relatedSection: 'general',
        userType: 'worker',
        opportunityCount: 6,
      },
      employer: {
        id: 'employer-general',
        title: 'Clarify your brand message',
        description:
          'A strong profile headline increases trust with candidates and boosts response rates by 40%.',
        relatedSection: 'general',
        userType: 'employer',
        opportunityCount: 4,
      },
      customer: {
        id: 'customer-general',
        title: 'Introduce your organization',
        description:
          'Add a compelling summary so our concierge team can match you with the right talent faster.',
        relatedSection: 'general',
        userType: 'customer',
        opportunityCount: 5,
      },
      general: {
        id: 'general-general',
        title: 'Set a professional headline',
        description: 'A concise headline makes it easier for the right opportunities to find you.',
        relatedSection: 'general',
        userType: 'general',
        opportunityCount: 5,
      },
    },
    skills: {
      worker: {
        id: 'worker-skills',
        title: 'Add at least 3 skills',
        description:
          'Profiles with 3 or more skills surface in 65% more employer searches. Add your core strengths to unlock targeted matches.',
        relatedSection: 'skills',
        userType: 'worker',
        opportunityCount: 8,
      },
      employer: {
        id: 'employer-skills',
        title: 'Tag sought skills',
        description:
          'Highlight requested skill sets so we can promote your openings to the most qualified workers.',
        relatedSection: 'skills',
        userType: 'employer',
        opportunityCount: 5,
      },
      customer: {
        id: 'customer-skills',
        title: 'Specify required expertise',
        description:
          'Clarify the skill profiles you value. We’ll automatically recommend matching candidates as new resumes arrive.',
        relatedSection: 'skills',
        userType: 'customer',
        opportunityCount: 6,
      },
      general: {
        id: 'general-skills',
        title: 'Document skills you rely on',
        description:
          'Listing key skills ensures the platform can surface relevant insights and opportunities.',
        relatedSection: 'skills',
        userType: 'general',
        opportunityCount: 6,
      },
    },
    experience: {
      worker: {
        id: 'worker-experience',
        title: 'Add a recent role',
        description:
          'Showcase your latest project or employer to unlock curated job matches tailored to your experience.',
        relatedSection: 'experience',
        userType: 'worker',
        opportunityCount: 7,
      },
      employer: {
        id: 'employer-experience',
        title: 'Share recent hires',
        description:
          'Document the roles you’ve filled to receive benchmarking data and salary insights for similar positions.',
        relatedSection: 'experience',
        userType: 'employer',
        opportunityCount: 4,
      },
      customer: {
        id: 'customer-experience',
        title: 'Highlight success stories',
        description:
          'Document successful project engagements so we can recommend complementary specialists.',
        relatedSection: 'experience',
        userType: 'customer',
        opportunityCount: 4,
      },
      general: {
        id: 'general-experience',
        title: 'Showcase your background',
        description:
          'A verified experience entry increases the trust signal of your profile for the full network.',
        relatedSection: 'experience',
        userType: 'general',
        opportunityCount: 5,
      },
    },
    certifications: {
      worker: {
        id: 'worker-certifications',
        title: 'Add certifications',
        description:
          'Credentials improve validation and can bump your visibility in employer searches by 2x.',
        relatedSection: 'certifications',
        userType: 'worker',
        opportunityCount: 5,
      },
      employer: {
        id: 'employer-certifications',
        title: 'Request verified credentials',
        description:
          'Document the certifications you value so our screening automatically highlights qualified talent.',
        relatedSection: 'certifications',
        userType: 'employer',
        opportunityCount: 3,
      },
      customer: {
        id: 'customer-certifications',
        title: 'Capture compliance requirements',
        description:
          'Outline the certifications your projects demand to streamline the matching workflow.',
        relatedSection: 'certifications',
        userType: 'customer',
        opportunityCount: 3,
      },
      general: {
        id: 'general-certifications',
        title: 'Showcase credentials',
        description:
          'Listing credentials makes it simple for partners to confirm you meet project requirements.',
        relatedSection: 'certifications',
        userType: 'general',
        opportunityCount: 4,
      },
    },
    preferences: {
      worker: {
        id: 'worker-preferences',
        title: 'Set work preferences',
        description:
          'Define where and how you prefer to work to receive location-specific opportunities without noise.',
        relatedSection: 'preferences',
        userType: 'worker',
        opportunityCount: 9,
      },
      employer: {
        id: 'employer-preferences',
        title: 'Clarify hiring appetite',
        description:
          'Outline work arrangements and travel expectations so candidates know if they match before applying.',
        relatedSection: 'preferences',
        userType: 'employer',
        opportunityCount: 6,
      },
      customer: {
        id: 'customer-preferences',
        title: 'Specify project footprint',
        description:
          'Let us know project locations and travel requirements so we can line up crews proactively.',
        relatedSection: 'preferences',
        userType: 'customer',
        opportunityCount: 5,
      },
      general: {
        id: 'general-preferences',
        title: 'Document work style preferences',
        description:
          'Sharing work preferences enables smarter matches and reduces irrelevant outreach.',
        relatedSection: 'preferences',
        userType: 'general',
        opportunityCount: 6,
      },
    },
    education: {
      worker: {
        id: 'worker-education',
        title: 'Add your education',
        description:
          'Education details help us surface alumni networks and apprenticeship programs tailored to you.',
        relatedSection: 'education',
        userType: 'worker',
        opportunityCount: 4,
      },
      employer: {
        id: 'employer-education',
        title: 'Highlight training programs',
        description:
          'Sharing your training partnerships unlocks co-marketing opportunities with trade schools.',
        relatedSection: 'education',
        userType: 'employer',
        opportunityCount: 3,
      },
      customer: {
        id: 'customer-education',
        title: 'Showcase team training',
        description:
          'Document the training standards you uphold so candidates understand your commitment to safety.',
        relatedSection: 'education',
        userType: 'customer',
        opportunityCount: 3,
      },
      general: {
        id: 'general-education',
        title: 'Document education',
        description: 'Education entries help the matching engine factor in certification pathways.',
        relatedSection: 'education',
        userType: 'general',
        opportunityCount: 4,
      },
    },
  }

  for (const section of incomplete) {
    const base = baseMessages[section.id]
    for (const userType of userTypes) {
      if (userType in base) {
        benefits.push(base[userType as keyof typeof base])
      }
    }
    // Include general guidance if no user type matched
    if (benefits.every((benefit) => benefit.relatedSection !== section.id)) {
      benefits.push(base.general)
    }
  }

  return benefits
}

/**
 * Profile Completion router - handles profile completion status
 */
export const profileCompletionRouter = t.router({
  /**
   * Enhanced profile completion status with weighted scoring and milestones.
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    try {
      const { status } = await evaluateCompletion({
        supabase,
        userId: user.id,
        persistHistory: true,
      })
      return status
    } catch (error) {
      console.error('[profileCompletion] getStatus error:', error)
      const formattedError = formatErrorPayload(error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to compute completion status: ${formattedError}`,
      })
    }
  }),

  /**
   * Track dismissals of profile completion nudges.
   */
  dismissNudge: protectedProcedure
    .input(dismissNudgeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      try {
        const timestamp = new Date().toISOString()
        const { preferencesData } = await fetchCompletionData(supabase, user.id)
        const existingHistory = parseNudgeHistory(preferencesData?.nudge_history)

        const updatedHistory: NudgeHistoryState = {
          dismissed: {
            ...existingHistory.dismissed,
            [input.nudgeId]: {
              dismissedAt: timestamp,
              reason: input.reason,
            },
          },
          lastDismissedAt: timestamp,
        }

        const { error: persistError } = await supabase.schema('core').from('preferences').upsert(
          {
            user_id: user.id,
            nudge_history: updatedHistory,
            updated_at: timestamp,
          },
          { onConflict: 'user_id' }
        )

        if (persistError) {
          throw persistError
        }

        return {
          success: true,
          nudgeHistory: updatedHistory,
        }
      } catch (error) {
        console.error('[profileCompletion] dismissNudge error:', error)
        const formattedError = formatErrorPayload(error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to dismiss nudge: ${formattedError}`,
        })
      }
    }),

  /**
   * Provide tailored benefits messaging based on incomplete sections.
   */
  getPersonalizedBenefits: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    try {
      const { status, computation } = await evaluateCompletion({
        supabase,
        userId: user.id,
        persistHistory: false,
      })

      const normalizedUserTypes = computation.userTypes.map((type) => type.toLowerCase()) as Array<
        'worker' | 'employer' | 'customer' | 'general'
      >

      if (normalizedUserTypes.length === 0) {
        normalizedUserTypes.push('general')
      }

      const benefits = generatePersonalizedBenefits(normalizedUserTypes, status.sectionProgress)

      return {
        benefits,
        completionPercentage: status.completionPercentage,
        incompleteSections: status.incompleteSections,
        userTypes: normalizedUserTypes,
        updatedAt: status.updatedAt,
      }
    } catch (error) {
      console.error('[profileCompletion] getPersonalizedBenefits error:', error)
      const formattedError = formatErrorPayload(error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to generate personalized benefits: ${formattedError}`,
      })
    }
  }),

  /**
   * Temporary compatibility endpoint while clients migrate.
   */
  getCompletionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { status } = await evaluateCompletion({
      supabase,
      userId: user.id,
      persistHistory: true,
    })
    return status
  }),
})
