/**
 * Compliance Dependencies Router
 * REQ-2, TASK-19: Integrate Authorization Checks into tRPC Routers
 *
 * tRPC router for managing dependencies between compliance requirements.
 * Includes dependency relationships, umbrella underlying schedules, and rules.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../../middleware.ts'
import { enforceCompliancePermission, getOrgIdFromInput } from './compliance-auth.ts'

// =============================================================================
// Zod Schemas
// =============================================================================

const dependencyTypeEnum = z.enum(['requires', 'recommended', 'alternative'])

const underlyingCoverageTypeEnum = z.enum([
  'general_liability',
  'auto_liability',
  'employers_liability',
  'professional_liability',
])

const conditionOperatorEnum = z.enum([
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
])

const ruleTypeEnum = z.enum(['include', 'exclude'])

// =============================================================================
// Input Schemas
// =============================================================================

const listForRequirementInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
})

const createDependencyInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  dependencyType: dependencyTypeEnum,
  condition: z
    .object({
      min_underlying_limit: z.number().optional(),
      attachment_point: z.number().optional(),
      follow_form: z.boolean().optional(),
      conditions: z
        .array(
          z.object({
            field: z.string(),
            operator: z.string(),
            value: z.unknown(),
          })
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  notes: z.string().optional(),
})

const updateDependencyInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyId: z.string().uuid(),
  dependencyType: dependencyTypeEnum.optional(),
  condition: z
    .object({
      min_underlying_limit: z.number().optional(),
      attachment_point: z.number().optional(),
      follow_form: z.boolean().optional(),
      conditions: z
        .array(
          z.object({
            field: z.string(),
            operator: z.string(),
            value: z.unknown(),
          })
        )
        .optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
})

const deleteDependencyInputSchema = z.object({
  organizationId: z.string().uuid(),
  dependencyId: z.string().uuid(),
})

// Umbrella underlying schedule schemas
const createUnderlyingScheduleInputSchema = z.object({
  organizationId: z.string().uuid(),
  umbrellaRequirementId: z.string().uuid(),
  underlyingCoverageType: underlyingCoverageTypeEnum,
  requiredMinimumLimit: z.number().positive(),
  attachmentPoint: z.number().positive(),
  isScheduled: z.boolean().default(true),
  followsForm: z.boolean().default(true),
  dropDownAllowed: z.boolean().default(false),
  dropDownSir: z.number().positive().optional(),
  exclusions: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
})

const updateUnderlyingScheduleInputSchema = z.object({
  organizationId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  requiredMinimumLimit: z.number().positive().optional(),
  attachmentPoint: z.number().positive().optional(),
  isScheduled: z.boolean().optional(),
  followsForm: z.boolean().optional(),
  dropDownAllowed: z.boolean().optional(),
  dropDownSir: z.number().positive().nullable().optional(),
  exclusions: z.record(z.boolean()).nullable().optional(),
  notes: z.string().nullable().optional(),
})

const deleteUnderlyingScheduleInputSchema = z.object({
  organizationId: z.string().uuid(),
  scheduleId: z.string().uuid(),
})

const listUnderlyingScheduleInputSchema = z.object({
  organizationId: z.string().uuid(),
  umbrellaRequirementId: z.string().uuid(),
})

// Requirement rules schemas
const createRuleInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
  ruleType: ruleTypeEnum,
  conditionField: z.string().min(1).max(100),
  conditionOperator: conditionOperatorEnum,
  conditionValue: z.unknown(),
  priority: z.number().int().default(0),
  description: z.string().optional(),
})

const updateRuleInputSchema = z.object({
  organizationId: z.string().uuid(),
  ruleId: z.string().uuid(),
  ruleType: ruleTypeEnum.optional(),
  conditionField: z.string().min(1).max(100).optional(),
  conditionOperator: conditionOperatorEnum.optional(),
  conditionValue: z.unknown().optional(),
  priority: z.number().int().optional(),
  description: z.string().nullable().optional(),
})

const deleteRuleInputSchema = z.object({
  organizationId: z.string().uuid(),
  ruleId: z.string().uuid(),
})

const listRulesInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementId: z.string().uuid(),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Verify a requirement exists and belongs to the organization
 */
async function verifyRequirementAccess(
  supabase: { schema: (s: string) => { from: (t: string) => unknown } },
  requirementId: string,
  organizationId: string
): Promise<void> {
  const { data, error } = await (supabase as unknown as {
    schema: (s: string) => {
      from: (t: string) => {
        select: (s: string) => {
          eq: (f: string, v: string) => {
            eq: (f: string, v: string) => {
              single: () => Promise<{ data: unknown; error: unknown }>
            }
          }
        }
      }
    }
  })
    .schema('forsured')
    .from('compliance_requirements')
    .select('id')
    .eq('id', requirementId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Requirement not found',
    })
  }
}

// =============================================================================
// Router
// =============================================================================

export const complianceDependenciesRouter = t.router({
  // ===========================================================================
  // Dependencies
  // ===========================================================================

  /**
   * List dependencies for a requirement
   * Requires: requirement:read permission
   */
  listForRequirement: protectedProcedure
    .input(listForRequirementInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, requirementId } = input

      // Verify requirement access
      await verifyRequirementAccess(ctx.supabase, requirementId, organizationId)

      // Get dependencies where this requirement is the source
      const { data: dependencies, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .select(
          `
          id,
          requirement_id,
          depends_on_id,
          dependency_type,
          condition,
          notes,
          created_at,
          depends_on:compliance_requirements!compliance_requirement_dependencies_depends_on_id_fkey(
            id,
            code,
            name,
            type
          )
        `
        )
        .eq('requirement_id', requirementId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list dependencies: ${error.message}`,
        })
      }

      // Also get reverse dependencies (what depends on this requirement)
      const { data: dependents, error: depError } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .select(
          `
          id,
          requirement_id,
          depends_on_id,
          dependency_type,
          condition,
          notes,
          created_at,
          requirement:compliance_requirements!compliance_requirement_dependencies_requirement_id_fkey(
            id,
            code,
            name,
            type
          )
        `
        )
        .eq('depends_on_id', requirementId)

      if (depError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list dependents: ${depError.message}`,
        })
      }

      return {
        dependencies: dependencies ?? [],
        dependents: dependents ?? [],
      }
    }),

  /**
   * Create a dependency between requirements
   * Requires: requirement:manage_dependencies permission
   */
  create: protectedProcedure
    .input(createDependencyInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, requirementId, dependsOnId, dependencyType, condition, notes } = input

      // Verify both requirements exist and belong to org
      await verifyRequirementAccess(ctx.supabase, requirementId, organizationId)
      await verifyRequirementAccess(ctx.supabase, dependsOnId, organizationId)

      // Check for circular dependency
      if (requirementId === dependsOnId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A requirement cannot depend on itself',
        })
      }

      // Check if dependency would create a cycle
      const { data: existingDeps } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .select('id')
        .eq('requirement_id', dependsOnId)
        .eq('depends_on_id', requirementId)

      if (existingDeps && existingDeps.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This dependency would create a circular reference',
        })
      }

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .insert({
          requirement_id: requirementId,
          depends_on_id: dependsOnId,
          dependency_type: dependencyType,
          condition: condition ?? null,
          notes: notes ?? null,
          created_by: ctx.user?.id ?? null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This dependency already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create dependency: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Update a dependency
   * Requires: requirement:manage_dependencies permission
   */
  update: protectedProcedure
    .input(updateDependencyInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { dependencyId, ...updates } = input

      // Build update object
      const updateData: Record<string, unknown> = {}
      if (updates.dependencyType !== undefined) updateData.dependency_type = updates.dependencyType
      if (updates.condition !== undefined) updateData.condition = updates.condition
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .update(updateData)
        .eq('id', dependencyId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update dependency: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Delete a dependency
   * Requires: requirement:manage_dependencies permission
   */
  delete: protectedProcedure
    .input(deleteDependencyInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { dependencyId } = input

      const { error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_dependencies')
        .delete()
        .eq('id', dependencyId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete dependency: ${error.message}`,
        })
      }

      return { success: true }
    }),

  // ===========================================================================
  // Umbrella Underlying Schedule
  // ===========================================================================

  /**
   * List underlying schedule for an umbrella requirement
   * Requires: requirement:read permission
   */
  listUnderlyingSchedule: protectedProcedure
    .input(listUnderlyingScheduleInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, umbrellaRequirementId } = input

      // Verify umbrella requirement access
      await verifyRequirementAccess(ctx.supabase, umbrellaRequirementId, organizationId)

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('umbrella_underlying_schedule')
        .select('*')
        .eq('umbrella_requirement_id', umbrellaRequirementId)
        .order('underlying_coverage_type')

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list underlying schedule: ${error.message}`,
        })
      }

      return data ?? []
    }),

  /**
   * Create an underlying schedule entry
   * Requires: requirement:manage_dependencies permission
   */
  createUnderlyingSchedule: protectedProcedure
    .input(createUnderlyingScheduleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const {
        organizationId,
        umbrellaRequirementId,
        underlyingCoverageType,
        requiredMinimumLimit,
        attachmentPoint,
        isScheduled,
        followsForm,
        dropDownAllowed,
        dropDownSir,
        exclusions,
        notes,
      } = input

      // Verify umbrella requirement access
      await verifyRequirementAccess(ctx.supabase, umbrellaRequirementId, organizationId)

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('umbrella_underlying_schedule')
        .insert({
          umbrella_requirement_id: umbrellaRequirementId,
          underlying_coverage_type: underlyingCoverageType,
          required_minimum_limit: requiredMinimumLimit,
          attachment_point: attachmentPoint,
          is_scheduled: isScheduled,
          follows_form: followsForm,
          drop_down_allowed: dropDownAllowed,
          drop_down_sir: dropDownSir ?? null,
          exclusions: exclusions ?? null,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An underlying schedule entry for this coverage type already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create underlying schedule: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Update an underlying schedule entry
   * Requires: requirement:manage_dependencies permission
   */
  updateUnderlyingSchedule: protectedProcedure
    .input(updateUnderlyingScheduleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { scheduleId, ...updates } = input

      const updateData: Record<string, unknown> = {}
      if (updates.requiredMinimumLimit !== undefined)
        updateData.required_minimum_limit = updates.requiredMinimumLimit
      if (updates.attachmentPoint !== undefined) updateData.attachment_point = updates.attachmentPoint
      if (updates.isScheduled !== undefined) updateData.is_scheduled = updates.isScheduled
      if (updates.followsForm !== undefined) updateData.follows_form = updates.followsForm
      if (updates.dropDownAllowed !== undefined) updateData.drop_down_allowed = updates.dropDownAllowed
      if (updates.dropDownSir !== undefined) updateData.drop_down_sir = updates.dropDownSir
      if (updates.exclusions !== undefined) updateData.exclusions = updates.exclusions
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('umbrella_underlying_schedule')
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update underlying schedule: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Delete an underlying schedule entry
   * Requires: requirement:manage_dependencies permission
   */
  deleteUnderlyingSchedule: protectedProcedure
    .input(deleteUnderlyingScheduleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { scheduleId } = input

      const { error } = await ctx.supabase
        .schema('forsured')
        .from('umbrella_underlying_schedule')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete underlying schedule: ${error.message}`,
        })
      }

      return { success: true }
    }),

  // ===========================================================================
  // Requirement Rules
  // ===========================================================================

  /**
   * List rules for a requirement
   * Requires: requirement:read permission
   */
  listRules: protectedProcedure
    .input(listRulesInputSchema)
    .use(enforceCompliancePermission('requirement:read', getOrgIdFromInput))
    .query(async ({ ctx, input }) => {
      const { organizationId, requirementId } = input

      // Verify requirement access
      await verifyRequirementAccess(ctx.supabase, requirementId, organizationId)

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_rules')
        .select('*')
        .eq('requirement_id', requirementId)
        .order('priority', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list rules: ${error.message}`,
        })
      }

      return data ?? []
    }),

  /**
   * Create a requirement rule
   * Requires: requirement:manage_dependencies permission
   */
  createRule: protectedProcedure
    .input(createRuleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const {
        organizationId,
        requirementId,
        ruleType,
        conditionField,
        conditionOperator,
        conditionValue,
        priority,
        description,
      } = input

      // Verify requirement access
      await verifyRequirementAccess(ctx.supabase, requirementId, organizationId)

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_rules')
        .insert({
          requirement_id: requirementId,
          rule_type: ruleType,
          condition_field: conditionField,
          condition_operator: conditionOperator,
          condition_value: conditionValue,
          priority,
          description: description ?? null,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create rule: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Update a requirement rule
   * Requires: requirement:manage_dependencies permission
   */
  updateRule: protectedProcedure
    .input(updateRuleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { ruleId, ...updates } = input

      const updateData: Record<string, unknown> = {}
      if (updates.ruleType !== undefined) updateData.rule_type = updates.ruleType
      if (updates.conditionField !== undefined) updateData.condition_field = updates.conditionField
      if (updates.conditionOperator !== undefined) updateData.condition_operator = updates.conditionOperator
      if (updates.conditionValue !== undefined) updateData.condition_value = updates.conditionValue
      if (updates.priority !== undefined) updateData.priority = updates.priority
      if (updates.description !== undefined) updateData.description = updates.description

      const { data, error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_rules')
        .update(updateData)
        .eq('id', ruleId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update rule: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Delete a requirement rule
   * Requires: requirement:manage_dependencies permission
   */
  deleteRule: protectedProcedure
    .input(deleteRuleInputSchema)
    .use(enforceCompliancePermission('requirement:manage_dependencies', getOrgIdFromInput))
    .mutation(async ({ ctx, input }) => {
      const { ruleId } = input

      const { error } = await ctx.supabase
        .schema('forsured')
        .from('compliance_requirement_rules')
        .delete()
        .eq('id', ruleId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete rule: ${error.message}`,
        })
      }

      return { success: true }
    }),
})
