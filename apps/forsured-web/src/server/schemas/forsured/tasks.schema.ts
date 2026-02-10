/**
 * Task Schemas
 * Create Zod Schemas for Forsured Entities
 * TASK-4: Create task schemas
 *
 * Zod schemas for task entities with create, update, and base schemas
 * for tRPC input/output validation.
 */

import { z } from 'zod';
import {
  uuidSchema,
  timestampSchema,
  taskStatusEnum,
} from './shared.schema';

/**
 * Base task schema
 * Full schema with all fields including auto-generated ones
 */
export const taskSchema = z.object({
  id: uuidSchema,
  policy_id: uuidSchema,
  task_type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusEnum,
  assigned_to: uuidSchema.optional(),
  due_date: timestampSchema.optional(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

/**
 * Create task schema
 * Omits auto-generated fields (id, created_at, updated_at) for creation requests
 */
export const createTaskSchema = taskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Update task schema
 * Partial schema allowing optional fields for update requests
 */
export const updateTaskSchema = createTaskSchema.partial();

/**
 * Export TypeScript types inferred from schemas
 */
export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
