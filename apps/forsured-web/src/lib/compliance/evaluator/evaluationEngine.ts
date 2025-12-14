/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Main evaluation orchestrator that ties all validation logic together
 */

import { v4 as uuidv4 } from 'uuid';
import { ComplianceRequirement, CoverageLimits } from '../types';
import {
  EvaluationRequest,
  EvaluationResult,
  BatchEvaluationRequest,
  BatchEvaluationResult,
  ComplianceGap,
  RuleApplication,
  ComplianceStatus,
  GapType,
  GapSeverity,
  DependencyEvaluationContext,
  RULE_ENGINE_VERSION
} from './types';
import { calculateComplianceScore, determineComplianceStatus } from './scoringAlgorithm';
import { validateCoverageAmounts } from './coverageValidation';
import { validatePolicyDates } from './dateValidation';
import { validateEndorsements } from './endorsementValidation';
import { validateRequirementDependencies } from './dependencyValidation';

/**
 * Main evaluation engine
 * Evaluates policy compliance against project requirements
 */
export class ComplianceEvaluationEngine {
  /**
   * Evaluate a single policy against project requirements
   *
   * @param request Evaluation request
   * @param projectRequirements List of compliance requirements for the project
   * @param projectStartDate Project start date (ISO format)
   * @param projectEndDate Project end date (ISO format)
   * @param dependencyContext Optional dependency context for umbrella/dependency validation
   * @returns Evaluation result with score and gaps
   */
  async evaluate(
    request: EvaluationRequest,
    projectRequirements: ComplianceRequirement[],
    projectStartDate: string,
    projectEndDate: string,
    dependencyContext: DependencyEvaluationContext | null = null
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    const gaps: ComplianceGap[] = [];
    const rulesApplied: RuleApplication[] = [];
    const coverageTypesEvaluated = new Set<string>();

    try {
      // Build requirements map for efficient lookup
      const requirementsMap = this.buildRequirementsMap(projectRequirements);

      // REQ-2: Validate dependencies FIRST (before coverage/date/endorsement validation)
      // This ensures umbrella policies have required underlying coverages
      const dependencyGaps = validateRequirementDependencies(
        projectRequirements,
        dependencyContext
      );
      gaps.push(...dependencyGaps);
      rulesApplied.push({
        rule_id: 'dependency-validation',
        rule_name: 'Requirement Dependency Validation',
        passed: dependencyGaps.length === 0,
        gaps_created: dependencyGaps.map(g => g.id)
      });

      // Validate coverage amounts
      const coverageGaps = validateCoverageAmounts(
        request.extracted_data.coverage_types,
        requirementsMap
      );
      gaps.push(...coverageGaps);
      rulesApplied.push({
        rule_id: 'coverage-validation',
        rule_name: 'Coverage Amount Validation',
        passed: coverageGaps.length === 0,
        gaps_created: coverageGaps.map(g => g.id)
      });

      // Track evaluated coverage types
      request.extracted_data.coverage_types.forEach(c =>
        coverageTypesEvaluated.add(c.type)
      );

      // Validate policy dates
      const dateGaps = validatePolicyDates(
        request.extracted_data.effective_date,
        request.extracted_data.expiration_date,
        projectStartDate,
        projectEndDate
      );
      gaps.push(...dateGaps);
      rulesApplied.push({
        rule_id: 'date-validation',
        rule_name: 'Policy Date Validation',
        passed: dateGaps.length === 0,
        gaps_created: dateGaps.map(g => g.id)
      });

      // Validate endorsements (deduplicate across requirements)
      const allRequiredEndorsements = this.deduplicateEndorsements(
        projectRequirements.flatMap(
          req => req.requirement_definition.required_endorsements
        )
      );
      const endorsementGaps = validateEndorsements(
        request.extracted_data.endorsements,
        allRequiredEndorsements
      );
      gaps.push(...endorsementGaps);
      rulesApplied.push({
        rule_id: 'endorsement-validation',
        rule_name: 'Endorsement Verification',
        passed: endorsementGaps.length === 0,
        gaps_created: endorsementGaps.map(g => g.id)
      });

      // Calculate compliance score
      const score = calculateComplianceScore(gaps);
      const status = determineComplianceStatus(score);

      // Calculate duration
      const endTime = Date.now();
      const durationMs = Math.max(1, endTime - startTime); // Ensure at least 1ms

      // Build and return result
      return {
        id: uuidv4(),
        policy_id: request.policy_id,
        project_id: request.project_id,
        score,
        status,
        evaluated_at: new Date().toISOString(),
        gaps,
        rules_applied: rulesApplied,
        metadata: {
          rule_engine_version: RULE_ENGINE_VERSION,
          evaluation_duration_ms: durationMs,
          total_requirements_checked: projectRequirements.length,
          coverage_types_evaluated: Array.from(coverageTypesEvaluated)
        }
      };
    } catch (error) {
      // If evaluation fails, return a critical failure result
      const endTime = Date.now();
      const durationMs = Math.max(1, endTime - startTime);

      return {
        id: uuidv4(),
        policy_id: request.policy_id,
        project_id: request.project_id,
        score: 0,
        status: ComplianceStatus.CRITICAL,
        evaluated_at: new Date().toISOString(),
        gaps: [{
          id: uuidv4(),
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 'Valid policy data',
          remediation: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          points_deducted: 100
        }],
        rules_applied: [],
        metadata: {
          rule_engine_version: RULE_ENGINE_VERSION,
          evaluation_duration_ms: durationMs,
          total_requirements_checked: 0,
          coverage_types_evaluated: []
        }
      };
    }
  }

  /**
   * Evaluate multiple policies in batch
   *
   * @param request Batch evaluation request
   * @param projectRequirements List of compliance requirements for the project
   * @param projectStartDate Project start date (ISO format)
   * @param projectEndDate Project end date (ISO format)
   * @param dependencyContext Optional dependency context for umbrella/dependency validation
   * @returns Batch evaluation result
   */
  async evaluateBatch(
    request: BatchEvaluationRequest,
    projectRequirements: ComplianceRequirement[],
    projectStartDate: string,
    projectEndDate: string,
    dependencyContext: DependencyEvaluationContext | null = null
  ): Promise<BatchEvaluationResult> {
    const results: EvaluationResult[] = [];

    // Evaluate each policy
    for (const evaluation of request.evaluations) {
      const result = await this.evaluate(
        {
          policy_id: evaluation.policy_id,
          project_id: request.project_id,
          extracted_data: evaluation.extracted_data
        },
        projectRequirements,
        projectStartDate,
        projectEndDate,
        dependencyContext
      );
      results.push(result);
    }

    // Calculate summary statistics
    const summary = {
      total_evaluated: results.length,
      compliant: results.filter(r => r.status === ComplianceStatus.COMPLIANT).length,
      warning: results.filter(r => r.status === ComplianceStatus.WARNING).length,
      critical: results.filter(r => r.status === ComplianceStatus.CRITICAL).length
    };

    return {
      project_id: request.project_id,
      results,
      summary
    };
  }

  /**
   * Build requirements map for efficient coverage lookup
   *
   * @param requirements List of compliance requirements
   * @returns Map of coverage type to required limits
   */
  private buildRequirementsMap(
    requirements: ComplianceRequirement[]
  ): Map<string, CoverageLimits> {
    const map = new Map<string, CoverageLimits>();

    for (const requirement of requirements) {
      map.set(
        requirement.type,
        requirement.requirement_definition.coverage_limits
      );
    }

    return map;
  }

  /**
   * Deduplicate endorsements across multiple requirements
   * Ensures each endorsement is only checked once
   *
   * @param endorsements List of required endorsements
   * @returns Deduplicated list
   */
  private deduplicateEndorsements(
    endorsements: Array<{ endorsement_type: string; description: string }>
  ): Array<{ endorsement_type: string; description: string }> {
    const seen = new Set<string>();
    const deduplicated: Array<{ endorsement_type: string; description: string }> = [];

    for (const endorsement of endorsements) {
      if (!seen.has(endorsement.endorsement_type)) {
        seen.add(endorsement.endorsement_type);
        deduplicated.push(endorsement);
      }
    }

    return deduplicated;
  }
}

/**
 * Create a new evaluation engine instance
 *
 * @returns New evaluation engine
 */
export function createEvaluationEngine(): ComplianceEvaluationEngine {
  return new ComplianceEvaluationEngine();
}
