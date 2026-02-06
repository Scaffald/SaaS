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

/** API response shape for single job */
interface JobApiResponse {
  data: Job
}

/** API response shape for job list (with pagination) */
interface JobListApiResponse {
  data: Job[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

/** API response shape for similar jobs */
interface SimilarJobsApiResponse {
  data: Job[]
}

export interface ExternalJob {
  id: string
  title?: string | null
  company_name?: string | null
  company_logo?: string | null
  job_location?: string | null
  job_type?: string | null
  job_category?: string | null
  description?: string | null
  compensation_min?: number | null
  compensation_max?: number | null
  compensation_currency?: string | null
  posted_date?: string | null
  application_url?: string | null
  external_url?: string | null
  featured?: boolean | null
  industries?: Array<{ industry_name: string; confidence_score: number }>
}

export interface ExternalJobFilterOptions {
  jobTypes: string[]
  locations: string[]
  industries: string[]
}

export class Jobs extends Resource {
  async list(params?: JobListParams): Promise<JobListResponse> {
    const res = await this.get<JobListApiResponse>('/v1/jobs', params as Record<string, unknown>)
    return {
      data: res.data ?? [],
      total: res.pagination?.total ?? 0,
      limit: res.pagination?.limit ?? 20,
      offset: res.pagination?.offset ?? 0,
    }
  }

  async retrieve(id: string): Promise<Job> {
    const res = await this.get<JobApiResponse>(`/v1/jobs/${id}`)
    return res.data
  }

  /** Get job by slug (vanity URL). Parity with REST GET /v1/jobs/slug/:slug */
  async retrieveBySlug(slug: string): Promise<Job | null> {
    try {
      const res = await this.get<JobApiResponse>(`/v1/jobs/slug/${encodeURIComponent(slug)}`)
      return res?.data ?? null
    } catch {
      return null
    }
  }

  async create(params: CreateJobParams): Promise<Job> {
    const res = await this.post<JobApiResponse>('/v1/jobs', params)
    return res.data
  }

  async update(id: string, params: Partial<CreateJobParams>): Promise<Job> {
    const res = await this.patch<JobApiResponse>(`/v1/jobs/${id}`, params)
    return res.data
  }

  async delete(id: string): Promise<void> {
    await this.del<void>(`/v1/jobs/${id}`)
  }

  async similar(id: string, limit?: number): Promise<JobListResponse> {
    const res = await this.get<SimilarJobsApiResponse>(`/v1/jobs/${id}/similar`, { limit })
    const data = res.data ?? []
    return {
      data,
      total: data.length,
      limit: limit ?? 5,
      offset: 0,
    }
  }

  async filterOptions(): Promise<{
    employmentTypes: string[]
    locations: string[]
    remoteOptions: string[]
  }> {
    const res = await this.get<{
      data: { employmentTypes: string[]; locations: string[]; remoteOptions: string[] }
    }>('/v1/jobs/filter-options')
    return res.data ?? { employmentTypes: [], locations: [], remoteOptions: [] }
  }

  /** List external jobs. Parity with REST GET /v1/jobs/external */
  async listExternal(): Promise<ExternalJob[]> {
    const res = await this.get<{ data: ExternalJob[] }>('/v1/jobs/external')
    return res.data ?? []
  }

  /** Get filter options for external jobs. Parity with REST GET /v1/jobs/external/filter-options */
  async externalFilterOptions(): Promise<ExternalJobFilterOptions> {
    const res = await this.get<{ data: ExternalJobFilterOptions }>('/v1/jobs/external/filter-options')
    return res.data ?? { jobTypes: [], locations: [], industries: [] }
  }

  /** Calculate soft skills match for a job. Parity with REST GET /v1/jobs/:jobId/soft-skills-match */
  async calculateSoftSkillsMatch(
    jobId: string,
    userId?: string
  ): Promise<{
    jobId: string
    jobTitle: string | null
    organization: unknown
    score: number | null
    needsSelfAssessment: boolean
    totalRequirements: number
    details: Array<{
      skillId: string
      skillName: string | null
      category: string | null
      requiredImportance: number
      userRating: number | null
      meetsRequirement: boolean | null
      contribution: number
    }>
  }> {
    const query = userId ? { userId } : {}
    const res = await this.get<{
      data: {
        jobId: string
        jobTitle: string | null
        organization: unknown
        score: number | null
        needsSelfAssessment: boolean
        totalRequirements: number
        details: Array<{
          skillId: string
          skillName: string | null
          category: string | null
          requiredImportance: number
          userRating: number | null
          meetsRequirement: boolean | null
          contribution: number
        }>
      }
    }>(`/v1/jobs/${encodeURIComponent(jobId)}/soft-skills-match`, query)
    return res.data
  }

  /** List jobs with soft skills match scores. Parity with REST GET /v1/jobs/soft-skills-match */
  async getJobsWithSoftSkillsMatch(params?: {
    minMatchScore?: number
    sortBy?: 'match_score'
    limit?: number
    offset?: number
  }): Promise<{
    total: number
    needsSelfAssessment: boolean
    jobs: Array<{
      jobId: string
      title: string | null
      slug: string | null
      organization: unknown
      matchScore: number | null
      totalRequirements: number
      details: Array<{
        skillId: string
        skillName: string | null
        category: string | null
        requiredImportance: number
        userRating: number | null
        meetsRequirement: boolean | null
        contribution: number
      }>
    }>
  }> {
    type JobWithDetails = {
      jobId: string
      title: string | null
      slug: string | null
      organization: unknown
      matchScore: number | null
      totalRequirements: number
      details: Array<{
        skillId: string
        skillName: string | null
        category: string | null
        requiredImportance: number
        userRating: number | null
        meetsRequirement: boolean | null
        contribution: number
      }>
    }
    const res = await this.get<{
      data: {
        total: number
        needsSelfAssessment: boolean
        jobs: JobWithDetails[]
      }
    }>('/v1/jobs/soft-skills-match', params as Record<string, string | number | undefined>)
    const data = res.data
    if (!data) return { total: 0, needsSelfAssessment: true, jobs: [] }
    return {
      total: data.total,
      needsSelfAssessment: data.needsSelfAssessment,
      jobs: data.jobs,
    }
  }
}
