/**
 * REQ-165: Compliance Requirements Management System
 * CRUD operations for compliance requirements
 */

import mockDatabase from '../../utils/mockDataStore';
import {
  ComplianceRequirement,
  CreateComplianceRequirementInput,
  UpdateComplianceRequirementInput,
  RequirementQueryOptions,
  RequirementListResponse,
  RequirementStatus
} from './types';
import {
  validateRequirementDefinition,
  validateUniqueName,
  validateEffectiveDate
} from './schema';

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
  const schemaValidation = validateRequirementDefinition(
    input.requirement_definition,
    input.type
  );
  if (!schemaValidation.valid) {
    throw new Error(
      `Validation failed: ${schemaValidation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`
    );
  }

  // Check for duplicate names
  const existingRequirements = await mockDatabase.query<ComplianceRequirement>(
    'compliance_requirements',
    { organization_id: input.organization_id }
  );
  const nameValidation = validateUniqueName(
    input.name,
    input.organization_id,
    existingRequirements
  );
  if (!nameValidation.valid) {
    throw new Error(nameValidation.errors[0].message);
  }

  // Validate effective date if provided
  const effectiveDate = input.effective_date || new Date().toISOString();
  const dateValidation = validateEffectiveDate(effectiveDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.errors[0].message);
  }

  // Create the requirement
  const requirement = await mockDatabase.insert<ComplianceRequirement>(
    'compliance_requirements',
    {
      ...input,
      version: 1,
      parent_requirement_id: null,
      superseded_date: null,
      effective_date: effectiveDate,
      archived_at: null
    }
  );

  return requirement;
}

/**
 * Retrieves a single requirement by ID
 * @param id The requirement ID
 * @returns The requirement or null if not found
 */
export async function getRequirement(
  id: string
): Promise<ComplianceRequirement | null> {
  return await mockDatabase.queryOne<ComplianceRequirement>(
    'compliance_requirements',
    { id }
  );
}

/**
 * Lists requirements with filtering, sorting, and pagination
 * @param options Query options including filters, sorting, and pagination
 * @returns Paginated list of requirements
 */
export async function listRequirements(
  options: RequirementQueryOptions = {}
): Promise<RequirementListResponse> {
  const {
    filters = {},
    sort_by = 'created_at',
    ascending = false,
    page = 1,
    limit = 50
  } = options;

  // Build filter object for database query
  const dbFilters: Record<string, string | boolean> = {};
  if (filters.type) dbFilters.type = filters.type;
  if (filters.status) dbFilters.status = filters.status;
  if (filters.is_template !== undefined) dbFilters.is_template = filters.is_template;
  if (filters.organization_id) dbFilters.organization_id = filters.organization_id;

  // Query all matching requirements
  let requirements = await mockDatabase.query<ComplianceRequirement>(
    'compliance_requirements',
    dbFilters,
    { column: sort_by, ascending }
  );

  // Apply search filter if provided
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    requirements = requirements.filter(
      req =>
        req.name.toLowerCase().includes(searchLower) ||
        req.description?.toLowerCase().includes(searchLower)
    );
  }

  // Calculate pagination
  const total = requirements.length;
  const total_pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = requirements.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      total_pages
    }
  };
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
  const current = await getRequirement(id);
  if (!current) {
    throw new Error('Requirement not found');
  }

  // Merge updates with current data
  const updatedDefinition = updates.requirement_definition || current.requirement_definition;
  const updatedType = current.type;
  const updatedName = updates.name || current.name;

  // Validate JSON schema if definition was updated
  if (updates.requirement_definition) {
    const schemaValidation = validateRequirementDefinition(
      updatedDefinition,
      updatedType
    );
    if (!schemaValidation.valid) {
      throw new Error(
        `Validation failed: ${schemaValidation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`
      );
    }
  }

  // Check for duplicate names if name was updated
  if (updates.name && updates.name !== current.name) {
    const existingRequirements = await mockDatabase.query<ComplianceRequirement>(
      'compliance_requirements',
      { organization_id: current.organization_id }
    );
    const nameValidation = validateUniqueName(
      updatedName,
      current.organization_id,
      existingRequirements,
      current.id
    );
    if (!nameValidation.valid) {
      throw new Error(nameValidation.errors[0].message);
    }
  }

  // Validate effective date if provided
  const effectiveDate = updates.effective_date || new Date().toISOString();
  const dateValidation = validateEffectiveDate(effectiveDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.errors[0].message);
  }

  // Mark current version as superseded
  await mockDatabase.update<ComplianceRequirement>(
    'compliance_requirements',
    id,
    { superseded_date: new Date().toISOString() }
  );

  // Create new version
  const newVersion = await mockDatabase.insert<ComplianceRequirement>(
    'compliance_requirements',
    {
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
      archived_at: null
    }
  );

  return newVersion;
}

/**
 * Soft deletes a requirement by archiving it
 * @param id The ID of the requirement to delete
 * @throws Error if requirement not found
 */
export async function deleteRequirement(id: string): Promise<void> {
  const requirement = await getRequirement(id);
  if (!requirement) {
    throw new Error('Requirement not found');
  }

  await mockDatabase.update<ComplianceRequirement>(
    'compliance_requirements',
    id,
    {
      status: RequirementStatus.ARCHIVED,
      archived_at: new Date().toISOString()
    }
  );
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
  const source = await getRequirement(sourceId);
  if (!source) {
    throw new Error('Source requirement not found');
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
    effective_date: new Date().toISOString()
  };

  return await createRequirement(input);
}

/**
 * Gets version history for a requirement
 * @param id The ID of any version of the requirement
 * @returns Array of all versions in descending order (newest first)
 */
export async function getRequirementVersions(
  id: string
): Promise<ComplianceRequirement[]> {
  const current = await getRequirement(id);
  if (!current) {
    throw new Error('Requirement not found');
  }

  // Find the root requirement (version 1)
  let root = current;
  while (root.parent_requirement_id) {
    const parent = await getRequirement(root.parent_requirement_id);
    if (!parent) break;
    root = parent;
  }

  // Collect all versions starting from root
  const versions: ComplianceRequirement[] = [root];
  let currentVersion = root;

  // Find all descendants
  while (true) {
    const descendants = await mockDatabase.query<ComplianceRequirement>(
      'compliance_requirements',
      { parent_requirement_id: currentVersion.id }
    );

    if (descendants.length === 0) break;

    // Should only be one direct descendant
    const nextVersion = descendants[0];
    versions.push(nextVersion);
    currentVersion = nextVersion;
  }

  // Return in descending order (newest first)
  return versions.reverse();
}
