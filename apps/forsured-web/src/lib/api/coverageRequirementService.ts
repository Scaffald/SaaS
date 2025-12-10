/**
 * REQ-271: Coverage Requirement Service Layer
 * API functions for managing coverage-specific additional requirements
 */

import { forsured } from '../supabase';
import type {
  CoverageRequirement,
  CreateCoverageRequirementRequest,
  UpdateCoverageRequirementRequest,
  CoverageType,
  RequirementType,
} from '../../types';

/**
 * Validation: Check if a requirement type is allowed for a coverage type
 * Enforces business rules:
 * - AI is NOT allowed for Workers Comp
 * - Primary Non-Contributory is ONLY allowed for GL and Umbrella
 * - Waiver and Certificate Holder are allowed for all coverage types
 */
export function isRequirementAllowedForCoverage(
  requirementType: RequirementType,
  coverageType: CoverageType
): boolean {
  switch (requirementType) {
    case 'additional_insured':
      // AI not allowed for Workers Comp
      return coverageType !== 'workers_comp';

    case 'primary_non_contributory':
      // Primary only allowed for GL and Umbrella
      return coverageType === 'general_liability' || coverageType === 'umbrella';

    case 'waiver_of_subrogation':
    case 'certificate_holder':
      // Waiver and Cert Holder allowed for all coverage types
      return true;

    default:
      return false;
  }
}

/**
 * Get all coverage requirements for an organization
 * @param organizationId - Organization UUID
 * @returns Array of coverage requirements
 */
export async function getAllCoverageRequirements(
  organizationId: string
): Promise<CoverageRequirement[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { data, error } = await forsured('coverage_requirements')
    .select('*')
    .eq('organization_id', organizationId)
    .order('coverage_type', { ascending: true })
    .order('requirement_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch coverage requirements: ${error.message}`);
  }

  return data || [];
}

/**
 * Get coverage requirements for a specific project
 * @param projectId - Project UUID
 * @returns Array of coverage requirements for the project
 */
export async function getCoverageRequirementsByProject(
  projectId: string
): Promise<CoverageRequirement[]> {
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const { data, error } = await forsured('coverage_requirements')
    .select('*')
    .eq('project_id', projectId)
    .order('coverage_type', { ascending: true })
    .order('requirement_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch coverage requirements for project: ${error.message}`);
  }

  return data || [];
}

/**
 * Get coverage requirements by coverage type
 * @param organizationId - Organization UUID
 * @param coverageType - Coverage type to filter by
 * @returns Array of coverage requirements for the coverage type
 */
export async function getCoverageRequirementsByCoverageType(
  organizationId: string,
  coverageType: CoverageType
): Promise<CoverageRequirement[]> {
  if (!organizationId || !coverageType) {
    throw new Error('Organization ID and Coverage Type are required');
  }

  const { data, error } = await forsured('coverage_requirements')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('coverage_type', coverageType)
    .order('requirement_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch coverage requirements: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single coverage requirement by ID
 * @param id - Coverage requirement UUID
 * @param organizationId - Organization UUID
 * @returns Coverage requirement or null if not found
 */
export async function getCoverageRequirementById(
  id: string,
  organizationId: string
): Promise<CoverageRequirement | null> {
  if (!id || !organizationId) {
    throw new Error('Coverage requirement ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requirements')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch coverage requirement: ${error.message}`);
  }

  return data;
}

/**
 * Create a new coverage requirement
 * @param request - Coverage requirement creation data
 * @returns Created coverage requirement
 */
export async function createCoverageRequirement(
  request: CreateCoverageRequirementRequest
): Promise<CoverageRequirement> {
  if (!request.organization_id) {
    throw new Error('Organization ID is required');
  }

  // Validate requirement type is allowed for coverage type
  if (!isRequirementAllowedForCoverage(request.requirement_type, request.coverage_type)) {
    const errorMessages: Record<string, string> = {
      'additional_insured-workers_comp': 'Additional Insured is not allowed for Workers Compensation coverage',
      'primary_non_contributory-auto': 'Primary Non-Contributory is only allowed for General Liability and Umbrella coverage',
      'primary_non_contributory-workers_comp': 'Primary Non-Contributory is only allowed for General Liability and Umbrella coverage',
      'primary_non_contributory-professional_liability': 'Primary Non-Contributory is only allowed for General Liability and Umbrella coverage',
    };
    const key = `${request.requirement_type}-${request.coverage_type}`;
    const message = errorMessages[key] || `${request.requirement_type} is not allowed for ${request.coverage_type} coverage`;
    throw new Error(message);
  }

  const { data, error } = await forsured('coverage_requirements')
    .insert(request)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violations
    if (error.code === '23505') {
      throw new Error(
        `Coverage requirement for ${request.coverage_type} - ${request.requirement_type} already exists for this ${request.project_id ? 'project' : 'organization'}`
      );
    }
    throw new Error(`Failed to create coverage requirement: ${error.message}`);
  }

  return data;
}

/**
 * Update a coverage requirement
 * @param id - Coverage requirement UUID
 * @param organizationId - Organization UUID
 * @param updates - Partial coverage requirement update
 * @returns Updated coverage requirement
 */
export async function updateCoverageRequirement(
  id: string,
  organizationId: string,
  updates: UpdateCoverageRequirementRequest
): Promise<CoverageRequirement> {
  if (!id || !organizationId) {
    throw new Error('Coverage requirement ID and Organization ID are required');
  }

  const { data, error } = await forsured('coverage_requirements')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update coverage requirement: ${error.message}`);
  }

  return data;
}

/**
 * Delete a coverage requirement
 * @param id - Coverage requirement UUID
 * @param organizationId - Organization UUID
 */
export async function deleteCoverageRequirement(
  id: string,
  organizationId: string
): Promise<void> {
  if (!id || !organizationId) {
    throw new Error('Coverage requirement ID and Organization ID are required');
  }

  const { error } = await forsured('coverage_requirements')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to delete coverage requirement: ${error.message}`);
  }
}

/**
 * Get allowed requirement types for a coverage type
 * Returns only the requirement types that are valid for the given coverage type
 * @param coverageType - Coverage type
 * @returns Array of allowed requirement types
 */
export function getAllowedRequirementTypes(coverageType: CoverageType): RequirementType[] {
  const allTypes: RequirementType[] = [
    'additional_insured',
    'waiver_of_subrogation',
    'primary_non_contributory',
    'certificate_holder',
  ];

  return allTypes.filter((reqType) =>
    isRequirementAllowedForCoverage(reqType, coverageType)
  );
}

/**
 * Get standard endorsement codes for a requirement type and coverage type
 * Returns commonly used endorsement codes
 * @param requirementType - Requirement type
 * @param coverageType - Coverage type
 * @returns Array of standard endorsement codes
 */
export function getStandardEndorsementCodes(
  requirementType: RequirementType,
  coverageType: CoverageType
): string[] {
  if (!isRequirementAllowedForCoverage(requirementType, coverageType)) {
    return [];
  }

  const standardCodes: Record<string, Record<string, string[]>> = {
    additional_insured: {
      general_liability: ['CG2010', 'CG2037', 'CG2026'],
      auto: ['CA2048', 'CA9948'],
      umbrella: ['Blanket AI'],
    },
    waiver_of_subrogation: {
      general_liability: ['CG2404'],
      auto: ['CA0444'],
      workers_comp: ['WC420304'],
      umbrella: ['Waiver Endorsement'],
      professional_liability: ['Waiver Clause'],
    },
    primary_non_contributory: {
      general_liability: ['CG2001', 'Primary & Non-Contributory'],
      umbrella: ['Primary & Non-Contributory'],
    },
    certificate_holder: {
      // Certificate holder doesn't typically have specific endorsement codes
      general_liability: [],
      auto: [],
      workers_comp: [],
      umbrella: [],
      professional_liability: [],
    },
  };

  return standardCodes[requirementType]?.[coverageType] || [];
}
