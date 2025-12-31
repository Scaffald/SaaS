import { BaseResource } from './base.js'

/**
 * Job status enum
 */
export type JobStatus = 'draft' | 'open' | 'paused' | 'closed' | 'published'

/**
 * Employment type enum
 */
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern'

/**
 * Remote option enum
 */
export type RemoteOption = 'on_site' | 'hybrid' | 'remote'

/**
 * Pay range type enum
 */
export type PayRangeType = 'hourly' | 'salary' | 'contract' | 'project'

/**
 * Job object
 */
export interface Job {
  id: string
  organization_id: string
  title: string
  description: string
  status: JobStatus
  employment_type: EmploymentType | null
  remote_option: RemoteOption | null
  location: string | null
  pay_range_min_cents: number | null
  pay_range_max_cents: number | null
  pay_range_type: PayRangeType | null
  created_at: string
  updated_at: string
  application_deadline: string | null
  number_of_openings: number | null
  is_featured: boolean | null
}

/**
 * Pagination metadata
 */
export interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Job list parameters
 */
export interface JobListParams {
  status?: JobStatus
  limit?: number
  offset?: number
  organizationId?: string
  location?: string
  employmentType?: EmploymentType
  remoteOption?: RemoteOption
}

/**
 * Job list response
 */
export interface JobListResponse {
  data: Job[]
  pagination: Pagination
}

/**
 * Job response
 */
export interface JobResponse {
  data: Job
}

/**
 * Similar jobs parameters
 */
export interface SimilarJobsParams {
  limit?: number
}

/**
 * Similar jobs response
 */
export interface SimilarJobsResponse {
  data: Job[]
}

/**
 * Filter options response
 */
export interface FilterOptionsResponse {
  data: {
    employmentTypes: string[]
    locations: string[]
    remoteOptions: string[]
  }
}

/**
 * Jobs resource
 */
export class JobsResource extends BaseResource {
  /**
   * List jobs with filtering and pagination
   *
   * @example
   * ```typescript
   * const jobs = await client.jobs.list({
   *   status: 'published',
   *   limit: 20,
   *   location: 'San Francisco',
   *   remoteOption: 'remote'
   * })
   * ```
   */
  async list(params?: JobListParams): Promise<JobListResponse> {
    return this.client.get<JobListResponse>(
      '/v1/jobs',
      params as Record<string, string | number | boolean | undefined>
    )
  }

  /**
   * Retrieve a specific job by ID
   *
   * @example
   * ```typescript
   * const job = await client.jobs.retrieve('job_123')
   * ```
   */
  async retrieve(id: string): Promise<JobResponse> {
    return this.client.get<JobResponse>(`/v1/jobs/${id}`)
  }

  /**
   * Get similar jobs based on a job ID
   *
   * @example
   * ```typescript
   * const similar = await client.jobs.similar('job_123', { limit: 5 })
   * ```
   */
  async similar(id: string, params?: SimilarJobsParams): Promise<SimilarJobsResponse> {
    return this.client.get<SimilarJobsResponse>(
      `/v1/jobs/${id}/similar`,
      params as Record<string, string | number | boolean | undefined>
    )
  }

  /**
   * Get available filter options for jobs
   *
   * @example
   * ```typescript
   * const options = await client.jobs.filterOptions()
   * console.log(options.data.employmentTypes)
   * ```
   */
  async filterOptions(): Promise<FilterOptionsResponse> {
    return this.client.get<FilterOptionsResponse>('/v1/jobs/filter-options')
  }
}
