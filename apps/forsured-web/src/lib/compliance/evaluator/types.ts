/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Type definitions for evaluation system
 */

import { CoverageType } from '../types';

/**
 * Compliance status enum
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * Gap type enum
 */
export enum GapType {
  MISSING_COVERAGE = 'missing_coverage',
  INSUFFICIENT_AMOUNT = 'insufficient_amount',
  MISSING_ENDORSEMENT = 'missing_endorsement',
  EXPIRED_POLICY = 'expired_policy',
  INCORRECT_HOLDER = 'incorrect_holder',
  EXPIRING_SOON = 'expiring_soon',
  // REQ-2: Dependency validation gap types
  MISSING_UNDERLYING_COVERAGE = 'missing_underlying_coverage',
  INSUFFICIENT_UNDERLYING_LIMIT = 'insufficient_underlying_limit',
  MISSING_DEPENDENCY = 'missing_dependency'
}

/**
 * Gap severity enum
 */
export enum GapSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Extracted policy data structure (from Mock OCR Parser)
 */
export interface ExtractedPolicyData {
  policy_number?: string;
  carrier?: string;
  effective_date: string;
  expiration_date: string;
  certificate_holder?: string;
  coverage_types: PolicyCoverage[];
  endorsements: string[];
}

/**
 * Policy coverage details
 */
export interface PolicyCoverage {
  type: CoverageType | string;
  per_occurrence_limit?: number;
  aggregate_limit?: number;
  deductible?: number;
  effective_date?: string;
  expiration_date?: string;
}

/**
 * Compliance gap definition
 */
export interface ComplianceGap {
  id: string;
  type: GapType;
  severity: GapSeverity;
  coverage_type?: CoverageType | string;
  endorsement?: string;
  current_value?: string | number | null;
  required_value: string | number;
  remediation: string;
  points_deducted: number;
}

/**
 * Rule application result
 */
export interface RuleApplication {
  rule_id: string;
  rule_name: string;
  passed: boolean;
  gaps_created?: string[]; // Gap IDs created by this rule
}

/**
 * Evaluation result
 */
export interface EvaluationResult {
  id: string;
  policy_id?: string;
  project_id: string;
  score: number; // 0-100
  status: ComplianceStatus;
  evaluated_at: string; // ISO 8601
  gaps: ComplianceGap[];
  rules_applied: RuleApplication[];
  metadata: EvaluationMetadata;
}

/**
 * Evaluation metadata
 */
export interface EvaluationMetadata {
  parser_version?: string;
  rule_engine_version: string;
  evaluation_duration_ms: number;
  total_requirements_checked: number;
  coverage_types_evaluated: string[];
}

/**
 * Evaluation request
 */
export interface EvaluationRequest {
  policy_id?: string;
  project_id: string;
  extracted_data: ExtractedPolicyData;
}

/**
 * REQ-2: Dependency context for evaluation
 * Provides information about requirement dependencies and umbrella schedules
 */
export interface DependencyEvaluationContext {
  /** Dependencies for the requirements being evaluated */
  dependencies: DependencyInfo[];
  /** Umbrella underlying schedules (if evaluating umbrella coverage) */
  umbrella_schedules: UmbrellaScheduleInfo[];
  /** Map of requirement ID to requirement info (for dependency lookup) */
  requirement_info: Map<string, RequirementInfoForEvaluation>;
}

/**
 * Dependency information for evaluation
 */
export interface DependencyInfo {
  requirement_id: string;
  depends_on_id: string;
  dependency_type: 'requires' | 'recommended' | 'alternative';
}

/**
 * Umbrella schedule information for evaluation
 */
export interface UmbrellaScheduleInfo {
  umbrella_requirement_id: string;
  underlying_coverage_type: string;
  required_minimum_limit: number;
  attachment_point: number;
}

/**
 * Requirement info needed for dependency evaluation
 */
export interface RequirementInfoForEvaluation {
  id: string;
  name: string;
  type: string;
  coverage_limits?: {
    per_occurrence?: number;
    aggregate?: number;
  };
}

/**
 * Batch evaluation request
 */
export interface BatchEvaluationRequest {
  project_id: string;
  evaluations: Array<{
    policy_id?: string;
    extracted_data: ExtractedPolicyData;
  }>;
}

/**
 * Batch evaluation result
 */
export interface BatchEvaluationResult {
  project_id: string;
  results: EvaluationResult[];
  summary: {
    total_evaluated: number;
    compliant: number;
    warning: number;
    critical: number;
  };
}

/**
 * Score deduction configuration
 */
export interface ScoreDeductions {
  MISSING_COVERAGE: number;
  INSUFFICIENT_AMOUNT: number;
  MISSING_ENDORSEMENT: number;
  EXPIRED_POLICY: number;
  INCORRECT_HOLDER: number;
  EXPIRING_SOON: number;
  // REQ-2: Dependency validation deductions
  MISSING_UNDERLYING_COVERAGE: number;
  INSUFFICIENT_UNDERLYING_LIMIT: number;
  MISSING_DEPENDENCY: number;
}

/**
 * Default score deductions based on REQ-128 and REQ-2
 * REQ-2 additions:
 * - MISSING_UNDERLYING_COVERAGE: 25 points (CRITICAL - umbrella without underlying)
 * - INSUFFICIENT_UNDERLYING_LIMIT: 15 points (HIGH - underlying limit too low)
 * - MISSING_DEPENDENCY: 20 points (CRITICAL - required dependency missing)
 */
export const DEFAULT_SCORE_DEDUCTIONS: ScoreDeductions = {
  MISSING_COVERAGE: 20,
  INSUFFICIENT_AMOUNT: 10,
  MISSING_ENDORSEMENT: 15,
  EXPIRED_POLICY: 50,
  INCORRECT_HOLDER: 10,
  EXPIRING_SOON: 5,
  // REQ-2: Dependency validation deductions
  MISSING_UNDERLYING_COVERAGE: 25,
  INSUFFICIENT_UNDERLYING_LIMIT: 15,
  MISSING_DEPENDENCY: 20
};

/**
 * Score boundaries for status determination
 */
export interface ScoreBoundaries {
  COMPLIANT_MIN: number;
  WARNING_MIN: number;
}

/**
 * Default score boundaries based on REQ-128
 */
export const DEFAULT_SCORE_BOUNDARIES: ScoreBoundaries = {
  COMPLIANT_MIN: 90,
  WARNING_MIN: 70
};

/**
 * Grace period configuration (in days)
 */
export const GRACE_PERIOD_DAYS = 30;

/**
 * Rule engine version
 */
export const RULE_ENGINE_VERSION = '1.0.0';
