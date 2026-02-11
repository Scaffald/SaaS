import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Lightweight user profile preview for map/card views
 */
export interface UserProfilePreview {
  id: string
  displayName: string
  avatarUrl: string | null
  avatarPath: string | null
  headline: string | null
  location: string | null
  topSkills: Array<{
    proficiency: number
    taxonomy: string | null
    csiSkillId: string | null
    onetOccupationId: string | null
  }>
}

/**
 * Comprehensive user profile for detailed views
 */
export interface UserProfileDetailed {
  id: string
  name: string | null
  avatar_url: string | null
  headline: string | null
  bio: string | null
  industry_name: string | null
  years_of_experience: number | null
  gamified_score: number | null
  location: string | null
  availability: string | null
  certifications: unknown[] | null
  hourly_rate_cents: number | null
  open_to_travel: boolean | null
  travel_mileage: number | null
  open_to_work: boolean | null
  education_level: string | null
}

/**
 * User skill with enrichment data
 */
export interface UserSkill {
  id: string
  skill_taxonomy: string
  csi_skill_id: string | null
  onet_occupation_id: string | null
  proficiency_level: number
  years_experience: number | null
  verified: boolean
  notes: string | null
  created_at: string
  skill_details: {
    name: string
    display_code: string | null
    hierarchy_level: number | null
    code: string | null
  } | null
}

/**
 * User certification
 */
export interface UserCertification {
  id: string
  certification_id: string
  user_id: string
  issue_date: string | null
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
  created_at: string
  certification: {
    id: string
    name: string
    issuing_organization: string | null
    depth: number
    parent_id: string | null
  } | null
}

/**
 * User work experience
 */
export interface UserExperience {
  id: string
  user_id: string
  job_title: string
  company_name: string
  location: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * User education
 */
export interface UserEducation {
  id: string
  user_id: string
  school_name: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  gpa: number | null
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Reviews summary with aggregated metrics
 */
export interface ReviewsSummary {
  totalReviews: number
  averageRating: number
  categoryBreakdown: {
    reliability: number
    collaboration: number
    professionalism: number
    technical: number
  }
  recentReviews: Array<{
    id: string
    reviewer_name: string
    rating: number
    comment: string | null
    created_at: string
  }>
  strengths: string[]
  improvements: string[]
}

/**
 * User contact information (gated by success fee)
 */
export interface ContactInfo {
  email: string | null
  phone_number: string | null
  preferred_contact_method: string | null
  accessible: boolean
  reason?: 'not_hired' | 'no_success_fee' | 'available'
}

/**
 * Parameters for getting user profile preview
 */
export interface GetPreviewParams {
  userId: string
}

/**
 * Parameters for getting user profile
 */
export interface GetUserProfileParams {
  userId: string
}

/**
 * Parameters for getting user skills
 */
export interface GetUserSkillsParams {
  userId: string
}

/**
 * Parameters for getting user certifications
 */
export interface GetUserCertificationsParams {
  userId: string
}

/**
 * Parameters for getting user experience
 */
export interface GetUserExperienceParams {
  userId: string
}

/**
 * Parameters for getting user education
 */
export interface GetUserEducationParams {
  userId: string
}

/**
 * Parameters for getting reviews summary
 */
export interface GetReviewsSummaryParams {
  userId: string
}

/**
 * Parameters for getting contact info
 */
export interface GetContactInfoParams {
  userId: string
  applicationId?: string
}

// ============================================================================
// RESOURCE CLASS
// ============================================================================

/**
 * User Profiles resource for accessing comprehensive user profile data
 * Used for discovery, search, and detailed profile views
 *
 * @remarks
 * All methods require authentication (OAuth token)
 * Contact information access is gated by success fee payment
 */
export class UserProfiles extends Resource {
  /**
   * Get lightweight user profile preview
   * Optimized for map views and quick cards
   *
   * @param params - User ID to fetch preview for
   * @returns Lightweight profile preview with top skills
   *
   * @example
   * ```typescript
   * const preview = await client.userProfiles.getPreview({ userId: 'user_123' })
   * console.log(preview.displayName)
   * console.log(preview.location)
   * console.log(preview.topSkills.length)
   * ```
   */
  async getPreview(params: GetPreviewParams): Promise<UserProfilePreview> {
    return this.get<UserProfilePreview>(`/v1/user-profiles/${params.userId}/preview`)
  }

  /**
   * Get comprehensive user profile
   * Includes all public profile data for detailed views
   *
   * @param params - User ID to fetch profile for
   * @returns Detailed user profile
   *
   * @example
   * ```typescript
   * const profile = await client.userProfiles.getUserProfile({ userId: 'user_123' })
   * console.log(profile.bio)
   * console.log(profile.years_of_experience)
   * console.log(profile.hourly_rate_cents)
   * ```
   */
  async getUserProfile(params: GetUserProfileParams): Promise<UserProfileDetailed> {
    return this.get<UserProfileDetailed>(`/v1/user-profiles/${params.userId}`)
  }

  /**
   * Get user's skills with enrichment data
   * Includes skill details from CSI/ONET taxonomies
   *
   * @param params - User ID to fetch skills for
   * @returns Array of enriched user skills
   *
   * @example
   * ```typescript
   * const skills = await client.userProfiles.getUserSkills({ userId: 'user_123' })
   * for (const skill of skills) {
   *   console.log(`${skill.skill_details?.name}: ${skill.proficiency_level}/5`)
   * }
   * ```
   */
  async getUserSkills(params: GetUserSkillsParams): Promise<UserSkill[]> {
    return this.get<UserSkill[]>(`/v1/user-profiles/${params.userId}/skills`)
  }

  /**
   * Get user's certifications
   * Includes certification details and expiration tracking
   *
   * @param params - User ID to fetch certifications for
   * @returns Array of user certifications
   *
   * @example
   * ```typescript
   * const certs = await client.userProfiles.getUserCertifications({ userId: 'user_123' })
   * const active = certs.filter(c => !c.expiration_date || new Date(c.expiration_date) > new Date())
   * ```
   */
  async getUserCertifications(params: GetUserCertificationsParams): Promise<UserCertification[]> {
    return this.get<UserCertification[]>(`/v1/user-profiles/${params.userId}/certifications`)
  }

  /**
   * Get user's work experience
   * Includes current and past positions
   *
   * @param params - User ID to fetch experience for
   * @returns Array of work experience entries
   *
   * @example
   * ```typescript
   * const experience = await client.userProfiles.getUserExperience({ userId: 'user_123' })
   * const currentJob = experience.find(exp => exp.is_current)
   * ```
   */
  async getUserExperience(params: GetUserExperienceParams): Promise<UserExperience[]> {
    return this.get<UserExperience[]>(`/v1/user-profiles/${params.userId}/experience`)
  }

  /**
   * Get user's education history
   * Includes degrees and ongoing education
   *
   * @param params - User ID to fetch education for
   * @returns Array of education entries
   *
   * @example
   * ```typescript
   * const education = await client.userProfiles.getUserEducation({ userId: 'user_123' })
   * const degrees = education.filter(ed => ed.degree)
   * ```
   */
  async getUserEducation(params: GetUserEducationParams): Promise<UserEducation[]> {
    return this.get<UserEducation[]>(`/v1/user-profiles/${params.userId}/education`)
  }

  /**
   * Get user's reviews summary
   * Aggregated review metrics and recent feedback
   *
   * @param params - User ID to fetch reviews for
   * @returns Reviews summary with ratings and feedback
   *
   * @example
   * ```typescript
   * const summary = await client.userProfiles.getReviewsSummary({ userId: 'user_123' })
   * console.log(`${summary.totalReviews} reviews, ${summary.averageRating}/5 stars`)
   * console.log(`Strengths: ${summary.strengths.join(', ')}`)
   * ```
   */
  async getReviewsSummary(params: GetReviewsSummaryParams): Promise<ReviewsSummary> {
    return this.get<ReviewsSummary>(`/v1/user-profiles/${params.userId}/reviews-summary`)
  }

  /**
   * Get user's contact information
   * Access is gated by success fee payment
   *
   * @param params - User ID and optional application ID
   * @returns Contact information if accessible
   *
   * @remarks
   * Contact info is only accessible after paying success fee for hiring
   * Returns accessibility status and reason if not available
   *
   * @example
   * ```typescript
   * const contact = await client.userProfiles.getContactInfo({
   *   userId: 'user_123',
   *   applicationId: 'app_456'
   * })
   * if (contact.accessible) {
   *   console.log(`Email: ${contact.email}`)
   *   console.log(`Phone: ${contact.phone_number}`)
   * } else {
   *   console.log(`Not accessible: ${contact.reason}`)
   * }
   * ```
   */
  async getContactInfo(params: GetContactInfoParams): Promise<ContactInfo> {
    return this.get<ContactInfo>(
      `/v1/user-profiles/${params.userId}/contact-info`,
      params.applicationId ? { applicationId: params.applicationId } : undefined
    )
  }
}
