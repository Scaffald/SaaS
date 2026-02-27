/**
 * Task Router
 * Additional tRPC Routers - Task Management
 *
 * Implements task management procedures replacing src/lib/api/taskService.ts
 * with type-safe tRPC procedures using Supabase backend.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Task status enum for validation
 */
const TaskStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'blocked',
]);

/**
 * Task priority enum for validation
 */
const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

/**
 * Map field names to event types for UI compatibility with TaskHistoryTimeline
 */
function mapFieldToEventType(
  fieldName: string
): 'created' | 'status_change' | 'assigned' | 'due_date_change' | 'edited' {
  switch (fieldName) {
    case 'created':
      return 'created';
    case 'status':
      return 'status_change';
    case 'assigned_to_user_id':
      return 'assigned';
    case 'due_date':
      return 'due_date_change';
    default:
      return 'edited';
  }
}

/**
 * Generate human-readable description for task history event
 */
function generateHistoryDescription(fieldName: string, oldValue: string | null, newValue: string | null): string {
  switch (fieldName) {
    case 'created':
      return 'created this task';
    case 'status':
      return `changed status from "${oldValue || 'none'}" to "${newValue}"`;
    case 'assigned_to_user_id':
      if (!oldValue && newValue) return 'assigned this task';
      if (oldValue && !newValue) return 'unassigned this task';
      return 'reassigned this task';
    case 'due_date':
      if (!oldValue && newValue) return `set due date to ${formatDueDate(newValue)}`;
      if (oldValue && !newValue) return 'removed due date';
      return `changed due date from ${formatDueDate(oldValue)} to ${formatDueDate(newValue)}`;
    case 'priority':
      return `changed priority from "${oldValue || 'none'}" to "${newValue}"`;
    case 'title':
      return 'updated the title';
    case 'description':
      return 'updated the description';
    default:
      return `updated ${fieldName.replace(/_/g, ' ')}`;
  }
}

/**
 * Format due date for display
 */
function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'none';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Task filters schema
 */
const TaskFiltersSchema = z.object({
  status: z.array(TaskStatusEnum).optional(),
  priority: z.array(TaskPriorityEnum).optional(),
  assignee: z.array(z.string().uuid()).optional(),
  project_id: z.array(z.string().uuid()).optional(),
  task_type: z.array(z.string()).optional(),
  date_range: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  search: z.string().optional(),
});

/**
 * Task Router
 *
 * All procedures require authentication and enforce organization-scoped access.
 */
export const taskRouter = createTRPCRouter({
  /**
   * List tasks with filtering, search, and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        filters: TaskFiltersSchema.optional(),
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
          message: 'You do not have permission to access tasks from this organization',
        });
      }

      // Build query
      let query = forsured('tasks')
        .select('*', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.filters) {
        if (input.filters.status && input.filters.status.length > 0) {
          query = query.in('status', input.filters.status);
        }

        if (input.filters.priority && input.filters.priority.length > 0) {
          query = query.in('priority', input.filters.priority);
        }

        if (input.filters.assignee && input.filters.assignee.length > 0) {
          query = query.in('assigned_to_user_id', input.filters.assignee);
        }

        if (input.filters.project_id && input.filters.project_id.length > 0) {
          query = query.in('project_id', input.filters.project_id);
        }

        if (input.filters.task_type && input.filters.task_type.length > 0) {
          query = query.in('task_type', input.filters.task_type);
        }

        if (input.filters.date_range) {
          if (input.filters.date_range.start) {
            query = query.gte('due_date', input.filters.date_range.start);
          }
          if (input.filters.date_range.end) {
            query = query.lte('due_date', input.filters.date_range.end);
          }
        }

        if (input.filters.search) {
          query = query.or(
            `title.ilike.%${input.filters.search}%,description.ilike.%${input.filters.search}%`
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
          message: 'Failed to fetch tasks',
          cause: error,
        });
      }

      return {
        tasks: data || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: count ? offset + input.pageSize < count : false,
      };
    }),

  /**
   * Get single task by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this task',
        });
      }

      const { data, error } = await forsured('tasks')
        .select('*')
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update task
   */
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          status: TaskStatusEnum.optional(),
          priority: TaskPriorityEnum.optional(),
          assigned_to_user_id: z.string().uuid().nullable().optional(),
          due_date: z.string().optional(),
          task_type: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this task',
        });
      }

      const { data, error } = await forsured('tasks')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Bulk update tasks
   */
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskIds: z.array(z.string().uuid()).min(1).max(100),
        updates: z.object({
          status: TaskStatusEnum.optional(),
          priority: TaskPriorityEnum.optional(),
          assigned_to_user_id: z.string().uuid().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update these tasks',
        });
      }

      const { data, error } = await forsured('tasks')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', input.taskIds)
        .eq('organization_id', input.organizationId)
        .select();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update tasks',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get overdue tasks
   */
  getOverdue: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access tasks from this organization',
        });
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await forsured('tasks')
        .select('*')
        .eq('organization_id', input.organizationId)
        .lt('due_date', today)
        .not('status', 'in', '(completed,cancelled)')
        .order('due_date', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch overdue tasks',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Add comment to task
   */
  addComment: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
        content: z.string().min(1),
        mentions: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to comment on this task',
        });
      }

      // Verify task exists and belongs to organization
      const { data: task } = await forsured('tasks')
        .select('id')
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const { data, error } = await forsured('task_comments')
        .insert({
          task_id: input.taskId,
          user_id: ctx.session?.id,
          content: input.content,
          mentions: input.mentions || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add comment',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get comments for a task
   */
  getComments: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view comments for this task',
        });
      }

      // Verify task exists and belongs to organization
      const { data: task } = await forsured('tasks')
        .select('id')
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const { data, error } = await forsured('task_comments')
        .select('*')
        .eq('task_id', input.taskId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch comments',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get attachments for a task
   */
  getAttachments: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view attachments for this task',
        });
      }

      // Verify task exists and belongs to organization
      const { data: task } = await forsured('tasks')
        .select('id')
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const { data, error } = await forsured('task_attachments')
        .select('*')
        .eq('task_id', input.taskId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch attachments',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get task history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view history for this task',
        });
      }

      // Verify task exists and belongs to organization
      const { data: task } = await forsured('tasks')
        .select('id')
        .eq('id', input.taskId)
        .eq('organization_id', input.organizationId)
        .single();

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Query task_history with user info for changed_by
      // Note: We use a raw query approach since cross-schema joins may require it
      const { data, error } = await forsured('task_history')
        .select(`
          id,
          task_id,
          organization_id,
          field_name,
          old_value,
          new_value,
          changed_by,
          created_at
        `)
        .eq('task_id', input.taskId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task history',
          cause: error,
        });
      }

      // Transform database records to UI-compatible format
      const historyForUI = data?.map((entry) => ({
        id: entry.id,
        task_id: entry.task_id,
        type: mapFieldToEventType(entry.field_name),
        field_name: entry.field_name,
        timestamp: entry.created_at,
        changed_by: entry.changed_by,
        description: generateHistoryDescription(entry.field_name, entry.old_value, entry.new_value),
        metadata: {
          oldValue: entry.old_value,
          newValue: entry.new_value,
        },
      })) || [];

      return historyForUI;
    }),

  /**
   * Export tasks to CSV format
   */
  exportTasks: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        filters: TaskFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to export tasks from this organization',
        });
      }

      // Build query with all tasks (no pagination for export)
      let query = forsured('tasks')
        .select('*')
        .eq('organization_id', input.organizationId);

      // Apply filters (same as list procedure)
      if (input.filters) {
        if (input.filters.status && input.filters.status.length > 0) {
          query = query.in('status', input.filters.status);
        }

        if (input.filters.priority && input.filters.priority.length > 0) {
          query = query.in('priority', input.filters.priority);
        }

        if (input.filters.assignee && input.filters.assignee.length > 0) {
          query = query.in('assigned_to_user_id', input.filters.assignee);
        }

        if (input.filters.project_id && input.filters.project_id.length > 0) {
          query = query.in('project_id', input.filters.project_id);
        }

        if (input.filters.task_type && input.filters.task_type.length > 0) {
          query = query.in('task_type', input.filters.task_type);
        }

        if (input.filters.date_range) {
          if (input.filters.date_range.start) {
            query = query.gte('due_date', input.filters.date_range.start);
          }
          if (input.filters.date_range.end) {
            query = query.lte('due_date', input.filters.date_range.end);
          }
        }

        if (input.filters.search) {
          query = query.or(
            `title.ilike.%${input.filters.search}%,description.ilike.%${input.filters.search}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export tasks',
          cause: error,
        });
      }

      // Generate CSV
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created At'];
      const rows = (data || []).map((t) => [
        t.id,
        t.title,
        t.status,
        t.priority,
        t.assigned_to_user_id || 'Unassigned',
        t.due_date || '',
        t.created_at,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      return csv;
    }),
});
