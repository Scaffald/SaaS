import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export interface EmploymentStatus {
  isLinked: boolean
  experienceId: string | null
  source: string | null
  isCurrent: boolean
  claimedAt: string | null
  createdAt: string | null
}

export interface GetEmploymentStatusParams {
  organizationId: string
}

export interface ClaimEmploymentParams {
  organizationId: string
}

export interface ClaimEmploymentResponse {
  alreadyLinked?: boolean
  experience: {
    id: string
    source: string
    is_current: boolean
    claimed_at: string | null
    created_at: string
  }
}

export interface RemoveEmploymentParams {
  organizationId: string
}

export interface RemoveEmploymentResponse {
  success: boolean
}

export interface FollowStatus {
  isFollowing: boolean
  followedAt: string | null
}

export interface GetFollowStatusParams {
  organizationId: string
}

export interface FollowOrganizationParams {
  organizationId: string
}

export interface FollowOrganizationResponse {
  success: boolean
  followedAt: string
}

export interface UnfollowOrganizationParams {
  organizationId: string
}

export interface UnfollowOrganizationResponse {
  success: boolean
}

export interface Employer {
  id: string
  name: string
  description?: string | null
  website?: string | null
  logo_url?: string | null
  industry?: string | null
  size?: string | null
  location?: string | null
  created_at: string
  updated_at: string
}

export interface GetEmployersParams {
  search?: string
  industry?: string
  location?: string
  limit?: number
  offset?: number
}

export interface GetEmployersResponse {
  employers: Employer[]
  total: number
}

export interface GetEmployerByIdParams {
  id: string
}

// ============================================================================
// Employers Resource
// ============================================================================

/**
 * Employers Resource
 * Handles discovery and interaction with employer organizations
 */
export class Employers extends Resource {
  /**
   * Get list of employers with optional filtering
   */
  async list(params?: GetEmployersParams): Promise<GetEmployersResponse> {
    return this.get<GetEmployersResponse>('/v1/employers', params)
  }

  /**
   * Get employer by ID
   */
  async getById(params: GetEmployerByIdParams): Promise<Employer> {
    return this.get<Employer>(`/v1/employers/${params.id}`)
  }

  /**
   * Check if user has linked employment with an organization
   */
  async getEmploymentStatus(params: GetEmploymentStatusParams): Promise<EmploymentStatus> {
    return this.get<EmploymentStatus>('/v1/employers/employment/status', params)
  }

  /**
   * Link user to an organization via experience record
   */
  async claimEmployment(params: ClaimEmploymentParams): Promise<ClaimEmploymentResponse> {
    return this.post<ClaimEmploymentResponse>('/v1/employers/employment/claim', params)
  }

  /**
   * Remove user's employment link to an organization
   */
  async removeEmployment(params: RemoveEmploymentParams): Promise<RemoveEmploymentResponse> {
    return this.del<RemoveEmploymentResponse>(`/v1/employers/employment/${params.organizationId}`)
  }

  /**
   * Check if user is following an organization
   */
  async getFollowStatus(params: GetFollowStatusParams): Promise<FollowStatus> {
    return this.get<FollowStatus>('/v1/employers/follow/status', params)
  }

  /**
   * Follow an organization
   */
  async follow(params: FollowOrganizationParams): Promise<FollowOrganizationResponse> {
    return this.post<FollowOrganizationResponse>('/v1/employers/follow', params)
  }

  /**
   * Unfollow an organization
   */
  async unfollow(params: UnfollowOrganizationParams): Promise<UnfollowOrganizationResponse> {
    return this.del<UnfollowOrganizationResponse>(`/v1/employers/follow/${params.organizationId}`)
  }
}
