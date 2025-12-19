/**
 * CCPA Types - Type definitions for CCPA compliance features
 * REQ-131: CCPA Compliance Implementation (USA-Only Scope)
 */

// =============================================================================
// PRIVACY REQUEST TYPES
// =============================================================================

export type PrivacyRequestType =
  | 'right_to_know'
  | 'right_to_delete'
  | 'right_to_correct'
  | 'opt_out_sale'
  | 'limit_sensitive_pi';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'requires_additional_info';

export type PrivacyRequestStatus =
  | 'received'
  | 'verification_pending'
  | 'in_progress'
  | 'completed'
  | 'denied'
  | 'expired';

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ResponseMethod = 'email' | 'portal' | 'mail' | 'api';

export type ExportFormat = 'json' | 'csv' | 'pdf';

export type DataScope = 'all_data' | 'categories_only' | 'specific_pieces';

export interface PrivacyRequest {
  id: string;
  created_at: string;
  updated_at: string;

  // Request identification
  request_number: string;
  request_type: PrivacyRequestType;

  // Requester information
  user_id?: string;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;

  // Verification
  verification_status: VerificationStatus;
  verification_method?: string;
  verification_date?: string;
  verification_notes?: string;

  // Request details
  request_description?: string;
  requested_data_categories?: string[];
  scope?: DataScope;

  // Processing
  status: PrivacyRequestStatus;
  assigned_to_user_id?: string;
  priority: RequestPriority;

  // Response timeline
  due_date: string;
  extended_due_date?: string;
  extension_reason?: string;

  // Response
  completed_date?: string;
  response_method?: ResponseMethod;
  response_notes?: string;
  denial_reason?: string;

  // Data export
  export_file_url?: string;
  export_file_size?: number;
  export_format?: ExportFormat;
  export_generated_at?: string;
  export_expires_at?: string;

  // Data deletion
  deletion_scheduled_date?: string;
  deletion_completed_date?: string;
  deletion_scope?: Record<string, unknown>;

  // Metadata
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;

  // Audit trail
  created_by_user_id?: string;
  last_modified_by_user_id?: string;
}

export interface CreatePrivacyRequestInput {
  request_type: PrivacyRequestType;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  request_description?: string;
  requested_data_categories?: string[];
  scope?: DataScope;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// CONSENT TYPES
// =============================================================================

export type ConsentType =
  | 'data_collection'
  | 'data_processing'
  | 'data_sharing'
  | 'marketing_communications'
  | 'analytics'
  | 'opt_out_sale'
  | 'limit_sensitive_pi'
  | 'third_party_sharing'
  | 'cookies_essential'
  | 'cookies_analytics'
  | 'cookies_marketing';

export type ConsentMethod =
  | 'explicit_opt_in'
  | 'explicit_opt_out'
  | 'implied'
  | 'pre_checked_box'
  | 'unchecked_box'
  | 'toggle_switch'
  | 'button_click'
  | 'form_submission'
  | 'api_call';

export interface ConsentRecord {
  id: string;
  created_at: string;
  updated_at: string;

  // User and organization
  user_id: string;
  organization_id?: string;

  // Consent details
  consent_type: ConsentType;
  consent_given: boolean;
  consent_version: string;

  // Context
  consent_method: ConsentMethod;
  consent_text?: string;
  consent_scope?: Record<string, unknown>;

  // Tracking
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  location_country?: string;
  location_region?: string;

  // Expiration and withdrawal
  expires_at?: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface CreateConsentRecordInput {
  user_id: string;
  consent_type: ConsentType;
  consent_given: boolean;
  consent_version: string;
  consent_method: ConsentMethod;
  consent_text?: string;
  consent_scope?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ConsentStatus {
  consent_type: ConsentType;
  is_granted: boolean;
  granted_at?: string;
  withdrawn_at?: string;
  expires_at?: string;
  consent_version: string;
}

// =============================================================================
// BREACH NOTIFICATION TYPES
// =============================================================================

export type BreachType =
  | 'unauthorized_access'
  | 'data_exfiltration'
  | 'ransomware'
  | 'insider_threat'
  | 'lost_device'
  | 'misconfiguration'
  | 'third_party_breach'
  | 'other';

export type BreachSeverity = 'critical' | 'high' | 'medium' | 'low';

export type RemediationStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'ongoing_monitoring';

export interface BreachNotification {
  id: string;
  created_at: string;
  updated_at: string;

  // Breach identification
  breach_number: string;
  breach_type: BreachType;
  severity: BreachSeverity;

  // Discovery and reporting
  discovered_at: string;
  reported_internally_at?: string;
  reported_externally_at?: string;

  // Affected data
  affected_user_count: number;
  affected_california_residents: number;
  data_types_exposed: string[];
  sensitive_data_exposed: boolean;

  // Impact assessment
  impact_description?: string;
  root_cause?: string;
  attack_vector?: string;
  systems_compromised?: string[];

  // Containment and remediation
  contained_at?: string;
  containment_actions?: string;
  remediation_status?: RemediationStatus;
  remediation_notes?: string;

  // Notification status
  notification_required: boolean;
  notification_deadline?: string;
  user_notification_sent: boolean;
  user_notification_sent_at?: string;
  user_notification_method?: string;

  // Regulatory notification
  california_ag_notified: boolean;
  california_ag_notified_at?: string;
  other_regulators_notified?: string[];

  // Law enforcement
  law_enforcement_notified: boolean;
  law_enforcement_agency?: string;
  law_enforcement_case_number?: string;

  // Insurance
  cyber_insurance_claim_filed: boolean;
  cyber_insurance_claim_number?: string;

  // Post-incident
  post_incident_review_completed: boolean;
  post_incident_review_date?: string;
  lessons_learned?: string;
  preventive_measures?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Audit trail
  created_by_user_id: string;
  last_modified_by_user_id?: string;
}

export interface CreateBreachNotificationInput {
  breach_type: BreachType;
  severity: BreachSeverity;
  discovered_at: string;
  affected_user_count: number;
  affected_california_residents: number;
  data_types_exposed: string[];
  sensitive_data_exposed: boolean;
  impact_description?: string;
  root_cause?: string;
  attack_vector?: string;
  systems_compromised?: string[];
  created_by_user_id: string;
}

export interface BreachNotificationTemplate {
  subject: string;
  body: string;
  recipient_email: string;
  breach_details: {
    breach_number: string;
    discovery_date: string;
    data_types_exposed: string[];
    what_happened: string;
    what_we_are_doing: string;
    what_you_can_do: string[];
    more_information_url: string;
  };
}

// =============================================================================
// DATA EXPORT TYPES
// =============================================================================

export interface UserDataExport {
  export_id: string;
  exported_at: string;
  consumer: {
    user_id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    role?: string;
    created_at?: string;
  };
  profile_data?: Record<string, unknown>;
  projects?: Array<Record<string, unknown>>;
  policies?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
  activity_logs?: Array<Record<string, unknown>>;
  relationships?: Array<Record<string, unknown>>;
  inferences?: {
    compliance_scores?: Array<Record<string, unknown>>;
    risk_assessments?: Array<Record<string, unknown>>;
  };
  collection_sources: string[];
  business_purposes: string[];
  third_parties: string[];
  retention_periods?: Record<string, string>;
}

// =============================================================================
// DATA DELETION TYPES
// =============================================================================

export interface DataDeletionRequest {
  request_id: string;
  user_id: string;
  requested_at: string;
  soft_delete_date: string;
  permanent_delete_date: string;
  deletion_scope: {
    user_profile: boolean;
    project_data: boolean;
    documents: boolean;
    activity_logs: boolean;
    consent_records: boolean;
  };
  exceptions: string[];
  status: 'pending' | 'soft_deleted' | 'permanently_deleted' | 'cancelled';
}

export interface DeletionResult {
  success: boolean;
  deleted_records: {
    users?: number;
    projects?: number;
    documents?: number;
    tasks?: number;
    activity_logs?: number;
  };
  retained_records: {
    table: string;
    count: number;
    reason: string;
  }[];
  errors?: string[];
}

// =============================================================================
// DPA TYPES
// =============================================================================

export type VendorType =
  | 'hosting'
  | 'database'
  | 'storage'
  | 'ocr_ai'
  | 'email'
  | 'authentication'
  | 'monitoring'
  | 'analytics'
  | 'other';

export type DPAStatus = 'pending' | 'under_review' | 'signed' | 'expired' | 'terminated';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DataProcessingAgreement {
  id: string;
  created_at: string;
  updated_at: string;

  // Vendor information
  vendor_name: string;
  vendor_contact_email: string;
  vendor_contact_phone?: string;
  vendor_type: VendorType;

  // Agreement details
  dpa_status: DPAStatus;
  dpa_signed_date?: string;
  dpa_expiration_date?: string;
  dpa_document_url?: string;

  // Data processing scope
  data_types_processed?: string[];
  processing_purposes?: string[];
  data_retention_period?: string;
  data_location_countries?: string[];

  // Compliance commitments
  ccpa_compliant: boolean;
  gdpr_compliant?: boolean;
  soc2_certified?: boolean;
  iso27001_certified?: boolean;
  hipaa_compliant?: boolean;

  // Breach notification requirements
  breach_notification_sla_hours: number;

  // Subprocessors
  subprocessors?: Array<{
    name: string;
    service: string;
    approved_date?: string;
  }>;

  // Review and audit
  last_review_date?: string;
  next_review_date?: string;
  audit_rights: boolean;
  last_audit_date?: string;

  // Risk assessment
  risk_level?: RiskLevel;
  risk_notes?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Audit trail
  created_by_user_id: string;
  last_modified_by_user_id?: string;
}

// =============================================================================
// SERVICE RESPONSE TYPES
// =============================================================================

export interface CCPAServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PrivacyRequestFilters {
  user_id?: string;
  requester_email?: string;
  status?: PrivacyRequestStatus;
  request_type?: PrivacyRequestType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface ConsentFilters {
  user_id?: string;
  consent_type?: ConsentType;
  consent_given?: boolean;
  active_only?: boolean;
}
