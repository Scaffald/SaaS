import { Resource } from './base.js'

export interface RequestDeletionResponse {
  id: string
  status: string
  createdAt: string
}

export interface RequestWorkerDeletionParams {
  reason?: string
}

export interface RequestOrganizationDeletionParams {
  organizationId: string
  reason?: string
}

export class AccountDeletion extends Resource {
  async requestWorkerDeletion(
    params?: RequestWorkerDeletionParams
  ): Promise<RequestDeletionResponse> {
    return this.post<RequestDeletionResponse>('/v1/account-deletion/worker', params ?? {})
  }

  async requestOrganizationDeletion(
    params: RequestOrganizationDeletionParams
  ): Promise<RequestDeletionResponse> {
    return this.post<RequestDeletionResponse>('/v1/account-deletion/organization', params)
  }
}
