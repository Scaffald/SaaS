import { Resource } from './base.js'

export interface OfficeCertification {
  id: string
  name: string
  slug: string
  issuing_organization?: string | null
  category: 'safety' | 'trade' | 'equipment' | 'license' | 'management' | 'other'
  description?: string | null
  typical_duration_days?: number | null
  requires_renewal: boolean
  renewal_period_months?: number | null
  is_active: boolean
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface CreateOfficeCertificationParams {
  name: string
  slug: string
  issuing_organization?: string
  category: 'safety' | 'trade' | 'equipment' | 'license' | 'management' | 'other'
  description?: string
  typical_duration_days?: number
  requires_renewal?: boolean
  renewal_period_months?: number
  metadata?: Record<string, unknown>
}

export interface UpdateOfficeCertificationParams {
  name?: string
  slug?: string
  issuing_organization?: string
  category?: 'safety' | 'trade' | 'equipment' | 'license' | 'management' | 'other'
  description?: string
  typical_duration_days?: number
  requires_renewal?: boolean
  renewal_period_months?: number
  is_active?: boolean
  metadata?: Record<string, unknown>
}

export class OfficeCertifications extends Resource {
  async create(
    params: CreateOfficeCertificationParams
  ): Promise<{ certification: OfficeCertification }> {
    return this.post<{ certification: OfficeCertification }>('/v1/office/certifications', params)
  }

  async update(
    id: string,
    params: UpdateOfficeCertificationParams
  ): Promise<{ certification: OfficeCertification }> {
    return this.patch<{ certification: OfficeCertification }>(
      `/v1/office/certifications/${id}`,
      params
    )
  }
}
