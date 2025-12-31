import { BaseResource } from './base.js'

/**
 * Application status enum
 */
export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'inquired'
  | 'interviewing'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

/**
 * Application type
 */
export type ApplicationType = 'quick' | 'full'

/**
 * Application object
 */
export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: ApplicationStatus
  application_type: ApplicationType
  current_location: string
  available_start_date: string | null
  cover_letter: string | null
  resume_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  years_experience: number | null
  salary_expectation_min_cents: number | null
  salary_expectation_max_cents: number | null
  willing_to_relocate: boolean | null
  requires_sponsorship: boolean | null
  custom_responses: Record<string, unknown> | null
  withdrawal_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Create application input (quick application)
 */
export interface CreateQuickApplicationInput {
  jobId: string
  currentLocation: string
  availableStartDate?: string
}

/**
 * Create application input (full application)
 */
export interface CreateFullApplicationInput {
  jobId: string
  currentLocation: string
  availableStartDate?: string
  coverLetter?: string
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  yearsExperience?: number
  salaryExpectationMinCents?: number
  salaryExpectationMaxCents?: number
  willingToRelocate?: boolean
  requiresSponsorship?: boolean
  customResponses?: Record<string, unknown>
}

/**
 * Update application input
 */
export interface UpdateApplicationInput {
  coverLetter?: string
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  yearsExperience?: number
  salaryExpectationMinCents?: number
  salaryExpectationMaxCents?: number
  willingToRelocate?: boolean
  requiresSponsorship?: boolean
  customResponses?: Record<string, unknown>
}

/**
 * Withdraw application input
 */
export interface WithdrawApplicationInput {
  reason?: string
}

/**
 * Application response
 */
export interface ApplicationResponse {
  data: Application
}

/**
 * Applications resource
 */
export class ApplicationsResource extends BaseResource {
  /**
   * Submit a job application (defaults to quick application)
   * Alias for createQuick()
   *
   * @example
   * ```typescript
   * const application = await client.applications.create({
   *   jobId: 'job_123',
   *   currentLocation: 'San Francisco, CA',
   * })
   * ```
   */
  async create(input: CreateQuickApplicationInput): Promise<ApplicationResponse> {
    return this.createQuick(input)
  }

  /**
   * Submit a quick job application
   *
   * @example
   * ```typescript
   * const application = await client.applications.createQuick({
   *   jobId: 'job_123',
   *   currentLocation: 'San Francisco, CA',
   *   availableStartDate: '2025-03-01'
   * })
   * ```
   */
  async createQuick(input: CreateQuickApplicationInput): Promise<ApplicationResponse> {
    return this.client.post<ApplicationResponse>('/v1/applications', {
      job_id: input.jobId,
      application_type: 'quick',
      current_location: input.currentLocation,
      available_start_date: input.availableStartDate,
    })
  }

  /**
   * Submit a full job application
   *
   * @example
   * ```typescript
   * const application = await client.applications.createFull({
   *   jobId: 'job_123',
   *   currentLocation: 'San Francisco, CA',
   *   coverLetter: 'I am excited to apply...',
   *   resumeUrl: 'https://example.com/resume.pdf',
   *   yearsExperience: 5,
   *   salaryExpectationMinCents: 12000000, // $120k
   *   salaryExpectationMaxCents: 15000000  // $150k
   * })
   * ```
   */
  async createFull(input: CreateFullApplicationInput): Promise<ApplicationResponse> {
    return this.client.post<ApplicationResponse>('/v1/applications', {
      job_id: input.jobId,
      application_type: 'full',
      current_location: input.currentLocation,
      available_start_date: input.availableStartDate,
      cover_letter: input.coverLetter,
      resume_url: input.resumeUrl,
      linkedin_url: input.linkedinUrl,
      portfolio_url: input.portfolioUrl,
      years_experience: input.yearsExperience,
      salary_expectation_min_cents: input.salaryExpectationMinCents,
      salary_expectation_max_cents: input.salaryExpectationMaxCents,
      willing_to_relocate: input.willingToRelocate,
      requires_sponsorship: input.requiresSponsorship,
      custom_responses: input.customResponses,
    })
  }

  /**
   * Get application details by ID
   *
   * @example
   * ```typescript
   * const application = await client.applications.retrieve('app_123')
   * ```
   */
  async retrieve(id: string): Promise<ApplicationResponse> {
    return this.client.get<ApplicationResponse>(`/v1/applications/${id}`)
  }

  /**
   * Update an application
   * Only works for applications in pending or reviewing status
   *
   * @example
   * ```typescript
   * const updated = await client.applications.update('app_123', {
   *   coverLetter: 'Updated cover letter...',
   *   resumeUrl: 'https://example.com/new-resume.pdf'
   * })
   * ```
   */
  async update(id: string, input: UpdateApplicationInput): Promise<ApplicationResponse> {
    return this.client.patch<ApplicationResponse>(`/v1/applications/${id}`, {
      cover_letter: input.coverLetter,
      resume_url: input.resumeUrl,
      linkedin_url: input.linkedinUrl,
      portfolio_url: input.portfolioUrl,
      years_experience: input.yearsExperience,
      salary_expectation_min_cents: input.salaryExpectationMinCents,
      salary_expectation_max_cents: input.salaryExpectationMaxCents,
      willing_to_relocate: input.willingToRelocate,
      requires_sponsorship: input.requiresSponsorship,
      custom_responses: input.customResponses,
    })
  }

  /**
   * Withdraw an application
   *
   * @example
   * ```typescript
   * await client.applications.withdraw('app_123', {
   *   reason: 'Accepted another offer'
   * })
   * ```
   */
  async withdraw(id: string, input?: WithdrawApplicationInput): Promise<ApplicationResponse> {
    return this.client.post<ApplicationResponse>(`/v1/applications/${id}/withdraw`, {
      reason: input?.reason,
    })
  }
}
