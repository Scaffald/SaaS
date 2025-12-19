/**
 * Compliance Requirements Router
 * REQ-2, TASK-19: Integrate Authorization Checks into tRPC Routers
 *
 * tRPC router for compliance requirements CRUD operations with
 * database-driven authorization.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../../middleware';
import {
  enforceCompliancePermission,
  getOrgIdFromInput,
  getUserPermissions,
} from './compliance-auth';

// =============================================================================
// Zod Schemas
// =============================================================================

const coverageTypeEnum = z.enum([
  'general_liability',
  'workers_comp',
  'auto_liability',
  'umbrella',
  'professional_liability',
  'custom',
])

const requirementStatusEnum = z.enum(['active', 'draft', 'archived'])

const coverageLimitsSchema = z
  .object({
    per_occurrence: z.number().min(0).optional(),
    aggregate: z.number().min(0).optional(),
    deductible_max: z.number().min(0).optional(),
  })
  .passthrough()

const requiredEndorsementSchema = z.object({
  endorsement_type: z.string().min(1),
  description: z.string(),
})

const policyConditionSchema = z.object({
  condition_type: z.string().min(1),
  description: z.string(),
})

const documentationRequirementSchema = z.object({
  document_type: z.string().min(1),
  is_required: z.boolean(),
})

const requirementDefinitionSchema = z.object({
  coverage_limits: coverageLimitsSchema,
  required_endorsements: z.array(requiredEndorsementSchema),
  policy_conditions: z.array(policyConditionSchema),
  documentation_requirements: z.array(documentationRequirementSchema),
})

// =============================================================================
// Input Schemas
// =============================================================================

const listInputSchema = z.object({
  organizationId: z.string().uuid(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  types: z.array(coverageTypeEnum).optional(),
  statuses: z.array(requirementStatusEnum).optional(),
  search: z.string().optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeArchived: z.boolean().default(false),
  isTemplate: z.boolean().optional(),
})

const getInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
})

const getByCodeInputSchema = z.object({
  organizationId: z.string().uuid(),
  code: z.string(),
})

const createInputSchema = z.object({
  organizationId: z.string().uuid(),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes'),
  name: z.string().min(1).max(255),
  type: coverageTypeEnum,
  description: z.string().optional(),
  status: requirementStatusEnum.default('draft'),
  is_template: z.boolean().default(false),
  effective_date: z.string().optional(),
  expiration_date: z.string().optional().nullable(),
  requirement_definition: requirementDefinitionSchema,
})

const updateInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/i)
    .optional(),
  name: z.string().min(1).max(255).optional(),
  type: coverageTypeEnum.optional(),
  description: z.string().nullable().optional(),
  status: requirementStatusEnum.optional(),
  effective_date: z.string().optional(),
  expiration_date: z.string().nullable().optional(),
  requirement_definition: requirementDefinitionSchema.optional(),
  change_summary: z.string().min(1, 'Change summary is required'),
})

const archiveInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
})

const restoreInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
})

const listVersionsInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
})

const cloneInputSchema = z.object({
  organizationId: z.string().uuid(),
  sourceRequirementId: z.string().uuid(),
  overrides: z
    .object({
      code: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
})

const restoreVersionInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  change_summary: z.string().min(1, 'Change summary is required'),
})

// =============================================================================
// Router
// =============================================================================

export const complianceRequirementsRouter = t.router({
  /**
   * List requirements with filtering and pagination
   * Requires: requirement:read permission
   */
  list: protectedProcedure
    .input(listInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const {
        organizationId,
        page,
        pageSize,
        types,
        statuses,
        search,
        sortBy,
        sortOrder,
        includeArchived,
        isTemplate,
      } = input

      const offset = (page - 1) * pageSize

      let query = ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_current', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1)

      // Apply filters
      if (!includeArchived) {
        query = query.is('archived_at', null)
      }

      if (types && types.length > 0) {
        query = query.in('type', types)
      }

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses)
      }

      if (isTemplate !== undefined) {
        query = query.eq('is_template', isTemplate)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list requirements: ${error.message}`,
        })
      }

      return {
        items: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    }),

  /**
   * Get a single requirement by ID
   * Requires: requirement:read permission
   */
  get: protectedProcedure
    .input(getInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, requirementId } = input

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        })
      }

      return data
    }),

  /**
   * Get a requirement by code
   * Requires: requirement:read permission
   */
  getByCode: protectedProcedure
    .input(getByCodeInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, code } = input

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('*')
        .eq('code', code)
        .eq('organization_id', organizationId)
        .eq('is_current', true)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        })
      }

      return data
    }),

  /**
   * Create a new requirement
   * Requires: requirement:create permission
   */
  create: protectedProcedure
    .input(createInputSchema)
    .use(enforceCompliancePermission('requirement:create', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, ...requirementData } = input

      // Check for duplicate code
      const { data: existing } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('code', requirementData.code)
        .eq('is_current', true)
        .single()

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A requirement with this code already exists',
        })
      }

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .insert({
          organization_id: organizationId,
          code: requirementData.code,
          name: requirementData.name,
          type: requirementData.type,
          description: requirementData.description ?? null,
          status: requirementData.status,
          is_template: requirementData.is_template,
          effective_date: requirementData.effective_date ?? new Date().toISOString().split('T')[0],
          expiration_date: requirementData.expiration_date ?? null,
          requirement_definition: requirementData.requirement_definition,
          created_by: ctx.user?.id ?? null,
          current_version: 1,
          is_current: true,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create requirement: ${error.message}`,
        })
      }

      // Create initial version record
      await ctx.supabase.schema('forsured').from('compliance_requirement_versions').insert({
        requirement_id: data.id,
        version_number: 1,
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        status: data.status,
        is_template: data.is_template,
        effective_date: data.effective_date,
        expiration_date: data.expiration_date,
        requirement_definition: data.requirement_definition,
        change_summary: 'Initial version',
        changed_by: ctx.user?.id ?? null,
      })

      return data
    }),

  /**
   * Update a requirement (creates a new version)
   * Requires: requirement:update permission
   */
  update: protectedProcedure
    .input(updateInputSchema)
    .use(enforceCompliancePermission('requirement:update', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, requirementId, change_summary, ...updates } = input

      // Get current requirement
      const { data: current, error: fetchError } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .single()

      if (fetchError || !current) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        })
      }

      // Build update object
      const updateData: Record<string, unknown> = {}
      if (updates.code !== undefined) updateData.code = updates.code
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.type !== undefined) updateData.type = updates.type
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.effective_date !== undefined) updateData.effective_date = updates.effective_date
      if (updates.expiration_date !== undefined) updateData.expiration_date = updates.expiration_date
      if (updates.requirement_definition !== undefined)
        updateData.requirement_definition = updates.requirement_definition

      // Increment version
      updateData.current_version = (current.current_version as number) + 1
      updateData.change_summary = change_summary

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .update(updateData)
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update requirement: ${error.message}`,
        })
      }

      // Create version record
      await ctx.supabase.schema('forsured').from('compliance_requirement_versions').insert({
        requirement_id: requirementId,
        version_number: data.current_version,
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        status: data.status,
        is_template: data.is_template,
        effective_date: data.effective_date,
        expiration_date: data.expiration_date,
        requirement_definition: data.requirement_definition,
        change_summary,
        changed_by: ctx.user?.id ?? null,
      })

      return data
    }),

  /**
   * Archive a requirement (soft delete)
   * Requires: requirement:delete permission
   */
  archive: protectedProcedure
    .input(archiveInputSchema)
    .use(enforceCompliancePermission('requirement:delete', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, requirementId } = input

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .update({
          archived_at: new Date().toISOString(),
          status: 'archived',
        })
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to archive requirement: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Restore an archived requirement
   * Requires: requirement:update permission
   */
  restore: protectedProcedure
    .input(restoreInputSchema)
    .use(enforceCompliancePermission('requirement:update', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, requirementId } = input

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .update({
          archived_at: null,
          status: 'draft',
        })
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to restore requirement: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * List version history for a requirement
   * Requires: requirement:read permission
   */
  listVersions: protectedProcedure
    .input(listVersionsInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, requirementId, page, pageSize } = input
      const offset = (page - 1) * pageSize

      // Verify requirement exists and belongs to org
      const { data: requirement } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('id')
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .single()

      if (!requirement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        })
      }

      const { data, error, count } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_versions')
        .select('*', { count: 'exact' })
        .eq('requirement_id', requirementId)
        .order('version_number', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list versions: ${error.message}`,
        })
      }

      return {
        items: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    }),

  /**
   * Clone a requirement
   * Requires: requirement:clone permission
   */
  clone: protectedProcedure
    .input(cloneInputSchema)
    .use(enforceCompliancePermission('requirement:clone', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, sourceRequirementId, overrides } = input

      // Get source requirement
      const { data: source, error: fetchError } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('*')
        .eq('id', sourceRequirementId)
        .eq('organization_id', organizationId)
        .single()

      if (fetchError || !source) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Source requirement not found',
        })
      }

      // Generate new code if not provided
      const newCode = overrides?.code ?? `${source.code}-COPY-${Date.now().toString(36).toUpperCase()}`

      // Create cloned requirement
      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .insert({
          organization_id: organizationId,
          code: newCode,
          name: overrides?.name ?? `${source.name} (Copy)`,
          type: source.type,
          description: overrides?.description ?? source.description,
          status: 'draft',
          is_template: false,
          effective_date: new Date().toISOString().split('T')[0],
          expiration_date: null,
          requirement_definition: source.requirement_definition,
          created_by: ctx.user?.id ?? null,
          current_version: 1,
          is_current: true,
          parent_requirement_id: sourceRequirementId,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to clone requirement: ${error.message}`,
        })
      }

      // Create initial version record
      await ctx.supabase.schema('forsured').from('compliance_requirement_versions').insert({
        requirement_id: data.id,
        version_number: 1,
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        status: data.status,
        is_template: data.is_template,
        effective_date: data.effective_date,
        expiration_date: data.expiration_date,
        requirement_definition: data.requirement_definition,
        change_summary: `Cloned from ${source.code}`,
        changed_by: ctx.user?.id ?? null,
      })

      return data
    }),

  /**
   * Restore a previous version
   * Requires: requirement:restore_version permission
   */
  restoreVersion: protectedProcedure
    .input(restoreVersionInputSchema)
    .use(enforceCompliancePermission('requirement:restore_version', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, requirementId, versionNumber, change_summary } = input

      // Get the version to restore
      const { data: version, error: versionError } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_versions')
        .select('*')
        .eq('requirement_id', requirementId)
        .eq('version_number', versionNumber)
        .single()

      if (versionError || !version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Version not found',
        })
      }

      // Get current requirement
      const { data: current } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .select('current_version')
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .single()

      if (!current) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        })
      }

      const newVersion = (current.current_version as number) + 1

      // Update requirement with version data
      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirements')
        .update({
          code: version.code,
          name: version.name,
          type: version.type,
          description: version.description,
          status: version.status,
          is_template: version.is_template,
          effective_date: version.effective_date,
          expiration_date: version.expiration_date,
          requirement_definition: version.requirement_definition,
          current_version: newVersion,
          change_summary,
        })
        .eq('id', requirementId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to restore version: ${error.message}`,
        })
      }

      // Create version record
      await ctx.supabase.schema('forsured').from('compliance_requirement_versions').insert({
        requirement_id: requirementId,
        version_number: newVersion,
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        status: data.status,
        is_template: data.is_template,
        effective_date: data.effective_date,
        expiration_date: data.expiration_date,
        requirement_definition: data.requirement_definition,
        change_summary: `${change_summary} (restored from v${versionNumber})`,
        changed_by: ctx.user?.id ?? null,
      })

      return data
    }),

  /**
   * Get user's permissions for compliance features
   * Returns the list of permissions the current user has
   */
  getMyPermissions: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const permissions = await getUserPermissions(ctx.supabase, ctx.user.id, input.organizationId)
      return { permissions }
    }),
})
