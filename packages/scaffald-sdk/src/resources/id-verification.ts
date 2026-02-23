import { Resource } from './base.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IdVerificationPricingItem {
  id: string
  name: string
  description: string | null
  priceCents: number
  metadata: Record<string, unknown>
}

export interface RequestVerificationParams {
  workerUserId: string
  organizationId?: string
  pricingId?: string
}

export interface RequestVerificationResponse {
  paymentIntentId: string
  clientSecret: string
  amountCents: number
  currency: string
}

export interface ConfirmVerificationParams {
  paymentIntentId: string
}

export interface ConfirmVerificationResponse {
  id: string
  badgeStatus: string
  badgeExpiresAt: string | null
}

export type CurrentVerificationResponse =
  | {
      id: string
      verificationLevel: string | null
      badgeStatus: string | null
      badgeExpiresAt: string | null
      verifiedAt: string | null
    }
  | null

export interface VerificationStatusResponse {
  id: string
  badgeStatus: string | null
  badgeExpiresAt: string | null
  personaStatus: string | null
  verificationLevel: string | null
  verifiedAt: string | null
  metadata: Record<string, unknown>
}

export interface IdVerificationListItem {
  id: string
  workerUserId: string | null
  workerName: string
  workerEmail: string | null
  workerAvatarUrl: string | null
  organizationId: string | null
  organizationName: string | null
  initiatedByUserId: string | null
  initiatedByOrgId: string | null
  paymentIntentId: string | null
  priceCents: number
  paidAt: string | null
  badgeStatus: 'active' | 'expired' | 'revoked'
  rawBadgeStatus: string | null
  badgeExpiresAt: string | null
  verificationLevel: string | null
  personaStatus: string | null
  verifiedAt: string | null
  createdAt: string | null
  source: 'worker' | 'organization' | 'platform'
}

export interface ListVerificationsParams {
  limit?: number
  offset?: number
  search?: string
  status?: 'all' | 'active' | 'expired' | 'revoked'
  organizationId?: string
}

export interface ListVerificationsResponse {
  items: IdVerificationListItem[]
  total: number
  hasMore: boolean
  summary: { total: number; active: number; expired: number; revoked: number }
}

export interface RevokeVerificationParams {
  idVerificationId: string
  reason: string
}

// ============================================================================
// ID VERIFICATION RESOURCE
// ============================================================================

/**
 * ID Verification resource.
 * Requires supabaseToken (user JWT) for protected endpoints.
 * Office role required for list and revoke.
 */
export class IdVerification extends Resource {
  async getPricing(): Promise<IdVerificationPricingItem[]> {
    const res = await this.get<{ data: IdVerificationPricingItem[] }>('/v1/id-verification/pricing')
    return res.data ?? []
  }

  async requestVerification(params: RequestVerificationParams): Promise<RequestVerificationResponse> {
    const res = await this.post<{ data: RequestVerificationResponse }>('/v1/id-verification/request', params)
    return res.data
  }

  async confirmVerificationPayment(params: ConfirmVerificationParams): Promise<ConfirmVerificationResponse> {
    const res = await this.post<{ data: ConfirmVerificationResponse }>('/v1/id-verification/confirm', params)
    return res.data
  }

  async getVerificationStatus(idVerificationId: string): Promise<VerificationStatusResponse> {
    const res = await this.get<{ data: VerificationStatusResponse }>(
      '/v1/id-verification/status',
      { idVerificationId } as Record<string, string>
    )
    return res.data
  }

  async getCurrentVerification(workerUserId?: string): Promise<CurrentVerificationResponse> {
    const params = workerUserId ? { workerUserId } : undefined
    const res = await this.get<{ data: CurrentVerificationResponse }>(
      '/v1/id-verification/current',
      params as Record<string, string> | undefined
    )
    return res.data ?? null
  }

  async listVerifications(params?: ListVerificationsParams): Promise<ListVerificationsResponse> {
    const res = await this.get<{ data: ListVerificationsResponse }>(
      '/v1/id-verification/list',
      params as Record<string, unknown>
    )
    return res.data ?? { items: [], total: 0, hasMore: false, summary: { total: 0, active: 0, expired: 0, revoked: 0 } }
  }

  async revokeVerification(params: RevokeVerificationParams): Promise<{ revoked: boolean }> {
    const res = await this.post<{ data: { revoked: boolean } }>('/v1/id-verification/revoke', params)
    return res.data
  }
}
