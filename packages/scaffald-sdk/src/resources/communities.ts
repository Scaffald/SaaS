import { Resource } from './base.js'

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  industry_id: string | null
  member_count: number
  post_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityWithMembership extends Community {
  is_member: boolean
  is_verified: boolean
}

export interface Membership {
  id: string
  community_id: string
  user_id: string
  joined_at: string
  is_verified: boolean
  verification_data: Record<string, unknown> | null
}

export interface CommunityMember {
  id: string
  display_name: string | null
  avatar_url: string | null
  headline: string | null
  is_verified: boolean
  joined_at: string
}

export interface JoinCommunityParams {
  license_state?: string
  license_number?: string
  license_type?: string
}

export interface CommunitiesListResponse {
  data: Community[]
}

export interface CommunityDetailResponse {
  data: CommunityWithMembership
}

export interface MembersListResponse {
  data: CommunityMember[]
  total: number
}

export interface MyCommunityItem {
  community_id: string
  community: Community
  joined_at: string
  is_verified: boolean
}

export interface MyCommunitiesResponse {
  data: MyCommunityItem[]
}

export class Communities extends Resource {
  async list(): Promise<CommunitiesListResponse> {
    return this.get<CommunitiesListResponse>('/v1/communities')
  }

  async getBySlug(slug: string): Promise<CommunityDetailResponse> {
    return this.get<CommunityDetailResponse>(`/v1/communities/${slug}`)
  }

  async join(communityId: string, params?: JoinCommunityParams): Promise<{ data: Membership }> {
    return this.post<{ data: Membership }>(`/v1/communities/${communityId}/join`, params || {})
  }

  async leave(communityId: string): Promise<void> {
    return this.del<void>(`/v1/communities/${communityId}/leave`)
  }

  async getMembers(
    communityId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<MembersListResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.offset !== undefined) qp.append('offset', params.offset.toString())
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<MembersListResponse>(`/v1/communities/${communityId}/members${query}`)
  }

  async myCommunities(): Promise<MyCommunitiesResponse> {
    return this.get<MyCommunitiesResponse>('/v1/communities/my')
  }
}
