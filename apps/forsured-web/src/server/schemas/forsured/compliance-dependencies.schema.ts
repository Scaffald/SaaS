/**
 * Compliance Dependencies Zod Schemas
 * Input validation schemas for dependency management tRPC router
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const dependencyTypeEnum = z.enum(['requires', 'recommended', 'alternative']);

export const underlyingCoverageTypeEnum = z.enum([
  'general_liability',
  'auto_liability',
  'employers_liability',
  'professional_liability',
]);

export const ruleTypeEnum = z.enum(['include', 'exclude']);

export const conditionOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
]);

// =============================================================================
// Dependency Condition Schema
// =============================================================================

export const dependencyConditionSchema = z.object({
  min_underlying_limit: z.number().min(0).optional(),
  attachment_point: z.number().min(0).optional(),
  follow_form: z.boolean().optional(),
  conditions: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.string().min(1),
        value: z.unknown(),
      })
    )
    .optional(),
});

// =============================================================================
// Dependencies Query Schemas
// =============================================================================

/**
 * List dependencies for a requirement
 */
export const dependencyListInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

/**
 * Get dependencies across all requirements in an organization
 */
export const dependencyListAllInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyType: dependencyTypeEnum.optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(50),
});

/**
 * Get a single dependency
 */
export const dependencyGetInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyId: z.string().uuid(),
});

// =============================================================================
// Dependencies Mutation Schemas
// =============================================================================

/**
 * Create a new dependency
 */
export const dependencyCreateInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  dependencyType: dependencyTypeEnum,
  condition: dependencyConditionSchema.optional(),
  notes: z.string().optional(),
});

/**
 * Update an existing dependency
 */
export const dependencyUpdateInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyId: z.string().uuid(),
  updates: z.object({
    dependencyType: dependencyTypeEnum.optional(),
    condition: dependencyConditionSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
});

/**
 * Delete a dependency
 */
export const dependencyDeleteInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyId: z.string().uuid(),
});

// =============================================================================
// Cycle Validation Schema
// =============================================================================

/**
 * Validate that adding a dependency won't create a cycle
 */
export const validateCycleInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
});

// =============================================================================
// Dependency Tree Schema
// =============================================================================

/**
 * Get the dependency tree for a requirement
 */
export const dependencyTreeInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  maxDepth: z.number().min(1).max(20).default(10),
});

/**
 * Get requirements that depend on a given requirement
 */
export const dependentsInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

// =============================================================================
// Umbrella Underlying Schedule Schemas
// =============================================================================

/**
 * List umbrella schedule entries
 */
export const umbrellaScheduleListInputSchema = z.object({
  organizationId: z.string().uuid(),
  umbrellaRequirementId: z.string().uuid(),
});

/**
 * Create umbrella schedule entry
 */
export const umbrellaScheduleCreateInputSchema = z.object({
  organizationId: z.string().uuid(),
  umbrellaRequirementId: z.string().uuid(),
  underlyingCoverageType: underlyingCoverageTypeEnum,
  requiredMinimumLimit: z.number().min(0),
  attachmentPoint: z.number().min(0),
  isScheduled: z.boolean().default(true),
  followsForm: z.boolean().default(true),
  dropDownAllowed: z.boolean().default(false),
  dropDownSir: z.number().min(0).nullable().optional(),
  exclusions: z.record(z.boolean()).nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Update umbrella schedule entry
 */
export const umbrellaScheduleUpdateInputSchema = z.object({
  organizationId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  updates: z.object({
    requiredMinimumLimit: z.number().min(0).optional(),
    attachmentPoint: z.number().min(0).optional(),
    isScheduled: z.boolean().optional(),
    followsForm: z.boolean().optional(),
    dropDownAllowed: z.boolean().optional(),
    dropDownSir: z.number().min(0).nullable().optional(),
    exclusions: z.record(z.boolean()).nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
});

/**
 * Delete umbrella schedule entry
 */
export const umbrellaScheduleDeleteInputSchema = z.object({
  organizationId: z.string().uuid(),
  scheduleId: z.string().uuid(),
});

// =============================================================================
// Compliance Rules Schemas
// =============================================================================

/**
 * List rules for a requirement
 */
export const rulesListInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

/**
 * Create a rule
 */
export const ruleCreateInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  ruleType: ruleTypeEnum,
  conditionField: z.string().min(1).max(100),
  conditionOperator: conditionOperatorEnum,
  conditionValue: z.unknown(),
  priority: z.number().int().default(0),
  description: z.string().nullable().optional(),
});

/**
 * Update a rule
 */
export const ruleUpdateInputSchema = z.object({
  organizationId: z.string().uuid(),
  ruleId: z.string().uuid(),
  updates: z.object({
    ruleType: ruleTypeEnum.optional(),
    conditionField: z.string().min(1).max(100).optional(),
    conditionOperator: conditionOperatorEnum.optional(),
    conditionValue: z.unknown().optional(),
    priority: z.number().int().optional(),
    description: z.string().nullable().optional(),
  }),
});

/**
 * Delete a rule
 */
export const ruleDeleteInputSchema = z.object({
  organizationId: z.string().uuid(),
  ruleId: z.string().uuid(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type DependencyType = z.infer<typeof dependencyTypeEnum>;
export type UnderlyingCoverageType = z.infer<typeof underlyingCoverageTypeEnum>;
export type RuleType = z.infer<typeof ruleTypeEnum>;
export type ConditionOperator = z.infer<typeof conditionOperatorEnum>;
export type DependencyCondition = z.infer<typeof dependencyConditionSchema>;
export type DependencyListInput = z.infer<typeof dependencyListInputSchema>;
export type DependencyListAllInput = z.infer<typeof dependencyListAllInputSchema>;
export type DependencyGetInput = z.infer<typeof dependencyGetInputSchema>;
export type DependencyCreateInput = z.infer<typeof dependencyCreateInputSchema>;
export type DependencyUpdateInput = z.infer<typeof dependencyUpdateInputSchema>;
export type DependencyDeleteInput = z.infer<typeof dependencyDeleteInputSchema>;
export type ValidateCycleInput = z.infer<typeof validateCycleInputSchema>;
export type DependencyTreeInput = z.infer<typeof dependencyTreeInputSchema>;
export type DependentsInput = z.infer<typeof dependentsInputSchema>;
export type UmbrellaScheduleListInput = z.infer<typeof umbrellaScheduleListInputSchema>;
export type UmbrellaScheduleCreateInput = z.infer<typeof umbrellaScheduleCreateInputSchema>;
export type UmbrellaScheduleUpdateInput = z.infer<typeof umbrellaScheduleUpdateInputSchema>;
export type UmbrellaScheduleDeleteInput = z.infer<typeof umbrellaScheduleDeleteInputSchema>;
export type RulesListInput = z.infer<typeof rulesListInputSchema>;
export type RuleCreateInput = z.infer<typeof ruleCreateInputSchema>;
export type RuleUpdateInput = z.infer<typeof ruleUpdateInputSchema>;
export type RuleDeleteInput = z.infer<typeof ruleDeleteInputSchema>;
