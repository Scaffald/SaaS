import { Resource } from './base.js'

export interface SuccessFeeSchedule {
  paymentSchedule: 'standard' | 'short'
  upfrontPercentage: number
  finalPercentage: number
  upfrontAmountCents: number
  finalAmountCents: number
  finalPaymentDueDate: string | null
}

export interface SuccessFeeStatus {
  successFeeId: string
  status: 'pending' | 'upfront_paid' | 'completed' | 'failed' | 'cancelled'
  schedule: SuccessFeeSchedule
  upfrontPaidAt: string | null
  upfrontPaymentIntentId: string | null
  finalPaymentIntentId: string | null
  createdAt: string
}

export interface CreateSuccessFeeParams {
  totalHireValueCents: number
  jobDurationDays: number
  hireStartDate: string
  organizationId: string
  workerUserId: string
  jobId?: string
  applicationId?: string
}

export interface CreateSuccessFeeResponse {
  successFeeId: string
  clientSecret: string | null
  paymentIntentId: string | null
  schedule: SuccessFeeSchedule
  status: 'pending' | 'upfront_paid' | 'completed' | 'failed' | 'cancelled'
  upfrontPaidAt: string | null
}

export interface GetStatusByApplicationParams {
  organizationId: string
  applicationId: string
  workerUserId: string
}

export interface ConfirmUpfrontPaymentParams {
  successFeeId: string
  paymentIntentId: string
}

export class SuccessFees extends Resource {
  /**
   * Get success fee status for a specific application.
   * Returns null if no success fee exists yet.
   */
  async getStatus(params: GetStatusByApplicationParams): Promise<SuccessFeeStatus | null> {
    return this.get<SuccessFeeStatus | null>('/v1/success-fees/status', params)
  }

  /**
   * Create or resume a success fee with an upfront Stripe payment intent.
   */
  async create(params: CreateSuccessFeeParams): Promise<CreateSuccessFeeResponse> {
    return this.post<CreateSuccessFeeResponse>('/v1/success-fees', params)
  }

  /**
   * Confirm upfront payment has succeeded and finalize the hire.
   */
  async confirmUpfront(params: ConfirmUpfrontPaymentParams): Promise<{ ok: true }> {
    return this.post<{ ok: true }>(`/v1/success-fees/${params.successFeeId}/confirm-upfront`, {
      paymentIntentId: params.paymentIntentId,
    })
  }
}
