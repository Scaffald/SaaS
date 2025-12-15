/**
 * REQ-2, TASK-4: Dependency Validation Service
 * Validates compliance requirement dependencies, including specialized umbrella insurance validation
 */

import { CoverageType } from './types';
import {
  createEmptyValidationResult,
  createErrorValidationResult,
  DependencyType,
  DependencyValidationResult,
  formatCoverageType,
  formatCurrency,
  InsufficientLimitError,
  MissingDependencyError,
  MissingUnderlyingError,
  ProjectRequirementInfo,
  RequirementDependency,
  UmbrellaUnderlyingSchedule,
  UnderlyingCoverageType,
  ValidateDependenciesInput,
} from './dependency-types';

/**
 * Maps CoverageType to UnderlyingCoverageType for umbrella validation
 */
const COVERAGE_TYPE_MAPPING: Partial<Record<CoverageType, UnderlyingCoverageType>> = {
  [CoverageType.GENERAL_LIABILITY]: UnderlyingCoverageType.GENERAL_LIABILITY,
  [CoverageType.AUTO_LIABILITY]: UnderlyingCoverageType.AUTO_LIABILITY,
};

/**
 * Validates all dependencies for a compliance requirement
 *
 * @param input - Validation input including requirement and project context
 * @param dependencies - Array of dependencies for the requirement (from database)
 * @param umbrellaSchedule - Umbrella underlying schedule (if applicable)
 * @param dependencyRequirements - Map of dependency requirement info (id -> info)
 * @returns Validation result with any errors found
 */
export function validateDependencies(
  input: ValidateDependenciesInput,
  dependencies: RequirementDependency[],
  umbrellaSchedule: UmbrellaUnderlyingSchedule[] | null,
  dependencyRequirements: Map<string, { id: string; name: string; type: string }>
): DependencyValidationResult {
  // No dependencies - always valid
  if (dependencies.length === 0 && (!umbrellaSchedule || umbrellaSchedule.length === 0)) {
    return createEmptyValidationResult();
  }

  const missingDependencies: MissingDependencyError[] = [];
  const insufficientLimits: InsufficientLimitError[] = [];
  const missingUnderlying: MissingUnderlyingError[] = [];
  const errors: string[] = [];

  // Create a set of project requirement IDs for fast lookup
  const projectRequirementIds = new Set(input.project_requirements.map((r) => r.id));

  // Validate each dependency
  for (const dependency of dependencies) {
    // Skip non-required dependencies
    if (dependency.dependency_type !== DependencyType.REQUIRES) {
      continue;
    }

    // Check if the required dependency is present in project requirements
    if (!projectRequirementIds.has(dependency.depends_on_id)) {
      const depInfo = dependencyRequirements.get(dependency.depends_on_id);
      missingDependencies.push({
        requirement_id: dependency.requirement_id,
        required_dependency_id: dependency.depends_on_id,
        required_dependency_name: depInfo?.name ?? 'Unknown Requirement',
        dependency_type: dependency.dependency_type,
        message: `Missing required dependency: ${depInfo?.name ?? dependency.depends_on_id}`,
      });
    }
  }

  // If this is an umbrella requirement, validate underlying coverages
  if (input.requirement_type === CoverageType.UMBRELLA && umbrellaSchedule && umbrellaSchedule.length > 0) {
    const umbrellaResult = validateUmbrellaUnderlying(umbrellaSchedule, input.project_requirements);

    insufficientLimits.push(...umbrellaResult.insufficient_limits);
    missingUnderlying.push(...umbrellaResult.missing_underlying);
    errors.push(...umbrellaResult.errors);
  }

  return createErrorValidationResult({
    missing_dependencies: missingDependencies,
    insufficient_limits: insufficientLimits,
    missing_underlying: missingUnderlying,
    errors,
  });
}

/**
 * Validates umbrella insurance underlying coverage requirements
 *
 * @param schedule - Array of umbrella underlying schedule entries
 * @param projectRequirements - Requirements present in the project
 * @returns Validation result for umbrella underlying coverages
 */
export function validateUmbrellaUnderlying(
  schedule: UmbrellaUnderlyingSchedule[],
  projectRequirements: ProjectRequirementInfo[]
): Pick<DependencyValidationResult, 'insufficient_limits' | 'missing_underlying' | 'errors' | 'valid'> {
  const insufficientLimits: InsufficientLimitError[] = [];
  const missingUnderlying: MissingUnderlyingError[] = [];
  const errors: string[] = [];

  // Create a map of coverage type -> project requirement for fast lookup
  const requirementsByType = new Map<string, ProjectRequirementInfo>();
  for (const req of projectRequirements) {
    // Map CoverageType to UnderlyingCoverageType
    const underlyingType = COVERAGE_TYPE_MAPPING[req.type];
    if (underlyingType) {
      requirementsByType.set(underlyingType, req);
    }
    // Also store by the original type for direct matches
    requirementsByType.set(req.type, req);
  }

  // Validate each underlying coverage requirement
  for (const entry of schedule) {
    const underlyingReq = requirementsByType.get(entry.underlying_coverage_type);

    if (!underlyingReq) {
      // Missing underlying coverage
      missingUnderlying.push({
        coverage_type: entry.underlying_coverage_type,
        required_limit: entry.required_minimum_limit,
        message: `Missing required underlying coverage: ${formatCoverageType(entry.underlying_coverage_type)} with minimum limit ${formatCurrency(entry.required_minimum_limit)}`,
      });
      continue;
    }

    // Check the underlying coverage limit
    // Use per_occurrence for most coverages, aggregate for GL
    let actualLimit: number | undefined;
    if (entry.underlying_coverage_type === UnderlyingCoverageType.GENERAL_LIABILITY) {
      // For GL, check aggregate limit (or per_occurrence if aggregate not set)
      actualLimit = underlyingReq.coverage_limits.aggregate ?? underlyingReq.coverage_limits.per_occurrence;
    } else {
      // For other coverages, use per_occurrence (combined single limit)
      actualLimit = underlyingReq.coverage_limits.per_occurrence;
    }

    if (actualLimit === undefined) {
      errors.push(
        `Unable to determine coverage limit for ${formatCoverageType(entry.underlying_coverage_type)}: no per_occurrence or aggregate limit found`
      );
      continue;
    }

    // Check if limit meets minimum requirement
    if (actualLimit < entry.required_minimum_limit) {
      insufficientLimits.push({
        coverage_type: entry.underlying_coverage_type,
        required_limit: entry.required_minimum_limit,
        actual_limit: actualLimit,
        shortfall: entry.required_minimum_limit - actualLimit,
        message: `Insufficient ${formatCoverageType(entry.underlying_coverage_type)} limit: requires ${formatCurrency(entry.required_minimum_limit)}, has ${formatCurrency(actualLimit)} (shortfall: ${formatCurrency(entry.required_minimum_limit - actualLimit)})`,
      });
    }

    // Check attachment point alignment (if configured)
    // The attachment point should match or be less than the underlying limit
    if (entry.attachment_point > 0 && actualLimit < entry.attachment_point) {
      errors.push(
        `Attachment point mismatch for ${formatCoverageType(entry.underlying_coverage_type)}: ` +
          `umbrella attaches at ${formatCurrency(entry.attachment_point)} but underlying limit is only ${formatCurrency(actualLimit)}`
      );
    }
  }

  const hasErrors =
    insufficientLimits.length > 0 || missingUnderlying.length > 0 || errors.length > 0;

  return {
    valid: !hasErrors,
    insufficient_limits: insufficientLimits,
    missing_underlying: missingUnderlying,
    errors,
  };
}

/**
 * Gets the effective coverage limit for a requirement
 * Useful for comparing against dependency conditions
 *
 * @param requirement - The requirement to check
 * @param limitType - Which limit to retrieve ('per_occurrence' | 'aggregate')
 * @returns The limit amount or null if not found
 */
export function getEffectiveCoverageLimit(
  requirement: ProjectRequirementInfo,
  limitType: 'per_occurrence' | 'aggregate' = 'per_occurrence'
): number | null {
  const limit = requirement.coverage_limits[limitType];
  return limit ?? null;
}

/**
 * Checks if a project has sufficient coverage for an umbrella policy
 * This is a convenience function for quick validation
 *
 * @param umbrellaSchedule - The umbrella's underlying schedule
 * @param projectRequirements - Requirements in the project
 * @returns true if all underlying requirements are met, false otherwise
 */
export function hasValidUmbrellaUnderlying(
  umbrellaSchedule: UmbrellaUnderlyingSchedule[],
  projectRequirements: ProjectRequirementInfo[]
): boolean {
  const result = validateUmbrellaUnderlying(umbrellaSchedule, projectRequirements);
  return result.valid;
}

/**
 * Creates a human-readable summary of validation errors
 *
 * @param result - The validation result to summarize
 * @returns A summary string suitable for display
 */
export function summarizeValidationResult(result: DependencyValidationResult): string {
  if (result.valid) {
    return 'All dependencies satisfied';
  }

  const issues: string[] = [];

  if (result.missing_dependencies.length > 0) {
    issues.push(
      `${result.missing_dependencies.length} missing required ${result.missing_dependencies.length === 1 ? 'dependency' : 'dependencies'}`
    );
  }

  if (result.missing_underlying.length > 0) {
    issues.push(
      `${result.missing_underlying.length} missing underlying ${result.missing_underlying.length === 1 ? 'coverage' : 'coverages'}`
    );
  }

  if (result.insufficient_limits.length > 0) {
    const totalShortfall = result.insufficient_limits.reduce((sum, e) => sum + e.shortfall, 0);
    issues.push(
      `${result.insufficient_limits.length} insufficient ${result.insufficient_limits.length === 1 ? 'limit' : 'limits'} (total shortfall: ${formatCurrency(totalShortfall)})`
    );
  }

  if (result.errors.length > 0) {
    issues.push(`${result.errors.length} ${result.errors.length === 1 ? 'error' : 'errors'}`);
  }

  return `Validation failed: ${issues.join(', ')}`;
}
