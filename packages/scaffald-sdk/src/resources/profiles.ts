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
}
