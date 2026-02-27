import { Resource } from './base'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Soft Skills Types
export type SoftSkillCategory = 'reliability' | 'collaboration' | 'professionalism' | 'technical'

export interface SoftSkillCatalogEntry {
  id: string
  name: string
  category: SoftSkillCategory
  description: string | null
  orderIndex: number
}

export interface SoftSkillView extends SoftSkillCatalogEntry {
  rating: number | null
  selfAssessedAt: string | null
}

export type CategoryAverages = Record<SoftSkillCategory, number>

export interface GetSoftSkillsParams {
  userId?: string
  version?: number
}

export interface GetSoftSkillsResponse {
  version: number | null
  lastUpdated: string | null
  categoryAverages: CategoryAverages
  skills: SoftSkillView[]
}

export interface SoftSkillRating {
  skill_id: string
  rating: number
}

export interface UpdateSoftSkillsParams {
  skills: SoftSkillRating[]
}

export interface UpdateSoftSkillsResponse {
  version: number
  selfAssessedAt: string
  createdNewVersion: boolean
  categoryAverages: CategoryAverages
}

export interface SoftSkillsHistoryVersion {
  version: number
  selfAssessedAt: string | null
  categoryAverages: CategoryAverages
}

export interface GetSoftSkillsHistoryResponse {
  versions: SoftSkillsHistoryVersion[]
}

export interface GetSoftSkillsComparisonResponse {
  version: number | null
  self: CategoryAverages | null
  peer: CategoryAverages | null
  peerSampleSize: number
  alignmentScore: number | null
}

// Hard Skills Types (Hierarchical)
export interface Industry {
  id: string
  name: string
  slug: string
}

export interface GetIndustriesResponse {
  industries: Industry[]
}

export interface SearchParentSkillsParams {
  query: string
  industryId?: string
  limit?: number
}

export interface ParentSkill {
  id: string
  name: string
  code?: string
}

export interface SearchParentSkillsResponse {
  skills: ParentSkill[]
}

export interface GetSkillChildrenParams {
  parentId: string
}

export interface SkillChild {
  id: string
  name: string
  code?: string
}

export interface GetSkillChildrenResponse {
  children: SkillChild[]
}

export interface GetSkillDetailsParams {
  skillId: string
}

export interface SkillDetails {
  id: string
  name: string
  code?: string
  description?: string
  [key: string]: unknown
}

export interface GetSkillDetailsResponse {
  skill: SkillDetails
}

export interface UserSkill {
  id?: string
  skill_id: string
  skill_name: string
  proficiency: number
  years_experience?: number
  is_explicit?: boolean
  verified?: boolean
  [key: string]: unknown
}

export interface GetUserSkillsResponse {
  explicitSkills: UserSkill[]
  impliedSkills: UserSkill[]
  allSkills: UserSkill[]
}

export interface AddUserSkillParams {
  skillId: string
  proficiency: number
}

export interface UpdateUserSkillParams {
  skillId: string
  proficiency?: number
}

export interface RemoveUserSkillParams {
  skillId: string
}

// Multi-Taxonomy Types
export type SkillTaxonomy = 'csi' | 'onet'

export interface SkillDetailsMT {
  code: string
  display_code: string
  name: string
  description?: string
  hierarchy_level: number | null
}

export interface UserSkillMT {
  id: string
  skill_taxonomy: string
  csi_skill_id: string | null
  onet_occupation_id: string | null
  proficiency_level: number
  years_experience: number | null
  verified: boolean
  notes: string | null
  created_at: string
  skill_details: SkillDetailsMT | null
}

export interface GetUserSkillsMTResponse {
  skills: UserSkillMT[]
}

export interface AddSkillMTParams {
  taxonomy: SkillTaxonomy
  skillId: string
  proficiencyLevel: number
  yearsExperience?: number
  notes?: string
}

export interface UpdateSkillMTParams {
  userSkillId: string
  proficiencyLevel?: number
  yearsExperience?: number
  notes?: string
}

export interface RemoveSkillMTParams {
  userSkillId: string
}

export interface GetPrimaryIndustryResponse {
  primary_industry_id: string | null
  industry: Industry | null
}

export interface UpdatePrimaryIndustryParams {
  industryId: string
}

// Legacy Types
export interface LegacySkill {
  skill_id: string
  skill_name: string
  proficiency: number
  years_experience: number
  is_primary: boolean
  endorsed_count: number
}

export interface GetSkillsLegacyResponse {
  skills: LegacySkill[]
  primary_industry_id: string | null
  secondary_industries: string[]
  skill_categories: string[]
}

export interface UpdateSkillsLegacyParams {
  industry_id?: string
}

// Standard Response
export interface SuccessResponse {
  success: boolean
}

// ============================================================================
// SKILLS RESOURCE
// ============================================================================

export class Skills extends Resource {
  // Soft Skills Endpoints

  async getSoftSkills(params?: GetSoftSkillsParams): Promise<GetSoftSkillsResponse> {
    return this.get<GetSoftSkillsResponse>('/v1/profiles/skills/soft', params)
  }

  async updateSoftSkills(params: UpdateSoftSkillsParams): Promise<UpdateSoftSkillsResponse> {
    return this.patch<UpdateSoftSkillsResponse>('/v1/profiles/skills/soft', params)
  }

  async getSoftSkillsHistory(): Promise<GetSoftSkillsHistoryResponse> {
    return this.get<GetSoftSkillsHistoryResponse>('/v1/profiles/skills/soft/history')
  }

  async getSoftSkillsComparison(): Promise<GetSoftSkillsComparisonResponse> {
    return this.get<GetSoftSkillsComparisonResponse>('/v1/profiles/skills/soft/comparison')
  }

  // Hard Skills Endpoints (Hierarchical)

  async getIndustries(): Promise<GetIndustriesResponse> {
    return this.get<GetIndustriesResponse>('/v1/profiles/skills/industries')
  }

  async searchParentSkills(params: SearchParentSkillsParams): Promise<SearchParentSkillsResponse> {
    return this.post<SearchParentSkillsResponse>('/v1/profiles/skills/search-parents', params)
  }

  async getSkillChildren(params: GetSkillChildrenParams): Promise<GetSkillChildrenResponse> {
    return this.get<GetSkillChildrenResponse>('/v1/profiles/skills/children', params)
  }

  async getSkillDetails(params: GetSkillDetailsParams): Promise<GetSkillDetailsResponse> {
    return this.get<GetSkillDetailsResponse>('/v1/profiles/skills/details', params)
  }

  async getUserSkills(): Promise<GetUserSkillsResponse> {
    return this.get<GetUserSkillsResponse>('/v1/profiles/skills')
  }

  async addUserSkill(params: AddUserSkillParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/profiles/skills', params)
  }

  async updateUserSkill(params: UpdateUserSkillParams): Promise<SuccessResponse> {
    return this.patch<SuccessResponse>('/v1/profiles/skills', params)
  }

  async removeUserSkill(params: RemoveUserSkillParams): Promise<SuccessResponse> {
    return this.del<SuccessResponse>(`/v1/profiles/skills/${params.skillId}`)
  }

  // Multi-Taxonomy Endpoints

  async getUserSkillsMultiTaxonomy(): Promise<GetUserSkillsMTResponse> {
    return this.get<GetUserSkillsMTResponse>('/v1/profiles/skills/multi-taxonomy')
  }

  async addSkillMultiTaxonomy(params: AddSkillMTParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/profiles/skills/multi-taxonomy', params)
  }

  async updateSkillMultiTaxonomy(params: UpdateSkillMTParams): Promise<SuccessResponse> {
    return this.patch<SuccessResponse>('/v1/profiles/skills/multi-taxonomy', params)
  }

  async removeSkillMultiTaxonomy(params: RemoveSkillMTParams): Promise<SuccessResponse> {
    return this.del<SuccessResponse>(`/v1/profiles/skills/multi-taxonomy/${params.userSkillId}`)
  }

  async getPrimaryIndustry(): Promise<GetPrimaryIndustryResponse> {
    return this.get<GetPrimaryIndustryResponse>('/v1/profiles/skills/primary-industry')
  }

  async updatePrimaryIndustry(params: UpdatePrimaryIndustryParams): Promise<SuccessResponse> {
    return this.patch<SuccessResponse>('/v1/profiles/skills/primary-industry', params)
  }

  // Legacy Endpoints (backwards compatibility)

  async getSkillsLegacy(): Promise<GetSkillsLegacyResponse> {
    return this.get<GetSkillsLegacyResponse>('/v1/profiles/skills/legacy')
  }

  async updateSkillsLegacy(params: UpdateSkillsLegacyParams): Promise<SuccessResponse> {
    return this.patch<SuccessResponse>('/v1/profiles/skills/legacy', params)
  }
}
