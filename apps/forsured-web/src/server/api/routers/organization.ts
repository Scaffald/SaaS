/**
 * Organization Router
 * Create tRPC Router Structure for Forsured
 * TASK-2: Create Organization-Scoped Router with Authorization
 *
 * Handles organization-specific data access with proper authorization.
 * Ensures users can only access data from their own organization.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Authorization helper that verifies user belongs to the requested organization
 *
 * @param userOrganizationId - User's organization ID from context
 * @param requestedOrganizationId - Organization ID from request input
 * @throws TRPCError with FORBIDDEN code if organization IDs don't match
 */
function verifyOrganizationAccess(
  userOrganizationId: string | null,
  requestedOrganizationId: string
): void {
  if (!userOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must belong to an organization to access this resource',
    });
  }

  if (userOrganizationId !== requestedOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access data from this organization',
    });
  }
}

/**
 * Organization Router
 *
 * All procedures:
 * - Require authentication (use protectedProcedure)
 * - Validate input with Zod schemas
 * - Check organization authorization before data access
 * - Return organization-scoped data only
 */
export const organizationRouter = createTRPCRouter({
  /**
   * Get organization details
   *
   * Returns organization information for the specified organization ID.
   * User must belong to the requested organization.
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Query organization data from forsured schema
      const { data, error } = await forsured('organizations')
        .select('id, name, created_at, updated_at')
        .eq('id', input.organizationId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch organization details',
          cause: error,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      return data;
    }),

  /**
   * List organization projects
   *
   * Returns all projects belonging to the specified organization.
   * User must belong to the requested organization.
   */
  listProjects: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Query projects from forsured schema with organization filter
      const { data, error, count } = await forsured('projects')
        .select('id, name, status, created_at, updated_at', { count: 'exact' })
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch organization projects',
          cause: error,
        });
      }

      return {
        projects: data || [],
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get organization statistics
   *
   * Returns summary statistics for the organization.
   * User must belong to the requested organization.
   */
  getStats: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Get project count
      const { count: projectCount, error: projectError } = await forsured('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', input.organizationId);

      if (projectError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch organization statistics',
          cause: projectError,
        });
      }

      // Get task count
      const { count: taskCount, error: taskError } = await forsured('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', input.organizationId);

      if (taskError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch organization statistics',
          cause: taskError,
        });
      }

      return {
        organizationId: input.organizationId,
        projectCount: projectCount || 0,
        taskCount: taskCount || 0,
      };
    }),

  /**
   * Get project with subcontractors and users (Cross-Schema Query)
    * TASK-3: Implement Cross-Schema Query Procedures
   *
   * Demonstrates querying across multiple schemas:
   * - forsured.projects (project data)
   * - forsured.subcontractors (subcontractor data)
   * - forsured.users (user data)
   *
   * Maintains organization-scoped authorization throughout all queries.
   */
  getProjectWithDetails: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid('Organization ID must be a valid UUID'),
        projectId: z.string().uuid('Project ID must be a valid UUID'),
        includeSubcontractors: z.boolean().default(true),
        includeUsers: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this organization
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Query 1: Get project from forsured schema
      const { data: project, error: projectError } = await forsured('projects')
        .select('id, name, status, organization_id, created_at, updated_at')
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId) // Ensure project belongs to organization
        .single();

      if (projectError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or does not belong to your organization',
          cause: projectError,
        });
      }

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Query 2: Get subcontractors from forsured schema (if requested)
      let subcontractors = null;
      if (input.includeSubcontractors) {
        const { data: subcontractorData, error: subcontractorError } = await forsured(
          'subcontractors'
        )
          .select('id, name, status, created_at')
          .eq('project_id', input.projectId)
          .eq('organization_id', input.organizationId) // Maintain organization filter
          .order('created_at', { ascending: false });

        if (subcontractorError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch subcontractors',
            cause: subcontractorError,
          });
        }

        subcontractors = subcontractorData || [];
      }

      // Query 3: Get users from forsured schema (if requested)
      let users = null;
      if (input.includeUsers) {
        const { data: userData, error: userError } = await forsured('users')
          .select('id, name, email, created_at')
          .eq('organization_id', input.organizationId) // Maintain organization filter
          .order('created_at', { ascending: false })
          .limit(10); // Limit users to prevent huge response

        if (userError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch users',
            cause: userError,
          });
        }

        users = userData || [];
      }

      // Combine results into typed response
      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          organizationId: project.organization_id,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        },
        subcontractors: subcontractors,
        users: users,
      };
    }),

});
