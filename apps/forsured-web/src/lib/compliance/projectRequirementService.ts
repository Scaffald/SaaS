/**
 * REQ-165: Compliance Requirements Management System
 * Service for managing project-requirement associations
 */

import { forsured } from '@scf/supabase/forsured-client'
import {
  type ProjectRequirement,
  type CreateProjectRequirementInput,
  type ComplianceRequirement,
  RequirementStatus,
} from './types'
import { getRequirement } from './requirementService'

/**
 * Extended project requirement with full requirement details
 */
export interface ProjectRequirementWithDetails {
  id: string
  project_id: string
  requirement_id: string
  is_mandatory: boolean
  assigned_at: string
  assigned_by: string
  requirement: ComplianceRequirement
}

/**
 * Associates a requirement with a project
 * @param input The association data
 * @returns The created project-requirement association
 * @throws Error if requirement is draft or already associated
 */
export async function associateRequirementWithProject(
  input: CreateProjectRequirementInput
): Promise<ProjectRequirement> {
  // Get the requirement to validate
  const requirement = await getRequirement(input.requirement_id)
  if (!requirement) {
    throw new Error('Requirement not found')
  }

  // Draft requirements cannot be assigned to projects
  if (requirement.status === RequirementStatus.DRAFT) {
    throw new Error('Cannot assign draft requirements to projects')
  }

  // Check for existing association
  const { data: existing } = await forsured('project_requirements')
    .select('*')
    .eq('project_id', input.project_id)
    .eq('requirement_id', input.requirement_id)

  if (existing && existing.length > 0) {
    throw new Error('Requirement is already associated with this project')
  }

  // Create the association
  const { data: association, error } = await forsured('project_requirements')
    .insert({
      ...input,
      assigned_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create association: ${error.message}`)
  }

  return association
}

/**
 * Retrieves all requirements for a project
 * @param projectId The project ID
 * @param mandatoryOnly If true, only return mandatory requirements
 * @returns Array of project requirements with full requirement details
 */
export async function getProjectRequirements(
  projectId: string,
  mandatoryOnly: boolean = false
): Promise<ProjectRequirementWithDetails[]> {
  let query = forsured('project_requirements').select('*').eq('project_id', projectId)

  if (mandatoryOnly) {
    query = query.eq('is_mandatory', true)
  }

  const { data: associations } = await query

  if (!associations) {
    return []
  }

  // Fetch full requirement details for each association
  const requirementsWithDetails = await Promise.all(
    associations.map(async (assoc) => {
      const requirement = await getRequirement(assoc.requirement_id)
      if (!requirement) {
        throw new Error(`Requirement ${assoc.requirement_id} not found`)
      }

      return {
        id: assoc.id,
        project_id: assoc.project_id,
        requirement_id: assoc.requirement_id,
        is_mandatory: assoc.is_mandatory,
        assigned_at: assoc.assigned_at,
        assigned_by: assoc.assigned_by,
        requirement,
      }
    })
  )

  return requirementsWithDetails
}

/**
 * Removes a requirement from a project
 * @param associationId The ID of the project-requirement association
 */
export async function removeRequirementFromProject(associationId: string): Promise<void> {
  const { error } = await forsured('project_requirements').delete().eq('id', associationId)

  if (error) {
    throw new Error(`Failed to remove requirement from project: ${error.message}`)
  }
}

/**
 * Updates a project-requirement association
 * @param associationId The ID of the association to update
 * @param updates The fields to update
 * @returns The updated association
 */
export async function updateProjectRequirement(
  associationId: string,
  updates: { is_mandatory?: boolean }
): Promise<ProjectRequirement> {
  const { data, error } = await forsured('project_requirements')
    .update(updates)
    .eq('id', associationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project requirement: ${error.message}`)
  }

  return data
}

/**
 * Checks if a requirement can be deleted (not assigned to active projects)
 * @param requirementId The requirement ID
 * @returns True if requirement is not assigned to any projects
 */
export async function canDeleteRequirement(requirementId: string): Promise<boolean> {
  const { data: associations } = await forsured('project_requirements')
    .select('*')
    .eq('requirement_id', requirementId)

  return !associations || associations.length === 0
}

/**
 * Gets all projects that use a specific requirement
 * @param requirementId The requirement ID
 * @returns Array of project IDs
 */
export async function getProjectsUsingRequirement(requirementId: string): Promise<string[]> {
  const { data: associations } = await forsured('project_requirements')
    .select('*')
    .eq('requirement_id', requirementId)

  return associations?.map((assoc) => assoc.project_id) || []
}
