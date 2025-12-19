/**
 * Project Router
 * REQ-286: Additional tRPC Routers - Project Management
 *
 * Implements project management procedures replacing src/lib/api/projectService.ts
 * with type-safe tRPC procedures using Supabase backend.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Project status enum for validation
 */
const ProjectStatusEnum = z.enum([
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]);

/**
 * Project filters schema
 */
const ProjectFiltersSchema = z.object({
  status: z.array(ProjectStatusEnum).optional(),
  owner_user_id: z.array(z.string().uuid()).optional(),
  date_range: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  search: z.string().optional(),
});

/**
 * Project Router
 *
 * All procedures require authentication and enforce organization-scoped access.
 */
export const projectRouter = createTRPCRouter({
  /**
   * List projects with filtering, search, and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        filters: ProjectFiltersSchema.optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.string().default('created_at'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access projects from this organization',
        });
      }

      // Build query
      let query = forsured('projects')
        .select('*', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.filters) {
        if (input.filters.status && input.filters.status.length > 0) {
          query = query.in('status', input.filters.status);
        }

        if (input.filters.owner_user_id && input.filters.owner_user_id.length > 0) {
          query = query.in('owner_user_id', input.filters.owner_user_id);
        }

        if (input.filters.date_range) {
          if (input.filters.date_range.start) {
            query = query.gte('created_at', input.filters.date_range.start);
          }
          if (input.filters.date_range.end) {
            query = query.lte('created_at', input.filters.date_range.end);
          }
        }

        if (input.filters.search) {
          query = query.or(
            `name.ilike.%${input.filters.search}%,description.ilike.%${input.filters.search}%`
          );
        }
      }

      // Apply sorting and pagination
      const offset = (input.page - 1) * input.pageSize;
      query = query
        .order(input.sortBy, { ascending: input.sortOrder === 'asc' })
        .range(offset, offset + input.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects',
          cause: error,
        });
      }

      return {
        projects: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: count ? offset + input.pageSize < count : false,
      };
    }),

  /**
   * Get single project by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this project',
        });
      }

      const { data, error } = await forsured('projects')
        .select('*')
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        status: ProjectStatusEnum.default('planning'),
        owner_user_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create projects in this organization',
        });
      }

      const { data, error } = await forsured('projects')
        .insert({
          organization_id: input.organizationId,
          name: input.name,
          description: input.description,
          status: input.status,
          owner_user_id: input.owner_user_id || ctx.session?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid(),
        updates: z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          status: ProjectStatusEnum.optional(),
          owner_user_id: z.string().uuid().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this project',
        });
      }

      const { data, error } = await forsured('projects')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this project',
        });
      }

      const { error } = await forsured('projects')
        .delete()
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete project',
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get project statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this project',
        });
      }

      // Verify project exists and belongs to organization
      const { data: project, error: projectError } = await forsured('projects')
        .select('id')
        .eq('id', input.projectId)
        .eq('organization_id', input.organizationId)
        .single();

      if (projectError || !project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Get task counts by status
      const { data: tasks, error: tasksError } = await forsured('tasks')
        .select('status')
        .eq('project_id', input.projectId);

      if (tasksError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project statistics',
          cause: tasksError,
        });
      }

      const tasksByStatus = (tasks || []).reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalTasks: tasks?.length || 0,
        tasksByStatus,
        completedTasks: tasksByStatus.completed || 0,
        pendingTasks: (tasksByStatus.pending || 0) + (tasksByStatus.in_progress || 0),
      };
    }),
});
