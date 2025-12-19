/**
 * Audit Logging System Type Definitions
 *
 * Comprehensive type definitions for the audit logging system supporting:
 * - 8 event categories (authentication, authorization, data_access, data_modification, admin, security, compliance, system)
 * - WORM (Write Once Read Many) implementation
 * - 7-year retention with tiered storage
 * - Hash chaining for tamper detection
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Audit event categories following the taxonomy defined in plans/51_AUDIT_LOGGING_SYSTEM.md
 */
export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'admin'
  | 'security'
  | 'compliance'
  | 'system';

/**
 * Event severity levels for alerting and filtering
 */
export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Event status indicating success or failure
 */
export type AuditStatus = 'success' | 'failure' | 'partial' | 'denied';

/**
 * Database operations that trigger audit events
 */
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | 'EXECUTE';

/**
 * Core audit log record structure
 */
export interface AuditLogRecord {
  // Primary identification
  id?: string;
  created_at?: string;

  // Event classification
  category: AuditCategory;
  action: string;
  severity?: AuditSeverity;

  // Actor (who performed the action)
  user_id?: string;
  organization_id?: string;
  impersonated_by_user_id?: string;

  // Target (what was affected)
  table_name?: string;
  record_id?: string;
  resource_type?: string;
  resource_name?: string;

  // Operation details
  operation?: AuditOperation;

  // Data changes (for modifications)
  old_data?: any;
  new_data?: any;
  changed_fields?: string[];

  // Event metadata (flexible storage)
  metadata?: Record<string, any>;

  // Request context
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;

  // Geographic context
  country_code?: string;
  region?: string;
  city?: string;

  // Result and status
  status?: AuditStatus;
  error_message?: string;

  // Tamper prevention
  previous_hash?: string;
  current_hash?: string;
  signature?: string;

  // Retention metadata
  retention_period?: string;
  archived_at?: string;
  purge_after?: string;
}

/**
 * 1. Authentication Events
 */
export interface AuthenticationEvent {
  category: 'authentication';
  action:
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'session_expired'
    | 'mfa_enabled'
    | 'mfa_disabled'
    | 'mfa_challenge_success'
    | 'mfa_challenge_failure'
    | 'password_reset_requested'
    | 'password_reset_completed'
    | 'password_changed';
  metadata?: {
    username?: string;
    email?: string;
    failure_reason?: string;
    mfa_method?: string;
    session_id?: string;
  };
}

/**
 * 2. Authorization Events
 */
export interface AuthorizationEvent {
  category: 'authorization';
  action:
    | 'permission_denied'
    | 'role_assigned'
    | 'role_removed'
    | 'permission_granted'
    | 'permission_revoked'
    | 'access_level_changed';
  metadata?: {
    user_id?: string;
    resource_type?: string;
    resource_id?: string;
    permission?: string;
    old_role?: string;
    new_role?: string;
  };
}

/**
 * 3. Data Access Events
 */
export interface DataAccessEvent {
  category: 'data_access';
  action:
    | 'view_policy'
    | 'view_document'
    | 'view_project'
    | 'view_compliance_record'
    | 'view_task'
    | 'view_sensitive_data'
    | 'export_data'
    | 'search_data';
  metadata?: {
    resource_type?: string;
    resource_id?: string;
    fields_accessed?: string[];
    search_query?: string;
    export_format?: string;
    record_count?: number;
  };
}

/**
 * 4. Data Modification Events
 */
export interface DataModificationEvent {
  category: 'data_modification';
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'soft_delete'
    | 'restore'
    | 'bulk_update'
    | 'bulk_delete';
  metadata?: {
    table_name?: string;
    record_id?: string;
    changed_fields?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    record_count?: number; // for bulk operations
  };
}

/**
 * 5. Admin Actions
 */
export interface AdminActionEvent {
  category: 'admin';
  action:
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'user_suspended'
    | 'user_reactivated'
    | 'organization_created'
    | 'organization_updated'
    | 'organization_deleted'
    | 'config_changed'
    | 'integration_configured'
    | 'api_key_generated'
    | 'api_key_revoked';
  metadata?: {
    target_user_id?: string;
    target_org_id?: string;
    config_key?: string;
    old_value?: any;
    new_value?: any;
    api_key_id?: string;
  };
}

/**
 * 6. Security Events
 */
export interface SecurityEvent {
  category: 'security';
  action:
    | 'password_change'
    | 'suspicious_activity'
    | 'rate_limit_exceeded'
    | 'ip_blocked'
    | 'account_locked'
    | 'brute_force_attempt'
    | 'unauthorized_access'
    | 'data_breach_attempt'
    | 'sql_injection_attempt'
    | 'xss_attempt';
  metadata?: {
    threat_level?: 'low' | 'medium' | 'high' | 'critical';
    detection_method?: string;
    blocked?: boolean;
    additional_details?: any;
  };
}

/**
 * 7. Compliance Actions
 */
export interface ComplianceActionEvent {
  category: 'compliance';
  action:
    | 'document_approved'
    | 'document_rejected'
    | 'compliance_evaluation_run'
    | 'compliance_score_calculated'
    | 'policy_expiration_detected'
    | 'endorsement_verified'
    | 'broker_ack_submitted'
    | 'broker_ack_approved'
    | 'audit_report_generated';
  metadata?: {
    document_id?: string;
    policy_id?: string;
    project_id?: string;
    subcontractor_id?: string;
    compliance_score?: number;
    findings?: string[];
  };
}

/**
 * 8. System Events
 */
export interface SystemEvent {
  category: 'system';
  action:
    | 'application_started'
    | 'application_stopped'
    | 'database_migration'
    | 'backup_completed'
    | 'backup_failed'
    | 'sync_completed'
    | 'sync_failed'
    | 'error_occurred'
    | 'performance_issue'
    | 'health_check_failed';
  metadata?: {
    service?: string;
    status?: 'success' | 'failure';
    error_message?: string;
    duration_ms?: number;
    additional_context?: any;
  };
}

/**
 * Union type of all audit events
 */
export type AuditEvent =
  | AuthenticationEvent
  | AuthorizationEvent
  | DataAccessEvent
  | DataModificationEvent
  | AdminActionEvent
  | SecurityEvent
  | ComplianceActionEvent
  | SystemEvent;

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  start_date?: string;
  end_date?: string;
  category?: AuditCategory;
  action?: string;
  severity?: AuditSeverity;
  user_id?: string;
  organization_id?: string;
  resource_type?: string;
  resource_id?: string;
  status?: AuditStatus;
  limit?: number;
  offset?: number;
}

/**
 * Audit log search result
 */
export interface AuditLogSearchResult {
  logs: AuditLogRecord[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Hash chain verification result
 */
export interface HashChainVerificationResult {
  valid: boolean;
  errors: string[];
  verified_count: number;
  failed_count: number;
}

/**
 * Storage tier types for retention management
 */
export type StorageTier = 'hot' | 'warm' | 'cold';

/**
 * Archive metadata for tiered storage
 */
export interface AuditLogArchiveMetadata {
  id: string;
  file_path: string;
  start_date: string;
  end_date: string;
  record_count: number;
  file_size_bytes: number;
  checksum: string;
  storage_tier: StorageTier;
  created_at: string;
}

/**
 * Alert rule definition
 */
export interface AuditAlertRule {
  name: string;
  description: string;
  condition: (events: AuditLogRecord[]) => boolean;
  severity: AuditSeverity;
  action: (events: AuditLogRecord[]) => Promise<void>;
  enabled: boolean;
}

/**
 * Alert notification
 */
export interface AuditAlert {
  id: string;
  rule_name: string;
  severity: AuditSeverity;
  title: string;
  message: string;
  triggered_at: string;
  events: AuditLogRecord[];
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

/**
 * Compliance report types
 */
export type ComplianceReportType = 'security_weekly' | 'compliance_monthly' | 'audit_trail' | 'gdpr' | 'ccpa' | 'soc2';

/**
 * Compliance report
 */
export interface ComplianceReport {
  id: string;
  type: ComplianceReportType;
  title: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  generated_by: string;
  summary: Record<string, any>;
  events: AuditLogRecord[];
  findings: string[];
  recommendations: string[];
}
