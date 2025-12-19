/**
 * REQ-106: Database Schema Type Definitions
 *
 * This file defines TypeScript interfaces for all 9 database tables
 * in the ForSured MVP database schema.
 */

// ==================== ENUMS ====================

export type DocumentStatus = 'pending' | 'approved' | 'rejected';
export type CoverageType =
  | 'general_liability'
  | 'workers_comp'
  | 'umbrella'
  | 'auto';
export type UserRole = 'manager' | 'subcontractor' | 'broker' | 'admin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type EndorsementType =
  | 'additional_insured'
  | 'waiver_of_subrogation'
  | 'primary_non_contributory';

// ==================== TABLE INTERFACES ====================

/**
 * Projects Table
 * Stores construction projects managed by general contractors
 */
export interface DBProject {
  id: string; // UUID
  name: string;
  manager_id: string; // FK to users
  organization_id?: string; // FK to organizations (scaffald schema) - REQ-214
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Subcontractors Table
 * Stores subcontractor company information
 */
export interface DBSubcontractor {
  id: string; // UUID
  name: string;
  company: string;
  contact_info: {
    email: string;
    phone: string;
    address?: string;
  };
  created_at: string; // ISO 8601 timestamp
}

/**
 * Documents Table
 * Stores uploaded insurance documents
 */
export interface DBDocument {
  id: string; // UUID
  subcontractor_id: string; // FK to subcontractors
  project_id: string; // FK to projects
  file_url: string;
  upload_date: string; // ISO 8601 timestamp
  status: DocumentStatus;
  uploaded_by_scaffald_user_id?: string; // FK to users (scaffald schema) - REQ-214
}

/**
 * Policies Table
 * Stores insurance policy details extracted from documents
 */
export interface DBPolicy {
  id: string; // UUID
  document_id: string; // FK to documents
  policy_number: string; // UNIQUE
  carrier: string;
  start_date: string; // ISO 8601 date
  end_date: string; // ISO 8601 date
  coverage_type: CoverageType;
  coverage_amount: number; // Numeric
}

/**
 * Endorsements Table
 * Stores policy endorsements (additional terms)
 */
export interface DBEndorsement {
  id: string; // UUID
  policy_id: string; // FK to policies
  type: EndorsementType;
  details: Record<string, unknown>; // JSONB - flexible structure
}

/**
 * Requirements Table
 * Stores insurance requirements for each project
 */
export interface DBRequirement {
  id: string; // UUID
  project_id: string; // FK to projects
  coverage_type: CoverageType;
  minimum_amount: number; // Numeric
  endorsements_required: string[]; // Text array
}

/**
 * ComplianceScores Table
 * Stores compliance scores for subcontractor-project pairs
 */
export interface DBComplianceScore {
  id: string; // UUID
  project_id: string; // FK to projects
  subcontractor_id: string; // FK to subcontractors
  score: number; // Integer 0-100
  last_evaluated: string; // ISO 8601 timestamp
  gaps: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Tasks Table
 * Stores tasks/action items for compliance management
 */
export interface DBTask {
  id: string; // UUID
  project_id: string; // FK to projects
  subcontractor_id: string; // FK to subcontractors
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string; // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 timestamp, nullable
}

/**
 * Users Table
 * Stores user accounts with roles
 */
export interface DBUser {
  id: string; // UUID
  email: string; // UNIQUE
  role: UserRole;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Organizations Table (scaffald schema)
 * REQ-214: Cross-schema FK support for dual-schema architecture
 * Stores organization information - simulates scaffald.organizations
 */
export interface DBOrganization {
  id: string; // UUID
  name: string;
  slug: string; // UNIQUE
  type: 'broker' | 'general_contractor' | 'subcontractor';
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ==================== HELPER TYPES ====================

/**
 * Generic database response type matching Supabase API
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

/**
 * Database error structure matching Supabase format
 */
export interface DatabaseError {
  message: string;
  code: string; // PostgreSQL error codes (e.g., '23505', '23503')
  details: string;
  hint: string;
}

/**
 * Union type of all table names for type safety
 */
export type TableName =
  | 'projects'
  | 'subcontractors'
  | 'documents'
  | 'policies'
  | 'endorsements'
  | 'requirements'
  | 'compliance_scores'
  | 'tasks'
  | 'users'
  | 'organizations'; // REQ-214: Cross-schema FK support

/**
 * Map table names to their corresponding interfaces
 */
export interface TableTypeMap {
  projects: DBProject;
  subcontractors: DBSubcontractor;
  documents: DBDocument;
  policies: DBPolicy;
  endorsements: DBEndorsement;
  requirements: DBRequirement;
  compliance_scores: DBComplianceScore;
  tasks: DBTask;
  users: DBUser;
  organizations: DBOrganization; // REQ-214: Cross-schema FK support
}

/**
 * Type helper to get the interface for a table name
 */
export type TableRow<T extends TableName> = TableTypeMap[T];
