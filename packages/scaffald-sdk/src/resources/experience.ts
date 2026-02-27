import { Resource } from './base'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Address {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  latitude?: number
  longitude?: number
}

export interface ExperienceEntry {
  id?: string
  user_id?: string
  organization_id?: string | null
  job_title: string
  company_name: string
  employment_type?: string | null
  location?: string | Address | null
  is_remote: boolean
  start_date?: string | null
  end_date?: string | null
  is_current: boolean
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface GetExperienceResponse {
  experience_entries: ExperienceEntry[]
}

export interface ExperienceSummary {
  career_level: string | null
}

export interface SaveExperienceParams {
  career_level?: string | null
  experience_entries: ExperienceEntry[]
}

export interface SaveExperienceResponse {
  success: boolean
  experience_entries: ExperienceEntry[]
}

export interface DeleteExperienceParams {
  experienceId: string
}

export interface DeleteExperienceResponse {
  success: boolean
}

// ============================================================================
// EXPERIENCE RESOURCE
// ============================================================================

export class Experience extends Resource {
  /**
   * Get user's experience entries
   * Returns all work experience entries for the authenticated user
   *
   * @returns Array of experience entries
   *
   * @example
   * ```typescript
   * const entries = await client.experience.getExperience()
   * console.log(`${entries.length} experience entries found`)
   * ```
   */
  async getExperience(): Promise<ExperienceEntry[]> {
    return this.get<ExperienceEntry[]>('/v1/profiles/experience')
  }

  /**
   * Get experience summary
   * Returns career level information from profile
   *
   * @returns Experience summary with career level
   *
   * @example
   * ```typescript
   * const summary = await client.experience.getExperienceSummary()
   * console.log(`Career level: ${summary.career_level}`)
   * ```
   */
  async getExperienceSummary(): Promise<ExperienceSummary> {
    return this.get<ExperienceSummary>('/v1/profiles/experience/summary')
  }

  /**
   * Save experience entries
   * Creates or updates multiple experience entries in bulk
   *
   * @param params - Experience data including entries and optional career level
   * @returns Success status with saved experience entries
   *
   * @example
   * ```typescript
   * const result = await client.experience.saveExperience({
   *   career_level: 'senior',
   *   experience_entries: [
   *     {
   *       job_title: 'Senior Developer',
   *       company_name: 'Acme Corp',
   *       is_remote: true,
   *       is_current: true,
   *       start_date: '2022-01-15',
   *       description: 'Full-stack development...'
   *     }
   *   ]
   * })
   * console.log(`Saved ${result.experience_entries.length} entries`)
   * ```
   */
  async saveExperience(params: SaveExperienceParams): Promise<SaveExperienceResponse> {
    return this.post<SaveExperienceResponse>('/v1/profiles/experience', params)
  }

  /**
   * Delete experience entry
   * Removes a single experience entry by ID
   *
   * @param params - Experience ID to delete
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.experience.deleteExperience({ experienceId: 'uuid-here' })
   * console.log('Experience entry deleted')
   * ```
   */
  async deleteExperience(params: DeleteExperienceParams): Promise<DeleteExperienceResponse> {
    return this.post<DeleteExperienceResponse>('/v1/profiles/experience/delete', params)
  }
}
