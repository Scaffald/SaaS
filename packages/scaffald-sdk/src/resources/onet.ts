import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export interface OccupationSearchResult {
  onetsoc_code: string
  title: string
  description?: string | null
}

export interface SearchOccupationsParams {
  query: string
  limit?: number
}

export interface SearchOccupationsResponse {
  occupations: OccupationSearchResult[]
  query: string
}

export interface RIASECScores {
  realistic: number
  investigative: number
  artistic: number
  social: number
  enterprising: number
  conventional: number
}

export interface SaveCareerAssessmentParams {
  riasec_scores?: RIASECScores
  current_occupation_code?: string
  target_occupation_codes?: string[]
}

export interface SaveCareerAssessmentResponse {
  success: boolean
}

export interface CareerAssessmentStatus {
  hasCompleted: boolean
  riasec_scores: RIASECScores | null
  current_occupation_code: string | null
  target_occupation_codes: string[]
  completed_at: string | null
}

export interface OccupationData {
  onetsoc_code: string
  title: string
  description?: string | null
  [key: string]: unknown // O*NET has many additional fields
}

export interface GetOccupationParams {
  onetCode: string
}

export interface RIASECStatus {
  isCompleted: boolean
  scores: RIASECScores | null
}

export interface OccupationStatus {
  isCompleted: boolean
  hasCurrentOccupation: boolean
  hasTargetOccupations: boolean
  currentOccupationCode: string | null
  targetOccupationCodes: string[]
}

// ============================================================================
// ONET Resource
// ============================================================================

/**
 * ONET Resource
 * Handles O*NET occupational data and career assessments (RIASEC)
 */
export class ONET extends Resource {
  /**
   * Search occupations by keyword
   * Returns matching occupations from O*NET database
   */
  async searchOccupations(params: SearchOccupationsParams): Promise<SearchOccupationsResponse> {
    return this.get<SearchOccupationsResponse>('/v1/onet/occupations/search', params)
  }

  /**
   * Get occupation details by O*NET code
   */
  async getOccupation(params: GetOccupationParams): Promise<OccupationData> {
    return this.get<OccupationData>(`/v1/onet/occupations/${params.onetCode}`)
  }

  /**
   * Save user's RIASEC assessment
   * Can save RIASEC scores, occupations, or both independently
   */
  async saveCareerAssessment(
    params: SaveCareerAssessmentParams
  ): Promise<SaveCareerAssessmentResponse> {
    return this.post<SaveCareerAssessmentResponse>('/v1/onet/career-assessment', params)
  }

  /**
   * Get user's career assessment status
   */
  async getCareerAssessmentStatus(): Promise<CareerAssessmentStatus> {
    return this.get<CareerAssessmentStatus>('/v1/onet/career-assessment/status')
  }

  /**
   * Get RIASEC assessment completion status
   */
  async getRIASECStatus(): Promise<RIASECStatus> {
    return this.get<RIASECStatus>('/v1/onet/riasec/status')
  }

  /**
   * Get occupation assessment completion status
   */
  async getOccupationStatus(): Promise<OccupationStatus> {
    return this.get<OccupationStatus>('/v1/onet/occupation/status')
  }
}
