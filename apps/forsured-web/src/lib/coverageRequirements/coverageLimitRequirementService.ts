/**
 * REQ-263: Coverage Limit Requirements API Service
 * TASK-2: Build API Endpoints for Coverage Requirements Management
 *
 * Service for managing coverage limit requirement CRUD operations with validation and authorization.
 * Supports both org-level and project-level coverage requirements.
 */

import type {
  CoverageLimitRequirement,
  CoverageRequirementLevel,
  CoverageLimitType,
  CreateCoverageLimitRequirementRequest,
  UpdateCoverageLimitRequirementRequest,
} from '../../types'
import { forsured } from '@scf/supabase/forsured-client'

/**
 * Valid coverage requirement levels
 */
export const VALID_LEVELS: CoverageRequirementLevel[] = ['org', 'project']

/**
 * Valid coverage types for limit requirements
 */
export const VALID_COVERAGE_TYPES: CoverageLimitType[] = [
  'general_liability',
  'workers_comp',
  'commercial_auto',
  'umbrella_excess',
  'professional_liability',
  'pollution_liability',
  'builders_risk',
  'equipment_floater',
]

/**
 * User role for authorization
 */
export type UserRole = 'admin' | 'broker' | 'gc' | 'subcontractor' | 'project_manager'

/**
 * User context for authorization
 */
export interface UserContext {
  id: string
  role: UserRole
  organization_id?: string
  project_ids?: string[]
}

/**
 * API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: UserContext): boolean {
  return user.role === 'admin'
}

/**
 * Check if user can manage org-level requirements (admin only)
 */
export function canManageOrgLevel(user: UserContext): boolean {
  return user.role === 'admin'
}

/**
 * Check if user can manage project-level requirements (admin or project manager)
 */
export function canManageProjectLevel(user: UserContext, projectId: string): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'project_manager' || user.role === 'gc') {
    return user.project_ids?.includes(projectId) ?? false
  }
  return false
}

/**
 * Validate level value
 */
export function validateLevel(level: string): ValidationError | undefined {
  if (!VALID_LEVELS.includes(level as CoverageRequirementLevel)) {
    return {
      field: 'level',
      message: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}`,
    }
  }
  return undefined
}

/**
 * Validate coverage type value
 */
export function validateCoverageType(coverageType: string): ValidationError | undefined {
  if (!VALID_COVERAGE_TYPES.includes(coverageType as CoverageLimitType)) {
    return {
      field: 'coverage_type',
      message: `Invalid coverage type. Must be one of: ${VALID_COVERAGE_TYPES.join(', ')}`,
    }
  }
  return undefined
}

/**
 * Validate minimum limit (must be positive)
 */
export function validateMinimumLimit(limit: number): ValidationError | undefined {
  if (typeof limit !== 'number' || limit < 0) {
    return {
      field: 'minimum_limit',
      message: 'Minimum limit must be a non-negative number',
    }
  }
  return undefined
}

/**
 * Validate level and project_id consistency
 * - org level: project_id must be null/undefined
 * - project level: project_id must be provided
 */
export function validateLevelProjectIdConsistency(
  level: CoverageRequirementLevel,
  projectId?: string | null
): ValidationError | undefined {
  if (level === 'org' && projectId) {
    return {
      field: 'project_id',
      message: 'Org-level requirements must not have a project_id',
    }
  }
  if (level === 'project' && !projectId) {
    return {
      field: 'project_id',
      message: 'Project-level requirements must have a project_id',
    }
  }
  return undefined
}

/**
 * Validate create input
 */
export async function validateCreateInput(
  input: CreateCoverageLimitRequirementRequest
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  // Required fields
  if (!input.name || input.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (input.name.length > 200) {
    errors.push({ field: 'name', message: 'Name must be 200 characters or less' })
  }

  if (!input.level) {
    errors.push({ field: 'level', message: 'Level is required' })
  } else {
    const levelError = validateLevel(input.level)
    if (levelError) errors.push(levelError)
  }

  if (!input.organization_id) {
    errors.push({ field: 'organization_id', message: 'Organization ID is required' })
  }

  if (!input.coverage_type) {
    errors.push({ field: 'coverage_type', message: 'Coverage type is required' })
  } else {
    const coverageTypeError = validateCoverageType(input.coverage_type)
    if (coverageTypeError) errors.push(coverageTypeError)
  }

  if (input.minimum_limit === undefined || input.minimum_limit === null) {
    errors.push({ field: 'minimum_limit', message: 'Minimum limit is required' })
  } else {
    const limitError = validateMinimumLimit(input.minimum_limit)
    if (limitError) errors.push(limitError)
  }

  // Level/project_id consistency
  if (input.level) {
    const consistencyError = validateLevelProjectIdConsistency(
      input.level as CoverageRequirementLevel,
      input.project_id
    )
    if (consistencyError) errors.push(consistencyError)
  }

  return errors
}

/**
 * Validate update input
 */
export async function validateUpdateInput(
  input: UpdateCoverageLimitRequirementRequest
): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  if (input.name !== undefined) {
    if (input.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty' })
    } else if (input.name.length > 200) {
      errors.push({ field: 'name', message: 'Name must be 200 characters or less' })
    }
  }

  if (input.coverage_type !== undefined) {
    const coverageTypeError = validateCoverageType(input.coverage_type)
    if (coverageTypeError) errors.push(coverageTypeError)
  }

  if (input.minimum_limit !== undefined) {
    const limitError = validateMinimumLimit(input.minimum_limit)
    if (limitError) errors.push(limitError)
  }

  return errors
}

/**
 * GET /api/coverage-limit-requirements
 * List coverage limit requirements
 *
 * @param organizationId - Required organization filter
 * @param projectId - Optional project filter (when provided, returns combined org + project requirements)
 */
export async function getCoverageLimitRequirements(
  organizationId: string,
  projectId?: string
): Promise<ApiResponse<CoverageLimitRequirement[]>> {
  try {
    if (!organizationId) {
      return {
        success: false,
        error: 'Organization ID is required',
        statusCode: 400,
      }
    }

    let requirements: CoverageLimitRequirement[]

    if (projectId) {
      // Get combined org-level + project-level requirements
      const { data: orgRequirements } = await forsured('coverage_limit_requirements')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('level', 'org')

      const { data: projectRequirements } = await forsured('coverage_limit_requirements')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .eq('level', 'project')

      requirements = [...(orgRequirements || []), ...(projectRequirements || [])]
    } else {
      // Get only org-level requirements
      const { data } = await forsured('coverage_limit_requirements')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('level', 'org')

      requirements = data || []
    }

    // Sort by coverage_type then name
    requirements.sort((a, b) => {
      if (a.coverage_type !== b.coverage_type) {
        return a.coverage_type.localeCompare(b.coverage_type)
      }
      return a.name.localeCompare(b.name)
    })

    return {
      success: true,
      data: requirements,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch coverage requirements',
      statusCode: 500,
    }
  }
}

/**
 * GET /api/coverage-limit-requirements/:id
 * Get a single coverage limit requirement by ID
 */
export async function getCoverageLimitRequirementById(
  id: string
): Promise<ApiResponse<CoverageLimitRequirement>> {
  try {
    const { data: requirement } = await forsured('coverage_limit_requirements')
      .select('*')
      .eq('id', id)
      .single()

    if (!requirement) {
      return {
        success: false,
        error: 'Coverage requirement not found',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: requirement,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch coverage requirement',
      statusCode: 500,
    }
  }
}

/**
 * POST /api/coverage-limit-requirements
 * Create a new coverage limit requirement
 *
 * Authorization:
 * - org-level: admin only
 * - project-level: admin or project manager
 */
export async function createCoverageLimitRequirement(
  input: CreateCoverageLimitRequirementRequest,
  user: UserContext
): Promise<ApiResponse<CoverageLimitRequirement>> {
  // Validation
  const errors = await validateCreateInput(input)
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => `${e.field}: ${e.message}`).join('; '),
      statusCode: 400,
    }
  }

  // Authorization check
  if (input.level === 'org') {
    if (!canManageOrgLevel(user)) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required for org-level requirements.',
        statusCode: 403,
      }
    }
  } else if (input.level === 'project' && input.project_id) {
    if (!canManageProjectLevel(user, input.project_id)) {
      return {
        success: false,
        error:
          'Unauthorized. Admin or project manager access required for project-level requirements.',
        statusCode: 403,
      }
    }
  }

  try {
    const { data: requirement, error } = await forsured('coverage_limit_requirements')
      .insert({
        name: input.name,
        level: input.level,
        organization_id: input.organization_id,
        project_id: input.level === 'org' ? null : (input.project_id ?? null),
        coverage_type: input.coverage_type,
        minimum_limit: input.minimum_limit,
        required: input.required ?? true,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to create coverage requirement: ${error.message}`,
        statusCode: 500,
      }
    }

    return {
      success: true,
      data: requirement,
      statusCode: 201,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create coverage requirement',
      statusCode: 500,
    }
  }
}

/**
 * PATCH /api/coverage-limit-requirements/:id
 * Update a coverage limit requirement
 *
 * Note: level and project_id cannot be changed after creation
 */
export async function updateCoverageLimitRequirement(
  id: string,
  input: UpdateCoverageLimitRequirementRequest,
  user: UserContext
): Promise<ApiResponse<CoverageLimitRequirement>> {
  // Check requirement exists
  const { data: existing } = await forsured('coverage_limit_requirements')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) {
    return {
      success: false,
      error: 'Coverage requirement not found',
      statusCode: 404,
    }
  }

  // Authorization check based on existing level
  if (existing.level === 'org') {
    if (!canManageOrgLevel(user)) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required for org-level requirements.',
        statusCode: 403,
      }
    }
  } else if (existing.level === 'project') {
    if (!canManageProjectLevel(user, existing.project_id!)) {
      return {
        success: false,
        error:
          'Unauthorized. Admin or project manager access required for project-level requirements.',
        statusCode: 403,
      }
    }
  }

  // Validation
  const errors = await validateUpdateInput(input)
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => `${e.field}: ${e.message}`).join('; '),
      statusCode: 400,
    }
  }

  try {
    const { data: updated, error } = await forsured('coverage_limit_requirements')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: `Failed to update coverage requirement: ${error.message}`,
        statusCode: 500,
      }
    }

    return {
      success: true,
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update coverage requirement',
      statusCode: 500,
    }
  }
}

/**
 * DELETE /api/coverage-limit-requirements/:id
 * Delete a coverage limit requirement
 */
export async function deleteCoverageLimitRequirement(
  id: string,
  user: UserContext
): Promise<ApiResponse<void>> {
  // Check requirement exists
  const { data: existing } = await forsured('coverage_limit_requirements')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) {
    return {
      success: false,
      error: 'Coverage requirement not found',
      statusCode: 404,
    }
  }

  // Authorization check based on level
  if (existing.level === 'org') {
    if (!canManageOrgLevel(user)) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required to delete org-level requirements.',
        statusCode: 403,
      }
    }
  } else if (existing.level === 'project' && existing.project_id) {
    if (!canManageProjectLevel(user, existing.project_id)) {
      return {
        success: false,
        error:
          'Unauthorized. Admin or project manager access required to delete project-level requirements.',
        statusCode: 403,
      }
    }
  }

  try {
    const { error } = await forsured('coverage_limit_requirements').delete().eq('id', id)

    if (error) {
      return {
        success: false,
        error: `Failed to delete coverage requirement: ${error.message}`,
        statusCode: 500,
      }
    }

    return {
      success: true,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete coverage requirement',
      statusCode: 500,
    }
  }
}

/**
 * Get only org-level requirements for an organization
 */
export async function getOrgLevelRequirements(
  organizationId: string
): Promise<ApiResponse<CoverageLimitRequirement[]>> {
  try {
    const { data: requirements } = await forsured('coverage_limit_requirements')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('level', 'org')
      .order('name', { ascending: true })

    return {
      success: true,
      data: requirements || [],
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch org-level requirements',
      statusCode: 500,
    }
  }
}

/**
 * Get only project-level requirements for a specific project
 */
export async function getProjectLevelRequirements(
  projectId: string
): Promise<ApiResponse<CoverageLimitRequirement[]>> {
  try {
    const { data: requirements } = await forsured('coverage_limit_requirements')
      .select('*')
      .eq('project_id', projectId)
      .eq('level', 'project')
      .order('name', { ascending: true })

    return {
      success: true,
      data: requirements || [],
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project-level requirements',
      statusCode: 500,
    }
  }
}

/**
 * Service instance with all methods
 */
export const coverageLimitRequirementService = {
  getCoverageLimitRequirements,
  getCoverageLimitRequirementById,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
  getOrgLevelRequirements,
  getProjectLevelRequirements,
  // Utility functions
  isAdmin,
  canManageOrgLevel,
  canManageProjectLevel,
  validateLevel,
  validateCoverageType,
  validateMinimumLimit,
  validateLevelProjectIdConsistency,
  validateCreateInput,
  validateUpdateInput,
  // Constants
  VALID_LEVELS,
  VALID_COVERAGE_TYPES,
}
