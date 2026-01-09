import { Resource } from './base.js'

export interface Job {
  id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'closed' | 'archived'
  location?: {
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
  salary_min?: number
  salary_max?: number
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temporary'
  created_at: string
  updated_at: string
  published_at?: string
  organization_id: string
}

export interface JobListParams {
  status?: 'draft' | 'published' | 'closed' | 'archived'
  limit?: number
  offset?: number
  search?: string
}

export interface JobListResponse {
  data: Job[]
  total: number
  limit: number
  offset: number
}

export interface CreateJobParams {
  title: string
  description: string
  status?: 'draft' | 'published'
  location?: {
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
  salary_min?: number
  salary_max?: number
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temporary'
}

export class Jobs extends Resource {
  async list(params?: JobListParams): Promise<JobListResponse> {
    return this.get<JobListResponse>('/v1/jobs', params)
  }

  async retrieve(id: string): Promise<Job> {
    return this.get<Job>(`/v1/jobs/${id}`)
  }

  async create(params: CreateJobParams): Promise<Job> {
    return this.post<Job>('/v1/jobs', params)
  }

  async update(id: string, params: Partial<CreateJobParams>): Promise<Job> {
    return this.patch<Job>(`/v1/jobs/${id}`, params)
  }

  async delete(id: string): Promise<void> {
    return this.del<void>(`/v1/jobs/${id}`)
  }

  async similar(id: string, limit?: number): Promise<JobListResponse> {
    return this.get<JobListResponse>(`/v1/jobs/${id}/similar`, { limit })
  }
}
