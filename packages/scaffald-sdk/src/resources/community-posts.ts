import { Resource } from './base.js'

export type PostType = 'advice' | 'critique' | 'showcase'
export type PostStatus =
  | 'draft'
  | 'pending_moderation'
  | 'private'
  | 'published'
  | 'flagged'
  | 'removed'

export interface PostAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  headline: string | null
}

export interface CommunityPost {
  id: string
  community_id: string
  author_id: string
  post_type: PostType
  status: PostStatus
  title: string
  body: string
  media_urls: string[]
  media_thumbnails: string[]
  skill_tags: string[]
  upvote_count: number
  comment_count: number
  rating_avg: number | null
  rating_count: number
  is_published: boolean
  published_at: string | null
  moderation_result: string | null
  ai_feedback_summary: string | null
  created_at: string
  updated_at: string
  author?: PostAuthor
  has_upvoted?: boolean
  has_bookmarked?: boolean
}

export interface CreatePostParams {
  community_id: string
  post_type: PostType
  title: string
  body: string
  media_urls?: string[]
  media_thumbnails?: string[]
  skill_tags?: string[]
}

export interface UpdatePostParams {
  title?: string
  body?: string
  media_urls?: string[]
  media_thumbnails?: string[]
  skill_tags?: string[]
}

export interface FeedParams {
  limit?: number
  cursor?: string
  sort?: 'recent' | 'top_rated'
}

export interface FeedResponse {
  data: CommunityPost[]
  next_cursor: string | null
}

export interface PostDetailResponse {
  data: CommunityPost
}

export class CommunityPosts extends Resource {
  async getCommunityFeed(communityId: string, params?: FeedParams): Promise<FeedResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.cursor) qp.append('cursor', params.cursor)
    if (params?.sort) qp.append('sort', params.sort)
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<FeedResponse>(`/v1/communities/posts/feed/${communityId}${query}`)
  }

  async getPublishedFeed(params?: FeedParams): Promise<FeedResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.cursor) qp.append('cursor', params.cursor)
    if (params?.sort) qp.append('sort', params.sort)
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<FeedResponse>(`/v1/communities/posts/published${query}`)
  }

  async getUserPortfolio(
    userId: string,
    params?: { limit?: number; cursor?: string }
  ): Promise<FeedResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.cursor) qp.append('cursor', params.cursor)
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<FeedResponse>(`/v1/communities/posts/portfolio/${userId}${query}`)
  }

  async getPost(postId: string): Promise<PostDetailResponse> {
    return this.get<PostDetailResponse>(`/v1/communities/posts/${postId}`)
  }

  async create(params: CreatePostParams): Promise<{ data: CommunityPost }> {
    return this.post<{ data: CommunityPost }>('/v1/communities/posts', params)
  }

  async update(postId: string, params: UpdatePostParams): Promise<{ data: CommunityPost }> {
    return this.patch<{ data: CommunityPost }>(`/v1/communities/posts/${postId}`, params)
  }

  async submit(postId: string): Promise<{ data: CommunityPost }> {
    return this.post<{ data: CommunityPost }>(`/v1/communities/posts/${postId}/submit`, {})
  }

  async publish(postId: string): Promise<{ data: CommunityPost }> {
    return this.post<{ data: CommunityPost }>(`/v1/communities/posts/${postId}/publish`, {})
  }

  async unpublish(postId: string): Promise<{ data: CommunityPost }> {
    return this.post<{ data: CommunityPost }>(`/v1/communities/posts/${postId}/unpublish`, {})
  }

  async delete(postId: string): Promise<void> {
    return this.del<void>(`/v1/communities/posts/${postId}`)
  }
}
