import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Occupation {
  onet_code: string
  title: string
  description: string
  alternate_titles: string[]
}

export interface OccupationDetails extends Occupation {
  sample_of_reported_job_titles: string[]
  tasks: string[]
  technology_skills: string[]
  knowledge: Array<{ name: string; level: number }>
  skills: Array<{ name: string; level: number }>
  abilities: Array<{ name: string; level: number }>
  education: {
    typical_education: string
    related_experience: string
    on_site_training: string
  }
  job_zone: number
  median_wages: {
    annual: number
    hourly: number
  }
}

export interface OccupationSkill {
  skill_name: string
  importance: number
  level: number
  category: string
}

export interface OccupationKnowledge {
  knowledge_area: string
  importance: number
  level: number
  description: string
}

export interface OccupationAbility {
  ability_name: string
  importance: number
  level: number
  description: string
}

export interface AutocompleteSuggestion {
  onet_code: string
  title: string
}

// Request Types
export interface SearchParams {
  keyword: string
  page?: number
  limit?: number
}

export interface GetSkillsParams {
  min_importance?: number
  category?: string
}

export interface GetRelatedParams {
  limit?: number
}

export interface AutocompleteParams {
  query: string
  limit?: number
}

// Response Types
export interface OccupationsSearchResponse {
  data: Occupation[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface OccupationDetailsResponse {
  data: OccupationDetails
}

export interface SkillsResponse {
  data: OccupationSkill[]
}

export interface RelatedOccupationsResponse {
  data: Occupation[]
}

export interface KnowledgeResponse {
  data: OccupationKnowledge[]
}

export interface AbilitiesResponse {
  data: OccupationAbility[]
}

export interface AutocompleteResponse {
  data: AutocompleteSuggestion[]
}

// Type aliases for backward compatibility with hooks
export interface SearchOccupationsParams {
  query?: string
  keyword?: string
  page?: number
  limit?: number
}
export interface SearchOccupationsResponse {
  occupations: Occupation[]
  data?: Occupation[]
  pagination?: { total: number; page: number; limit: number; total_pages: number }
}
export interface GetOccupationParams { onetCode: string }
export type OccupationData = OccupationDetailsResponse

// Career assessment types
export interface CareerAssessmentStatus {
  hasCompleted: boolean
  riasec_complete: boolean
  occupations_selected: boolean
  completed_at: string | null
}

export interface RIASECStatus {
  isCompleted: boolean
  complete: boolean
  scores: Record<string, number> | null
  completed_at: string | null
}

export interface OccupationStatus {
  isCompleted: boolean
  selected: boolean
  occupations: Occupation[]
  updated_at: string | null
}

export interface SaveCareerAssessmentParams {
  riasec_scores?: Record<string, number>
  selected_occupations?: string[]
}

export interface SaveCareerAssessmentResponse {
  success: boolean
}

// ============================================================================
// ONET Resource
// ============================================================================

/**
 * ONET Resource
 * Handles O*NET occupational data queries
 */
export class ONET extends Resource {
  /**
   * Search occupations by keyword
   */
  async search(params: SearchParams): Promise<OccupationsSearchResponse> {
    return super.get<OccupationsSearchResponse>('/v1/onet/search', params)
  }

  /**
   * Get occupation details by O*NET code
   */
  async getOccupation(onetCodeOrParams: string | GetOccupationParams): Promise<OccupationDetailsResponse> {
    const onetCode = typeof onetCodeOrParams === 'string' ? onetCodeOrParams : onetCodeOrParams.onetCode
    return super.get<OccupationDetailsResponse>(`/v1/onet/occupations/${onetCode}`)
  }

  /**
   * Get skills for an occupation
   */
  async getSkills(onetCode: string, params?: GetSkillsParams): Promise<SkillsResponse> {
    return super.get<SkillsResponse>(
      `/v1/onet/occupations/${onetCode}/skills`,
      params    )
  }

  /**
   * Get related occupations
   */
  async getRelated(onetCode: string, params?: GetRelatedParams): Promise<RelatedOccupationsResponse> {
    return super.get<RelatedOccupationsResponse>(
      `/v1/onet/occupations/${onetCode}/related`,
      params    )
  }

  /**
   * Get knowledge areas for an occupation
   */
  async getKnowledge(onetCode: string): Promise<KnowledgeResponse> {
    return super.get<KnowledgeResponse>(`/v1/onet/occupations/${onetCode}/knowledge`)
  }

  /**
   * Get abilities for an occupation
   */
  async getAbilities(onetCode: string): Promise<AbilitiesResponse> {
    return super.get<AbilitiesResponse>(`/v1/onet/occupations/${onetCode}/abilities`)
  }

  /**
   * Autocomplete occupation titles
   */
  async autocomplete(params: AutocompleteParams): Promise<AutocompleteResponse> {
    return super.get<AutocompleteResponse>('/v1/onet/autocomplete', params)
  }

  /** Search occupations (alias for search, supports query or keyword) */
  async searchOccupations(params: SearchOccupationsParams): Promise<SearchOccupationsResponse> {
    const searchParams: SearchParams = { keyword: params.query ?? params.keyword ?? '', page: params.page, limit: params.limit }
    return super.get<SearchOccupationsResponse>('/v1/onet/search', searchParams as unknown as Record<string, string>)
  }

  /** Get career assessment status */
  async getCareerAssessmentStatus(): Promise<CareerAssessmentStatus> {
    return super.get<CareerAssessmentStatus>('/v1/onet/career-assessment/status')
  }

  /** Get RIASEC assessment status */
  async getRIASECStatus(): Promise<RIASECStatus> {
    return super.get<RIASECStatus>('/v1/onet/riasec/status')
  }

  /** Get occupation selection status */
  async getOccupationStatus(): Promise<OccupationStatus> {
    return super.get<OccupationStatus>('/v1/onet/occupation/status')
  }

  /** Save career assessment data */
  async saveCareerAssessment(params: SaveCareerAssessmentParams): Promise<SaveCareerAssessmentResponse> {
    return super.post<SaveCareerAssessmentResponse>('/v1/onet/career-assessment', params)
  }
}
