import { Resource } from './base.js'

export interface CommentAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string
  parent_comment_id: string | null
  body: string
  is_pinned: boolean
  upvote_count: number
  created_at: string
  updated_at: string
  author?: CommentAuthor
  has_upvoted?: boolean
}

export interface CreateCommentParams {
  body: string
  parent_comment_id?: string
}

export interface CommentsListResponse {
  data: CommunityComment[]
  total: number
}

export class CommunityComments extends Resource {
  async list(
    postId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<CommentsListResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.offset !== undefined) qp.append('offset', params.offset.toString())
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<CommentsListResponse>(`/v1/communities/comments/${postId}${query}`)
  }

  async create(postId: string, params: CreateCommentParams): Promise<{ data: CommunityComment }> {
    return this.post<{ data: CommunityComment }>(`/v1/communities/comments/${postId}`, params)
  }

  async edit(commentId: string, body: string): Promise<{ data: CommunityComment }> {
    return this.patch<{ data: CommunityComment }>(
      `/v1/communities/comments/edit/${commentId}`,
      { body }
    )
  }

  async delete(commentId: string): Promise<void> {
    return this.del<void>(`/v1/communities/comments/${commentId}`)
  }

  async pin(commentId: string): Promise<{ data: CommunityComment }> {
    return this.post<{ data: CommunityComment }>(
      `/v1/communities/comments/pin/${commentId}`,
      {}
    )
  }

  async unpin(commentId: string): Promise<void> {
    return this.del<void>(`/v1/communities/comments/pin/${commentId}`)
  }
}
