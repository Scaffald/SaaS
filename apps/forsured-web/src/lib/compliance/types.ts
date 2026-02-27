/**
 * Compliance Requirements Management System
 * Type definitions for compliance requirements, templates, and related entities
 */

/**
 * Insurance coverage type enum
 */
export enum CoverageType {
  GENERAL_LIABILITY = 'general_liability',
  WORKERS_COMP = 'workers_comp',
  AUTO_LIABILITY = 'auto_liability',
  UMBRELLA = 'umbrella',
  CUSTOM = 'custom'
}

/**
 * Requirement status enum
 */
export enum RequirementStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

/**
 * Coverage limits definition
 */
export interface CoverageLimits {
  per_occurrence?: number;
  aggregate?: number;
  deductible_max?: number;
  // Additional fields for specific coverage types
  [key: string]: number | undefined;
}

/**
 * Required endorsement definition
 */
export interface RequiredEndorsement {
  endorsement_type: string;
  description: string;
}

/**
 * Policy condition definition
 */
export interface PolicyCondition {
  condition_type: string;
  description: string;
}

/**
 * Documentation requirement definition
 */
export interface DocumentationRequirement {
  document_type: string;
  is_required: boolean;
}

/**
 * Requirement definition structure (stored as JSON)
 */
export interface RequirementDefinition {
  coverage_limits: CoverageLimits;
  required_endorsements: RequiredEndorsement[];
  policy_conditions: PolicyCondition[];
  documentation_requirements: DocumentationRequirement[];
}

/**
 * Main compliance requirement entity
 */
export interface ComplianceRequirement {
  id: string;
  name: string;
  type: CoverageType;
  description?: string;
  status: RequirementStatus;
  is_template: boolean;
  created_by: string;
  organization_id: string;

  // Requirement definition (JSON structure)
  requirement_definition: RequirementDefinition;

  // Versioning fields
  version: number;
  parent_requirement_id: string | null;
  effective_date: string;
  superseded_date: string | null;
  change_summary?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

/**
 * Project-Requirement association
 */
export interface ProjectRequirement {
  id: string;
  project_id: string;
  requirement_id: string;
  is_mandatory: boolean;
  assigned_at: string;
  assigned_by: string;
}

/**
 * Input for creating a new requirement
 */
export type CreateComplianceRequirementInput = Omit<
  ComplianceRequirement,
  'id' | 'version' | 'parent_requirement_id' | 'superseded_date' | 'created_at' | 'updated_at' | 'archived_at'
> & {
  effective_date?: string;
};

/**
 * Input for updating an existing requirement (creates new version)
 */
export interface UpdateComplianceRequirementInput {
  name?: string;
  description?: string;
  status?: RequirementStatus;
  requirement_definition?: RequirementDefinition;
  change_summary: string;
  effective_date?: string;
}

/**
 * Query filters for listing requirements
 */
export interface RequirementFilters {
  type?: CoverageType;
  status?: RequirementStatus;
  is_template?: boolean;
  organization_id?: string;
  search?: string;
}

/**
 * Query options for listing requirements
 */
export interface RequirementQueryOptions {
  filters?: RequirementFilters;
  sort_by?: string;
  ascending?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated response for requirement list
 */
export interface RequirementListResponse {
  data: ComplianceRequirement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Input for creating project-requirement association
 */
export type CreateProjectRequirementInput = Omit<
  ProjectRequirement,
  'id' | 'assigned_at'
>;

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
