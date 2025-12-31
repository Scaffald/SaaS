import { BaseResource } from './base.js'

/**
 * User certification
 */
export interface UserCertification {
  name: string
  issuer: string | null
  issued_at: string | null
}

/**
 * Public user profile
 */
export interface PublicProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  github_url: string | null
  years_experience: number | null
  current_position: string | null
  skills: string[]
  certifications: UserCertification[]
  created_at: string
}

/**
 * Organization profile
 */
export interface OrganizationProfile {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  size: string | null
  location: string | null
  founded_year: number | null
  created_at: string
  job_count: number
}

/**
 * Employer profile
 */
export interface EmployerProfile {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  location: string | null
  created_at: string
  active_jobs_count: number
}

/**
 * Profile response
 */
export interface ProfileResponse {
  data: PublicProfile
}

/**
 * Organization response
 */
export interface OrganizationResponse {
  data: OrganizationProfile
}

/**
 * Employer response
 */
export interface EmployerResponse {
  data: EmployerProfile
}

/**
 * Profiles resource
 * All endpoints are rate-limited to 100 requests per 15 minutes
 */
export class ProfilesResource extends BaseResource {
  /**
   * Get public user profile by username
   *
   * @example
   * ```typescript
   * const profile = await client.profiles.getUser('johndoe')
   * console.log(profile.data.skills)
   * ```
   */
  async getUser(username: string): Promise<ProfileResponse> {
    return this.client.get<ProfileResponse>(`/v1/profiles/${username}`)
  }

  /**
   * Get organization profile by slug
   *
   * @example
   * ```typescript
   * const org = await client.profiles.getOrganization('acme-corp')
   * console.log(`${org.data.name} has ${org.data.job_count} jobs`)
   * ```
   */
  async getOrganization(slug: string): Promise<OrganizationResponse> {
    return this.client.get<OrganizationResponse>(`/v1/profiles/organizations/${slug}`)
  }

  /**
   * Get employer profile by slug
   *
   * @example
   * ```typescript
   * const employer = await client.profiles.getEmployer('tech-startup')
   * console.log(`${employer.data.active_jobs_count} active jobs`)
   * ```
   */
  async getEmployer(slug: string): Promise<EmployerResponse> {
    return this.client.get<EmployerResponse>(`/v1/profiles/employers/${slug}`)
  }
}
