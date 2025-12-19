/**
 * REQ-165: Compliance Requirements Management System
 * CRUD operations for compliance requirements
 */

import { supabase } from '../supabase'
import {
  type ComplianceRequirement,
  type CreateComplianceRequirementInput,
  type UpdateComplianceRequirementInput,
  type RequirementQueryOptions,
  type RequirementListResponse,
  RequirementStatus,
} from './types'
import { validateRequirementDefinition, validateUniqueName, validateEffectiveDate } from './schema'

/**
 * Creates a new compliance requirement
 * @param input The requirement data to create
 * @returns The created requirement with version 1
 * @throws Error if validation fails
 */
export async function createRequirement(
  input: CreateComplianceRequirementInput
): Promise<ComplianceRequirement> {
  // Validate JSON schema
  const schemaValidation = validateRequirementDefinition(input.requirement_definition, input.type)
  if (!schemaValidation.valid) {
    throw new Error(
      `Validation failed: ${schemaValidation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
    )
  }

  // Check for duplicate names
  const { data: existingRequirements } = await supabase.schema('forsured').from('compliance_requirements')
    .select('*')
    .eq('organization_id', input.organization_id)

  const nameValidation = validateUniqueName(
    input.name,
    input.organization_id,
    existingRequirements || []
  )
  if (!nameValidation.valid) {
    throw new Error(nameValidation.errors[0].message)
  }

  // Validate effective date if provided
  const effectiveDate = input.effective_date || new Date().toISOString()
  const dateValidation = validateEffectiveDate(effectiveDate)
  if (!dateValidation.valid) {
    throw new Error(dateValidation.errors[0].message)
  }

  // Create the requirement
  const { data: requirement, error } = await supabase.schema('forsured').from('compliance_requirements')
    .insert({
      ...input,
      version: 1,
      parent_requirement_id: null,
      superseded_date: null,
      effective_date: effectiveDate,
      archived_at: null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create requirement: ${error.message}`)
  }

  return requirement
}

/**
 * Retrieves a single requirement by ID
 * @param id The requirement ID
 * @returns The requirement or null if not found
 */
export async function getRequirement(id: string): Promise<ComplianceRequirement | null> {
  const { data } = await supabase.schema('forsured').from('compliance_requirements').select('*').eq('id', id).single()

  return data
}

/**
 * Lists requirements with filtering, sorting, and pagination
 * @param options Query options including filters, sorting, and pagination
 * @returns Paginated list of requirements
 */
export async function listRequirements(
  options: RequirementQueryOptions = {}
): Promise<RequirementListResponse> {
  const { filters = {}, sort_by = 'created_at', ascending = false, page = 1, limit = 50 } = options

  // Build Supabase query
  let query = supabase.schema('forsured').from('compliance_requirements').select('*')

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.is_template !== undefined) {
    query = query.eq('is_template', filters.is_template)
  }
  if (filters.organization_id) {
    query = query.eq('organization_id', filters.organization_id)
  }

  // Apply search filter if provided
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  // Apply sorting
  query = query.order(sort_by, { ascending })

  // Execute query
  const { data: requirements } = await query

  if (!requirements) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
      },
    }
  }

  // Calculate pagination
  const total = requirements.length
  const total_pages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedData = requirements.slice(start, end)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      total_pages,
    },
  }
}

/**
 * Updates an existing requirement by creating a new version
 * @param id The ID of the requirement to update
 * @param updates The fields to update
 * @returns The new version of the requirement
 * @throws Error if requirement not found or validation fails
 */
export async function updateRequirement(
  id: string,
  updates: UpdateComplianceRequirementInput
): Promise<ComplianceRequirement> {
  // Get the current requirement
  const current = await getRequirement(id)
  if (!current) {
    throw new Error('Requirement not found')
  }

  // Merge updates with current data
  const updatedDefinition = updates.requirement_definition || current.requirement_definition
  const updatedType = current.type
  const updatedName = updates.name || current.name

  // Validate JSON schema if definition was updated
  if (updates.requirement_definition) {
    const schemaValidation = validateRequirementDefinition(updatedDefinition, updatedType)
    if (!schemaValidation.valid) {
      throw new Error(
        `Validation failed: ${schemaValidation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      )
    }
  }

  // Check for duplicate names if name was updated
  if (updates.name && updates.name !== current.name) {
    const { data: existingRequirements } = await supabase.schema('forsured').from('compliance_requirements')
      .select('*')
      .eq('organization_id', current.organization_id)

    const nameValidation = validateUniqueName(
      updatedName,
      current.organization_id,
      existingRequirements || [],
      current.id
    )
    if (!nameValidation.valid) {
      throw new Error(nameValidation.errors[0].message)
    }
  }

  // Validate effective date if provided
  const effectiveDate = updates.effective_date || new Date().toISOString()
  const dateValidation = validateEffectiveDate(effectiveDate)
  if (!dateValidation.valid) {
    throw new Error(dateValidation.errors[0].message)
  }

  // Mark current version as superseded
  const { error: updateError } = await supabase.schema('forsured').from('compliance_requirements')
    .update({ superseded_date: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    throw new Error(`Failed to mark version as superseded: ${updateError.message}`)
  }

  // Create new version
  const { data: newVersion, error: insertError } = await supabase.schema('forsured').from('compliance_requirements')
    .insert({
      name: updatedName,
      type: current.type,
      description: updates.description !== undefined ? updates.description : current.description,
      status: updates.status || current.status,
      is_template: current.is_template,
      created_by: current.created_by,
      organization_id: current.organization_id,
      requirement_definition: updatedDefinition,
      version: current.version + 1,
      parent_requirement_id: current.id,
      effective_date: effectiveDate,
      superseded_date: null,
      change_summary: updates.change_summary,
      archived_at: null,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create new version: ${insertError.message}`)
  }

  return newVersion
}

/**
 * Soft deletes a requirement by archiving it
 * @param id The ID of the requirement to delete
 * @throws Error if requirement not found
 */
export async function deleteRequirement(id: string): Promise<void> {
  const requirement = await getRequirement(id)
  if (!requirement) {
    throw new Error('Requirement not found')
  }

  const { error } = await supabase.schema('forsured').from('compliance_requirements')
    .update({
      status: RequirementStatus.ARCHIVED,
      archived_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to archive requirement: ${error.message}`)
  }
}

/**
 * Clones an existing requirement or template
 * @param sourceId The ID of the requirement to clone
 * @param overrides Optional overrides for name and description
 * @returns The cloned requirement with version 1
 * @throws Error if source requirement not found
 */
export async function cloneRequirement(
  sourceId: string,
  overrides: { name?: string; description?: string }
): Promise<ComplianceRequirement> {
  const source = await getRequirement(sourceId)
  if (!source) {
    throw new Error('Source requirement not found')
  }

  const input: CreateComplianceRequirementInput = {
    name: overrides.name || `${source.name} (Copy)`,
    type: source.type,
    description: overrides.description !== undefined ? overrides.description : source.description,
    status: RequirementStatus.DRAFT,
    is_template: false,
    created_by: source.created_by,
    organization_id: source.organization_id,
    requirement_definition: source.requirement_definition,
    effective_date: new Date().toISOString(),
  }

  return await createRequirement(input)
}

/**
 * Gets version history for a requirement
 * @param id The ID of any version of the requirement
 * @returns Array of all versions in descending order (newest first)
 */
export async function getRequirementVersions(id: string): Promise<ComplianceRequirement[]> {
  const current = await getRequirement(id)
  if (!current) {
    throw new Error('Requirement not found')
  }

  // Find the root requirement (version 1)
  let root = current
  while (root.parent_requirement_id) {
    const parent = await getRequirement(root.parent_requirement_id)
    if (!parent) break
    root = parent
  }

  // Collect all versions starting from root
  const versions: ComplianceRequirement[] = [root]
  let currentVersion = root

  // Find all descendants
  while (true) {
    const { data: descendants } = await supabase.schema('forsured').from('compliance_requirements')
      .select('*')
      .eq('parent_requirement_id', currentVersion.id)

    if (!descendants || descendants.length === 0) break

    // Should only be one direct descendant
    const nextVersion = descendants[0]
    versions.push(nextVersion)
    currentVersion = nextVersion
  }

  // Return in descending order (newest first)
  return versions.reverse()
}
