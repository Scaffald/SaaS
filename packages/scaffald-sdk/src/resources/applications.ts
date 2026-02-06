import { Resource } from './base.js'

export interface Application {
  id: string
  job_id: string
  user_id: string
  status:
    | 'pending'
    | 'reviewing'
    | 'inquired'
    | 'interview'
    | 'offer'
    | 'hired'
    | 'rejected'
    | 'withdrawn'
  current_location?: string
  willing_to_relocate?: boolean
  years_experience?: number
  is_authorized_to_work?: boolean
  earliest_start_date?: string
  screening_answers?: Record<string, unknown>
  custom_question_answers?: CustomQuestionAnswer[]
  attachments?: Record<string, AttachmentMetadata>
  completed_steps?: string[]
  is_complete: boolean
  applied_at: string
  updated_at: string
  score?: number
}

export interface CustomQuestionAnswer {
  question_id: string
  question: string
  answer: string | string[] | boolean
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
}

export interface AttachmentMetadata {
  path: string
  filename: string
  size: number
  mime_type: string
  uploaded_at: string
}

export interface CreateApplicationParams {
  job_id: string
  current_location?: string
  willing_to_relocate?: boolean
  years_experience?: number
  is_authorized_to_work?: boolean
  earliest_start_date?: string
  screening_answers?: Record<string, unknown>
  custom_question_answers?: CustomQuestionAnswer[]
  attachments?: Record<string, AttachmentMetadata>
  completed_steps?: string[]
  is_complete?: boolean
  notes?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface UpdateApplicationParams {
  status?: Application['status']
  current_location?: string
  willing_to_relocate?: boolean
  years_experience?: number
  is_authorized_to_work?: boolean
  earliest_start_date?: string
  screening_answers?: Record<string, unknown>
  custom_question_answers?: CustomQuestionAnswer[]
  attachments?: Record<string, AttachmentMetadata>
  completed_steps?: string[]
  is_complete?: boolean
  notes?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface WithdrawApplicationParams {
  reason?: string
}

export class Applications extends Resource {
  /**
   * Create a new job application
   */
  async create(params: CreateApplicationParams): Promise<Application> {
    return this.post<Application>('/v1/applications', params)
  }

  /**
   * Retrieve an application by ID
   */
  async retrieve(id: string): Promise<Application> {
    return this.get<Application>(`/v1/applications/${id}`)
  }

  /**
   * Update an application
   */
  async update(id: string, params: UpdateApplicationParams): Promise<Application> {
    return this.patch<Application>(`/v1/applications/${id}`, params)
  }

  /**
   * Withdraw an application
   */
  async withdraw(id: string, params?: WithdrawApplicationParams): Promise<Application> {
    return this.post<Application>(`/v1/applications/${id}/withdraw`, params)
  }

  /**
   * Get the current user's application for a job (parity with tRPC jobs.getMyApplicationForJob).
   * Returns null if the user has not applied to the job.
   */
  async getMyForJob(jobId: string): Promise<Application | null> {
    try {
      const res = await this.get<{ data: Application }>(
        `/v1/jobs/${encodeURIComponent(jobId)}/applications/me`
      )
      return res?.data ?? null
    } catch {
      return null
    }
  }
}
