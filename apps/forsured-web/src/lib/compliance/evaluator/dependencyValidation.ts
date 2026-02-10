/**
 * Dependency Validation for Evaluation Engine
 * Integrates dependency validation from TASK-4 into the compliance evaluation workflow
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ComplianceGap,
  GapType,
  GapSeverity,
  DEFAULT_SCORE_DEDUCTIONS,
  DependencyEvaluationContext,
  DependencyInfo,
  UmbrellaScheduleInfo,
  RequirementInfoForEvaluation,
} from './types';
import { ComplianceRequirement, CoverageType } from '../types';
import { validateDependencies } from '../dependency-service';
import type {
  RequirementDependency,
  UmbrellaUnderlyingSchedule,
  ProjectRequirementInfo,
  UnderlyingCoverageType,
} from '../dependency-types';
import { DependencyType, formatCurrency, formatCoverageType } from '../dependency-types';

/**
 * Validates dependencies for all requirements and creates gaps for violations
 *
 * @param projectRequirements The requirements being evaluated
 * @param dependencyContext Dependency information for validation
 * @returns Array of compliance gaps for dependency violations
 */
export function validateRequirementDependencies(
  projectRequirements: ComplianceRequirement[],
  dependencyContext: DependencyEvaluationContext | null
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  // If no dependency context provided, skip dependency validation
  if (!dependencyContext) {
    return gaps;
  }

  // Build project requirements info for the dependency service
  const projectReqsInfo: ProjectRequirementInfo[] = projectRequirements.map((req) => ({
    id: req.id,
    type: req.type,
    name: req.name,
    coverage_limits: req.requirement_definition.coverage_limits,
  }));

  // Validate each requirement's dependencies
  for (const requirement of projectRequirements) {
    // Get dependencies for this requirement
    const reqDependencies = dependencyContext.dependencies.filter(
      (d) => d.requirement_id === requirement.id
    );

    if (reqDependencies.length === 0 && requirement.type !== CoverageType.UMBRELLA) {
      continue;
    }

    // Convert to the format expected by dependency service
    const serviceDependencies: RequirementDependency[] = reqDependencies.map((d) => ({
      id: uuidv4(),
      requirement_id: d.requirement_id,
      depends_on_id: d.depends_on_id,
      dependency_type: d.dependency_type as DependencyType,
      condition: null,
      notes: null,
      created_at: new Date().toISOString(),
    }));

    // Get umbrella schedule if this is an umbrella requirement
    const umbrellaSchedule: UmbrellaUnderlyingSchedule[] | null =
      requirement.type === CoverageType.UMBRELLA
        ? dependencyContext.umbrella_schedules
            .filter((s) => s.umbrella_requirement_id === requirement.id)
            .map((s) => ({
              id: uuidv4(),
              umbrella_requirement_id: s.umbrella_requirement_id,
              underlying_coverage_type: s.underlying_coverage_type as UnderlyingCoverageType,
              required_minimum_limit: s.required_minimum_limit,
              attachment_point: s.attachment_point,
              is_scheduled: true,
              follows_form: true,
              drop_down_allowed: false,
              drop_down_sir: null,
              exclusions: null,
              notes: null,
            }))
        : null;

    // Validate using the dependency service
    const validationResult = validateDependencies(
      {
        requirement_id: requirement.id,
        requirement_type: requirement.type,
        organization_id: requirement.organization_id,
        project_requirements: projectReqsInfo,
      },
      serviceDependencies,
      umbrellaSchedule,
      dependencyContext.requirement_info
    );

    // Convert missing dependencies to gaps
    for (const missing of validationResult.missing_dependencies) {
      gaps.push(createMissingDependencyGap(missing.required_dependency_name, requirement.name));
    }

    // Convert missing underlying coverages to gaps
    for (const missingUnderlying of validationResult.missing_underlying) {
      gaps.push(
        createMissingUnderlyingCoverageGap(
          missingUnderlying.coverage_type,
          missingUnderlying.required_limit,
          requirement.name
        )
      );
    }

    // Convert insufficient limits to gaps
    for (const insufficient of validationResult.insufficient_limits) {
      gaps.push(
        createInsufficientUnderlyingLimitGap(
          insufficient.coverage_type,
          insufficient.required_limit,
          insufficient.actual_limit,
          insufficient.shortfall,
          requirement.name
        )
      );
    }
  }

  return gaps;
}

/**
 * Creates a gap for a missing required dependency
 */
function createMissingDependencyGap(
  dependencyName: string,
  requirementName: string
): ComplianceGap {
  return {
    id: uuidv4(),
    type: GapType.MISSING_DEPENDENCY,
    severity: GapSeverity.CRITICAL,
    required_value: dependencyName,
    current_value: null,
    remediation: `Add "${dependencyName}" to the project requirements. The "${requirementName}" requirement depends on it.`,
    points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_DEPENDENCY,
  };
}

/**
 * Creates a gap for missing underlying coverage (umbrella validation)
 */
function createMissingUnderlyingCoverageGap(
  coverageType: string,
  requiredLimit: number,
  umbrellaRequirementName: string
): ComplianceGap {
  const formattedType = formatCoverageType(coverageType as UnderlyingCoverageType);
  const formattedLimit = formatCurrency(requiredLimit);

  return {
    id: uuidv4(),
    type: GapType.MISSING_UNDERLYING_COVERAGE,
    severity: GapSeverity.CRITICAL,
    coverage_type: coverageType,
    required_value: formattedLimit,
    current_value: null,
    remediation: `Add ${formattedType} coverage with at least ${formattedLimit} limit. Required as underlying coverage for "${umbrellaRequirementName}".`,
    points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_UNDERLYING_COVERAGE,
  };
}

/**
 * Creates a gap for insufficient underlying coverage limit
 */
function createInsufficientUnderlyingLimitGap(
  coverageType: string,
  requiredLimit: number,
  actualLimit: number,
  shortfall: number,
  umbrellaRequirementName: string
): ComplianceGap {
  const formattedType = formatCoverageType(coverageType as UnderlyingCoverageType);
  const formattedRequired = formatCurrency(requiredLimit);
  const formattedActual = formatCurrency(actualLimit);
  const formattedShortfall = formatCurrency(shortfall);

  return {
    id: uuidv4(),
    type: GapType.INSUFFICIENT_UNDERLYING_LIMIT,
    severity: GapSeverity.WARNING,
    coverage_type: coverageType,
    required_value: formattedRequired,
    current_value: formattedActual,
    remediation: `Increase ${formattedType} limit from ${formattedActual} to ${formattedRequired} (shortfall: ${formattedShortfall}). Required as underlying coverage for "${umbrellaRequirementName}".`,
    points_deducted: DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_UNDERLYING_LIMIT,
  };
}

/**
 * Creates an empty dependency evaluation context
 * Useful for evaluations that don't need dependency checking
 */
export function createEmptyDependencyContext(): DependencyEvaluationContext {
  return {
    dependencies: [],
    umbrella_schedules: [],
    requirement_info: new Map(),
  };
}

/**
 * Creates a dependency evaluation context from raw data
 *
 * @param dependencies Array of dependency information
 * @param umbrellaSchedules Array of umbrella schedule information
 * @param requirements Array of requirement information for lookup
 */
export function createDependencyContext(
  dependencies: DependencyInfo[],
  umbrellaSchedules: UmbrellaScheduleInfo[],
  requirements: RequirementInfoForEvaluation[]
): DependencyEvaluationContext {
  const requirementMap = new Map<string, RequirementInfoForEvaluation>();
  for (const req of requirements) {
    requirementMap.set(req.id, req);
  }

  return {
    dependencies,
    umbrella_schedules: umbrellaSchedules,
    requirement_info: requirementMap,
  };
}
