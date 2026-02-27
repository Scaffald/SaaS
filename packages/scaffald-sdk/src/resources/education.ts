import { Resource } from './base'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EducationEntry {
  id?: string
  user_id?: string
  university_id?: string | null
  institution_name: string
  is_verified?: boolean
  degree_type?: string | null
  custom_degree_type?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  expected_graduation_date?: string | null
  is_current?: boolean
  gpa?: number | null
  description?: string | null
  location?: string | null
  created_at?: string
  updated_at?: string
}

export interface EducationLevel {
  education_level: string | null
}

export interface SaveEducationParams {
  education_level?: string | null
  education_entries: EducationEntry[]
}

export interface SaveEducationResponse {
  success: boolean
  education_entries: EducationEntry[]
}

export interface DeleteEducationParams {
  educationId: string
}

export interface DeleteEducationResponse {
  success: boolean
}

// ============================================================================
// EDUCATION RESOURCE
// ============================================================================

export class Education extends Resource {
  /**
   * Get user's education entries
   * Returns all education entries for the authenticated user
   *
   * @returns Array of education entries
   *
   * @example
   * ```typescript
   * const entries = await client.education.getEducation()
   * console.log(`${entries.length} education entries found`)
   * ```
   */
  async getEducation(): Promise<EducationEntry[]> {
    return this.get<EducationEntry[]>('/v1/profiles/education')
  }

  /**
   * Get education level
   * Returns education level information from profile
   *
   * @returns Education level
   *
   * @example
   * ```typescript
   * const level = await client.education.getEducationLevel()
   * console.log(`Education level: ${level.education_level}`)
   * ```
   */
  async getEducationLevel(): Promise<EducationLevel> {
    return this.get<EducationLevel>('/v1/profiles/education/level')
  }

  /**
   * Save education entries
   * Creates or updates multiple education entries in bulk
   *
   * @param params - Education data including entries and optional education level
   * @returns Success status with saved education entries
   *
   * @example
   * ```typescript
   * const result = await client.education.saveEducation({
   *   education_level: 'bachelor',
   *   education_entries: [
   *     {
   *       institution_name: 'University of Example',
   *       degree_type: 'Bachelor of Science',
   *       field_of_study: 'Computer Science',
   *       start_date: '2018-09-01',
   *       end_date: '2022-05-15',
   *       is_current: false,
   *       gpa: 3.8
   *     }
   *   ]
   * })
   * console.log(`Saved ${result.education_entries.length} entries`)
   * ```
   */
  async saveEducation(params: SaveEducationParams): Promise<SaveEducationResponse> {
    return this.post<SaveEducationResponse>('/v1/profiles/education', params)
  }

  /**
   * Delete education entry
   * Removes a single education entry by ID
   *
   * @param params - Education ID to delete
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.education.deleteEducation({ educationId: 'uuid-here' })
   * console.log('Education entry deleted')
   * ```
   */
  async deleteEducation(params: DeleteEducationParams): Promise<DeleteEducationResponse> {
    return this.post<DeleteEducationResponse>('/v1/profiles/education/delete', params)
  }
}
