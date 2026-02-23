import { Resource } from './base.js'

export interface University {
  id: string
  name: string
  slug: string
  country: string
  alpha_two_code: string
  domains: string[]
  web_pages: string[]
  state_province: string | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface UniversityListResponse {
  universities: University[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UniversityListParams {
  page?: number
  pageSize?: number
  search?: string
  country?: string
  sortBy?: 'name' | 'country' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface UniversitySearchParams {
  query: string
  country?: string
  limit?: number
}

export interface UniversitySearchResponse {
  universities: University[]
}

export interface CreateUniversityParams {
  name: string
  slug: string
  country: string
  alpha_two_code: string
  domains?: string[]
  web_pages?: string[]
  state_province?: string
  metadata?: Record<string, unknown>
}

export interface UpdateUniversityParams {
  name?: string
  slug?: string
  country?: string
  alpha_two_code?: string
  domains?: string[]
  web_pages?: string[]
  state_province?: string
  metadata?: Record<string, unknown>
}

export class OfficeUniversities extends Resource {
  async retrieve(id: string): Promise<{ university: University }> {
    return this.get<{ university: University }>(`/v1/office/universities/${id}`)
  }

  async list(params?: UniversityListParams): Promise<UniversityListResponse> {
    return this.get<UniversityListResponse>('/v1/office/universities', params as Record<string, string>)
  }

  async search(params: UniversitySearchParams): Promise<UniversitySearchResponse> {
    return this.get<UniversitySearchResponse>('/v1/office/universities/search', params as unknown as Record<string, string>)
  }

  async create(params: CreateUniversityParams): Promise<{ success: boolean; university: University }> {
    return this.post<{ success: boolean; university: University }>('/v1/office/universities', params)
  }

  async update(id: string, params: UpdateUniversityParams): Promise<{ success: boolean; university: University }> {
    return this.patch<{ success: boolean; university: University }>(`/v1/office/universities/${id}`, params)
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/office/universities/${id}`)
  }
}
