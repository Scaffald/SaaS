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
  async getOccupation(onetCode: string): Promise<OccupationDetailsResponse> {
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
}
