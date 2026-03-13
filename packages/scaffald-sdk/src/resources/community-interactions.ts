import { Resource } from './base.js'

export interface UpvoteParams {
  target_type: 'post' | 'comment'
  target_id: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface BookmarksListResponse {
  data: any[]
  next_cursor: string | null
}

export class CommunityInteractions extends Resource {
  async upvote(params: UpvoteParams): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/v1/communities/interactions/upvote', params)
  }

  async removeUpvote(targetType: 'post' | 'comment', targetId: string): Promise<void> {
    return this.del<void>(`/v1/communities/interactions/upvote/${targetType}/${targetId}`)
  }

  async bookmark(postId: string): Promise<{ data: Bookmark }> {
    return this.post<{ data: Bookmark }>(`/v1/communities/interactions/bookmark/${postId}`, {})
  }

  async removeBookmark(postId: string): Promise<void> {
    return this.del<void>(`/v1/communities/interactions/bookmark/${postId}`)
  }

  async listBookmarks(params?: {
    limit?: number
    cursor?: string
  }): Promise<BookmarksListResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.cursor) qp.append('cursor', params.cursor)
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<BookmarksListResponse>(`/v1/communities/interactions/bookmarks${query}`)
  }
}
