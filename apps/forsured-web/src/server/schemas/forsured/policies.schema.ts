/**
 * Policy and Policy Provision Schemas
 * Create Zod Schemas for Forsured Entities
 * Insurance Coverage Detail Requirements
 *
 * Zod schemas for insurance policies and policy provision entities
 * with create, update, and validation schemas for tRPC input/output validation.
 */

import { z } from 'zod';
import {
  uuidSchema,
  timestampSchema,
  monetaryAmountSchema,
  optionalMonetaryAmountSchema,
  provisionTypeEnum,
} from './shared.schema';

// =============================================================================
// Policy Type and Status Enums
// =============================================================================

/**
 * Insurance policy type enum
 * Must match database constraint in 010_create_insurance_policy_parent_child.sql
 */
export const policyTypeEnum = z.enum([
  'GL',
  'WC',
  'Auto',
  'Umbrella',
  'Professional Liability',
  'Other',
]);

/**
 * Insurance policy status enum
 * Must match database constraint in 010_create_insurance_policy_parent_child.sql
 */
export const policyStatusEnum = z.enum([
  'active',
  'expired',
  'cancelled',
  'pending',
]);

// =============================================================================
// Insurance Policy Schemas
// =============================================================================

/**
 * Base insurance policy schema
 * Full schema with all fields including auto-generated ones
 */
export const insurancePolicySchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  project_id: uuidSchema.nullable().optional(),
  policy_number: z.string().nullable().optional(),
  policy_type: policyTypeEnum,
  carrier_name: z.string().nullable().optional(),
  aggregate_limit: z.number().nullable().optional(),
  each_occurrence_limit: z.number().nullable().optional(),
  deductible: z.number().nullable().optional(),
  effective_date: z.string().nullable().optional(), // DATE stored as string
  expiration_date: z.string().nullable().optional(), // DATE stored as string
  status: policyStatusEnum,
  created_by: uuidSchema.nullable().optional(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

/**
 * Create insurance policy schema
 * Omits auto-generated fields for creation requests
 */
export const createInsurancePolicySchema = insurancePolicySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Update insurance policy schema
 * Partial schema for update requests
 */
export const updateInsurancePolicySchema = createInsurancePolicySchema.partial();

// =============================================================================
// Policy Provision Schemas
// =============================================================================

/**
 * Base policy provision schema
 * Full schema with all fields including auto-generated ones
 * Extended with organization_id, description, and updated_at
 */
export const policyProvisionSchema = z.object({
  id: uuidSchema,
  policy_id: uuidSchema,
  organization_id: uuidSchema,
  provision_type: provisionTypeEnum,
  limit_amount: z.number().nullable().optional(), // For monetary provisions
  deductible: z.number().nullable().optional(),
  provision_value: z.string().nullable().optional(), // For boolean/string provisions
  description: z.string().nullable().optional(), // For 'other' type or notes
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

/**
 * Create policy provision schema
 * Omits auto-generated fields (id, created_at, updated_at) for creation requests
 */
export const createPolicyProvisionSchema = policyProvisionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Update policy provision schema
 * Partial schema allowing optional fields for update requests
 */
export const updatePolicyProvisionSchema = createPolicyProvisionSchema.partial();

// =============================================================================
// Validation Result Schemas
// =============================================================================

/**
 * Validation severity levels
 */
export const validationSeverityEnum = z.enum(['success', 'warning', 'error']);

/**
 * Provision validation result schema
 * Used to indicate whether a provision meets GL requirements
 */
export const provisionValidationResultSchema = z.object({
  provision_type: provisionTypeEnum,
  is_valid: z.boolean(),
  message: z.string(),
  severity: validationSeverityEnum,
  requirement: z.string().optional(), // Human-readable requirement (e.g., "Min $1,000,000")
  actual_value: z.union([z.number(), z.string(), z.boolean()]).nullable().optional(),
});

/**
 * Policy provisions response schema
 * Response structure for GET /api/policies/{policyId}/provisions
 */
export const policyProvisionsResponseSchema = z.object({
  provisions: z.array(policyProvisionSchema),
  validation_results: z.array(provisionValidationResultSchema),
  has_red_flags: z.boolean(),
  policy: insurancePolicySchema.optional(),
});

// =============================================================================
// GL Sub-Limits Display Types
// =============================================================================

/**
 * GL sub-limit display item
 * Used for rendering the CoverageTable component
 */
export const glSubLimitDisplaySchema = z.object({
  id: z.string(),
  name: z.string(),
  provision_type: provisionTypeEnum,
  requirement: z.string(), // e.g., "Min $1,000,000" or "Yes/No"
  current_value: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  formatted_value: z.string(), // Human-readable formatted value
  is_valid: z.boolean(),
  severity: validationSeverityEnum,
  message: z.string().optional(),
});

// =============================================================================
// Export TypeScript Types
// =============================================================================

export type PolicyType = z.infer<typeof policyTypeEnum>;
export type PolicyStatus = z.infer<typeof policyStatusEnum>;
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;
export type CreateInsurancePolicy = z.infer<typeof createInsurancePolicySchema>;
export type UpdateInsurancePolicy = z.infer<typeof updateInsurancePolicySchema>;
export type PolicyProvision = z.infer<typeof policyProvisionSchema>;
export type CreatePolicyProvision = z.infer<typeof createPolicyProvisionSchema>;
export type UpdatePolicyProvision = z.infer<typeof updatePolicyProvisionSchema>;
export type ValidationSeverity = z.infer<typeof validationSeverityEnum>;
export type ProvisionValidationResult = z.infer<typeof provisionValidationResultSchema>;
export type PolicyProvisionsResponse = z.infer<typeof policyProvisionsResponseSchema>;
export type GLSubLimitDisplay = z.infer<typeof glSubLimitDisplaySchema>;
