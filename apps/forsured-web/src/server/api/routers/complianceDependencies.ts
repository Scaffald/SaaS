/**
 * Compliance Dependencies Router
 * REQ-2, TASK-8: tRPC CRUD Operations for Compliance Dependencies
 * TASK-19: Integrated with Compliance Authorization System
 *
 * Implements:
 * - Dependency CRUD with cycle validation
 * - Umbrella underlying schedule management
 * - Compliance rules management
 * - Dependency tree and dependents queries
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import {
  dependencyListInputSchema,
  dependencyListAllInputSchema,
  dependencyGetInputSchema,
  dependencyCreateInputSchema,
  dependencyUpdateInputSchema,
  dependencyDeleteInputSchema,
  validateCycleInputSchema,
  dependencyTreeInputSchema,
  dependentsInputSchema,
  umbrellaScheduleListInputSchema,
  umbrellaScheduleCreateInputSchema,
  umbrellaScheduleUpdateInputSchema,
  umbrellaScheduleDeleteInputSchema,
  rulesListInputSchema,
  ruleCreateInputSchema,
  ruleUpdateInputSchema,
  ruleDeleteInputSchema,
} from '../../schemas/forsured/compliance-dependencies.schema';
import {
  validateNoCycles,
  getDependencyTree,
  getDependents,
  type RequirementInfo,
} from '../../../lib/compliance/dependency-resolver';
import type { RequirementDependency } from '../../../lib/compliance/dependency-types';
import { requirePermission } from '../helpers/complianceAuthorization';
import { CompliancePermission } from '../../../lib/compliance/authorization';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Verify organization access
 */
function verifyOrganizationAccess(userOrgId: string | undefined | null, requestOrgId: string): void {
  if (userOrgId !== requestOrgId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this organization',
    });
  }
}

/**
 * Verify requirement belongs to organization
 */
async function verifyRequirementOwnership(
  requirementId: string,
  organizationId: string
): Promise<void> {
  const { data, error } = await forsured('compliance_requirements')
    .select('id')
    .eq('id', requirementId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Requirement not found in this organization',
    });
  }
}

/**
 * Verify dependency belongs to organization (via requirement)
 */
async function verifyDependencyOwnership(
  dependencyId: string,
  organizationId: string
): Promise<{ requirement_id: string; depends_on_id: string }> {
  const { data, error } = await forsured('compliance_requirement_dependencies')
    .select(`
      id,
      requirement_id,
      depends_on_id,
      requirement:requirement_id (
        organization_id
      )
    `)
    .eq('id', dependencyId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Dependency not found',
    });
  }

  const requirement = data.requirement as { organization_id: string } | null;
  if (requirement?.organization_id !== organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Dependency does not belong to this organization',
    });
  }

  return {
    requirement_id: data.requirement_id,
    depends_on_id: data.depends_on_id,
  };
}

/**
 * Verify umbrella schedule entry belongs to organization
 */
async function verifyUmbrellaScheduleOwnership(
  scheduleId: string,
  organizationId: string
): Promise<string> {
  const { data, error } = await forsured('umbrella_underlying_schedule')
    .select(`
      id,
      umbrella_requirement_id,
      requirement:umbrella_requirement_id (
        organization_id
      )
    `)
    .eq('id', scheduleId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Umbrella schedule entry not found',
    });
  }

  const requirement = data.requirement as { organization_id: string } | null;
  if (requirement?.organization_id !== organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Umbrella schedule entry does not belong to this organization',
    });
  }

  return data.umbrella_requirement_id;
}

/**
 * Verify rule belongs to organization
 */
async function verifyRuleOwnership(ruleId: string, organizationId: string): Promise<string> {
  const { data, error } = await forsured('compliance_requirement_rules')
    .select(`
      id,
      requirement_id,
      requirement:requirement_id (
        organization_id
      )
    `)
    .eq('id', ruleId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Rule not found',
    });
  }

  const requirement = data.requirement as { organization_id: string } | null;
  if (requirement?.organization_id !== organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Rule does not belong to this organization',
    });
  }

  return data.requirement_id;
}

/**
 * Get all dependencies for an organization (for cycle detection)
 */
async function getOrganizationDependencies(
  organizationId: string
): Promise<RequirementDependency[]> {
  const { data, error } = await forsured('compliance_requirement_dependencies')
    .select(`
      id,
      requirement_id,
      depends_on_id,
      dependency_type,
      condition,
      notes,
      created_at,
      requirement:requirement_id (
        organization_id
      )
    `);

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch dependencies: ${error.message}`,
    });
  }

  // Filter to only those belonging to the organization
  return (data ?? [])
    .filter((d) => {
      const requirement = d.requirement as { organization_id: string } | null;
      return requirement?.organization_id === organizationId;
    })
    .map((d) => ({
      id: d.id,
      requirement_id: d.requirement_id,
      depends_on_id: d.depends_on_id,
      dependency_type: d.dependency_type,
      condition: d.condition,
      notes: d.notes,
      created_at: d.created_at,
    })) as RequirementDependency[];
}

/**
 * Get requirement info map for dependency tree building
 */
async function getRequirementInfoMap(
  organizationId: string
): Promise<Map<string, RequirementInfo>> {
  const { data, error } = await forsured('compliance_requirements')
    .select('id, name, type')
    .eq('organization_id', organizationId);

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch requirements: ${error.message}`,
    });
  }

  const map = new Map<string, RequirementInfo>();
  for (const req of data ?? []) {
    map.set(req.id, {
      id: req.id,
      name: req.name,
      type: req.type,
    });
  }

  return map;
}

// =============================================================================
// Compliance Dependencies Router
// =============================================================================

export const complianceDependenciesRouter = createTRPCRouter({
  // ===========================================================================
  // DEPENDENCIES CRUD
  // ===========================================================================

  /**
   * List dependencies for a specific requirement
   * Requires DEPENDENCY_VIEW permission
   */
  list: protectedProcedure.input(dependencyListInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_VIEW
    );

    await verifyRequirementOwnership(input.requirementId, input.organizationId);

    const { data, error } = await forsured('compliance_requirement_dependencies')
      .select(`
        id,
        requirement_id,
        depends_on_id,
        dependency_type,
        condition,
        notes,
        created_at,
        depends_on:depends_on_id (
          id,
          name,
          code,
          type
        )
      `)
      .eq('requirement_id', input.requirementId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch dependencies: ${error.message}`,
      });
    }

    return data ?? [];
  }),

  /**
   * List all dependencies in an organization with pagination
   * Requires DEPENDENCY_VIEW permission
   */
  listAll: protectedProcedure.input(dependencyListAllInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_VIEW
    );

    // Get all requirements for this organization first
    const { data: requirements } = await forsured('compliance_requirements')
      .select('id')
      .eq('organization_id', input.organizationId);

    const requirementIds = (requirements ?? []).map((r) => r.id);

    if (requirementIds.length === 0) {
      return {
        dependencies: [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }

    let query = forsured('compliance_requirement_dependencies')
      .select(
        `
        id,
        requirement_id,
        depends_on_id,
        dependency_type,
        condition,
        notes,
        created_at,
        requirement:requirement_id (
          id,
          name,
          code,
          type
        ),
        depends_on:depends_on_id (
          id,
          name,
          code,
          type
        )
      `,
        { count: 'exact' }
      )
      .in('requirement_id', requirementIds);

    if (input.dependencyType) {
      query = query.eq('dependency_type', input.dependencyType);
    }

    const from = (input.page - 1) * input.pageSize;
    const to = from + input.pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch dependencies: ${error.message}`,
      });
    }

    return {
      dependencies: data ?? [],
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / input.pageSize),
      },
    };
  }),

  /**
   * Get a single dependency by ID
   * Requires DEPENDENCY_VIEW permission
   */
  get: protectedProcedure.input(dependencyGetInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_VIEW
    );

    await verifyDependencyOwnership(input.dependencyId, input.organizationId);

    const { data, error } = await forsured('compliance_requirement_dependencies')
      .select(`
        id,
        requirement_id,
        depends_on_id,
        dependency_type,
        condition,
        notes,
        created_at,
        requirement:requirement_id (
          id,
          name,
          code,
          type
        ),
        depends_on:depends_on_id (
          id,
          name,
          code,
          type
        )
      `)
      .eq('id', input.dependencyId)
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dependency not found',
      });
    }

    return data;
  }),

  /**
   * Create a new dependency (with cycle validation)
   * Requires DEPENDENCY_CREATE permission
   */
  create: protectedProcedure.input(dependencyCreateInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to create dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_CREATE
    );

    // Verify both requirements exist in the organization
    await verifyRequirementOwnership(input.requirementId, input.organizationId);
    await verifyRequirementOwnership(input.dependsOnId, input.organizationId);

    // Check for duplicate
    const { data: existing } = await forsured('compliance_requirement_dependencies')
      .select('id')
      .eq('requirement_id', input.requirementId)
      .eq('depends_on_id', input.dependsOnId)
      .maybeSingle();

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This dependency already exists',
      });
    }

    // Validate no cycles would be created
    const dependencies = await getOrganizationDependencies(input.organizationId);
    const requirements = await getRequirementInfoMap(input.organizationId);

    const cycleResult = validateNoCycles(
      input.requirementId,
      input.dependsOnId,
      dependencies,
      requirements
    );

    if (cycleResult.would_create_cycle) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: cycleResult.message,
      });
    }

    // Create the dependency
    const { data, error } = await forsured('compliance_requirement_dependencies')
      .insert({
        requirement_id: input.requirementId,
        depends_on_id: input.dependsOnId,
        dependency_type: input.dependencyType,
        condition: input.condition ?? null,
        notes: input.notes ?? null,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create dependency: ${error.message}`,
      });
    }

    return data;
  }),

  /**
   * Update an existing dependency
   * Requires DEPENDENCY_EDIT permission
   */
  update: protectedProcedure.input(dependencyUpdateInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to edit dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_EDIT
    );

    await verifyDependencyOwnership(input.dependencyId, input.organizationId);

    const updateData: Record<string, unknown> = {};
    if (input.updates.dependencyType !== undefined) {
      updateData.dependency_type = input.updates.dependencyType;
    }
    if (input.updates.condition !== undefined) {
      updateData.condition = input.updates.condition;
    }
    if (input.updates.notes !== undefined) {
      updateData.notes = input.updates.notes;
    }

    const { data, error } = await forsured('compliance_requirement_dependencies')
      .update(updateData)
      .eq('id', input.dependencyId)
      .select()
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update dependency: ${error?.message ?? 'Unknown error'}`,
      });
    }

    return data;
  }),

  /**
   * Delete a dependency
   * Requires DEPENDENCY_DELETE permission
   */
  delete: protectedProcedure.input(dependencyDeleteInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to delete dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_DELETE
    );

    await verifyDependencyOwnership(input.dependencyId, input.organizationId);

    const { error } = await forsured('compliance_requirement_dependencies')
      .delete()
      .eq('id', input.dependencyId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete dependency: ${error.message}`,
      });
    }

    return { success: true };
  }),

  // ===========================================================================
  // CYCLE VALIDATION & TREE
  // ===========================================================================

  /**
   * Validate that adding a dependency won't create a cycle
   * Requires DEPENDENCY_VIEW permission
   */
  validateCycle: protectedProcedure
    .input(validateCycleInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to view dependencies
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.DEPENDENCY_VIEW
      );

      const dependencies = await getOrganizationDependencies(input.organizationId);
      const requirements = await getRequirementInfoMap(input.organizationId);

      return validateNoCycles(input.requirementId, input.dependsOnId, dependencies, requirements);
    }),

  /**
   * Get the dependency tree for a requirement
   * Requires DEPENDENCY_VIEW permission
   */
  getTree: protectedProcedure.input(dependencyTreeInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_VIEW
    );

    await verifyRequirementOwnership(input.requirementId, input.organizationId);

    const dependencies = await getOrganizationDependencies(input.organizationId);
    const requirements = await getRequirementInfoMap(input.organizationId);

    try {
      const tree = getDependencyTree(
        input.requirementId,
        dependencies,
        requirements,
        input.maxDepth
      );
      return tree;
    } catch (error) {
      if (error instanceof Error && error.name === 'CircularDependencyError') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }
      throw error;
    }
  }),

  /**
   * Get requirements that depend on a given requirement
   * Requires DEPENDENCY_VIEW permission
   */
  getDependents: protectedProcedure.input(dependentsInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view dependencies
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.DEPENDENCY_VIEW
    );

    await verifyRequirementOwnership(input.requirementId, input.organizationId);

    const dependencies = await getOrganizationDependencies(input.organizationId);
    const requirements = await getRequirementInfoMap(input.organizationId);

    const dependentIds = getDependents(input.requirementId, dependencies);

    // Return full requirement info for each dependent
    return dependentIds.map((id) => requirements.get(id)).filter(Boolean);
  }),

  // ===========================================================================
  // UMBRELLA UNDERLYING SCHEDULE
  // ===========================================================================

  /**
   * List umbrella schedule entries for a requirement
   * Requires DEPENDENCY_VIEW permission
   */
  listUmbrellaSchedule: protectedProcedure
    .input(umbrellaScheduleListInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to view dependencies
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.DEPENDENCY_VIEW
      );

      await verifyRequirementOwnership(input.umbrellaRequirementId, input.organizationId);

      const { data, error } = await forsured('umbrella_underlying_schedule')
        .select('*')
        .eq('umbrella_requirement_id', input.umbrellaRequirementId)
        .order('underlying_coverage_type');

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch umbrella schedule: ${error.message}`,
        });
      }

      return data ?? [];
    }),

  /**
   * Create an umbrella schedule entry
   * Requires DEPENDENCY_CREATE permission
   */
  createUmbrellaSchedule: protectedProcedure
    .input(umbrellaScheduleCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to create dependencies (umbrella schedules are part of dependency management)
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.DEPENDENCY_CREATE
      );

      await verifyRequirementOwnership(input.umbrellaRequirementId, input.organizationId);

      // Check for duplicate coverage type
      const { data: existing } = await forsured('umbrella_underlying_schedule')
        .select('id')
        .eq('umbrella_requirement_id', input.umbrellaRequirementId)
        .eq('underlying_coverage_type', input.underlyingCoverageType)
        .maybeSingle();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `An entry for ${input.underlyingCoverageType} already exists in this schedule`,
        });
      }

      const { data, error } = await forsured('umbrella_underlying_schedule')
        .insert({
          umbrella_requirement_id: input.umbrellaRequirementId,
          underlying_coverage_type: input.underlyingCoverageType,
          required_minimum_limit: input.requiredMinimumLimit,
          attachment_point: input.attachmentPoint,
          is_scheduled: input.isScheduled,
          follows_form: input.followsForm,
          drop_down_allowed: input.dropDownAllowed,
          drop_down_sir: input.dropDownSir ?? null,
          exclusions: input.exclusions ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create umbrella schedule entry: ${error.message}`,
        });
      }

      return data;
    }),

  /**
   * Update an umbrella schedule entry
   * Requires DEPENDENCY_EDIT permission
   */
  updateUmbrellaSchedule: protectedProcedure
    .input(umbrellaScheduleUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to edit dependencies (umbrella schedules are part of dependency management)
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.DEPENDENCY_EDIT
      );

      await verifyUmbrellaScheduleOwnership(input.scheduleId, input.organizationId);

      const updateData: Record<string, unknown> = {};
      if (input.updates.requiredMinimumLimit !== undefined) {
        updateData.required_minimum_limit = input.updates.requiredMinimumLimit;
      }
      if (input.updates.attachmentPoint !== undefined) {
        updateData.attachment_point = input.updates.attachmentPoint;
      }
      if (input.updates.isScheduled !== undefined) {
        updateData.is_scheduled = input.updates.isScheduled;
      }
      if (input.updates.followsForm !== undefined) {
        updateData.follows_form = input.updates.followsForm;
      }
      if (input.updates.dropDownAllowed !== undefined) {
        updateData.drop_down_allowed = input.updates.dropDownAllowed;
      }
      if (input.updates.dropDownSir !== undefined) {
        updateData.drop_down_sir = input.updates.dropDownSir;
      }
      if (input.updates.exclusions !== undefined) {
        updateData.exclusions = input.updates.exclusions;
      }
      if (input.updates.notes !== undefined) {
        updateData.notes = input.updates.notes;
      }

      const { data, error } = await forsured('umbrella_underlying_schedule')
        .update(updateData)
        .eq('id', input.scheduleId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update umbrella schedule entry: ${error?.message ?? 'Unknown error'}`,
        });
      }

      return data;
    }),

  /**
   * Delete an umbrella schedule entry
   * Requires DEPENDENCY_DELETE permission
   */
  deleteUmbrellaSchedule: protectedProcedure
    .input(umbrellaScheduleDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to delete dependencies (umbrella schedules are part of dependency management)
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.DEPENDENCY_DELETE
      );

      await verifyUmbrellaScheduleOwnership(input.scheduleId, input.organizationId);

      const { error } = await forsured('umbrella_underlying_schedule')
        .delete()
        .eq('id', input.scheduleId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete umbrella schedule entry: ${error.message}`,
        });
      }

      return { success: true };
    }),

  // ===========================================================================
  // COMPLIANCE RULES
  // ===========================================================================

  /**
   * List rules for a requirement
   * Requires REQUIREMENT_VIEW permission
   */
  listRules: protectedProcedure.input(rulesListInputSchema).query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to view requirements (rules are part of requirement management)
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.REQUIREMENT_VIEW
    );

    await verifyRequirementOwnership(input.requirementId, input.organizationId);

    const { data, error } = await forsured('compliance_requirement_rules')
      .select('*')
      .eq('requirement_id', input.requirementId)
      .order('priority', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch rules: ${error.message}`,
      });
    }

    return data ?? [];
  }),

  /**
   * Create a rule
   * Requires REQUIREMENT_EDIT permission (rules are part of requirement configuration)
   */
  createRule: protectedProcedure.input(ruleCreateInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to edit requirements (rules are part of requirement configuration)
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.REQUIREMENT_EDIT
    );

    await verifyRequirementOwnership(input.requirementId, input.organizationId);

    const { data, error } = await forsured('compliance_requirement_rules')
      .insert({
        requirement_id: input.requirementId,
        rule_type: input.ruleType,
        condition_field: input.conditionField,
        condition_operator: input.conditionOperator,
        condition_value: input.conditionValue,
        priority: input.priority,
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create rule: ${error.message}`,
      });
    }

    return data;
  }),

  /**
   * Update a rule
   * Requires REQUIREMENT_EDIT permission (rules are part of requirement configuration)
   */
  updateRule: protectedProcedure.input(ruleUpdateInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to edit requirements (rules are part of requirement configuration)
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.REQUIREMENT_EDIT
    );

    await verifyRuleOwnership(input.ruleId, input.organizationId);

    const updateData: Record<string, unknown> = {};
    if (input.updates.ruleType !== undefined) {
      updateData.rule_type = input.updates.ruleType;
    }
    if (input.updates.conditionField !== undefined) {
      updateData.condition_field = input.updates.conditionField;
    }
    if (input.updates.conditionOperator !== undefined) {
      updateData.condition_operator = input.updates.conditionOperator;
    }
    if (input.updates.conditionValue !== undefined) {
      updateData.condition_value = input.updates.conditionValue;
    }
    if (input.updates.priority !== undefined) {
      updateData.priority = input.updates.priority;
    }
    if (input.updates.description !== undefined) {
      updateData.description = input.updates.description;
    }

    const { data, error } = await forsured('compliance_requirement_rules')
      .update(updateData)
      .eq('id', input.ruleId)
      .select()
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update rule: ${error?.message ?? 'Unknown error'}`,
      });
    }

    return data;
  }),

  /**
   * Delete a rule
   * Requires REQUIREMENT_EDIT permission (rules are part of requirement configuration)
   */
  deleteRule: protectedProcedure.input(ruleDeleteInputSchema).mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    // Check permission to edit requirements (rules are part of requirement configuration)
    await requirePermission(
      ctx.userId,
      input.organizationId,
      CompliancePermission.REQUIREMENT_EDIT
    );

    await verifyRuleOwnership(input.ruleId, input.organizationId);

    const { error } = await forsured('compliance_requirement_rules')
      .delete()
      .eq('id', input.ruleId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete rule: ${error.message}`,
      });
    }

    return { success: true };
  }),
});
