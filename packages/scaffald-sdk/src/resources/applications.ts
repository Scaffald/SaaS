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
  /** Source of hire — how the candidate found this job (Issue #91) */
  source?: 'scaffald' | 'referral' | 'external_board' | 'social_media' | 'company_website' | 'other'
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
  /** Source tracking — how the candidate found this job (Issue #91) */
  source?: 'scaffald' | 'referral' | 'external_board' | 'social_media' | 'company_website' | 'other'
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

export interface ListApplicationsParams {
  status?: Application['status']
  limit?: number
  offset?: number
}

export interface ListApplicationsResponse {
  data: Application[]
  total: number
  limit: number
  offset: number
}

export interface GetUploadUrlParams {
  application_id: string
  attachment_type: 'resume' | 'cover_letter' | 'portfolio' | 'assessment' | 'video_interview'
  filename: string
  content_type: string
}

export interface GetUploadUrlResponse {
  uploadUrl: string
  path: string
}

export interface ConfirmUploadParams {
  application_id: string
  attachment_type: 'resume' | 'cover_letter' | 'portfolio' | 'assessment' | 'video_interview'
  path: string
  filename: string
  size: number
  mime_type: string
}

export interface ApplicationMessage {
  id: string
  application_id: string
  sender_id: string
  body: string
  created_at: string
  sender_name?: string
  sender_role?: 'applicant' | 'recruiter' | 'system'
}

export interface GetMessagesResponse {
  data: ApplicationMessage[]
}

export interface SendMessageParams {
  applicationId: string
  body: string
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

  /**
   * List the current user's applications
   * @param params - Filter and pagination parameters
   * @returns List of applications with pagination metadata
   */
  async list(params?: ListApplicationsParams): Promise<ListApplicationsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.get<ListApplicationsResponse>(`/v1/applications${query}`)
  }

  /**
   * Get a presigned URL for uploading an application attachment
   * @param params - Upload parameters including application ID, attachment type, filename, and content type
   * @returns Presigned upload URL and storage path
   */
  async getUploadUrl(params: GetUploadUrlParams): Promise<GetUploadUrlResponse> {
    return this.post<GetUploadUrlResponse>('/v1/applications/upload-url', params)
  }

  /**
   * Confirm that a file was successfully uploaded
   * @param params - Upload confirmation including application ID, attachment type, path, and file metadata
   * @returns Updated application with the new attachment
   */
  async confirmUpload(params: ConfirmUploadParams): Promise<Application> {
    return this.post<Application>('/v1/applications/confirm-upload', params)
  }

  /**
   * Get messages for an application
   * @param applicationId - The application ID
   * @returns List of messages for the application
   */
  async getMessages(applicationId: string): Promise<GetMessagesResponse> {
    return this.get<GetMessagesResponse>(`/v1/applications/${applicationId}/messages`)
  }

  /**
   * Send a message on an application
   * @param params - Message parameters including application ID and message body
   * @returns The created message
   */
  async sendMessage(params: SendMessageParams): Promise<ApplicationMessage> {
    const { applicationId, body } = params
    return this.post<ApplicationMessage>(`/v1/applications/${applicationId}/messages`, { body })
  }
}
