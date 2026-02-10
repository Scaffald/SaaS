/**
 * Compliance Requirements Zod Schemas
 * Input validation schemas for compliance requirements tRPC router
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const coverageTypeEnum = z.enum([
  'general_liability',
  'workers_comp',
  'auto_liability',
  'umbrella',
  'professional_liability',
  'custom',
]);

export const requirementStatusEnum = z.enum(['active', 'draft', 'archived']);

// =============================================================================
// Requirement Definition Schemas
// =============================================================================

export const coverageLimitsSchema = z.object({
  per_occurrence: z.number().min(0).optional(),
  aggregate: z.number().min(0).optional(),
  deductible_max: z.number().min(0).optional(),
}).passthrough(); // Allow additional limit types

export const requiredEndorsementSchema = z.object({
  endorsement_type: z.string().min(1),
  description: z.string(),
});

export const policyConditionSchema = z.object({
  condition_type: z.string().min(1),
  description: z.string(),
});

export const documentationRequirementSchema = z.object({
  document_type: z.string().min(1),
  is_required: z.boolean(),
});

export const requirementDefinitionSchema = z.object({
  coverage_limits: coverageLimitsSchema,
  required_endorsements: z.array(requiredEndorsementSchema),
  policy_conditions: z.array(policyConditionSchema),
  documentation_requirements: z.array(documentationRequirementSchema),
});

// =============================================================================
// Query Input Schemas
// =============================================================================

/**
 * Filters for listing requirements
 */
export const requirementFiltersSchema = z.object({
  type: z.array(coverageTypeEnum).optional(),
  status: z.array(requirementStatusEnum).optional(),
  is_template: z.boolean().optional(),
  search: z.string().optional(),
  is_current: z.boolean().optional(),
});

/**
 * List requirements input with filters and pagination
 */
export const requirementListInputSchema = z.object({
  organizationId: z.string().uuid(),
  filters: requirementFiltersSchema.optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'type', 'status', 'created_at', 'updated_at', 'effective_date']).default('created_at'),
  ascending: z.boolean().default(false),
});

/**
 * Get single requirement input
 */
export const requirementGetInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

// =============================================================================
// Mutation Input Schemas
// =============================================================================

/**
 * Create requirement input (all required fields)
 */
export const requirementCreateInputSchema = z.object({
  organizationId: z.string().uuid(),
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes'),
  name: z.string().min(1).max(255),
  type: coverageTypeEnum,
  description: z.string().optional(),
  status: requirementStatusEnum.default('draft'),
  is_template: z.boolean().default(false),
  effective_date: z.string().date().optional(),
  expiration_date: z.string().date().optional(),
  requirement_definition: requirementDefinitionSchema,
});

/**
 * Update requirement input (partial updates)
 * Creates a new version when called
 */
export const requirementUpdateInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  updates: z.object({
    code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes').optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    status: requirementStatusEnum.optional(),
    effective_date: z.string().date().optional(),
    expiration_date: z.string().date().nullable().optional(),
    requirement_definition: requirementDefinitionSchema.optional(),
  }),
  change_summary: z.string().min(1, 'Change summary is required'),
});

/**
 * Delete (archive) requirement input
 */
export const requirementDeleteInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

/**
 * Clone requirement input
 */
export const requirementCloneInputSchema = z.object({
  organizationId: z.string().uuid(),
  sourceRequirementId: z.string().uuid(),
  overrides: z.object({
    code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes').optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }).optional(),
});

/**
 * Get versions input
 */
export const requirementVersionsInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
});

/**
 * Get a specific version by ID or version number
 */
export const requirementVersionGetInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  versionId: z.string().uuid().optional(),
  versionNumber: z.number().int().min(1).optional(),
}).refine(
  (data) => data.versionId || data.versionNumber,
  { message: 'Either versionId or versionNumber must be provided' }
);

/**
 * Compare two versions
 */
export const requirementCompareVersionsInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  fromVersionNumber: z.number().int().min(1),
  toVersionNumber: z.number().int().min(1),
});

/**
 * Restore a previous version
 */
export const requirementRestoreVersionInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  change_summary: z.string().min(1, 'Change summary is required'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CoverageType = z.infer<typeof coverageTypeEnum>;
export type RequirementStatus = z.infer<typeof requirementStatusEnum>;
export type CoverageLimits = z.infer<typeof coverageLimitsSchema>;
export type RequiredEndorsement = z.infer<typeof requiredEndorsementSchema>;
export type PolicyCondition = z.infer<typeof policyConditionSchema>;
export type DocumentationRequirement = z.infer<typeof documentationRequirementSchema>;
export type RequirementDefinition = z.infer<typeof requirementDefinitionSchema>;
export type RequirementFilters = z.infer<typeof requirementFiltersSchema>;
export type RequirementListInput = z.infer<typeof requirementListInputSchema>;
export type RequirementGetInput = z.infer<typeof requirementGetInputSchema>;
export type RequirementCreateInput = z.infer<typeof requirementCreateInputSchema>;
export type RequirementUpdateInput = z.infer<typeof requirementUpdateInputSchema>;
export type RequirementDeleteInput = z.infer<typeof requirementDeleteInputSchema>;
export type RequirementCloneInput = z.infer<typeof requirementCloneInputSchema>;
export type RequirementVersionsInput = z.infer<typeof requirementVersionsInputSchema>;
export type RequirementVersionGetInput = z.infer<typeof requirementVersionGetInputSchema>;
export type RequirementCompareVersionsInput = z.infer<typeof requirementCompareVersionsInputSchema>;
export type RequirementRestoreVersionInput = z.infer<typeof requirementRestoreVersionInputSchema>;
