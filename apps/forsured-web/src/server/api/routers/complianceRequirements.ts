/**
 * Compliance Requirements Router
 * REQ-2, TASK-7: tRPC CRUD Operations for Compliance Requirements
 *
 * Implements full CRUD operations with:
 * - Organization-scoped access control
 * - Admin-only write operations
 * - Automatic versioning on updates
 * - Soft delete (archive) support
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured, core } from '../../../lib/supabase';
import {
  requirementListInputSchema,
  requirementGetInputSchema,
  requirementCreateInputSchema,
  requirementUpdateInputSchema,
  requirementDeleteInputSchema,
  requirementCloneInputSchema,
  requirementVersionsInputSchema,
  requirementVersionGetInputSchema,
  requirementCompareVersionsInputSchema,
  requirementRestoreVersionInputSchema,
} from '../../schemas/forsured/compliance-requirements.schema';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if user has admin access to an organization
 * Returns true if user has admin, super_admin, or platform_admin role
 */
async function hasAdminAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Query role_assignments from core schema with a join to roles
  const { data, error } = await core('role_assignments')
    .select(`
      id,
      roles:role_id (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error || !data) return false;

  return data.some((assignment) => {
    const role = assignment.roles as { name: string } | null;
    return role && ['admin', 'super_admin', 'platform_admin'].includes(role.name);
  });
}

/**
 * Verify organization access - throws FORBIDDEN if user doesn't belong to org
 */
function verifyOrganizationAccess(
  userOrgId: string | undefined,
  requestOrgId: string
): void {
  if (userOrgId !== requestOrgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this organization',
    });
  }
}

// =============================================================================
// Compliance Requirements Router
// =============================================================================

export const complianceRequirementsRouter = createTRPCRouter({
  /**
   * List compliance requirements with filtering, sorting, and pagination
   */
  list: protectedProcedure
    .input(requirementListInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      let query = forsured('compliance_requirements')
        .select('*', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.filters) {
        if (input.filters.type && input.filters.type.length > 0) {
          query = query.in('type', input.filters.type);
        }
        if (input.filters.status && input.filters.status.length > 0) {
          query = query.in('status', input.filters.status);
        }
        if (input.filters.is_template !== undefined) {
          query = query.eq('is_template', input.filters.is_template);
        }
        if (input.filters.is_current !== undefined) {
          query = query.eq('is_current', input.filters.is_current);
        }
        if (input.filters.search) {
          // Use full-text search on name and description
          query = query.or(
            `name.ilike.%${input.filters.search}%,description.ilike.%${input.filters.search}%,code.ilike.%${input.filters.search}%`
          );
        }
      }

      // Apply sorting
      query = query.order(input.sortBy, { ascending: input.ascending });

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch requirements: ${error.message}`,
        });
      }

      return {
        requirements: data ?? [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Get a single compliance requirement by ID
   */
  get: protectedProcedure
    .input(requirementGetInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      const { data, error } = await forsured('compliance_requirements')
        .select('*')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      return data;
    }),

  /**
   * Create a new compliance requirement
   * Requires admin access
   */
  create: protectedProcedure
    .input(requirementCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify admin access
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const isAdmin = await hasAdminAccess(ctx.userId, input.organizationId);
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to create requirements',
        });
      }

      // Check for duplicate code within organization
      const { data: existing } = await forsured('compliance_requirements')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('code', input.code)
        .maybeSingle();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A requirement with code "${input.code}" already exists in this organization`,
        });
      }

      // Validate expiration_date is after effective_date if both provided
      if (input.effective_date && input.expiration_date) {
        const effectiveDate = new Date(input.effective_date);
        const expirationDate = new Date(input.expiration_date);
        if (expirationDate <= effectiveDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Expiration date must be after effective date',
          });
        }
      }

      const { data, error } = await forsured('compliance_requirements')
        .insert({
          code: input.code,
          name: input.name,
          type: input.type,
          description: input.description,
          status: input.status,
          is_template: input.is_template,
          effective_date: input.effective_date ?? new Date().toISOString().split('T')[0],
          expiration_date: input.expiration_date,
          organization_id: input.organizationId,
          created_by: ctx.userId,
          requirement_definition: input.requirement_definition,
          change_summary: 'Initial version',
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create requirement: ${error.message}`,
        });
      }

      return data;
    }),

  /**
   * Update an existing compliance requirement
   * Creates a new version automatically via database trigger
   * Requires admin access
   */
  update: protectedProcedure
    .input(requirementUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify admin access
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const isAdmin = await hasAdminAccess(ctx.userId, input.organizationId);
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to update requirements',
        });
      }

      // Verify requirement exists
      const { data: existing, error: fetchError } = await forsured('compliance_requirements')
        .select('*')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Check for duplicate code if code is being changed
      if (input.updates.code && input.updates.code !== existing.code) {
        const { data: duplicateCode } = await forsured('compliance_requirements')
          .select('id')
          .eq('organization_id', input.organizationId)
          .eq('code', input.updates.code)
          .neq('id', input.requirementId)
          .maybeSingle();

        if (duplicateCode) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A requirement with code "${input.updates.code}" already exists in this organization`,
          });
        }
      }

      // Validate dates if both are provided (either from update or existing)
      const effectiveDate = input.updates.effective_date ?? existing.effective_date;
      const expirationDate = input.updates.expiration_date ?? existing.expiration_date;
      if (effectiveDate && expirationDate) {
        const eff = new Date(effectiveDate);
        const exp = new Date(expirationDate);
        if (exp <= eff) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Expiration date must be after effective date',
          });
        }
      }

      // Build update object (only include changed fields)
      const updateData: Record<string, unknown> = {
        change_summary: input.change_summary,
        updated_at: new Date().toISOString(),
      };

      if (input.updates.code !== undefined) updateData.code = input.updates.code;
      if (input.updates.name !== undefined) updateData.name = input.updates.name;
      if (input.updates.description !== undefined) updateData.description = input.updates.description;
      if (input.updates.status !== undefined) updateData.status = input.updates.status;
      if (input.updates.effective_date !== undefined) updateData.effective_date = input.updates.effective_date;
      if (input.updates.expiration_date !== undefined) updateData.expiration_date = input.updates.expiration_date;
      if (input.updates.requirement_definition !== undefined) {
        updateData.requirement_definition = input.updates.requirement_definition;
      }

      const { data, error } = await forsured('compliance_requirements')
        .update(updateData)
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update requirement: ${error?.message ?? 'Unknown error'}`,
        });
      }

      return data;
    }),

  /**
   * Delete (archive) a compliance requirement
   * Soft delete - sets status to 'archived' and sets archived_at timestamp
   * Requires admin access
   */
  delete: protectedProcedure
    .input(requirementDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify admin access
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const isAdmin = await hasAdminAccess(ctx.userId, input.organizationId);
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to delete requirements',
        });
      }

      // Verify requirement exists
      const { data: existing, error: fetchError } = await forsured('compliance_requirements')
        .select('id')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Soft delete: archive the requirement
      const { error } = await forsured('compliance_requirements')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          change_summary: 'Requirement archived',
        })
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete requirement: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Clone an existing requirement or template
   * Creates a new requirement with the same definition but new code/name
   * Requires admin access
   */
  clone: protectedProcedure
    .input(requirementCloneInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify admin access
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const isAdmin = await hasAdminAccess(ctx.userId, input.organizationId);
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to clone requirements',
        });
      }

      // Fetch source requirement
      const { data: source, error: sourceError } = await forsured('compliance_requirements')
        .select('*')
        .eq('id', input.sourceRequirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (sourceError || !source) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Source requirement not found',
        });
      }

      // Generate new code if not provided
      const newCode = input.overrides?.code ?? `${source.code}-COPY`;
      const newName = input.overrides?.name ?? `${source.name} (Copy)`;
      const newDescription = input.overrides?.description ?? source.description;

      // Check for duplicate code
      const { data: duplicateCode } = await forsured('compliance_requirements')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('code', newCode)
        .maybeSingle();

      if (duplicateCode) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A requirement with code "${newCode}" already exists. Please provide a unique code.`,
        });
      }

      // Create the clone
      const { data, error } = await forsured('compliance_requirements')
        .insert({
          code: newCode,
          name: newName,
          type: source.type,
          description: newDescription,
          status: 'draft', // New clones start as draft
          is_template: false, // Clones are not templates by default
          effective_date: new Date().toISOString().split('T')[0],
          expiration_date: null,
          organization_id: input.organizationId,
          created_by: ctx.userId,
          requirement_definition: source.requirement_definition,
          change_summary: `Cloned from "${source.name}" (${source.code})`,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to clone requirement: ${error.message}`,
        });
      }

      return data;
    }),

  /**
   * Get version history for a requirement
   * Returns all versions in descending order (newest first)
   */
  getVersions: protectedProcedure
    .input(requirementVersionsInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify requirement exists and belongs to organization
      const { data: requirement, error: reqError } = await forsured('compliance_requirements')
        .select('id')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (reqError || !requirement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Fetch versions with pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      const { data, error, count } = await forsured('compliance_requirement_versions')
        .select(`
          id,
          requirement_id,
          version,
          snapshot,
          changed_fields,
          change_summary,
          changed_by,
          changed_at,
          parent_version_id
        `, { count: 'exact' })
        .eq('requirement_id', input.requirementId)
        .order('version', { ascending: false })
        .range(from, to);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch versions: ${error.message}`,
        });
      }

      return {
        versions: data ?? [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Get a specific version by ID or version number
   */
  getVersion: protectedProcedure
    .input(requirementVersionGetInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify requirement exists and belongs to organization
      const { data: requirement, error: reqError } = await forsured('compliance_requirements')
        .select('id')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (reqError || !requirement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Build query based on input
      let query = forsured('compliance_requirement_versions')
        .select(`
          id,
          requirement_id,
          version,
          snapshot,
          changed_fields,
          change_summary,
          changed_by,
          changed_at,
          parent_version_id
        `)
        .eq('requirement_id', input.requirementId);

      if (input.versionId) {
        query = query.eq('id', input.versionId);
      } else if (input.versionNumber) {
        query = query.eq('version', input.versionNumber);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: input.versionId
            ? `Version with ID "${input.versionId}" not found`
            : `Version ${input.versionNumber} not found`,
        });
      }

      return data;
    }),

  /**
   * Compare two versions side-by-side
   * Returns field-level differences between versions
   */
  compareVersions: protectedProcedure
    .input(requirementCompareVersionsInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify requirement exists and belongs to organization
      const { data: requirement, error: reqError } = await forsured('compliance_requirements')
        .select('id')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (reqError || !requirement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Fetch both versions
      const { data: versions, error } = await forsured('compliance_requirement_versions')
        .select(`
          id,
          version,
          snapshot,
          changed_fields,
          change_summary,
          changed_by,
          changed_at
        `)
        .eq('requirement_id', input.requirementId)
        .in('version', [input.fromVersionNumber, input.toVersionNumber])
        .order('version', { ascending: true });

      if (error || !versions || versions.length !== 2) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or both versions not found',
        });
      }

      const fromVersion = versions.find((v) => v.version === input.fromVersionNumber);
      const toVersion = versions.find((v) => v.version === input.toVersionNumber);

      if (!fromVersion || !toVersion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or both versions not found',
        });
      }

      // Compute differences between snapshots
      const fromSnapshot = fromVersion.snapshot as Record<string, unknown>;
      const toSnapshot = toVersion.snapshot as Record<string, unknown>;

      const differences: Array<{
        field: string;
        fromValue: unknown;
        toValue: unknown;
      }> = [];

      // Get all keys from both snapshots
      const allKeys = new Set([...Object.keys(fromSnapshot), ...Object.keys(toSnapshot)]);

      for (const key of allKeys) {
        const fromValue = fromSnapshot[key];
        const toValue = toSnapshot[key];

        // Deep compare values
        if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
          differences.push({
            field: key,
            fromValue,
            toValue,
          });
        }
      }

      return {
        fromVersion: {
          version: fromVersion.version,
          changed_at: fromVersion.changed_at,
          changed_by: fromVersion.changed_by,
          change_summary: fromVersion.change_summary,
        },
        toVersion: {
          version: toVersion.version,
          changed_at: toVersion.changed_at,
          changed_by: toVersion.changed_by,
          change_summary: toVersion.change_summary,
        },
        differences,
      };
    }),

  /**
   * Restore a requirement to a previous version
   * Creates a new version with the snapshot from the specified version
   * Requires admin access
   */
  restoreVersion: protectedProcedure
    .input(requirementRestoreVersionInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Verify admin access
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const isAdmin = await hasAdminAccess(ctx.userId, input.organizationId);
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to restore versions',
        });
      }

      // Verify requirement exists and belongs to organization
      const { data: requirement, error: reqError } = await forsured('compliance_requirements')
        .select('*')
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .single();

      if (reqError || !requirement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Requirement not found',
        });
      }

      // Fetch the version to restore
      const { data: versionToRestore, error: versionError } = await forsured('compliance_requirement_versions')
        .select('snapshot')
        .eq('requirement_id', input.requirementId)
        .eq('version', input.versionNumber)
        .single();

      if (versionError || !versionToRestore) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Version ${input.versionNumber} not found`,
        });
      }

      const snapshot = versionToRestore.snapshot as Record<string, unknown>;

      // Update the requirement with values from the snapshot
      // The database trigger will automatically create a new version
      const { data, error } = await forsured('compliance_requirements')
        .update({
          code: snapshot.code as string,
          name: snapshot.name as string,
          type: snapshot.type as string,
          description: snapshot.description as string | null,
          status: snapshot.status as string,
          effective_date: snapshot.effective_date as string,
          expiration_date: snapshot.expiration_date as string | null,
          requirement_definition: snapshot.requirement_definition,
          change_summary: `${input.change_summary} (Restored from version ${input.versionNumber})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.requirementId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to restore version: ${error?.message ?? 'Unknown error'}`,
        });
      }

      return data;
    }),
});
