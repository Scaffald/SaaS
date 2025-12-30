/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-5: Implement Dual-Level Compliance Validation Logic
 *
 * Service for validating subcontractor coverage against both org-level and
 * project-level requirements. Provides comprehensive compliance checking with
 * detailed results showing which requirements are met/unmet.
 */

import type {
  CoverageLimitRequirement,
  CoverageLimitComplianceCheck,
  CoverageLimitComplianceResult,
  CoverageLimitType,
} from '../../types'
import { supabase } from '../supabase'

/**
 * Subcontractor coverage data for compliance checking
 */
export interface SubcontractorCoverage {
  subcontractor_id: string
  coverage_type: CoverageLimitType
  limit: number
  policy_number?: string
  expiration_date?: string
}

/**
 * Input for compliance validation
 */
export interface ComplianceValidationInput {
  subcontractor_id: string
  organization_id: string
  project_id?: string
  coverages: SubcontractorCoverage[]
}

/**
 * Get org-level requirements for an organization
 */
async function getOrgRequirements(organizationId: string): Promise<CoverageLimitRequirement[]> {
  const { data } = await supabase.schema('forsured').from('coverage_limit_requirements')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('level', 'org')

  return data || []
}

/**
 * Get project-level requirements for a specific project
 */
async function getProjectRequirements(projectId: string): Promise<CoverageLimitRequirement[]> {
  const { data } = await supabase.schema('forsured').from('coverage_limit_requirements')
    .select('*')
    .eq('project_id', projectId)
    .eq('level', 'project')

  return data || []
}

/**
 * Find coverage for a specific coverage type from subcontractor's coverages
 */
function findCoverageForType(
  coverages: SubcontractorCoverage[],
  coverageType: CoverageLimitType
): SubcontractorCoverage | undefined {
  return coverages.find((c) => c.coverage_type === coverageType)
}

/**
 * Check a single requirement against subcontractor's coverage
 */
function checkRequirementCompliance(
  requirement: CoverageLimitRequirement,
  coverages: SubcontractorCoverage[]
): CoverageLimitComplianceCheck {
  const coverage = findCoverageForType(coverages, requirement.coverage_type)
  const actualLimit = coverage?.limit ?? null

  const isMet = actualLimit !== null && actualLimit >= requirement.minimum_limit
  const gapAmount =
    !isMet && actualLimit !== null
      ? requirement.minimum_limit - actualLimit
      : !isMet && actualLimit === null
        ? requirement.minimum_limit
        : undefined

  return {
    requirement_id: requirement.id,
    requirement_name: requirement.name,
    level: requirement.level,
    coverage_type: requirement.coverage_type,
    required_limit: requirement.minimum_limit,
    actual_limit: actualLimit,
    status: isMet ? 'met' : 'unmet',
    gap_amount: gapAmount,
  }
}

/**
 * Validate subcontractor coverage against org-level requirements only
 *
 * Use this for checking organization-wide compliance without project context.
 *
 * @param input - Subcontractor coverage data and organization context
 * @returns Compliance result with org-level checks only
 */
export async function validateOrgLevelCompliance(
  input: Omit<ComplianceValidationInput, 'project_id'>
): Promise<CoverageLimitComplianceResult> {
  const { subcontractor_id, organization_id, coverages } = input

  // Get org-level requirements
  const orgRequirements = await getOrgRequirements(organization_id)

  // Filter to only required requirements for compliance determination
  const requiredOrgRequirements = orgRequirements.filter((r) => r.required)

  // Check each org requirement
  const orgLevelChecks: CoverageLimitComplianceCheck[] = orgRequirements.map((req) =>
    checkRequirementCompliance(req, coverages)
  )

  // Determine overall compliance (only required requirements affect this)
  const requiredOrgChecks = orgLevelChecks.filter((check) =>
    requiredOrgRequirements.some((req) => req.id === check.requirement_id)
  )
  const allRequiredMet = requiredOrgChecks.every((check) => check.status === 'met')

  return {
    subcontractor_id,
    organization_id,
    overall_compliant: allRequiredMet,
    org_level_checks: orgLevelChecks,
    project_level_checks: [],
    checked_at: new Date().toISOString(),
  }
}

/**
 * Validate subcontractor coverage against project-level requirements only
 *
 * Use this for project-specific compliance checking without org requirements.
 *
 * @param input - Subcontractor coverage data and project context
 * @returns Compliance result with project-level checks only
 */
export async function validateProjectLevelCompliance(
  input: Required<ComplianceValidationInput>
): Promise<CoverageLimitComplianceResult> {
  const { subcontractor_id, organization_id, project_id, coverages } = input

  // Get project-level requirements
  const projectRequirements = await getProjectRequirements(project_id)

  // Filter to only required requirements for compliance determination
  const requiredProjectRequirements = projectRequirements.filter((r) => r.required)

  // Check each project requirement
  const projectLevelChecks: CoverageLimitComplianceCheck[] = projectRequirements.map((req) =>
    checkRequirementCompliance(req, coverages)
  )

  // Determine overall compliance (only required requirements affect this)
  const requiredProjectChecks = projectLevelChecks.filter((check) =>
    requiredProjectRequirements.some((req) => req.id === check.requirement_id)
  )
  const allRequiredMet = requiredProjectChecks.every((check) => check.status === 'met')

  return {
    subcontractor_id,
    organization_id,
    project_id,
    overall_compliant: allRequiredMet,
    org_level_checks: [],
    project_level_checks: projectLevelChecks,
    checked_at: new Date().toISOString(),
  }
}

/**
 * Validate subcontractor coverage against both org and project-level requirements
 *
 * This is the primary compliance validation function that checks coverage
 * against the combined set of requirements from both levels.
 *
 * @param input - Subcontractor coverage data with org and optional project context
 * @returns Comprehensive compliance result with both org and project checks
 */
export async function validateDualLevelCompliance(
  input: ComplianceValidationInput
): Promise<CoverageLimitComplianceResult> {
  const { subcontractor_id, organization_id, project_id, coverages } = input

  // Get org-level requirements
  const orgRequirements = await getOrgRequirements(organization_id)

  // Get project-level requirements if project specified
  const projectRequirements = project_id ? await getProjectRequirements(project_id) : []

  // Filter to only required requirements for compliance determination
  const requiredOrgRequirements = orgRequirements.filter((r) => r.required)
  const requiredProjectRequirements = projectRequirements.filter((r) => r.required)

  // Check org-level requirements
  const orgLevelChecks: CoverageLimitComplianceCheck[] = orgRequirements.map((req) =>
    checkRequirementCompliance(req, coverages)
  )

  // Check project-level requirements
  const projectLevelChecks: CoverageLimitComplianceCheck[] = projectRequirements.map((req) =>
    checkRequirementCompliance(req, coverages)
  )

  // Determine overall compliance
  // Must meet ALL required org-level AND ALL required project-level requirements
  const requiredOrgChecks = orgLevelChecks.filter((check) =>
    requiredOrgRequirements.some((req) => req.id === check.requirement_id)
  )
  const requiredProjectChecks = projectLevelChecks.filter((check) =>
    requiredProjectRequirements.some((req) => req.id === check.requirement_id)
  )

  const orgCompliant = requiredOrgChecks.every((check) => check.status === 'met')
  const projectCompliant = requiredProjectChecks.every((check) => check.status === 'met')
  const overallCompliant = orgCompliant && projectCompliant

  return {
    subcontractor_id,
    organization_id,
    project_id,
    overall_compliant: overallCompliant,
    org_level_checks: orgLevelChecks,
    project_level_checks: projectLevelChecks,
    checked_at: new Date().toISOString(),
  }
}

/**
 * Get a summary of compliance gaps for a subcontractor
 *
 * Returns only the unmet requirements with gap details.
 */
export function getComplianceGaps(
  result: CoverageLimitComplianceResult
): CoverageLimitComplianceCheck[] {
  const allChecks = [...result.org_level_checks, ...result.project_level_checks]
  return allChecks.filter((check) => check.status === 'unmet')
}

/**
 * Calculate a compliance score (percentage of requirements met)
 */
export function calculateComplianceScore(result: CoverageLimitComplianceResult): number {
  const allChecks = [...result.org_level_checks, ...result.project_level_checks]
  if (allChecks.length === 0) return 100

  const metCount = allChecks.filter((check) => check.status === 'met').length
  return Math.round((metCount / allChecks.length) * 100)
}

/**
 * Calculate compliance score for required requirements only
 */
export function calculateRequiredComplianceScore(
  result: CoverageLimitComplianceResult,
  orgRequirements: CoverageLimitRequirement[],
  projectRequirements: CoverageLimitRequirement[] = []
): number {
  const requiredOrgIds = new Set(orgRequirements.filter((r) => r.required).map((r) => r.id))
  const requiredProjectIds = new Set(projectRequirements.filter((r) => r.required).map((r) => r.id))

  const requiredOrgChecks = result.org_level_checks.filter((c) =>
    requiredOrgIds.has(c.requirement_id)
  )
  const requiredProjectChecks = result.project_level_checks.filter((c) =>
    requiredProjectIds.has(c.requirement_id)
  )

  const allRequiredChecks = [...requiredOrgChecks, ...requiredProjectChecks]
  if (allRequiredChecks.length === 0) return 100

  const metCount = allRequiredChecks.filter((check) => check.status === 'met').length
  return Math.round((metCount / allRequiredChecks.length) * 100)
}

/**
 * Format currency value
 */
export function formatLimitValue(value: number | null): string {
  if (value === null) return 'Not provided'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Get human-readable coverage type name
 */
export function getCoverageTypeName(coverageType: CoverageLimitType): string {
  const names: Record<CoverageLimitType, string> = {
    general_liability: 'General Liability',
    workers_comp: "Workers' Compensation",
    commercial_auto: 'Commercial Auto',
    umbrella_excess: 'Umbrella/Excess Liability',
    professional_liability: 'Professional Liability',
    pollution_liability: 'Pollution Liability',
    builders_risk: "Builder's Risk",
    equipment_floater: 'Equipment Floater',
  }
  return names[coverageType] || coverageType
}

/**
 * Service instance with all methods
 */
export const coverageComplianceService = {
  validateOrgLevelCompliance,
  validateProjectLevelCompliance,
  validateDualLevelCompliance,
  getComplianceGaps,
  calculateComplianceScore,
  calculateRequiredComplianceScore,
  formatLimitValue,
  getCoverageTypeName,
}
