/**
 * Stub types for the capability-based inquiry API used by inquiries-sdk-hooks.
 * Inquiry, InquiryTemplate, CreateInquiryParams are imported from @scaffald/sdk.
 */

/** Params for accepting an inquiry section */
export interface AcceptSectionParams {
  inquiryId: string;
  sectionName: string;
}

/** Response from acceptSection */
export interface AcceptSectionResponse {
  success?: boolean;
}

/** Params for adding a comment to an inquiry section */
export interface AddCommentParams {
  inquiryId: string;
  sectionName: string;
  content: string;
}

/** Params for applying a template to an application */
export interface ApplyTemplateParams {
  applicationId: string;
  templateId: string;
}

/** Response from applyTemplate */
export interface ApplyTemplateResponse {
  templateData: unknown;
  templateId: string;
}

/** Result of bulk inquiry creation */
export interface BulkCreateResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    applicationId: string;
    success: boolean;
    inquiryId?: string;
    error?: string;
  }>;
}

/** Params for changing inquiry status */
export interface ChangeStatusParams {
  inquiryId: string;
  newStatus: string;
}

/** Response from changeStatus */
export interface ChangeStatusResponse {
  success: boolean;
  newStatus: string;
}

/** Params for creating inquiries in bulk */
export interface CreateBulkInquiriesParams {
  applicationIds: string[];
  inquiryData: Record<string, unknown>;
}

/** Params for creating an inquiry template */
export interface CreateTemplateParams {
  applicationId: string;
  name: string;
  description?: string;
  templateData: Record<string, unknown>;
}

/** Single audit log entry for inquiry history */
export interface InquiryAuditLog {
  id: string;
  action?: string;
  [key: string]: unknown;
}

/** Response from submitCapabilityResponse */
export interface InquiryCapabilityResponse {
  [key: string]: unknown;
}

/** Comment on an inquiry section */
export interface InquiryComment {
  id: string;
  sender_id: string;
  content: string;
  read_by: string[];
  created_at: string;
  section_name?: string;
  inquiry_id?: string;
}

/** Full inquiry with sections and comments (getByApplication / getMultiple) */
export interface InquiryDetails {
  inquiry: Record<string, unknown>;
  sections: unknown[];
  comments: InquiryComment[];
  /** Capability question responses (when present from API) */
  capabilityResponses?: Array<{
    capability_name: string;
    response_value?: boolean;
    response_text?: string;
  }>;
  /** Capability question definitions (when present from API) */
  capabilityQuestions?: Array<{
    name: string;
    label?: string;
    type?: string;
    unit?: string;
    required?: boolean;
  }>;
  /** Job summary (when joined from API) */
  job?: {
    id?: string;
    title?: string;
    location?: string;
    [key: string]: unknown;
  };
  /** Application summary (when joined from API) */
  application?: { id?: string; [key: string]: unknown };
  /** Candidate summary (when joined from API) */
  candidate?: {
    displayName?: string;
    username?: string;
    [key: string]: unknown;
  };
}

/** Smart defaults derived from associated job */
export interface SmartDefaults {
  defaults: unknown;
  fields: unknown[];
  job: unknown;
}

/** Params for submitting a capability response */
export interface SubmitCapabilityResponseParams {
  inquiryId: string;
  capabilityName: string;
  responseValue?: boolean;
  responseText?: string;
}

/** Params for updating an inquiry */
export interface UpdateInquiryParams {
  id: string;
  [key: string]: unknown;
}

/** Params for updating an inquiry template */
export interface UpdateTemplateParams {
  templateId: string;
  name?: string;
  description?: string;
  templateData?: Record<string, unknown>;
}

/** Params for creating a capability-based inquiry (matches InquiryCreateInput from @scf/schemas) */
export interface CreateInquiryParams {
  applicationId: string;
  // Employment terms
  employmentType?: "permanent" | "temporary";
  employmentTypeNegotiable: boolean;
  workSchedule?: "full_time" | "part_time" | "day_week";
  workScheduleNegotiable: boolean;
  scheduleShifts: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingHoursTimezone?: string;
  workingHoursNegotiable: boolean;
  workdays: (
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  )[];
  workdaysNegotiable: boolean;
  employmentStartDate: string;
  employmentEndDate?: string;
  employmentDatesNegotiable: boolean;
  // Compensation
  rateType: "hourly" | "salary";
  rateMinCents: number;
  rateMaxCents?: number;
  rateNegotiable: boolean;
  // Capabilities
  enduranceRequired: boolean;
  // Other
  willingToTravel?: boolean;
  travelDistanceMiles?: number;
  willingToWorkOvertime?: boolean;
  hasDriversLicense?: boolean;
  additionalNotes?: string;
}

/** Base inquiry (compatible with SDK) */
export interface Inquiry {
  id: string;
  [key: string]: unknown;
}

/** Extended client interface for capability inquiry API (tRPC migration - methods may not exist on SDK yet) */
export interface InquiryCapabilityClient {
  getTemplates(applicationId: string): Promise<InquiryTemplate[]>;
  createTemplate(params: CreateTemplateParams): Promise<InquiryTemplate>;
  updateTemplate(params: UpdateTemplateParams): Promise<InquiryTemplate>;
  deleteTemplate(templateId: string): Promise<{ success: boolean }>;
  applyTemplate(params: ApplyTemplateParams): Promise<ApplyTemplateResponse>;
  getSmartDefaults(applicationId: string): Promise<SmartDefaults>;
  create(params: CreateInquiryParams): Promise<Inquiry>;
  createBulk(params: CreateBulkInquiriesParams): Promise<BulkCreateResult>;
  getByApplication(applicationId: string): Promise<InquiryDetails | null>;
  getMultiple(inquiryIds: string[]): Promise<InquiryDetails[]>;
  getHistory(inquiryId: string): Promise<InquiryAuditLog[]>;
  send(inquiryId: string): Promise<{ success: boolean }>;
  addComment(params: AddCommentParams): Promise<InquiryComment>;
  markCommentRead(commentId: string): Promise<{ success: boolean }>;
  acceptSection(params: AcceptSectionParams): Promise<AcceptSectionResponse>;
  submitCapabilityResponse(
    params: SubmitCapabilityResponseParams
  ): Promise<InquiryCapabilityResponse>;
  update(params: UpdateInquiryParams): Promise<Inquiry>;
  changeStatus(params: ChangeStatusParams): Promise<ChangeStatusResponse>;
}

/** Re-export for convenience */
export interface InquiryTemplate {
  id: string;
  name: string;
  [key: string]: unknown;
}
