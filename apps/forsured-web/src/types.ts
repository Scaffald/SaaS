export type UserRole = 'broker' | 'manager' | 'subcontractor' | 'admin';
export type UserType = 'broker' | 'manager' | 'subcontractor' | 'admin';

// =============================================================================
// User Profile Types (REQ-126: OAuth 2.0 + RBAC)
// =============================================================================

/**
 * User profile stored in Supabase user_profiles table
 * Links Scaffald OAuth user to ForSured role and onboarding state
 */
export interface UserProfile {
  id: string;
  scaffald_user_id: string;
  user_type: UserType;
  /** REQ-4: User set type for industry-specific lexicon */
  user_set_type_id?: string | null;
  onboarding_completed: boolean;
  company_connected: boolean;
  onboarding_step: number;
  onboarding_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// RBAC Permission Types (REQ-126: OAuth 2.0 + RBAC)
// =============================================================================

/**
 * Permission enum for role-based access control
 */
export enum Permission {
  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_VIEW_ALL = 'project:view:all',
  PROJECT_VIEW_ASSIGNED = 'project:view:assigned',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',

  // Tasks
  TASK_CREATE = 'task:create',
  TASK_VIEW_ASSIGNED = 'task:view:assigned',
  TASK_ASSIGN = 'task:assign',
  TASK_COMPLETE = 'task:complete',

  // Documents
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_VIEW = 'document:view',
  DOCUMENT_DOWNLOAD = 'document:download',
  DOCUMENT_DELETE = 'document:delete',

  // Policies
  POLICY_CREATE = 'policy:create',
  POLICY_VIEW = 'policy:view',
  POLICY_EDIT = 'policy:edit',
  POLICY_APPROVE = 'policy:approve',

  // Users
  USER_CREATE = 'user:create',
  USER_VIEW = 'user:view',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
}

/**
 * Role permissions mapping - defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserType, Permission[]> = {
  manager: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_ASSIGN,
    Permission.TASK_COMPLETE,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_DELETE,
    Permission.POLICY_VIEW,
    Permission.USER_VIEW,
  ],

  subcontractor: [
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_COMPLETE,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.DOCUMENT_DELETE,
    Permission.POLICY_VIEW,
  ],

  broker: [
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_VIEW_ASSIGNED,
    Permission.TASK_CREATE,
    Permission.TASK_VIEW_ASSIGNED,
    Permission.TASK_ASSIGN,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_VIEW,
    Permission.DOCUMENT_DOWNLOAD,
    Permission.POLICY_CREATE,
    Permission.POLICY_VIEW,
    Permission.POLICY_EDIT,
    Permission.POLICY_APPROVE,
    Permission.USER_VIEW,
  ],
};
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SubcontractorTaskStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected';

// REQ-282: Extended task status for project task displays
export type ProjectTaskStatus =
  | 'submitted'    // Sub submitted response/document
  | 'in_review'    // Broker/GC reviewing submission
  | 'approved'     // Submission accepted
  | 'rejected'     // Submission rejected with reason
  | 'needs_info';  // More information required
export type SubcontractorTaskType =
  | 'coi_upload'
  | 'endorsement_correction'
  | 'auto_symbol_compliance'
  | 'limit_inadequacy'
  | 'operations_language';
export type TaskOriginRole = 'manager' | 'broker';
export type TaskSourceType = 'org_requirement' | 'project_requirement' | 'manual';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

// =============================================================================
// Due Date Source Types (REQ-267)
// =============================================================================

/**
 * REQ-267: Due Date Inference & Management
 * Source of how a task's due date was determined
 */
export type DueDateSource =
  | 'inferred_policy'   // Auto-calculated from policy expiration (30 days before)
  | 'inferred_project'  // Auto-calculated from project start date (7 days before)
  | 'inferred_onboarding' // Auto-calculated from onboarding deadline
  | 'manual'            // Manually set by task creator
  | 'gc_set'            // Set by General Contractor
  | 'broker_set';       // Set by Broker

// =============================================================================
// Task Severity Types (REQ-266)
// =============================================================================

/**
 * Task severity levels for compliance correlation
 * Maps to business consequences and risk levels
 */
export type TaskSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Task severity enum for type-safe comparisons and iteration
 */
export const TaskSeverityLevel = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

/**
 * Business consequence types that drive task severity
 * These represent the real-world impact of compliance issues
 */
export type ConsequenceType =
  | 'site_access_denied'      // Critical: Sub cannot work on site
  | 'payment_hold'            // Critical: Payment withheld until resolved
  | 'contract_termination'    // Critical: Risk of contract cancellation
  | 'incomplete_bid'          // High: Bid cannot proceed
  | 'project_delay'           // High: Project timeline at risk
  | 'audit_failure'           // High: Failed compliance audit
  | 'coverage_gap'            // Medium: Insurance gap identified
  | 'endorsement_missing'     // Medium: Required endorsement not present
  | 'expiring_soon'           // Low: Policy expiring within grace period
  | 'documentation_needed'    // Low: Additional docs required
  | 'review_recommended'      // Info: Suggested review, no immediate action
  | 'notification';           // Info: Informational notification

/**
 * Maps consequence types to their corresponding task severity level
 */
export const CONSEQUENCE_SEVERITY_MAP: Record<ConsequenceType, TaskSeverity> = {
  // Critical consequences - immediate action required
  site_access_denied: 'critical',
  payment_hold: 'critical',
  contract_termination: 'critical',
  // High consequences - urgent but not blocking
  incomplete_bid: 'high',
  project_delay: 'high',
  audit_failure: 'high',
  // Medium consequences - attention needed
  coverage_gap: 'medium',
  endorsement_missing: 'medium',
  // Low consequences - routine follow-up
  expiring_soon: 'low',
  documentation_needed: 'low',
  // Info consequences - awareness only
  review_recommended: 'info',
  notification: 'info',
};

/**
 * Task severity display configuration for UI consistency
 */
export const TASK_SEVERITY_CONFIG: Record<TaskSeverity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  priority: number;
}> = {
  critical: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    priority: 5,
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    priority: 4,
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    priority: 3,
  },
  low: {
    label: 'Low',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    priority: 2,
  },
  info: {
    label: 'Info',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-500',
    priority: 1,
  },
};
export type ComplianceStatus =
  | 'compliant'
  | 'warning'
  | 'critical'
  | 'non_compliant'
  | 'partial';
export type PolicyType =
  | 'general_liability'
  | 'workers_comp'
  | 'commercial_auto'
  | 'umbrella_excess'
  | 'professional_liability'
  | 'pollution_liability'
  | 'builders_risk'
  | 'equipment_floater';
export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type ClientType =
  | 'general_contractor'
  | 'subcontractor'
  | 'owner'
  | 'developer';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AcknowledgementStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';
export type RelationshipStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended';

export interface User {
  id: string;
  organization_id?: string;
  name: string;
  email: string;
  role: UserRole;
  broker_role?: string;
  company: string;
  avatar?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus | SubcontractorTaskStatus | ProjectTaskStatus;
  priority: TaskPriority;
  due_date?: string;
  // REQ-267: Due Date Inference & Management
  due_date_source?: DueDateSource;
  created_by_user_id: string;
  assigned_to_user_id?: string;
  client_id?: string;
  project_id?: string;
  policy_id?: string;
  policy_number?: string;
  task_type?: string | SubcontractorTaskType;
  metadata?: unknown | SubcontractorTaskMetadata;
  created_at: string;
  updated_at: string;
  // REQ-272: Task Source Tracking
  source_type?: TaskSourceType;
  source_requirement_id?: string;
  // Subcontractor task specific fields
  origin_role?: TaskOriginRole;
  project_name?: string;
  gc_company_name?: string;
  // REQ-282: Context fields for project task display
  sub_company_name?: string;
  // REQ-282: Rejection reason for rejected tasks
  rejection_reason?: string;
  created_by?: {
    id: string;
    name: string;
    role: string;
  };
  quick_actions?: string[];
  document_link?: string;
  target_role?: string;
  // REQ-266: Task Severity for compliance correlation
  severity?: TaskSeverity;
  consequence_type?: ConsequenceType;
}

/**
 * REQ-267: Due Date Change History
 * Tracks all changes to task due dates for audit trail
 */
export interface TaskDueDateHistory {
  id: string;
  task_id: string;
  old_due_date?: string;
  new_due_date?: string;
  source: DueDateSource;
  changed_by_user_id: string;
  changed_by?: {
    id: string;
    name: string;
    email?: string;
  };
  changed_at: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  /** Organization that owns this project (maps to forsured.projects.organization_id) */
  organization_id: string;
  /** @deprecated Use organization_id instead - kept for backwards compatibility */
  client_id?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  contract_value?: number;
  project_manager?: string;
  compliance_status?: ComplianceStatus;
  general_liability_required?: number;
  workers_comp_required?: number;
  auto_liability_required?: number;
  umbrella_required?: number;
  professional_liability_required?: number;
  pollution_liability_required?: number;
  builders_risk_required?: number;
  additional_insureds?: string[];
  waiver_of_subrogation_required?: boolean;
  primary_non_contributory_required?: boolean;
  certificate_holder?: string;
  special_provisions?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerClient {
  id: string;
  broker_org_id: string;
  client_org_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  client_type: ClientType;
  risk_level: RiskLevel;
  compliance_score?: number;
  status: string;
  last_activity_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  /** Primary contact name for display purposes (alias for contact_name) */
  primary_contact?: string;
}

export interface PolicyData {
  id: string;
  client_id: string;
  policy_type: PolicyType;
  policy_number: string;
  provider: string;
  coverage_amount: number;
  premium_amount?: number;
  start_date: string;
  end_date: string;
  status: PolicyStatus;
  deductible?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  client_id: string;
  overall_score: number;
  last_review_date: string;
  next_review_date?: string;
  risk_level: RiskLevel;
  issues_count: number;
  warnings_count: number;
  policies_expiring_soon: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerSubcontractorRelationship {
  id: string;
  manager_org_id: string;
  subcontractor_org_id: string;
  status: RelationshipStatus;
  relationship_health_score?: number;
  projects_together_count?: number;
  total_contract_value?: number;
  last_project_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectParticipant {
  id: string;
  project_id: string;
  organization_id: string;
  user_id?: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at?: string;
  removed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerClientDelegation {
  id: string;
  broker_org_id: string;
  client_org_id: string;
  granted_by_user_id: string;
  scope: string;
  permissions: string[];
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerClientAssignment {
  id: string;
  broker_org_id: string;
  client_org_id: string;
  broker_user_id: string;
  assigned_by_user_id: string;
  role: string;
  assigned_at: string;
  removed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerAcknowledgementForm {
  id: string;
  subcontractor_org_id: string;
  broker_org_id: string;
  project_id: string;
  manager_org_id: string;
  subcontractor_company_name: string;
  broker_agency_name: string;
  broker_contact_name: string;
  broker_email: string;
  broker_phone?: string;
  gc_project_name: string;
  date_issued: string;
  date_due: string;
  date_submitted?: string;
  date_reviewed?: string;
  status: AcknowledgementStatus;
  compliance_status?: ComplianceStatus;
  compliance_score?: number;
  missing_endorsements?: string[];
  manager_notes?: string;
  requires_pollution_liability?: boolean;
  requires_professional_liability?: boolean;
  involves_hazardous_materials?: boolean;
  involves_trenching?: boolean;
  involves_residential_work?: boolean;
  created_by_user_id: string;
  submitted_by_user_id?: string;
  reviewed_by_user_id?: string;
  coverage_items?: AcknowledgementCoverageItem[];
  signatures?: AcknowledgementSignature[];
  created_at: string;
  updated_at: string;
}

export interface AcknowledgementCoverageItem {
  id: string;
  form_id: string;
  coverage_type: PolicyType;
  policy_number?: string;
  carrier?: string;
  coverage_amount?: number;
  effective_date?: string;
  expiration_date?: string;
  verified: boolean;
  verified_by_user_id?: string;
  verified_at?: string;
  notes?: string;
  required_endorsements?: string[];
  has_all_endorsements?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcknowledgementSignature {
  id: string;
  form_id: string;
  signer_user_id: string;
  signer_name: string;
  signer_title: string;
  signer_email: string;
  signature_type: 'broker' | 'subcontractor' | 'manager';
  signed_at: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  avatar?: string;
}

export interface BrokerContact {
  name: string;
  email: string;
  phone?: string;
}

export interface SubcontractorTaskMetadata {
  severity_level: SeverityLevel;
  compliance_issue_type: string;
  // Endorsement-specific fields
  missing_endorsement?: string;
  required_endorsement_form?: string;
  current_endorsement?: string;
  required_endorsement?: string;
  correction_instructions?: string;
  // Auto symbol-specific fields
  current_symbol?: string;
  required_symbol?: string;
  symbol_explanation?: string;
  // Limit inadequacy-specific fields
  current_limit?: number;
  required_limit?: number;
  gap_amount?: number;
  // Operations language-specific fields
  current_language?: string;
  required_language?: string;
  // COI upload specific fields
  required_endorsements?: string[];
  // Common fields
  requirements_link?: string;
  broker_contact?: BrokerContact;
  rejection_reason?: string;
}

// REQ-17: Workflow Activation Types

export type ApprovalItemType =
  | 'endorsement_review'
  | 'waiver_request'
  | 'policy_renewal'
  | 'document_verification'
  | 'bid_approval'
  | 'coverage_gap'
  | 'user_invite';
export type ApprovalItemStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';
export type ApprovalPriority = 'urgent' | 'high' | 'normal' | 'low';
export type UserRoleRBAC = 'admin' | 'manager' | 'user';
export type AuthMethod = 'api_key' | 'oauth' | 'username_password';
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type EntityType = 'task' | 'document' | 'project' | 'bid';
export type DocumentViewMode = 'inline' | 'modal' | 'split-screen';

export interface Comment {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string;
  content: string;
  mentions?: string[]; // User IDs
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url?: string; // Mock URL
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  title: string;
  description: string;
  requested_by: string;
  requested_at: string;
  due_date?: string;
  priority: ApprovalPriority;
  status: ApprovalItemStatus;
  related_items: {
    project_id?: string;
    client_id?: string;
    document_id?: string;
    user_id?: string;
  };
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CoverageGap {
  type: string;
  required: number;
  actual: number;
  status: 'insufficient' | 'sufficient' | 'exceeds';
}

export interface BidProposal {
  id: string;
  project_id: string;
  subcontractor_id: string;
  bid_amount: number;
  scope_of_work: string;
  proposed_timeline: { start: string; end: string };
  documents: { type: string; file_id: string }[];
  submitted_at: string;
  status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected';
  compliance_score?: number;
  coverage_gaps?: CoverageGap[];
  risk_assessment?: string;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  name: string;
  role: UserRoleRBAC;
  invited_by: string;
  invited_at: string;
  status: 'pending' | 'accepted' | 'expired';
  project_ids?: string[];
  client_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnection {
  id: string;
  integration_id: string;
  user_id: string;
  status: ConnectionStatus;
  auth_method: AuthMethod;
  credentials: Record<string, string>; // Mocked
  sync_settings: {
    data_types: ('projects' | 'documents' | 'payments' | 'contacts')[];
    frequency: SyncFrequency;
    initial_sync: boolean;
  };
  last_sync?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceIssue {
  id: string;
  subcontractor_id: string;
  project_id?: string;
  type:
    | 'coverage_gap'
    | 'missing_document'
    | 'expired_policy'
    | 'failed_verification'
    | 'missing_endorsement';
  title: string;
  description: string;
  severity: SeverityLevel;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  due_date?: string;
  resolved_at?: string;
  resolution_notes?: string;
  related_document_id?: string;
  assigned_to?: string; // REQ-279: User ID responsible for resolving this issue
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_size: number;
  file_url?: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
}

export interface AIExtractedFields {
  id: string;
  document_id: string;
  policy_number?: string;
  carrier?: string;
  coverage_amounts?: { type: string; amount: number }[];
  effective_date?: string;
  expiry_date?: string;
  named_insureds?: string[];
  confidence: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface ComparisonResult {
  overallMatch: number; // 0-100
  gaps: CoverageGap[];
  recommendations: string[];
  confidence: number; // 0-100
}

export interface AIAnalysisResult {
  scope: string;
  findings: string[];
  confidence: number;
  recommendations: string[];
  actionsTaken: string[];
  actionsRequiringReview: string[];
}

// =============================================================================
// Insurance Policy Parent-Child Model (REQ-262)
// =============================================================================

export type InsurancePolicyType = 'GL' | 'WC' | 'Auto' | 'Umbrella' | 'Professional Liability' | 'Other';
export type InsurancePolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type ProvisionType =
  | 'per_occurrence'
  | 'general_aggregate'
  | 'personal_advertising'
  | 'products_completed'
  | 'medical_payments'
  | 'damage_to_premises'
  | 'fire_damage'
  | 'employee_benefits'
  | 'other';

/**
 * Insurance Policy (parent entity)
 * Represents a complete insurance policy with child provisions and endorsements
 */
export interface InsurancePolicy {
  id: string;
  organization_id: string;
  project_id?: string;
  policy_number?: string;
  policy_type: InsurancePolicyType;
  carrier_name?: string;
  aggregate_limit?: number;
  each_occurrence_limit?: number;
  deductible?: number;
  effective_date?: string;
  expiration_date?: string;
  status: InsurancePolicyStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // REQ-270: Umbrella policies track which underlying coverages they extend
  underlying_policy_ids?: string[];
  // Populated from underlying_policy_ids - full policy objects for display
  underlying_coverages?: InsurancePolicy[];
  // Nested children (loaded separately or via joins)
  provisions?: PolicyProvision[];
  endorsements?: PolicyEndorsement[];
}

/**
 * Policy Provision (child entity)
 * Represents a sub-limit or provision within an insurance policy
 */
export interface PolicyProvision {
  id: string;
  policy_id: string;
  organization_id: string;
  provision_type: ProvisionType;
  limit_amount?: number;
  deductible?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Policy Endorsement (child entity)
 * Represents an additional coverage or endorsement added to an insurance policy
 */
export interface PolicyEndorsement {
  id: string;
  policy_id: string;
  organization_id: string;
  endorsement_code?: string;
  endorsement_type: string;
  description?: string;
  limit_amount?: number;
  effective_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a new insurance policy with optional children
 */
export interface CreateInsurancePolicyRequest {
  organization_id: string;
  project_id?: string;
  policy_number?: string;
  policy_type: InsurancePolicyType;
  carrier_name?: string;
  aggregate_limit?: number;
  each_occurrence_limit?: number;
  deductible?: number;
  effective_date?: string;
  expiration_date?: string;
  status?: InsurancePolicyStatus;
  provisions?: Omit<PolicyProvision, 'id' | 'policy_id' | 'organization_id' | 'created_at' | 'updated_at'>[];
  endorsements?: Omit<PolicyEndorsement, 'id' | 'policy_id' | 'organization_id' | 'created_at' | 'updated_at'>[];
}

/**
 * Request payload for updating an insurance policy
 */
export interface UpdateInsurancePolicyRequest {
  policy_number?: string;
  policy_type?: InsurancePolicyType;
  carrier_name?: string;
  aggregate_limit?: number;
  each_occurrence_limit?: number;
  deductible?: number;
  effective_date?: string;
  expiration_date?: string;
  status?: InsurancePolicyStatus;
}

/**
 * Request payload for creating a new provision
 */
export interface CreateProvisionRequest {
  provision_type: ProvisionType;
  limit_amount?: number;
  deductible?: number;
  description?: string;
}

/**
 * Request payload for creating a new endorsement
 */
export interface CreateEndorsementRequest {
  endorsement_code?: string;
  endorsement_type: string;
  description?: string;
  limit_amount?: number;
  effective_date?: string;
}

// =============================================================================
// Compliance Flags Types (REQ-269)
// =============================================================================

/**
 * Entity types that can have compliance flags attached
 */
export type FlaggableEntityType = 'policy' | 'provision' | 'endorsement';

/**
 * Severity levels for compliance flags
 */
export type FlagSeverity = 'info' | 'warning' | 'critical';

/**
 * Status of a compliance flag
 */
export type FlagStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * Predefined flag types for categorizing compliance issues
 */
export type ComplianceFlagType =
  | 'coverage_gap'           // Required coverage not present
  | 'limit_insufficient'     // Coverage limit below requirement
  | 'expired'                // Policy/endorsement has expired
  | 'expiring_soon'          // Policy/endorsement expiring within threshold
  | 'missing_endorsement'    // Required endorsement not present
  | 'symbol_mismatch'        // Auto symbol doesn't match requirement
  | 'deductible_exceeded'    // Deductible exceeds allowed amount
  | 'named_insured_missing'  // Required named insured not present
  | 'waiver_subrogation'     // Waiver of subrogation issue
  | 'additional_insured'     // Additional insured issue
  | 'primary_noncontributory' // Primary and non-contributory issue
  | 'other';                 // Other/custom flag type

/**
 * Compliance Flag entity
 * Polymorphic flag attached to a policy, provision, or endorsement
 */
export interface ComplianceFlag {
  id: string;
  entity_type: FlaggableEntityType;
  entity_id: string;
  flag_type: ComplianceFlagType;
  severity: FlagSeverity;
  status: FlagStatus;
  title: string;
  description?: string;
  requirement_id?: string;
  project_id?: string;
  subcontractor_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

/**
 * Request payload for creating a compliance flag
 */
export interface CreateComplianceFlagRequest {
  entity_type: FlaggableEntityType;
  entity_id: string;
  flag_type: ComplianceFlagType;
  severity?: FlagSeverity;
  title: string;
  description?: string;
  requirement_id?: string;
  project_id?: string;
  subcontractor_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request payload for updating a compliance flag
 */
export interface UpdateComplianceFlagRequest {
  status?: FlagStatus;
  severity?: FlagSeverity;
  title?: string;
  description?: string;
  resolution_notes?: string;
}

/**
 * Compliance flag with resolved entity details for display
 */
export interface ComplianceFlagWithEntity extends ComplianceFlag {
  // Resolved entity reference (only one will be populated based on entity_type)
  policy?: InsurancePolicy;
  provision?: PolicyProvision;
  endorsement?: PolicyEndorsement;
}

/**
 * Flag severity display configuration
 */
export const FLAG_SEVERITY_CONFIG: Record<FlagSeverity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  priority: number;
}> = {
  critical: {
    label: 'Critical',
    color: 'text-danger-700',
    bgColor: 'bg-danger-100',
    borderColor: 'border-danger-300',
    icon: 'AlertTriangle',
    priority: 3,
  },
  warning: {
    label: 'Warning',
    color: 'text-warning-700',
    bgColor: 'bg-warning-100',
    borderColor: 'border-warning-300',
    icon: 'AlertCircle',
    priority: 2,
  },
  info: {
    label: 'Info',
    color: 'text-info-700',
    bgColor: 'bg-info-100',
    borderColor: 'border-info-300',
    icon: 'Info',
    priority: 1,
  },
};

// =============================================================================
// Task Documents Types (REQ-265)
// =============================================================================

/**
 * Task document type enum
 */
export type TaskDocumentType = 'uploaded' | 'linked_policy' | 'linked_certificate' | 'linked_endorsement';

/**
 * Task document - links tasks to uploaded documents or certificate references
 */
export interface TaskDocument {
  id: string;
  task_id: string;
  organization_id: string;
  document_type: TaskDocumentType;
  // Uploaded documents
  document_url?: string;
  document_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  // Linked references
  linked_policy_id?: string;
  linked_certificate_id?: string;
  // Metadata
  uploaded_by?: string;
  version: number;
  is_current_version: boolean;
  replaces_document_id?: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for uploading a document to a task
 */
export interface UploadTaskDocumentRequest {
  task_id: string;
  organization_id: string;
  document_url: string;
  document_name: string;
  file_size_bytes?: number;
  mime_type?: string;
  description?: string;
  notes?: string;
  replaces_document_id?: string; // For versioning
}

/**
 * Request payload for linking a policy/certificate to a task
 */
export interface LinkTaskDocumentRequest {
  task_id: string;
  organization_id: string;
  document_type: 'linked_policy' | 'linked_certificate' | 'linked_endorsement';
  linked_policy_id?: string;
  linked_certificate_id?: string;
  description?: string;
  notes?: string;
}

/**
 * Request payload for updating a task document
 */
export interface UpdateTaskDocumentRequest {
  description?: string;
  notes?: string;
}

// =============================================================================
// Coverage Requirements Types (REQ-271)
// =============================================================================

/**
 * Coverage type enum
 */
export type CoverageType = 'general_liability' | 'auto' | 'workers_comp' | 'umbrella' | 'professional_liability';

/**
 * Requirement type enum
 */
export type RequirementType = 'additional_insured' | 'waiver_of_subrogation' | 'primary_non_contributory' | 'certificate_holder';

/**
 * Coverage requirement - defines required additional insured, waiver, etc. for coverage types
 */
export interface CoverageRequirement {
  id: string;
  organization_id: string;
  project_id?: string;
  coverage_type: CoverageType;
  requirement_type: RequirementType;
  is_required: boolean;
  endorsement_codes?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a coverage requirement
 */
export interface CreateCoverageRequirementRequest {
  organization_id: string;
  project_id?: string;
  coverage_type: CoverageType;
  requirement_type: RequirementType;
  is_required: boolean;
  endorsement_codes?: string[];
  notes?: string;
}

/**
 * Request payload for updating a coverage requirement
 */
export interface UpdateCoverageRequirementRequest {
  is_required?: boolean;
  endorsement_codes?: string[];
  notes?: string;
}

// =============================================================================
// Coverage Request Types (REQ-273)
// =============================================================================

/**
 * Coverage request status enum
 */
export type CoverageRequestStatus = 'pending' | 'quoted' | 'approved' | 'rejected' | 'cancelled';

/**
 * Coverage request - workflow for subs to request coverage from brokers
 */
export interface CoverageRequest {
  id: string;
  organization_id: string;
  project_id?: string;
  requester_id: string;
  broker_id?: string;
  coverage_type: string;
  status: CoverageRequestStatus;
  quote_amount?: number;
  quote_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a new coverage request
 */
export interface CreateCoverageRequestRequest {
  organization_id: string;
  project_id?: string;
  coverage_type: string;
  broker_id?: string;
}

/**
 * Request payload for updating a coverage request
 */
export interface UpdateCoverageRequestRequest {
  status?: CoverageRequestStatus;
  broker_id?: string;
  quote_amount?: number;
  quote_details?: Record<string, any>;
}

/**
 * Request payload for broker to provide quote
 */
export interface ProvideQuoteRequest {
  quote_amount: number;
  quote_details?: Record<string, any>;
}

/**
 * REQ-267: Notification type for in-app notifications
 */
export type NotificationType = 'due_date_change' | 'task_assigned' | 'task_completed' | 'general';

/**
 * REQ-267: In-app notification
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
  read_at?: string;
}

/**
 * REQ-261: Task Type Category
 * Categories for organizing task types
 */
export type TaskTypeCategory =
  | 'document_review'
  | 'policy_management'
  | 'compliance'
  | 'onboarding'
  | 'custom';

/**
 * REQ-261: Default assignee role for task types
 */
export type TaskTypeAssigneeRole = 'broker' | 'manager' | 'contractor';

/**
 * REQ-261: Auto-assignment rules for task types
 */
export interface TaskTypeAutoAssignmentRules {
  /** Assign to project manager */
  assign_to_project_manager?: boolean;
  /** Assign to policy holder */
  assign_to_policy_holder?: boolean;
  /** Assign to specific role */
  assign_to_role?: TaskTypeAssigneeRole;
  /** Custom assignment logic identifier */
  custom_rule?: string;
}

/**
 * REQ-261: Task Type Definition
 * Defines a reusable task type with default settings
 */
export interface TaskType {
  id: string;
  /** Unique name for the task type */
  name: string;
  /** Description of what this task type is for */
  description?: string;
  /** Default priority when creating tasks of this type */
  default_priority: TaskPriority;
  /** Default due date offset in days from task creation */
  default_due_date_offset: number;
  /** Category for organizing task types */
  category: TaskTypeCategory;
  /** Icon identifier for visual distinction */
  icon?: string;
  /** Color hex code for visual distinction */
  color?: string;
  /** Default role to assign tasks to */
  default_assignee_role?: TaskTypeAssigneeRole;
  /** Rules for automatic task assignment */
  auto_assignment_rules?: TaskTypeAutoAssignmentRules;
  /** Whether this task type is active */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Coverage Limit Requirements (REQ-263)
// =============================================================================

/**
 * REQ-263: Coverage Requirement Level
 * Distinguishes between organization-wide and project-specific coverage requirements
 */
export type CoverageRequirementLevel = 'org' | 'project';

/**
 * REQ-263: Coverage Type for Limit Requirements
 * Standard insurance coverage types for minimum limit tracking
 */
export type CoverageLimitType =
  | 'general_liability'
  | 'workers_comp'
  | 'commercial_auto'
  | 'umbrella_excess'
  | 'professional_liability'
  | 'pollution_liability'
  | 'builders_risk'
  | 'equipment_floater';

/**
 * REQ-263: Coverage Limit Requirement
 * Defines minimum insurance coverage requirements at org or project level
 *
 * - org-level: applies to all projects in the organization (project_id = null)
 * - project-level: applies only to a specific project (project_id = NOT NULL)
 */
export interface CoverageLimitRequirement {
  id: string;
  /** Descriptive name for the requirement (e.g., "General Liability - Minimum") */
  name: string;
  /** Level of requirement: 'org' for company-wide, 'project' for project-specific */
  level: CoverageRequirementLevel;
  /** Organization this requirement belongs to */
  organization_id: string;
  /** Project this requirement applies to (null for org-level requirements) */
  project_id: string | null;
  /** Type of coverage this requirement specifies */
  coverage_type: CoverageLimitType;
  /** Minimum required coverage amount in dollars */
  minimum_limit: number;
  /** Whether this coverage is required (vs. recommended) */
  required: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * REQ-263: Request payload for creating a coverage limit requirement
 */
export interface CreateCoverageLimitRequirementRequest {
  name: string;
  level: CoverageRequirementLevel;
  organization_id: string;
  project_id?: string | null;
  coverage_type: CoverageLimitType;
  minimum_limit: number;
  required?: boolean;
}

/**
 * REQ-263: Request payload for updating a coverage limit requirement
 */
export interface UpdateCoverageLimitRequirementRequest {
  name?: string;
  coverage_type?: CoverageLimitType;
  minimum_limit?: number;
  required?: boolean;
}

/**
 * REQ-263: Compliance check result for a single requirement
 */
export interface CoverageLimitComplianceCheck {
  requirement_id: string;
  requirement_name: string;
  level: CoverageRequirementLevel;
  coverage_type: CoverageLimitType;
  required_limit: number;
  actual_limit: number | null;
  status: 'met' | 'unmet';
  gap_amount?: number;
}

/**
 * REQ-263: Overall compliance result for a subcontractor
 */
export interface CoverageLimitComplianceResult {
  subcontractor_id: string;
  organization_id: string;
  project_id?: string;
  overall_compliant: boolean;
  org_level_checks: CoverageLimitComplianceCheck[];
  project_level_checks: CoverageLimitComplianceCheck[];
  checked_at: string;
}
