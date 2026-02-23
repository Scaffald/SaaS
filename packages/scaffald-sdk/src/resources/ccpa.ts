import { Resource } from './base.js'
import type {
  CCPADataSummaryResponse,
  CCPAMyRequestsResponse,
  CCPAOptOutsResponse,
  CCPASubmitRequestParams,
  CCPASubmitRequestResponse,
  CCPASetOptOutParams,
  CCPASetOptOutResponse,
  CCPAComplianceMetrics,
  CCPAAdminRequestsParams,
  CCPAAdminRequestsResponse,
  CCPAProcessRequestResponse,
} from '../types/ccpa.js'

export class CCPA extends Resource {
  // ===== User Endpoints =====

  async getDataSummary(): Promise<CCPADataSummaryResponse> {
    return this.get<CCPADataSummaryResponse>('/v1/ccpa/data-summary')
  }

  async getMyRequests(params?: { limit?: number; offset?: number; status?: string }): Promise<CCPAMyRequestsResponse> {
    const query: Record<string, string> = {}
    if (params?.limit) query.limit = String(params.limit)
    if (params?.offset) query.offset = String(params.offset)
    if (params?.status) query.status = params.status
    return this.get<CCPAMyRequestsResponse>('/v1/ccpa/my-requests', query)
  }

  async getConnectedApps(): Promise<unknown[]> {
    return this.get<unknown[]>('/v1/ccpa/connected-apps')
  }

  async getMyOptOuts(): Promise<CCPAOptOutsResponse> {
    return this.get<CCPAOptOutsResponse>('/v1/ccpa/my-opt-outs')
  }

  async setOptOut(params: CCPASetOptOutParams): Promise<CCPASetOptOutResponse> {
    return this.post<CCPASetOptOutResponse>('/v1/ccpa/opt-outs', params)
  }

  async submitRequest(params: CCPASubmitRequestParams): Promise<CCPASubmitRequestResponse> {
    return this.post<CCPASubmitRequestResponse>('/v1/ccpa/requests', params)
  }

  // ===== Admin Endpoints =====

  async getComplianceMetrics(): Promise<CCPAComplianceMetrics> {
    return this.get<CCPAComplianceMetrics>('/v1/ccpa/compliance-metrics')
  }

  async getAdminRequests(params?: CCPAAdminRequestsParams): Promise<CCPAAdminRequestsResponse> {
    const query: Record<string, string> = {}
    if (params?.status && params.status !== 'all') query.status = params.status
    if (params?.type && params.type !== 'all') query.type = params.type
    if (params?.priority && params.priority !== 'all') query.priority = params.priority
    if (params?.limit) query.limit = String(params.limit)
    if (params?.offset) query.offset = String(params.offset)
    return this.get<CCPAAdminRequestsResponse>('/v1/ccpa/admin-requests', query)
  }

  async processRequest(requestId: string): Promise<CCPAProcessRequestResponse> {
    return this.post<CCPAProcessRequestResponse>(`/v1/ccpa/requests/${requestId}/process`, {})
  }
}
