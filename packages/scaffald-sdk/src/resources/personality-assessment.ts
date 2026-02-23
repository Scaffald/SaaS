import { Resource } from './base.js'

// Base assessment data structure
export interface PersonalityAssessment {
  id: string
  user_id: string
  current_step: 'luscher1' | 'cooldown' | 'ipip' | 'luscher2' | 'acute' | 'completed' | null
  completion_score: number
  started_at: string
  last_updated_at: string
  updated_at: string
  completed_at: string | null
  luscher1_choices: number[] | null
  luscher1_completed_at: string | null
  luscher2_choices: number[] | null
  luscher2_completed_at: string | null
  luscher2_results: string | null
  ipip_answers: IPIPAnswer[] | null
  ipip_current_index: number | null
  ipip_language: string | null
  ipip_completed_at: string | null
  ai_report: string | null
  ai_report_generated_at: string | null
  cooldown_end_time: string | null
  next_available_at: string | null
  next_luscher_test_available_at: string | null
  diary_response: string | null
}

export interface IPIPAnswer {
  id: string
  domain: 'A' | 'E' | 'N' | 'C' | 'O'
  facet: number
  score: number
}

// Status response types
export interface AssessmentStatus extends PersonalityAssessment {}

export interface IPIPStatus {
  isCompleted: boolean
  completedAt: string | null
  progress: number
}

export interface LuscherTest1Status {
  isCompleted: boolean
  completedAt: string | null
}

export interface LuscherTest2Status {
  isCompleted: boolean
  completedAt: string | null
}

export interface LuscherTestAvailability {
  isCompleted: boolean
  isOnCooldown: boolean
  nextAvailableAt: string | null
}

// Save request types
export interface SaveLuscher1Params {
  choices: number[]
}

export interface SaveLuscher2Params {
  choices: number[]
  results?: string
}

export interface SaveIPIPProgressParams {
  answers: IPIPAnswer[]
  current_index: number
  language?: string
}

export interface SaveLuscherTestSessionParams {
  luscher1Choices: number[]
  luscher2Choices: number[]
  diaryResponse?: string
}

export interface UpdateCurrentStepParams {
  step: 'luscher1' | 'cooldown' | 'ipip' | 'luscher2' | 'acute' | 'completed'
}

export interface GenerateReportParams {
  luscherResults: string
}

export interface GenerateShareTokenParams {
  expiresInDays?: number
}

export interface RevokeShareTokenParams {
  token: string
}

// Response types
export interface SaveProgressResponse {
  success: boolean
  isComplete?: boolean
}

export interface GenerateReportResponse {
  success: boolean
  report: string
}

export interface GenerateShareTokenResponse {
  token: string
  shareUrl: string
  expiresAt: string | null
}

export interface SaveLuscherTestSessionResponse {
  success: boolean
  nextAvailableAt: string
}

export interface AwardResultsViewXPResponse {
  success: boolean
  alreadyAwarded?: boolean
  newXP?: number
}

export interface PersonalityArchetype {
  archetype: string
  confidence: number
  details: {
    name: string
    description: string
    strengths: string[]
    work_styles: string
    team_dynamics: string
    growth_areas: string[]
  } | null
}

export class PersonalityAssessments extends Resource {
  /**
   * Get assessment status or create new assessment
   * Returns current progress or creates a new assessment if none exists
   */
  async getStatus(): Promise<AssessmentStatus> {
    return this.get<AssessmentStatus>('/v1/personality-assessment/status')
  }

  /**
   * Get IPIP assessment completion status
   */
  async getIPIPStatus(): Promise<IPIPStatus> {
    return this.get<IPIPStatus>('/v1/personality-assessment/ipip/status')
  }

  /**
   * Get Luscher Test 1 completion status
   */
  async getLuscherTest1Status(): Promise<LuscherTest1Status> {
    return this.get<LuscherTest1Status>('/v1/personality-assessment/luscher-1/status')
  }

  /**
   * Get Luscher Test 2 completion status
   */
  async getLuscherTest2Status(): Promise<LuscherTest2Status> {
    return this.get<LuscherTest2Status>('/v1/personality-assessment/luscher-2/status')
  }

  /**
   * Get Luscher Test availability (cooldown status)
   */
  async getLuscherTestAvailability(): Promise<LuscherTestAvailability> {
    return this.get<LuscherTestAvailability>('/v1/personality-assessment/luscher/availability')
  }

  /**
   * Save Luscher Test 1 results
   */
  async saveLuscher1(params: SaveLuscher1Params): Promise<SaveProgressResponse> {
    return this.post<SaveProgressResponse>('/v1/personality-assessment/luscher-1', params)
  }

  /**
   * Save IPIP progress (incremental saves)
   */
  async saveIPIPProgress(params: SaveIPIPProgressParams): Promise<SaveProgressResponse> {
    return this.post<SaveProgressResponse>('/v1/personality-assessment/ipip', params)
  }

  /**
   * Save Luscher Test 2 results
   */
  async saveLuscher2(params: SaveLuscher2Params): Promise<SaveProgressResponse> {
    return this.post<SaveProgressResponse>('/v1/personality-assessment/luscher-2', params)
  }

  /**
   * Update current step
   * Used to advance to the next step after cooldown completes
   */
  async updateCurrentStep(params: UpdateCurrentStepParams): Promise<SaveProgressResponse> {
    return this.put<SaveProgressResponse>('/v1/personality-assessment/step', params)
  }

  /**
   * Save unified Luscher test session (both parts + diary + XP + cooldown)
   */
  async saveLuscherTestSession(
    params: SaveLuscherTestSessionParams
  ): Promise<SaveLuscherTestSessionResponse> {
    return this.post<SaveLuscherTestSessionResponse>(
      '/v1/personality-assessment/luscher/session',
      params
    )
  }

  /**
   * Generate AI report from Luscher results
   * This calls OpenAI to generate a personality report
   */
  async generateReport(params: GenerateReportParams): Promise<GenerateReportResponse> {
    return this.post<GenerateReportResponse>('/v1/personality-assessment/report', params)
  }

  /**
   * Generate share token for IPIP results
   */
  async generateShareToken(
    params?: GenerateShareTokenParams
  ): Promise<GenerateShareTokenResponse> {
    return this.post<GenerateShareTokenResponse>('/v1/personality-assessment/share', params || {})
  }

  /**
   * Revoke share token
   */
  async revokeShareToken(params: RevokeShareTokenParams): Promise<SaveProgressResponse> {
    return this.del<SaveProgressResponse>(`/v1/personality-assessment/share/${params.token}`)
  }

  /**
   * Award XP for viewing results (one-time)
   */
  async awardResultsViewXP(): Promise<AwardResultsViewXPResponse> {
    return this.post<AwardResultsViewXPResponse>('/v1/personality-assessment/xp/results-view', {})
  }

  /**
   * Get primary archetype for the current user.
   * Returns null if the IPIP has not been completed yet.
   */
  async getArchetype(): Promise<PersonalityArchetype | null> {
    return this.get<PersonalityArchetype | null>('/v1/personality-assessment/archetype')
  }
}
