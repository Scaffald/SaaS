/**
 * Fixed UUID constants for ForSured test data
 * These IDs are deterministic for reproducible tests
 *
 * ID Naming Convention:
 * - 50000000-0000-0000-0000-0000000000XX: ForSured test users
 * - 60000000-0000-0000-0000-0000000000XX: ForSured test organizations
 * - 70000000-0000-0000-0000-0000000000XX: ForSured test projects
 * - 71000000-0000-0000-0000-0000000000XX: ForSured test subcontractors
 * - 72000000-0000-0000-0000-0000000000XX: ForSured test documents
 * - 73000000-0000-0000-0000-0000000000XX: ForSured test policies
 * - 74000000-0000-0000-0000-0000000000XX: ForSured test requirements
 * - 75000000-0000-0000-0000-0000000000XX: ForSured test tasks
 * - 76000000-0000-0000-0000-0000000000XX: ForSured test compliance scores
 */

// =============================================================================
// TEST USER IDs
// =============================================================================
export const FORSURED_USER_IDS = {
  // General Contractors (GC)
  GC_FRESH: '50000000-0000-0000-0000-000000000001',
  GC_ONBOARDING: '50000000-0000-0000-0000-000000000002',
  GC_ACTIVE: '50000000-0000-0000-0000-000000000003',
  GC_MULTIPROJECT: '50000000-0000-0000-0000-000000000004',

  // Contractors/Subcontractors
  CONTRACTOR_FRESH: '50000000-0000-0000-0000-000000000011',
  CONTRACTOR_ACTIVE: '50000000-0000-0000-0000-000000000012',
  CONTRACTOR_NONCOMPLIANT: '50000000-0000-0000-0000-000000000013',
  CONTRACTOR_MULTIPROJECT: '50000000-0000-0000-0000-000000000014',

  // Brokers
  BROKER_FRESH: '50000000-0000-0000-0000-000000000021',
  BROKER_ACTIVE: '50000000-0000-0000-0000-000000000022',

  // Admin
  ADMIN: '50000000-0000-0000-0000-000000000031',
  SUPER_ADMIN: '50000000-0000-0000-0000-000000000032',
} as const

// =============================================================================
// TEST ORGANIZATION IDs
// =============================================================================
export const FORSURED_ORG_IDS = {
  // GC Organizations
  GC_ORG_PRIMARY: '60000000-0000-0000-0000-000000000001',
  GC_ORG_SECONDARY: '60000000-0000-0000-0000-000000000002',
  GC_ORG_LARGE: '60000000-0000-0000-0000-000000000003',

  // Contractor Organizations
  CONTRACTOR_ORG_ACTIVE: '60000000-0000-0000-0000-000000000011',
  CONTRACTOR_ORG_NONCOMPLIANT: '60000000-0000-0000-0000-000000000012',
  CONTRACTOR_ORG_PENDING: '60000000-0000-0000-0000-000000000013',

  // Broker Organizations
  BROKER_ORG_PRIMARY: '60000000-0000-0000-0000-000000000021',
} as const

// =============================================================================
// TEST PROJECT IDs
// =============================================================================
export const FORSURED_PROJECT_IDS = {
  // Active projects
  PROJECT_ACTIVE_SMALL: '70000000-0000-0000-0000-000000000001',
  PROJECT_ACTIVE_MEDIUM: '70000000-0000-0000-0000-000000000002',
  PROJECT_ACTIVE_LARGE: '70000000-0000-0000-0000-000000000003',

  // Projects with compliance issues
  PROJECT_NONCOMPLIANT: '70000000-0000-0000-0000-000000000011',
  PROJECT_WARNING: '70000000-0000-0000-0000-000000000012',

  // Completed projects
  PROJECT_COMPLETED: '70000000-0000-0000-0000-000000000021',
} as const

// =============================================================================
// TEST SUBCONTRACTOR IDs
// =============================================================================
export const FORSURED_SUBCONTRACTOR_IDS = {
  // Compliant subcontractors
  SUB_COMPLIANT_ELECTRICAL: '71000000-0000-0000-0000-000000000001',
  SUB_COMPLIANT_PLUMBING: '71000000-0000-0000-0000-000000000002',
  SUB_COMPLIANT_HVAC: '71000000-0000-0000-0000-000000000003',
  SUB_COMPLIANT_ROOFING: '71000000-0000-0000-0000-000000000004',

  // Warning status subcontractors
  SUB_WARNING_EXPIRING: '71000000-0000-0000-0000-000000000011',
  SUB_WARNING_COVERAGE: '71000000-0000-0000-0000-000000000012',

  // Non-compliant subcontractors
  SUB_NONCOMPLIANT_EXPIRED: '71000000-0000-0000-0000-000000000021',
  SUB_NONCOMPLIANT_MISSING: '71000000-0000-0000-0000-000000000022',
} as const

// =============================================================================
// TEST DOCUMENT IDs
// =============================================================================
export const FORSURED_DOCUMENT_IDS = {
  // Approved documents
  DOC_COI_APPROVED_1: '72000000-0000-0000-0000-000000000001',
  DOC_COI_APPROVED_2: '72000000-0000-0000-0000-000000000002',
  DOC_COI_APPROVED_3: '72000000-0000-0000-0000-000000000003',

  // Pending documents
  DOC_COI_PENDING: '72000000-0000-0000-0000-000000000011',

  // Rejected documents
  DOC_COI_REJECTED: '72000000-0000-0000-0000-000000000021',

  // Processing documents
  DOC_COI_PROCESSING: '72000000-0000-0000-0000-000000000031',
} as const

// =============================================================================
// TEST POLICY IDs
// =============================================================================
export const FORSURED_POLICY_IDS = {
  // General Liability policies
  POLICY_GL_ACTIVE_1: '73000000-0000-0000-0000-000000000001',
  POLICY_GL_ACTIVE_2: '73000000-0000-0000-0000-000000000002',
  POLICY_GL_EXPIRING: '73000000-0000-0000-0000-000000000003',
  POLICY_GL_EXPIRED: '73000000-0000-0000-0000-000000000004',

  // Workers Comp policies
  POLICY_WC_ACTIVE: '73000000-0000-0000-0000-000000000011',
  POLICY_WC_EXPIRING: '73000000-0000-0000-0000-000000000012',

  // Umbrella policies
  POLICY_UMBRELLA_ACTIVE: '73000000-0000-0000-0000-000000000021',

  // Auto policies
  POLICY_AUTO_ACTIVE: '73000000-0000-0000-0000-000000000031',
} as const

// =============================================================================
// TEST REQUIREMENT IDs
// =============================================================================
export const FORSURED_REQUIREMENT_IDS = {
  REQ_GL_STANDARD: '74000000-0000-0000-0000-000000000001',
  REQ_GL_HIGH: '74000000-0000-0000-0000-000000000002',
  REQ_WC_STANDARD: '74000000-0000-0000-0000-000000000011',
  REQ_UMBRELLA_STANDARD: '74000000-0000-0000-0000-000000000021',
  REQ_AUTO_STANDARD: '74000000-0000-0000-0000-000000000031',
} as const

// =============================================================================
// TEST TASK IDs
// =============================================================================
export const FORSURED_TASK_IDS = {
  // Pending tasks
  TASK_PENDING_UPLOAD: '75000000-0000-0000-0000-000000000001',
  TASK_PENDING_REVIEW: '75000000-0000-0000-0000-000000000002',

  // In progress tasks
  TASK_INPROGRESS_1: '75000000-0000-0000-0000-000000000011',
  TASK_INPROGRESS_2: '75000000-0000-0000-0000-000000000012',

  // Completed tasks
  TASK_COMPLETED_1: '75000000-0000-0000-0000-000000000021',
  TASK_COMPLETED_2: '75000000-0000-0000-0000-000000000022',
} as const

// =============================================================================
// TEST COMPLIANCE SCORE IDs
// =============================================================================
export const FORSURED_COMPLIANCE_IDS = {
  SCORE_COMPLIANT_100: '76000000-0000-0000-0000-000000000001',
  SCORE_COMPLIANT_95: '76000000-0000-0000-0000-000000000002',
  SCORE_WARNING_75: '76000000-0000-0000-0000-000000000011',
  SCORE_WARNING_60: '76000000-0000-0000-0000-000000000012',
  SCORE_CRITICAL_40: '76000000-0000-0000-0000-000000000021',
  SCORE_CRITICAL_20: '76000000-0000-0000-0000-000000000022',
} as const

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type ForsuredUserId = (typeof FORSURED_USER_IDS)[keyof typeof FORSURED_USER_IDS]
export type ForsuredOrgId = (typeof FORSURED_ORG_IDS)[keyof typeof FORSURED_ORG_IDS]
export type ForsuredProjectId = (typeof FORSURED_PROJECT_IDS)[keyof typeof FORSURED_PROJECT_IDS]
export type ForsuredSubcontractorId =
  (typeof FORSURED_SUBCONTRACTOR_IDS)[keyof typeof FORSURED_SUBCONTRACTOR_IDS]
export type ForsuredDocumentId = (typeof FORSURED_DOCUMENT_IDS)[keyof typeof FORSURED_DOCUMENT_IDS]
export type ForsuredPolicyId = (typeof FORSURED_POLICY_IDS)[keyof typeof FORSURED_POLICY_IDS]
export type ForsuredRequirementId =
  (typeof FORSURED_REQUIREMENT_IDS)[keyof typeof FORSURED_REQUIREMENT_IDS]
export type ForsuredTaskId = (typeof FORSURED_TASK_IDS)[keyof typeof FORSURED_TASK_IDS]
export type ForsuredComplianceId =
  (typeof FORSURED_COMPLIANCE_IDS)[keyof typeof FORSURED_COMPLIANCE_IDS]
