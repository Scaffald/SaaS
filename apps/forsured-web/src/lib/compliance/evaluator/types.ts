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
  EXPIRING_SOON = 'expiring_soon'
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
}

/**
 * Default score deductions based on REQ-128
 */
export const DEFAULT_SCORE_DEDUCTIONS: ScoreDeductions = {
  MISSING_COVERAGE: 20,
  INSUFFICIENT_AMOUNT: 10,
  MISSING_ENDORSEMENT: 15,
  EXPIRED_POLICY: 50,
  INCORRECT_HOLDER: 10,
  EXPIRING_SOON: 5
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
