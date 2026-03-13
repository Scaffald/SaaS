import { Resource } from './base.js'

export interface PostRating {
  id: string
  post_id: string
  rater_id: string
  base_rating: number
  quality_rating: number | null
  technique_rating: number | null
  creativity_rating: number | null
  created_at: string
  rater?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreateRatingParams {
  base_rating: number
  quality_rating?: number
  technique_rating?: number
  creativity_rating?: number
}

export interface RatingSummary {
  rating_avg: number | null
  rating_count: number
  quality_avg: number | null
  technique_avg: number | null
  creativity_avg: number | null
  distribution: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5': number
  }
}

export class CommunityRatings extends Resource {
  async rate(postId: string, params: CreateRatingParams): Promise<{ data: PostRating }> {
    return this.post<{ data: PostRating }>(`/v1/communities/ratings/${postId}`, params)
  }

  async list(postId: string): Promise<{ data: PostRating[] }> {
    return this.get<{ data: PostRating[] }>(`/v1/communities/ratings/${postId}`)
  }

  async getSummary(postId: string): Promise<{ data: RatingSummary }> {
    return this.get<{ data: RatingSummary }>(`/v1/communities/ratings/summary/${postId}`)
  }
}
