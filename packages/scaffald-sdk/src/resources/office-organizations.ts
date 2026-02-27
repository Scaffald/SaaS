import { Resource } from './base.js'

export interface OfficeOrganization {
  id: string
  name: string
  slug: string
  industry_id: string | null
  industry_name?: string | null
  logo_url: string | null
  visibility: string
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

export interface OfficeOrganizationSimple {
  id: string
  name: string
  slug: string
  owner_user_id: string | null
}

export interface GetOfficeOrganizationsResponse {
  organizations: OfficeOrganizationSimple[]
}

export interface ListOfficeOrganizationsParams {
  limit?: number
  offset?: number
  search?: string
}

export interface ListOfficeOrganizationsResponse {
  organizations: OfficeOrganization[]
  total: number
}

export interface OfficeOrganizationRequest {
  id: string
  name: string
  slug: string
  website: string | null
  notes: string | null
  message?: string | null
  personal_note?: string | null
  viewed_at?: string | null
  resent_count?: number | null
  status: 'pending' | 'approved' | 'rejected'
  metadata: Record<string, unknown>
  created_at: string
  created_by_user_id: string
  reviewed_at: string | null
  reviewed_by_user_id: string | null
  rejection_reason: string | null
  organization_id: string | null
}

export interface ListOrganizationRequestsParams {
  status?: 'pending' | 'approved' | 'rejected'
  limit?: number
}

export interface ListOrganizationRequestsResponse {
  requests: OfficeOrganizationRequest[]
  counts: { pending: number; approved: number; rejected: number }
}

export interface ReviewOrganizationRequestParams {
  action: 'approve' | 'reject'
  rejectionReason?: string
}

export interface CheckSlugResponse {
  available: boolean
  reason?: 'format' | 'reserved' | 'taken'
  message?: string
  suggestions?: string[]
  slug: string
}

export interface CreateOfficeOrganizationParams {
  name: string
  slug: string
  industry_id?: string
  logo_url?: string
  visibility?: 'public' | 'private'
  address?: Record<string, unknown>
}

export interface UpdateOfficeOrganizationParams {
  name?: string
  slug?: string
  industry_id?: string
  logo_url?: string
  visibility?: 'public' | 'private'
  address?: Record<string, unknown>
  locations?: Array<{ name: string; address: Record<string, unknown> }>
}

export class OfficeOrganizations extends Resource {
  async getAll(): Promise<GetOfficeOrganizationsResponse> {
    return this.get<GetOfficeOrganizationsResponse>('/v1/office/organizations')
  }

  async list(params?: ListOfficeOrganizationsParams): Promise<ListOfficeOrganizationsResponse> {
    return this.get<ListOfficeOrganizationsResponse>('/v1/office/organizations/list', params as Record<string, string>)
  }

  async listRequests(params?: ListOrganizationRequestsParams): Promise<ListOrganizationRequestsResponse> {
    return this.get<ListOrganizationRequestsResponse>('/v1/office/organizations/requests', params as Record<string, string>)
  }

  async checkSlug(slug: string, organizationId?: string): Promise<CheckSlugResponse> {
    const params: Record<string, string> = { slug }
    if (organizationId) params.organizationId = organizationId
    return this.get<CheckSlugResponse>('/v1/office/organizations/check-slug', params as never)
  }

  async reviewRequest(id: string, params: ReviewOrganizationRequestParams): Promise<{ request: OfficeOrganizationRequest; organization: OfficeOrganization | null }> {
    return this.post(`/v1/office/organizations/requests/${id}/review`, params)
  }

  async create(params: CreateOfficeOrganizationParams): Promise<{ organization: OfficeOrganization }> {
    return this.post('/v1/office/organizations', params)
  }

  async update(id: string, params: UpdateOfficeOrganizationParams): Promise<{ organization: OfficeOrganization }> {
    return this.patch(`/v1/office/organizations/${id}`, params)
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.del(`/v1/office/organizations/${id}`)
  }
}
