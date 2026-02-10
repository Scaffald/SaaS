import { Resource } from './base.js'

// ===========================
// Types
// ===========================

export type InquiryStatus =
  | 'draft'
  | 'sent'
  | 'candidate_responded'
  | 'organization_responded'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type EmploymentType = 'temporary' | 'permanent'
export type WorkSchedule = 'full_time' | 'part_time' | 'day_week'
export type RateType = 'hourly' | 'salary'
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface InquiryTemplate {
  id: string
  organization_id: string
  created_by: string
  name: string
  description: string | null
  template_data: Record<string, unknown>
  is_default: boolean
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  application_id: string
  created_by: string
  status: InquiryStatus
  sent_at: string | null
  employment_type: EmploymentType | null
  employment_type_negotiable: boolean
  work_schedule: WorkSchedule | null
  work_schedule_negotiable: boolean
  schedule_shifts: boolean
  working_hours_start: string | null
  working_hours_end: string | null
  working_hours_timezone: string | null
  working_hours_negotiable: boolean
  workdays: Weekday[] | null
  workdays_negotiable: boolean
  employment_start_date: string
  employment_end_date: string | null
  employment_dates_negotiable: boolean
  rate_type: RateType
  rate_min_cents: number
  rate_max_cents: number | null
  rate_negotiable: boolean
  endurance_required: boolean
  willing_to_travel: boolean | null
  travel_distance_miles: number | null
  willing_to_work_overtime: boolean | null
  has_drivers_license: boolean | null
  additional_notes: string | null
  created_at: string
  updated_at: string
}

export interface InquirySection {
  id: string
  inquiry_id: string
  section_name: string
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
}

export interface InquiryComment {
  id: string
  inquiry_id: string
  section_name: string
  sender_id: string
  content: string
  read_by: string[]
  created_at: string
  updated_at: string
}

export interface InquiryCapabilityResponse {
  id: string
  inquiry_id: string
  capability_name: string
  response_value: number | null
  response_text: string | null
  created_at: string
  updated_at: string
}

export interface JobCapabilityQuestion {
  name: string
  label: string
  type: string
  unit?: string
  required: boolean
}

export interface InquiryAuditLog {
  id: string
  inquiry_id: string
  event_type: string
  actor_id: string
  event_data: Record<string, unknown> | null
  created_at: string
  actor?: {
    id: string
    display_name: string | null
    username: string | null
    avatar_path: string | null
  }
}

// ===========================
// Request Types
// ===========================

export interface CreateTemplateParams {
  applicationId: string
  name: string
  description?: string
  templateData: Record<string, unknown>
}

export interface UpdateTemplateParams {
  templateId: string
  name?: string
  description?: string | null
  templateData?: Record<string, unknown>
}

export interface ApplyTemplateParams {
  applicationId: string
  templateId: string
}

export interface CreateInquiryParams {
  applicationId: string
  employmentType?: EmploymentType
  employmentTypeNegotiable: boolean
  workSchedule?: WorkSchedule
  workScheduleNegotiable: boolean
  scheduleShifts: boolean
  workingHoursStart?: string
  workingHoursEnd?: string
  workingHoursTimezone?: string
  workingHoursNegotiable: boolean
  workdays: Weekday[]
  workdaysNegotiable: boolean
  employmentStartDate: string
  employmentEndDate?: string
  employmentDatesNegotiable: boolean
  rateType: RateType
  rateMinCents: number
  rateMaxCents?: number
  rateNegotiable: boolean
  enduranceRequired: boolean
  willingToTravel?: boolean
  travelDistanceMiles?: number
  willingToWorkOvertime?: boolean
  hasDriversLicense?: boolean
  additionalNotes?: string
}

export interface BulkInquiryData {
  employmentType?: EmploymentType
  employmentTypeNegotiable: boolean
  workSchedule?: WorkSchedule
  workScheduleNegotiable: boolean
  scheduleShifts: boolean
  workingHoursStart?: string
  workingHoursEnd?: string
  workingHoursTimezone?: string
  workingHoursNegotiable: boolean
  workdays: Weekday[]
  workdaysNegotiable: boolean
  employmentStartDate: string
  employmentEndDate?: string
  employmentDatesNegotiable: boolean
  rateType: RateType
  rateMinCents: number
  rateMaxCents?: number
  rateNegotiable: boolean
  enduranceRequired: boolean
  willingToTravel?: boolean
  travelDistanceMiles?: number
  willingToWorkOvertime?: boolean
  hasDriversLicense?: boolean
  additionalNotes?: string
}

export interface CreateBulkInquiriesParams {
  applicationIds: string[]
  inquiryData: BulkInquiryData
}

export interface AddCommentParams {
  inquiryId: string
  sectionName: string
  content: string
}

export interface AcceptSectionParams {
  inquiryId: string
  sectionName: string
}

export interface SubmitCapabilityResponseParams {
  inquiryId: string
  capabilityName: string
  responseValue?: number
  responseText?: string
}

export interface UpdateInquiryParams {
  id: string
  employmentType?: EmploymentType
  employmentTypeNegotiable?: boolean
  workSchedule?: WorkSchedule
  workScheduleNegotiable?: boolean
  scheduleShifts?: boolean
  workingHoursStart?: string
  workingHoursEnd?: string
  workingHoursTimezone?: string
  workingHoursNegotiable?: boolean
  workdays?: Weekday[]
  workdaysNegotiable?: boolean
  employmentStartDate?: string
  employmentEndDate?: string | null
  employmentDatesNegotiable?: boolean
  rateType?: RateType
  rateMinCents?: number
  rateMaxCents?: number | null
  rateNegotiable?: boolean
  enduranceRequired?: boolean
  willingToTravel?: boolean | null
  travelDistanceMiles?: number | null
  willingToWorkOvertime?: boolean | null
  hasDriversLicense?: boolean | null
  additionalNotes?: string | null
}

export interface ChangeStatusParams {
  inquiryId: string
  newStatus: Exclude<InquiryStatus, 'draft'>
}

// ===========================
// Response Types
// ===========================

export interface SmartDefaults {
  defaults: Partial<CreateInquiryParams> | null
  fields: string[]
  job: {
    id: string
    title: string | null
    location: string | null
  } | null
}

export interface InquiryDetails {
  inquiry: Inquiry
  sections: InquirySection[]
  comments: InquiryComment[]
  capabilityResponses: InquiryCapabilityResponse[]
  application: unknown
  candidate: unknown
  job: unknown
  capabilityQuestions: JobCapabilityQuestion[]
}

export interface BulkCreateResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    applicationId: string
    success: boolean
    inquiryId?: string
    error?: string
  }>
}

export interface ApplyTemplateResponse {
  templateData: Record<string, unknown>
  templateId: string
}

export interface AcceptSectionResponse {
  success: boolean
  allAccepted: boolean
}

export interface ChangeStatusResponse {
  success: boolean
  newStatus: InquiryStatus
}

/**
 * Inquiries resource - job inquiry and negotiation operations
 * Handles creating, sending, and managing inquiries between organizations and candidates
 */
export class Inquiries extends Resource {
  /**
   * Get templates available for an application's organization
   */
  async getTemplates(applicationId: string): Promise<InquiryTemplate[]> {
    return this.get<InquiryTemplate[]>('/inquiries/templates', { applicationId })
  }

  /**
   * Create a reusable inquiry template
   */
  async createTemplate(params: CreateTemplateParams): Promise<InquiryTemplate> {
    return this.post<InquiryTemplate>('/inquiries/templates', params)
  }

  /**
   * Update an inquiry template
   */
  async updateTemplate(params: UpdateTemplateParams): Promise<InquiryTemplate> {
    return this.patch<InquiryTemplate>(`/inquiries/templates/${params.templateId}`, params)
  }

  /**
   * Delete an inquiry template
   */
  async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/inquiries/templates/${templateId}`)
  }

  /**
   * Apply a template and increment usage count
   */
  async applyTemplate(params: ApplyTemplateParams): Promise<ApplyTemplateResponse> {
    return this.post<ApplyTemplateResponse>('/inquiries/templates/apply', params)
  }

  /**
   * Get smart defaults derived from the associated job
   */
  async getSmartDefaults(applicationId: string): Promise<SmartDefaults> {
    return this.get<SmartDefaults>('/inquiries/smart-defaults', { applicationId })
  }

  /**
   * Create a new inquiry for an application
   */
  async create(params: CreateInquiryParams): Promise<Inquiry> {
    return this.post<Inquiry>('/inquiries', params)
  }

  /**
   * Create inquiries for multiple applications in bulk
   */
  async createBulk(params: CreateBulkInquiriesParams): Promise<BulkCreateResult> {
    return this.post<BulkCreateResult>('/inquiries/bulk', params)
  }

  /**
   * Get inquiry by application ID
   */
  async getByApplication(applicationId: string): Promise<InquiryDetails | null> {
    return this.get<InquiryDetails | null>('/inquiries/by-application', { applicationId })
  }

  /**
   * Get multiple inquiries by IDs for comparison
   */
  async getMultiple(inquiryIds: string[]): Promise<InquiryDetails[]> {
    return this.get<InquiryDetails[]>('/inquiries/multiple', { inquiryIds: inquiryIds.join(',') })
  }

  /**
   * Get inquiry history/audit trail
   */
  async getHistory(inquiryId: string): Promise<InquiryAuditLog[]> {
    return this.get<InquiryAuditLog[]>(`/inquiries/${inquiryId}/history`)
  }

  /**
   * Send inquiry (change status from draft to sent)
   */
  async send(inquiryId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/inquiries/${inquiryId}/send`)
  }

  /**
   * Add comment to an inquiry section
   */
  async addComment(params: AddCommentParams): Promise<InquiryComment> {
    return this.post<InquiryComment>(`/inquiries/${params.inquiryId}/comments`, params)
  }

  /**
   * Mark comment as read
   */
  async markCommentRead(commentId: string): Promise<{ success: boolean }> {
    return this.patch<{ success: boolean }>(`/inquiries/comments/${commentId}/read`)
  }

  /**
   * Accept a section of the inquiry (applicant only)
   */
  async acceptSection(params: AcceptSectionParams): Promise<AcceptSectionResponse> {
    return this.post<AcceptSectionResponse>(`/inquiries/${params.inquiryId}/sections/accept`, params)
  }

  /**
   * Submit capability response (applicant only)
   */
  async submitCapabilityResponse(
    params: SubmitCapabilityResponseParams
  ): Promise<InquiryCapabilityResponse> {
    return this.post<InquiryCapabilityResponse>(`/inquiries/${params.inquiryId}/capabilities`, params)
  }

  /**
   * Update inquiry fields
   */
  async update(params: UpdateInquiryParams): Promise<Inquiry> {
    return this.patch<Inquiry>(`/inquiries/${params.id}`, params)
  }

  /**
   * Change inquiry status
   */
  async changeStatus(params: ChangeStatusParams): Promise<ChangeStatusResponse> {
    return this.post<ChangeStatusResponse>(`/inquiries/${params.inquiryId}/status`, params)
  }
}
