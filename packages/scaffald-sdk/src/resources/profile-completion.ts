import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export type ProfileWizardStepId =
  | 'general'
  | 'skills'
  | 'experience'
  | 'certifications'
  | 'preferences'
  | 'education'

export type CompletionMilestoneThreshold = 25 | 50 | 75 | 100

export interface SectionStatus {
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

export interface DismissNudgeParams {
  nudgeId: string
  reason?: string
}

export interface DismissNudgeResponse {
  success: boolean
  nudgeHistory: {
    dismissed: Record<string, { dismissedAt: string; reason?: string }>
    lastDismissedAt: string
  }
}

export interface PersonalizedBenefit {
  id: string
  title: string
  description: string
  relatedSection: ProfileWizardStepId
  userType: 'worker' | 'employer' | 'customer' | 'general'
  opportunityCount: number
}

export interface PersonalizedBenefitsResponse {
  benefits: PersonalizedBenefit[]
  completionPercentage: number
  incompleteSections: ProfileWizardStepId[]
  userTypes: Array<'worker' | 'employer' | 'customer' | 'general'>
  updatedAt: string
}

// ============================================================================
// ProfileCompletion Resource
// ============================================================================

/**
 * Profile Completion Resource
 * Handles profile completion status, milestones, and nudges
 */
export class ProfileCompletion extends Resource {
  /**
   * Get profile completion status with weighted scoring and milestones
   */
  async getStatus(): Promise<CompletionStatusPayload> {
    return this.get<CompletionStatusPayload>('/v1/profiles/completion/status')
  }

  /**
   * Dismiss a profile completion nudge
   */
  async dismissNudge(params: DismissNudgeParams): Promise<DismissNudgeResponse> {
    return this.post<DismissNudgeResponse>('/v1/profiles/completion/nudges/dismiss', params)
  }

  /**
   * Get personalized benefits messaging based on incomplete sections
   */
  async getPersonalizedBenefits(): Promise<PersonalizedBenefitsResponse> {
    return this.get<PersonalizedBenefitsResponse>('/v1/profiles/completion/benefits')
  }
}
