import { Resource } from './base.js'

export interface PendingVerification {
  membership_id: string
  community_id: string
  community_name: string
  user_id: string
  display_name: string | null
  email: string | null
  verification_data: {
    state: string
    license_number: string
    license_type: string
    submitted_at: string
    status: string
  }
  joined_at: string
}

export interface VerificationQueueParams {
  community_id?: string
  limit?: number
  offset?: number
}

export class OfficeCommunities extends Resource {
  async getVerificationQueue(
    params?: VerificationQueueParams
  ): Promise<{ data: PendingVerification[]; total: number }> {
    const qp = new URLSearchParams()
    if (params?.community_id) qp.append('community_id', params.community_id)
    if (params?.limit !== undefined) qp.append('limit', params.limit.toString())
    if (params?.offset !== undefined) qp.append('offset', params.offset.toString())
    const query = qp.toString() ? `?${qp.toString()}` : ''
    return this.get<{ data: PendingVerification[]; total: number }>(
      `/v1/office/communities/verification-queue${query}`
    )
  }

  async approveVerification(
    membershipId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.patch<{ success: boolean; message: string }>(
      `/v1/office/communities/verify/${membershipId}`,
      {}
    )
  }

  async rejectVerification(
    membershipId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.patch<{ success: boolean; message: string }>(
      `/v1/office/communities/reject/${membershipId}`,
      { reason }
    )
  }
}
