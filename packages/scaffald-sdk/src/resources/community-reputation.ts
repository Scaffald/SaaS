import { Resource } from './base.js'

export interface ScaffoldScore {
  user_id: string
  score: number
  karma_bank: number
  total_earned: number
  total_spent: number
  updated_at: string
}

export interface ReputationEvent {
  id: string
  action: string
  delta: number
  reason: string | null
  source_type: string | null
  source_id: string | null
  created_at: string
}

export interface GiftKarmaParams {
  receiver_id: string
  amount: number
  message?: string
}

export interface ReputationHistoryResponse {
  data: ReputationEvent[]
  total: number
}

export class CommunityReputation extends Resource {
  async getMyScore(): Promise<{ data: ScaffoldScore }> {
    return this.get<{ data: ScaffoldScore }>('/v1/communities/reputation/me')
  }

  async getUserScore(userId: string): Promise<{ data: { user_id: string; score: number } }> {
    return this.get<{ data: { user_id: string; score: number } }>(
      `/v1/communities/reputation/user/${userId}`
    )
  }

  async getHistory(params?: {
    limit?: number
    offset?: number
  }): Promise<ReputationHistoryResponse> {
    const qp = new URLSearchParams()
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.offset !== undefined) qp.append('offset', params.offset.toString())
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<ReputationHistoryResponse>(`/v1/communities/reputation/history${query}`)
  }

  async giftKarma(params: GiftKarmaParams): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(
      '/v1/communities/reputation/gift-karma',
      params
    )
  }
}
