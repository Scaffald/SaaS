import { Resource } from './base.js'

export interface Follow {
  id: string
  follower_id: string
  follower_type: 'user'
  followee_id: string
  followee_type: 'user' | 'organization' | 'job'
  created_at: string
  follower?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  followee?: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface FollowUserParams {
  targetUserId: string
}

export interface FollowsListResponse {
  data: Follow[]
  total: number
}

export interface FollowStatusResponse {
  isFollowing: boolean
  followId?: string
}

export class Follows extends Resource {
  /**
   * Get users that the current user is following
   */
  async getFollowing(params?: { limit?: number; offset?: number }): Promise<FollowsListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.get<FollowsListResponse>(`/v1/follows/following${query}`)
  }

  /**
   * Get users following the current user
   */
  async getFollowers(params?: { limit?: number; offset?: number }): Promise<FollowsListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.get<FollowsListResponse>(`/v1/follows/followers${query}`)
  }

  /**
   * Check if current user is following another user
   */
  async getStatus(userId: string): Promise<FollowStatusResponse> {
    return this.get<FollowStatusResponse>(`/v1/follows/status/${userId}`)
  }

  /**
   * Follow a user
   */
  async followUser(params: FollowUserParams): Promise<Follow> {
    return this.post<Follow>('/v1/follows/user', params)
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    return this.del<void>(`/v1/follows/user/${userId}`)
  }
}
