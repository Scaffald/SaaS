import { Resource } from './base'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EmploymentPreferences {
  preferred_work_locations: string[]
  open_to_travel: boolean
  travel_distance_miles: number
  us_resident: boolean
  authorized_countries: string[]
  us_passport: boolean
  drivers_license_classes: string[]
  military_status: string[]
  availability: string[]
  hourly_rate: number
}

export interface UpdateEmploymentParams {
  preferred_work_locations?: string[]
  open_to_travel?: boolean
  travel_distance_miles?: number
  us_resident?: boolean
  authorized_countries?: string[]
  us_passport?: boolean
  drivers_license_classes?: string[]
  military_status?: string[]
  availability?: string[]
  hourly_rate?: number
}

export interface UpdateEmploymentResponse {
  success: boolean
}

// ============================================================================
// EMPLOYMENT RESOURCE
// ============================================================================

export class Employment extends Resource {
  /**
   * Get employment preferences
   * Returns user's employment preferences and work status
   *
   * @returns Employment preferences
   *
   * @example
   * ```typescript
   * const prefs = await client.employment.getEmployment()
   * console.log(`Open to travel: ${prefs.open_to_travel}`)
   * console.log(`Hourly rate: $${prefs.hourly_rate}`)
   * ```
   */
  async getEmployment(): Promise<EmploymentPreferences> {
    return this.get<EmploymentPreferences>('/v1/profiles/employment')
  }

  /**
   * Update employment preferences
   * Updates user's employment preferences in profile
   *
   * @param params - Employment preference updates (all fields optional)
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.employment.updateEmployment({
   *   open_to_travel: true,
   *   travel_distance_miles: 50,
   *   hourly_rate: 75,
   *   preferred_work_locations: ['New York, NY', 'Remote'],
   *   availability: ['full-time', 'contract']
   * })
   * console.log('Employment preferences updated')
   * ```
   */
  async updateEmployment(params: UpdateEmploymentParams): Promise<UpdateEmploymentResponse> {
    return this.patch<UpdateEmploymentResponse>('/v1/profiles/employment', params)
  }
}
