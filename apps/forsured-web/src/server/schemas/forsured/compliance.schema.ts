/**
 * Compliance Schemas
 * REQ-287: Create Zod Schemas for Forsured Entities
 * TASK-5: Create compliance schemas
 *
 * Zod schemas for compliance entities with create, update, and base schemas
 * for tRPC input/output validation.
 */

import { z } from 'zod';
import {
  uuidSchema,
  timestampSchema,
  complianceStatusEnum,
} from './shared.schema';

/**
 * Base compliance schema
 * Full schema with all fields including auto-generated ones
 */
export const complianceSchema = z.object({
  id: uuidSchema,
  policy_id: uuidSchema,
  requirement_type: z.string().min(1),
  description: z.string().min(1),
  status: complianceStatusEnum,
  due_date: timestampSchema.optional(),
  completed_date: timestampSchema.optional(),
  notes: z.string().optional(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

/**
 * Create compliance schema
 * Omits auto-generated fields (id, created_at, updated_at) for creation requests
 */
export const createComplianceSchema = complianceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Update compliance schema
 * Partial schema allowing optional fields for update requests
 */
export const updateComplianceSchema = createComplianceSchema.partial();

/**
 * Export TypeScript types inferred from schemas
 */
export type Compliance = z.infer<typeof complianceSchema>;
export type CreateCompliance = z.infer<typeof createComplianceSchema>;
export type UpdateCompliance = z.infer<typeof updateComplianceSchema>;
