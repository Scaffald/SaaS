/**
 * Coverage Schemas
 * REQ-287: Create Zod Schemas for Forsured Entities
 * TASK-3: Create coverage schemas
 *
 * Zod schemas for coverage entities with create, update, and base schemas
 * for tRPC input/output validation.
 */

import { z } from 'zod';
import {
  uuidSchema,
  timestampSchema,
  monetaryAmountSchema,
} from './shared.schema';

/**
 * Base coverage schema
 * Full schema with all fields including auto-generated ones
 */
export const coverageSchema = z.object({
  id: uuidSchema,
  policy_id: uuidSchema,
  coverage_type: z.string().min(1),
  coverage_limit: monetaryAmountSchema,
  effective_date: timestampSchema,
  expiration_date: timestampSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

/**
 * Create coverage schema
 * Omits auto-generated fields (id, created_at, updated_at) for creation requests
 */
export const createCoverageSchema = coverageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Update coverage schema
 * Partial schema allowing optional fields for update requests
 */
export const updateCoverageSchema = createCoverageSchema.partial();

/**
 * Export TypeScript types inferred from schemas
 */
export type Coverage = z.infer<typeof coverageSchema>;
export type CreateCoverage = z.infer<typeof createCoverageSchema>;
export type UpdateCoverage = z.infer<typeof updateCoverageSchema>;
