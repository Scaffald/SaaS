/**
 * Shared Schema Definitions for Forsured Entities
 * Create Zod Schemas for Forsured Entities
 * TASK-1: Create shared schema definitions
 *
 * Common Zod schemas and types reused across all Forsured entity schemas.
 */

import { z } from 'zod';

/**
 * UUID validation schema
 * Validates string format as UUID v4
 */
export const uuidSchema = z.string().uuid();

/**
 * Timestamp validation schema
 * Validates ISO 8601 date strings or Date objects
 */
export const timestampSchema = z.coerce.date();

/**
 * Monetary amount validation schema
 * Validates positive numbers for currency amounts
 */
export const monetaryAmountSchema = z.number().positive();

/**
 * Optional monetary amount schema
 * Allows undefined/null for optional monetary fields
 */
export const optionalMonetaryAmountSchema = z.number().positive().optional();

/**
 * Policy provision type enum
 * Defines all valid provision types for policy provisions
 * Must match database constraint in 010_create_insurance_policy_parent_child.sql
 * Extended for GL sub-limits requirements
 */
export const provisionTypeEnum = z.enum([
  // GL sub-limits (monetary)
  'per_occurrence',
  'general_aggregate',
  'personal_advertising',
  'products_completed',
  'medical_payments',
  'damage_to_premises',
  'fire_damage',
  'employee_benefits',
  // GL requirements (boolean/string) - Added for
  'per_project_aggregate',
  'occurrence_form',
  'auto_symbol',
  // Other
  'other',
]);

/**
 * GL provision validation requirements
 * Defines validation rules for each GL provision type
 */
export const glProvisionRequirements = {
  per_occurrence: { minLimit: 1000000, type: 'monetary' as const },
  general_aggregate: { minLimit: 2000000, type: 'monetary' as const },
  personal_advertising: { minLimit: 1000000, type: 'monetary' as const },
  products_completed: { minLimit: 2000000, type: 'monetary' as const },
  medical_payments: { type: 'monetary' as const },
  damage_to_premises: { type: 'monetary' as const },
  fire_damage: { type: 'monetary' as const },
  employee_benefits: { type: 'monetary' as const },
  per_project_aggregate: { type: 'boolean' as const },
  occurrence_form: { type: 'boolean' as const },
  auto_symbol: { validValues: ['1', '7,8,9'] as const, type: 'string' as const },
  other: { type: 'monetary' as const },
} as const;

/**
 * Deductible validation for GL policies
 * Maximum deductible allowed is $10,000
 */
export const glMaxDeductible = 10000;

/**
 * Task status enum
 * Defines all valid task statuses
 */
export const taskStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Compliance status enum
 * Defines all valid compliance statuses
 */
export const complianceStatusEnum = z.enum([
  'compliant',
  'non_compliant',
  'pending_review',
]);

/**
 * Export TypeScript types inferred from schemas
 */
export type ProvisionType = z.infer<typeof provisionTypeEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type ComplianceStatus = z.infer<typeof complianceStatusEnum>;
