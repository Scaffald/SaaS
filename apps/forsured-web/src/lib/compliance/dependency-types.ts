/**
 * REQ-2, TASK-4: Dependency Validation Types
 * Type definitions for dependency validation, including umbrella insurance validation
 */

import type { CoverageType } from './types';

/**
 * Types of dependencies between requirements
 */
export enum DependencyType {
  REQUIRES = 'requires',
  RECOMMENDED = 'recommended',
  ALTERNATIVE = 'alternative',
}

/**
 * Underlying coverage types supported by umbrella policies
 */
export enum UnderlyingCoverageType {
  GENERAL_LIABILITY = 'general_liability',
  AUTO_LIABILITY = 'auto_liability',
  EMPLOYERS_LIABILITY = 'employers_liability',
  PROFESSIONAL_LIABILITY = 'professional_liability',
}

/**
 * Represents a dependency between two compliance requirements
 */
export interface RequirementDependency {
  id: string;
  requirement_id: string;
  depends_on_id: string;
  dependency_type: DependencyType;
  condition: DependencyCondition | null;
  notes: string | null;
  created_at: string;
}

/**
 * Conditional rules for a dependency
 */
export interface DependencyCondition {
  min_underlying_limit?: number;
  attachment_point?: number;
  follow_form?: boolean;
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

/**
 * Umbrella underlying schedule entry
 */
export interface UmbrellaUnderlyingSchedule {
  id: string;
  umbrella_requirement_id: string;
  underlying_coverage_type: UnderlyingCoverageType;
  required_minimum_limit: number;
  attachment_point: number;
  is_scheduled: boolean;
  follows_form: boolean;
  drop_down_allowed: boolean;
  drop_down_sir: number | null;
  exclusions: Record<string, boolean> | null;
  notes: string | null;
}

/**
 * Represents a missing dependency error
 */
export interface MissingDependencyError {
  requirement_id: string;
  required_dependency_id: string;
  required_dependency_name: string;
  dependency_type: DependencyType;
  message: string;
}

/**
 * Represents an insufficient limit error for umbrella validation
 */
export interface InsufficientLimitError {
  coverage_type: UnderlyingCoverageType;
  required_limit: number;
  actual_limit: number;
  shortfall: number;
  message: string;
}

/**
 * Represents a missing underlying coverage error for umbrella validation
 */
export interface MissingUnderlyingError {
  coverage_type: UnderlyingCoverageType;
  required_limit: number;
  message: string;
}

/**
 * Represents an attachment point mismatch error
 */
export interface AttachmentPointError {
  coverage_type: UnderlyingCoverageType;
  expected_attachment_point: number;
  actual_underlying_limit: number;
  message: string;
}

/**
 * Union type for all umbrella validation errors
 */
export type UmbrellaValidationError =
  | InsufficientLimitError
  | MissingUnderlyingError
  | AttachmentPointError;

/**
 * Result of dependency validation
 */
export interface DependencyValidationResult {
  /** Whether all dependencies are satisfied */
  valid: boolean;

  /** List of missing required dependencies */
  missing_dependencies: MissingDependencyError[];

  /** List of insufficient coverage limit errors (umbrella) */
  insufficient_limits: InsufficientLimitError[];

  /** List of missing underlying coverage errors (umbrella) */
  missing_underlying: MissingUnderlyingError[];

  /** List of attachment point mismatch errors */
  attachment_point_errors: AttachmentPointError[];

  /** General error messages */
  errors: string[];

  /** Timestamp of validation */
  validated_at: string;
}

/**
 * Input for validating dependencies
 */
export interface ValidateDependenciesInput {
  /** The requirement to validate */
  requirement_id: string;

  /** The requirement's coverage type */
  requirement_type: CoverageType;

  /** The organization ID */
  organization_id: string;

  /** Requirements already present in the project/context */
  project_requirements: ProjectRequirementInfo[];
}

/**
 * Simplified requirement info for validation context
 */
export interface ProjectRequirementInfo {
  id: string;
  type: CoverageType;
  name: string;
  coverage_limits: {
    per_occurrence?: number;
    aggregate?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Creates an empty (valid) validation result
 */
export function createEmptyValidationResult(): DependencyValidationResult {
  return {
    valid: true,
    missing_dependencies: [],
    insufficient_limits: [],
    missing_underlying: [],
    attachment_point_errors: [],
    errors: [],
    validated_at: new Date().toISOString(),
  };
}

/**
 * Creates a validation result with errors
 */
export function createErrorValidationResult(
  errors: Partial<Omit<DependencyValidationResult, 'valid' | 'validated_at'>>
): DependencyValidationResult {
  const hasErrors =
    (errors.missing_dependencies?.length ?? 0) > 0 ||
    (errors.insufficient_limits?.length ?? 0) > 0 ||
    (errors.missing_underlying?.length ?? 0) > 0 ||
    (errors.attachment_point_errors?.length ?? 0) > 0 ||
    (errors.errors?.length ?? 0) > 0;

  return {
    valid: !hasErrors,
    missing_dependencies: errors.missing_dependencies ?? [],
    insufficient_limits: errors.insufficient_limits ?? [],
    missing_underlying: errors.missing_underlying ?? [],
    attachment_point_errors: errors.attachment_point_errors ?? [],
    errors: errors.errors ?? [],
    validated_at: new Date().toISOString(),
  };
}

/**
 * Formats a currency amount for display in error messages
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an underlying coverage type for display
 */
export function formatCoverageType(type: UnderlyingCoverageType): string {
  const labels: Record<UnderlyingCoverageType, string> = {
    [UnderlyingCoverageType.GENERAL_LIABILITY]: 'General Liability',
    [UnderlyingCoverageType.AUTO_LIABILITY]: 'Auto Liability',
    [UnderlyingCoverageType.EMPLOYERS_LIABILITY]: "Employer's Liability",
    [UnderlyingCoverageType.PROFESSIONAL_LIABILITY]: 'Professional Liability',
  };
  return labels[type] ?? type;
}
