import { Resource } from './base.js'

export interface ViolationReport {
  id: string
  status: 'pending' | 'under_review' | 'confirmed' | 'dismissed' | 'resolved'
  violationType: 'off_platform_hire' | 'off_platform_communication' | 'fee_avoidance' | 'other'
  description: string | null
  reportedByName: string | null
  organizationName: string | null
  workerName: string | null
  resolutionAction: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListViolationReportsParams {
  status?: 'pending' | 'under_review' | 'confirmed' | 'dismissed' | 'resolved'
  violationType?: 'off_platform_hire' | 'off_platform_communication' | 'fee_avoidance' | 'other'
  organizationId?: string
  workerUserId?: string
  limit?: number
  offset?: number
}

export interface ListViolationReportsResponse {
  items: ViolationReport[]
  totalCount: number
}

export interface UpdateViolationReportParams {
  reportId: string
  status?: 'pending' | 'under_review' | 'confirmed' | 'dismissed' | 'resolved'
  reviewNotes?: string
  resolutionAction?: 'warning_issued' | 'fee_collected' | 'account_suspended' | 'account_terminated' | 'no_action' | 'other'
}

export interface UpdateViolationReportResponse {
  id: string
  status: string
  updatedAt: string
}

export class LegalAgreements extends Resource {
  async listViolationReports(
    params?: ListViolationReportsParams
  ): Promise<ListViolationReportsResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.violationType) searchParams.set('violationType', params.violationType)
    if (params?.organizationId) searchParams.set('organizationId', params.organizationId)
    if (params?.workerUserId) searchParams.set('workerUserId', params.workerUserId)
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset))
    const qs = searchParams.toString()
    return this.get<ListViolationReportsResponse>(
      `/v1/legal-agreements/violation-reports${qs ? `?${qs}` : ''}`
    )
  }

  async updateViolationReport(
    params: UpdateViolationReportParams
  ): Promise<UpdateViolationReportResponse> {
    const { reportId, ...body } = params
    return this.patch<UpdateViolationReportResponse>(
      `/v1/legal-agreements/violation-reports/${reportId}`,
      body
    )
  }
}
