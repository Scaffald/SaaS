import { Resource } from './base.js'

export interface UserProfile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  years_experience?: number
  current_position?: string
  skills?: string[]
  certifications?: Certification[]
  created_at: string
}

export interface Certification {
  name: string
  issuer?: string
  issued_at?: string
}

export interface OrganizationProfile {
  id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  location?: string
  founded_year?: number
  created_at: string
  job_count: number
}

export interface EmployerProfile {
  id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  location?: string
  created_at: string
  active_jobs_count: number
}

// ===========================
// Profile Management Types
// ===========================

export interface CurrentUser {
  id: string
  email: string
}

export interface Address {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
}

export interface GeneralInfo {
  first_name: string
  last_name: string
  avatar_path: string
  email: string
  phone: string
  about: unknown | null
  address: Address | null
}

export interface UpdateGeneralInfoParams {
  first_name?: string
  last_name?: string
  avatar_path?: string
  about?: unknown | null
  address?: Address | null
  phone?: string
}

export interface ProfileBySlug {
  id: string
  username: string
  slug: string
  avatar_path?: string
  avatar_url?: string
  about?: unknown
  headline?: string
  display_name?: string
  industry_id?: string
  years_of_experience?: number
  open_to_work?: boolean
  industries?: {
    id: string
    name: string
    slug: string
  }
  visibility: {
    work_experience: boolean
    education: boolean
    skills: boolean
    certifications: boolean
    reviews: boolean
    contact_info: boolean
  }
}

export interface SlugAvailability {
  available: boolean
  suggestions: string[]
}

export interface UpdateSlugResponse {
  success: boolean
  slug: string
  nextChangeAllowed: string
}

export interface SlugHistoryEntry {
  old_slug: string | null
  new_slug: string
  changed_at: string
}

export interface SlugHistory {
  history: SlugHistoryEntry[]
  nextChangeAllowed: string | null
  daysRemaining: number | null
}

export interface UploadAvatarParams {
  file: string // base64 encoded file with data URL prefix
  fileName: string
  contentType: string
}

export interface UploadAvatarResponse {
  success: boolean
  avatarPath: string
}

export class Profiles extends Resource {
  /**
   * Get a user profile by username
   */
  async getUser(username: string): Promise<UserProfile> {
    return this.get<UserProfile>(`/v1/profiles/${username}`)
  }

  /**
   * Get an organization profile by slug
   */
  async getOrganization(slug: string): Promise<OrganizationProfile> {
    return this.get<OrganizationProfile>(`/v1/profiles/organizations/${slug}`)
  }

  /**
   * Get an employer profile by slug
   */
  async getEmployer(slug: string): Promise<EmployerProfile> {
    return this.get<EmployerProfile>(`/v1/profiles/employers/${slug}`)
  }

  // ===== Profile Management - General =====

  /**
   * Get current authenticated user info
   * Returns the authenticated user's ID and email
   *
   * @returns Current user information
   *
   * @example
   * ```typescript
   * const user = await client.profiles.getCurrentUser()
   * console.log(`Logged in as: ${user.email}`)
   * ```
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return this.get<CurrentUser>('/v1/profiles/current')
  }

  /**
   * Get general profile information
   * Returns user's basic profile data including name, email, phone, about, and address
   *
   * @returns General profile information
   *
   * @example
   * ```typescript
   * const profile = await client.profiles.getGeneralInfo()
   * console.log(`${profile.first_name} ${profile.last_name}`)
   * ```
   */
  async getGeneralInfo(): Promise<GeneralInfo> {
    return this.get<GeneralInfo>('/v1/profiles/general')
  }

  /**
   * Update general profile information
   * Updates user's basic profile data in users and private profile tables
   *
   * @param params - Profile update parameters
   * @returns Success status
   *
   * @example
   * ```typescript
   * await client.profiles.updateGeneralInfo({
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   phone: '+1-555-0123',
   *   about: { type: 'doc', content: [...] }
   * })
   * ```
   */
  async updateGeneralInfo(params: UpdateGeneralInfoParams): Promise<{ success: boolean }> {
    return this.patch<{ success: boolean }>('/v1/profiles/general', params)
  }

  // ===== Profile Management - Vanity URL =====

  /**
   * Get profile by slug (public endpoint, no auth required)
   * Returns public profile data for vanity URL access
   *
   * @param slug - The profile slug
   * @returns Public profile information
   *
   * @example
   * ```typescript
   * const profile = await client.profiles.getProfileBySlug('john-doe')
   * console.log(profile.display_name)
   * ```
   */
  async getProfileBySlug(slug: string): Promise<ProfileBySlug> {
    return this.get<ProfileBySlug>(`/v1/profiles/slug/${slug}`)
  }

  /**
   * Check if a slug is available
   * Public endpoint for real-time availability checking
   *
   * @param slug - The slug to check
   * @returns Availability status and suggestions if unavailable
   *
   * @example
   * ```typescript
   * const { available, suggestions } = await client.profiles.checkSlugAvailability('john-doe')
   * if (!available) {
   *   console.log('Try these instead:', suggestions)
   * }
   * ```
   */
  async checkSlugAvailability(slug: string): Promise<SlugAvailability> {
    return this.get<SlugAvailability>('/v1/profiles/slug/check', { slug })
  }

  /**
   * Update user's slug
   * Enforces 30-day cooldown between changes
   *
   * @param slug - The new slug
   * @returns Success status with next allowed change date
   *
   * @example
   * ```typescript
   * try {
   *   const result = await client.profiles.updateSlug('john-doe-dev')
   *   console.log(`Slug updated! Next change allowed: ${result.nextChangeAllowed}`)
   * } catch (error) {
   *   // Handle cooldown or conflict errors
   * }
   * ```
   */
  async updateSlug(slug: string): Promise<UpdateSlugResponse> {
    return this.patch<UpdateSlugResponse>('/v1/profiles/slug', { slug })
  }

  /**
   * Get slug change history
   * Returns history of slug changes and next allowed change date
   *
   * @returns Slug change history
   *
   * @example
   * ```typescript
   * const { history, daysRemaining } = await client.profiles.getSlugHistory()
   * if (daysRemaining) {
   *   console.log(`Can change slug again in ${daysRemaining} days`)
   * }
   * ```
   */
  async getSlugHistory(): Promise<SlugHistory> {
    return this.get<SlugHistory>('/v1/profiles/slug/history')
  }

  // ===== Profile Management - Avatar =====

  /**
   * Upload avatar image
   * Handles avatar file upload to storage and updates profile
   *
   * @param params - Avatar upload parameters
   * @returns Upload success with avatar path
   *
   * @example
   * ```typescript
   * // Assuming you have a base64 encoded image
   * const result = await client.profiles.uploadAvatar({
   *   file: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
   *   fileName: 'avatar.jpg',
   *   contentType: 'image/jpeg'
   * })
   * console.log(`Avatar uploaded: ${result.avatarPath}`)
   * ```
   */
  async uploadAvatar(params: UploadAvatarParams): Promise<UploadAvatarResponse> {
    return this.post<UploadAvatarResponse>('/v1/profiles/avatar', params)
  }
}
