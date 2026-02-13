import { Resource } from './base.js'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Prerequisite {
  id: string
  name: string
  description: string
  category: string
  required: boolean
  completed: boolean
  completion_percentage: number
  fields?: Array<{ name: string; completed: boolean }>
}

export interface PrerequisitesResponse {
  data: Prerequisite[]
}

export interface PrerequisiteValidationResult {
  valid: boolean
  required_prerequisites_met: boolean
  optional_prerequisites_met: boolean
  missing_required: Prerequisite[]
  missing_optional: Prerequisite[]
  completion_percentage: number
}

export interface PrerequisiteCheckResult {
  prerequisite_id: string
  completed: boolean
  completion_percentage: number
  missing_fields: string[]
}

export interface CompletionStats {
  total_prerequisites: number
  completed_prerequisites: number
  required_prerequisites: number
  required_completed: number
  optional_prerequisites: number
  optional_completed: number
  overall_completion_percentage: number
  required_completion_percentage: number
  optional_completion_percentage: number
}

export interface ListPrerequisitesParams {
  category?: string
  required?: boolean
  completed?: boolean
}

export interface ValidatePrerequisitesParams {
  context?: string
  job_id?: string
}

export interface GetMissingParams {
  required_only?: boolean
  context?: string
}

export interface GetStatsParams {
  category?: string
}

// Onboarding prerequisites types
export interface PrerequisiteAddress {
  street: string
  city: string
  state: string
  zip: string
  country: string
  latitude?: number
  longitude?: number
}

export type UserType = 'worker' | 'employer' | 'customer'

export interface PrerequisitesData {
  first_name: string
  last_name: string
  address: PrerequisiteAddress | null
  user_types: UserType[]
  industry_id: string
}

export interface PrerequisitesCheckResponse {
  isComplete: boolean
  hasName: boolean
  hasAddress: boolean
  hasUserTypes: boolean
  hasIndustry: boolean
  hasAcceptedPrivacy: boolean
  hasAcceptedTerms: boolean
  completedAt: string | null
  data: PrerequisitesData
}

export interface CompletePrerequisitesParams {
  first_name: string
  last_name: string
  address: PrerequisiteAddress
  user_types: UserType[]
  industry_id: string
  accepts_privacy_policy: boolean
  accepts_terms_of_service: boolean
}

export interface CompletePrerequisitesResponse {
  success: boolean
}

// ============================================================================
// Prerequisites Resource
// ============================================================================

/**
 * Prerequisites resource for managing user onboarding requirements
 */
export class Prerequisites extends Resource {
  /**
   * List all prerequisites
   */
  async list(params?: ListPrerequisitesParams): Promise<PrerequisitesResponse> {
    return super.get<PrerequisitesResponse>('/v1/prerequisites', params)
  }

  /**
   * Get prerequisite by ID
   */
  async getById(id: string): Promise<{ data: Prerequisite }> {
    return super.get<{ data: Prerequisite }>(`/v1/prerequisites/${id}`)
  }

  /**
   * Check overall prerequisites status for current user
   */
  async check(): Promise<PrerequisitesCheckResponse> {
    return super.get<PrerequisitesCheckResponse>('/v1/prerequisites/check')
  }

  /**
   * Check specific prerequisite completion status
   */
  async checkPrerequisite(id: string): Promise<{ data: PrerequisiteCheckResult }> {
    return super.get<{ data: PrerequisiteCheckResult }>(`/v1/prerequisites/${id}/check`)
  }

  /**
   * Complete prerequisites (onboarding flow)
   */
  async complete(params: CompletePrerequisitesParams): Promise<CompletePrerequisitesResponse> {
    return this.post<CompletePrerequisitesResponse>('/v1/prerequisites/complete', params)
  }

  /**
   * Validate prerequisites for context
   */
  async validate(
    params?: ValidatePrerequisitesParams
  ): Promise<{ data: PrerequisiteValidationResult }> {
    return super.get<{ data: PrerequisiteValidationResult }>('/v1/prerequisites/validate', params)
  }

  /**
   * Get missing prerequisites
   */
  async getMissing(params?: GetMissingParams): Promise<PrerequisitesResponse> {
    return super.get<PrerequisitesResponse>('/v1/prerequisites/missing', params)
  }

  /**
   * Get completion statistics
   */
  async getCompletionStats(params?: GetStatsParams): Promise<{ data: CompletionStats }> {
    return super.get<{ data: CompletionStats }>('/v1/prerequisites/stats', params)
  }
}
