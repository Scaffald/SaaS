import { Resource } from './base.js'

/**
 * ProfileWidgets Resource
 *
 * Provides read-only endpoints for profile widget components.
 * These endpoints support viewing both own profile and other users' profiles.
 */

// ============================================================================
// GENERAL INFO
// ============================================================================

export interface GeneralInfoWidgetParams {
  userId?: string
}

export interface GeneralInfoWidgetResponse {
  id: string
  username: string | null
  slug: string | null
  avatar_path: string | null
  avatar_url: string | null
  about: string | null
  headline: string | null
  display_name: string | null
  industry_id: string | null
  years_of_experience: number | null
  open_to_work: boolean | null
  calculatedYearsOfExperience: number
  industries?: {
    id: string
    name: string
    slug: string
  } | null
  privateData?: {
    first_name: string | null
    last_name: string | null
    address: string | null
    location: string | null
    email?: string
    phone?: string
  } | null
  idVerificationBadge?: {
    badge_status: string | null
    badge_expires_at: string | null
    verified_at: string | null
  } | null
}

// ============================================================================
// EXPERIENCE
// ============================================================================

export interface ExperienceWidgetParams {
  userId?: string
}

export interface ExperienceWidgetEntry {
  id: string
  user_id: string
  job_title: string
  company_name: string
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  location: string | null
  employment_type: string | null
  is_remote: boolean | null
  description: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// EDUCATION
// ============================================================================

export interface EducationWidgetParams {
  userId?: string
}

export interface EducationWidgetEntry {
  id: string
  user_id: string
  degree_type: string | null
  field_of_study: string | null
  institution_name: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  description: string | null
  location: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// SKILLS
// ============================================================================

export interface SkillsWidgetParams {
  userId?: string
}

export interface SkillWidgetEntry {
  id: string
  taxonomy: 'csi' | 'onet'
  name: string
  label: string
  displayCode: string | null
  proficiency: number
  yearsExperience: number | null
  verified: boolean
  metadata: Record<string, unknown> | null
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export interface CertificationsWidgetParams {
  userId?: string
}

export interface CertificationWidgetEntry {
  id: string
  user_id: string
  name: string
  issuing_organization: string | null
  issue_date: string | null
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
  does_not_expire: boolean | null
  created_at: string
  updated_at: string
}

// ============================================================================
// PREFERENCES
// ============================================================================

export interface PreferencesWidgetResponse {
  availability?: string | null
  preferred_work_locations?: string[] | null
  open_to_travel?: boolean | null
  travel_distance_miles?: number | null
  career_level?: string | null
  hourly_rate_cents?: number | null
  us_resident?: boolean | null
  us_passport?: boolean | null
  authorized_countries?: string[] | null
  veteran?: boolean | null
  military_status?: string | null
  drivers_license_classes?: string[] | null
}

// ============================================================================
// RESOURCE CLASS
// ============================================================================

export class ProfileWidgets extends Resource {
  /**
   * Get general profile information for widget display
   * @param params - Optional userId to view another user's profile
   */
  async getGeneralInfo(params?: GeneralInfoWidgetParams): Promise<GeneralInfoWidgetResponse> {
    const queryParams = params?.userId ? { userId: params.userId } : undefined
    return this.get<GeneralInfoWidgetResponse>('/v1/profiles/widgets/general-info', queryParams)
  }

  /**
   * Get work experience for widget display
   * @param params - Optional userId to view another user's experience
   */
  async getExperience(params?: ExperienceWidgetParams): Promise<ExperienceWidgetEntry[]> {
    const queryParams = params?.userId ? { userId: params.userId } : undefined
    return this.get<ExperienceWidgetEntry[]>('/v1/profiles/widgets/experience', queryParams)
  }

  /**
   * Get education for widget display
   * @param params - Optional userId to view another user's education
   */
  async getEducation(params?: EducationWidgetParams): Promise<EducationWidgetEntry[]> {
    const queryParams = params?.userId ? { userId: params.userId } : undefined
    return this.get<EducationWidgetEntry[]>('/v1/profiles/widgets/education', queryParams)
  }

  /**
   * Get technical skills for widget display
   * Excludes soft skills (only returns CSI and O*NET skills)
   * @param params - Optional userId to view another user's skills
   */
  async getSkills(params?: SkillsWidgetParams): Promise<SkillWidgetEntry[]> {
    const queryParams = params?.userId ? { userId: params.userId } : undefined
    return this.get<SkillWidgetEntry[]>('/v1/profiles/widgets/skills', queryParams)
  }

  /**
   * Get certifications for widget display
   * @param params - Optional userId to view another user's certifications
   */
  async getCertifications(params?: CertificationsWidgetParams): Promise<CertificationWidgetEntry[]> {
    const queryParams = params?.userId ? { userId: params.userId } : undefined
    return this.get<CertificationWidgetEntry[]>('/v1/profiles/widgets/certifications', queryParams)
  }

  /**
   * Get work preferences for widget display
   * Only returns data for authenticated user's own profile
   */
  async getPreferences(): Promise<PreferencesWidgetResponse> {
    return this.get<PreferencesWidgetResponse>('/v1/profiles/widgets/preferences')
  }
}
