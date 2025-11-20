/**
 * Review Draft Types
 * Defines the structure for review state management
 */

export interface ReviewDraft {
  // Step 1: Skills ratings
  skillsRatings: Record<string, number>

  // Step 2: Skills tags
  skillsStrengths: string[]
  skillsImprovements: string[]

  // Step 3: Reliability rating
  reliabilityRating: number

  // Step 4: Reliability tags
  reliabilityStrengths: string[]
  reliabilityImprovements: string[]

  // Step 5: Collaboration rating
  collaborationRating: number

  // Step 6: Collaboration tags
  collaborationStrengths: string[]
  collaborationImprovements: string[]

  // Step 7: Summary
  summary: string

  // Step 8: Recommendation
  recommendation: boolean | null

  // Metadata
  subjectId: string
  lastSaved: string | null
  currentStep: number
}

export interface ReviewDraftState extends ReviewDraft {
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export const createEmptyReviewDraft = (subjectId: string): ReviewDraft => ({
  skillsRatings: {},
  skillsStrengths: [],
  skillsImprovements: [],
  reliabilityRating: 0,
  reliabilityStrengths: [],
  reliabilityImprovements: [],
  collaborationRating: 0,
  collaborationStrengths: [],
  collaborationImprovements: [],
  summary: '',
  recommendation: null,
  subjectId,
  lastSaved: null,
  currentStep: 1,
})
