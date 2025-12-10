/**
 * Policies Router
 * REQ-280: Insurance Coverage Detail Requirements
 * TASK-2: Build API Endpoints for Policy Provisions with Validation
 *
 * Implements insurance policy and policy provisions management with
 * GL sub-limit validation per REQ-280 requirements.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import {
  provisionTypeEnum,
  glProvisionRequirements,
  glMaxDeductible,
  ProvisionType,
} from '../../schemas/forsured/shared.schema';
import {
  policyTypeEnum,
  policyStatusEnum,
  PolicyProvision,
  ProvisionValidationResult,
  ValidationSeverity,
} from '../../schemas/forsured/policies.schema';

// =============================================================================
// Validation Service
// =============================================================================

/**
 * Human-readable names for provision types
 */
const provisionDisplayNames: Record<ProvisionType, string> = {
  per_occurrence: 'Per Occurrence',
  general_aggregate: 'General Aggregate',
  personal_advertising: 'Personal & Advertising Injury',
  products_completed: 'Products-Completed Operations',
  medical_payments: 'Medical Payments',
  damage_to_premises: 'Damage to Premises Rented to You',
  fire_damage: 'Fire Damage',
  employee_benefits: 'Employee Benefits Liability',
  per_project_aggregate: 'Per Project Aggregate',
  occurrence_form: 'Occurrence Form',
  auto_symbol: 'Auto Symbol Requirements',
  other: 'Other',
};

/**
 * Format currency value for display
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'Not specified';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get human-readable requirement string for a provision type
 */
function getRequirementString(provisionType: ProvisionType): string {
  const req = glProvisionRequirements[provisionType];
  if (!req) return 'No specific requirement';

  if (req.type === 'monetary' && 'minLimit' in req && req.minLimit) {
    return `Min ${formatCurrency(req.minLimit)}`;
  }
  if (req.type === 'boolean') {
    return 'Yes/No';
  }
  if (req.type === 'string' && 'validValues' in req) {
    return req.validValues.join(' or ');
  }
  return 'No specific requirement';
}

/**
 * Validate a single policy provision against GL requirements
 * REQ-280: Validates each provision against specified requirements
 */
function validateProvision(
  provision: PolicyProvision & { provision_value?: string | null }
): ProvisionValidationResult {
  const provisionType = provision.provision_type as ProvisionType;
  const req = glProvisionRequirements[provisionType];

  // Default valid result
  const validResult: ProvisionValidationResult = {
    provision_type: provisionType,
    is_valid: true,
    message: 'Meets requirements',
    severity: 'success' as ValidationSeverity,
    requirement: getRequirementString(provisionType),
    actual_value: provision.limit_amount ?? provision.provision_value ?? null,
  };

  // No specific requirement - always valid
  if (!req) {
    return validResult;
  }

  // Monetary validation
  if (req.type === 'monetary') {
    const limitAmount = provision.limit_amount;

    if (limitAmount === null || limitAmount === undefined) {
      return {
        ...validResult,
        is_valid: false,
        message: 'Limit amount not specified',
        severity: 'error',
        actual_value: null,
      };
    }

    // Check minimum limit requirement
    if ('minLimit' in req && req.minLimit && limitAmount < req.minLimit) {
      return {
        ...validResult,
        is_valid: false,
        message: `Limit ${formatCurrency(limitAmount)} is below required minimum of ${formatCurrency(req.minLimit)}`,
        severity: 'error',
        actual_value: limitAmount,
      };
    }

    return {
      ...validResult,
      actual_value: limitAmount,
    };
  }

  // Boolean validation (per_project_aggregate, occurrence_form)
  if (req.type === 'boolean') {
    const value = provision.provision_value;

    if (value === null || value === undefined) {
      return {
        ...validResult,
        is_valid: false,
        message: 'Value not specified',
        severity: 'warning',
        actual_value: null,
      };
    }

    // Accept 'true', 'false', 'yes', 'no' (case-insensitive)
    const normalizedValue = value.toLowerCase();
    const isValidBoolean = ['true', 'false', 'yes', 'no'].includes(normalizedValue);

    if (!isValidBoolean) {
      return {
        ...validResult,
        is_valid: false,
        message: `Invalid value "${value}". Expected Yes or No`,
        severity: 'error',
        actual_value: value,
      };
    }

    return {
      ...validResult,
      actual_value: normalizedValue === 'true' || normalizedValue === 'yes',
    };
  }

  // String validation (auto_symbol)
  if (req.type === 'string' && 'validValues' in req) {
    const value = provision.provision_value;

    if (value === null || value === undefined) {
      return {
        ...validResult,
        is_valid: false,
        message: 'Value not specified',
        severity: 'warning',
        actual_value: null,
      };
    }

    if (!req.validValues.includes(value as '1' | '7,8,9')) {
      return {
        ...validResult,
        is_valid: false,
        message: `Invalid value "${value}". Must be ${req.validValues.join(' or ')}`,
        severity: 'error',
        actual_value: value,
      };
    }

    return {
      ...validResult,
      actual_value: value,
    };
  }

  return validResult;
}

/**
 * Validate deductible against GL maximum
 * REQ-280: Deductible must be at most $10,000
 */
function validateDeductible(deductible: number | null | undefined): ProvisionValidationResult {
  const result: ProvisionValidationResult = {
    provision_type: 'other', // Use 'other' as a placeholder for deductible
    is_valid: true,
    message: 'Deductible meets requirements',
    severity: 'success',
    requirement: `Max ${formatCurrency(glMaxDeductible)}`,
    actual_value: deductible ?? null,
  };

  if (deductible === null || deductible === undefined) {
    return {
      ...result,
      message: 'No deductible specified',
    };
  }

  if (deductible > glMaxDeductible) {
    return {
      ...result,
      is_valid: false,
      message: `Deductible ${formatCurrency(deductible)} exceeds maximum of ${formatCurrency(glMaxDeductible)}`,
      severity: 'error',
    };
  }

  return result;
}

// =============================================================================
// Policy Filters Schema
// =============================================================================

const PolicyFiltersSchema = z.object({
  policy_type: z.array(policyTypeEnum).optional(),
  status: z.array(policyStatusEnum).optional(),
  project_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

// =============================================================================
// Policies Router
// =============================================================================

export const policiesRouter = createTRPCRouter({
  /**
   * List insurance policies with filtering and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        filters: PolicyFiltersSchema.optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user belongs to organization
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access policies from this organization',
        });
      }

      let query = forsured('insurance_policies')
        .select('*', { count: 'exact' })
        .eq('organization_id', input.organizationId);

      // Apply filters
      if (input.filters) {
        if (input.filters.policy_type && input.filters.policy_type.length > 0) {
          query = query.in('policy_type', input.filters.policy_type);
        }
        if (input.filters.status && input.filters.status.length > 0) {
          query = query.in('status', input.filters.status);
        }
        if (input.filters.project_id) {
          query = query.eq('project_id', input.filters.project_id);
        }
        if (input.filters.search) {
          query = query.or(
            `policy_number.ilike.%${input.filters.search}%,carrier_name.ilike.%${input.filters.search}%`
          );
        }
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch policies: ${error.message}`,
        });
      }

      return {
        policies: data ?? [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Get a single insurance policy by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        policyId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this policy',
        });
      }

      const { data, error } = await forsured('insurance_policies')
        .select('*')
        .eq('id', input.policyId)
        .eq('organization_id', input.organizationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Policy not found',
        });
      }

      return data;
    }),

  /**
   * Get policy provisions with validation results
   * REQ-280: Main endpoint for GL sub-limits with validation
   */
  getProvisions: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        policyId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this policy',
        });
      }

      // Fetch the policy first to verify it exists
      const { data: policy, error: policyError } = await forsured('insurance_policies')
        .select('*')
        .eq('id', input.policyId)
        .eq('organization_id', input.organizationId)
        .single();

      if (policyError || !policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Policy not found',
        });
      }

      // Fetch provisions for this policy
      const { data: provisions, error: provisionsError } = await forsured('policy_provisions')
        .select('*')
        .eq('policy_id', input.policyId)
        .eq('organization_id', input.organizationId)
        .order('provision_type', { ascending: true });

      if (provisionsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch provisions: ${provisionsError.message}`,
        });
      }

      // Validate each provision
      const validationResults: ProvisionValidationResult[] = (provisions ?? []).map((provision) =>
        validateProvision(provision as PolicyProvision & { provision_value?: string | null })
      );

      // Check for any red flags (invalid provisions)
      const hasRedFlags = validationResults.some(
        (result) => !result.is_valid && result.severity === 'error'
      );

      // Also validate deductible at the policy level if it's a GL policy
      let deductibleValidation: ProvisionValidationResult | null = null;
      if (policy.policy_type === 'GL' && policy.deductible !== null) {
        deductibleValidation = validateDeductible(policy.deductible);
        if (!deductibleValidation.is_valid) {
          validationResults.push(deductibleValidation);
        }
      }

      return {
        provisions: provisions ?? [],
        validation_results: validationResults,
        has_red_flags: hasRedFlags || (deductibleValidation?.is_valid === false),
        policy,
      };
    }),

  /**
   * Create a new policy provision
   */
  createProvision: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        policyId: z.string().uuid(),
        provision_type: provisionTypeEnum,
        limit_amount: z.number().nullable().optional(),
        deductible: z.number().nullable().optional(),
        provision_value: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create provisions for this organization',
        });
      }

      // Verify policy exists and belongs to organization
      const { data: policy, error: policyError } = await forsured('insurance_policies')
        .select('id')
        .eq('id', input.policyId)
        .eq('organization_id', input.organizationId)
        .single();

      if (policyError || !policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Policy not found',
        });
      }

      const { data, error } = await forsured('policy_provisions')
        .insert({
          policy_id: input.policyId,
          organization_id: input.organizationId,
          provision_type: input.provision_type,
          limit_amount: input.limit_amount,
          deductible: input.deductible,
          provision_value: input.provision_value,
          description: input.description,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create provision: ${error.message}`,
        });
      }

      return data;
    }),

  /**
   * Update a policy provision
   */
  updateProvision: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        provisionId: z.string().uuid(),
        updates: z.object({
          provision_type: provisionTypeEnum.optional(),
          limit_amount: z.number().nullable().optional(),
          deductible: z.number().nullable().optional(),
          provision_value: z.string().nullable().optional(),
          description: z.string().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this provision',
        });
      }

      const { data, error } = await forsured('policy_provisions')
        .update(input.updates)
        .eq('id', input.provisionId)
        .eq('organization_id', input.organizationId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provision not found or update failed',
        });
      }

      return data;
    }),

  /**
   * Delete a policy provision
   */
  deleteProvision: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        provisionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this provision',
        });
      }

      const { error } = await forsured('policy_provisions')
        .delete()
        .eq('id', input.provisionId)
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete provision: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Get GL sub-limits display data for the CoverageTable component
   * REQ-280: Returns formatted data ready for UI rendering
   */
  getGLSubLimitsDisplay: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        policyId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this policy',
        });
      }

      // Fetch provisions with validation
      const { data: policy, error: policyError } = await forsured('insurance_policies')
        .select('*')
        .eq('id', input.policyId)
        .eq('organization_id', input.organizationId)
        .single();

      if (policyError || !policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Policy not found',
        });
      }

      const { data: provisions, error: provisionsError } = await forsured('policy_provisions')
        .select('*')
        .eq('policy_id', input.policyId)
        .eq('organization_id', input.organizationId)
        .order('provision_type', { ascending: true });

      if (provisionsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch provisions: ${provisionsError.message}`,
        });
      }

      // Transform provisions into display format for CoverageTable
      const displayItems = (provisions ?? []).map((provision) => {
        const provisionType = provision.provision_type as ProvisionType;
        const validation = validateProvision(
          provision as PolicyProvision & { provision_value?: string | null }
        );
        const req = glProvisionRequirements[provisionType];

        // Format the value based on provision type
        let formattedValue = 'Not specified';
        if (req?.type === 'monetary' && provision.limit_amount !== null) {
          formattedValue = formatCurrency(provision.limit_amount);
        } else if (req?.type === 'boolean' && provision.provision_value) {
          const val = provision.provision_value.toLowerCase();
          formattedValue = val === 'true' || val === 'yes' ? 'Yes' : 'No';
        } else if (req?.type === 'string' && provision.provision_value) {
          formattedValue = provision.provision_value;
        }

        return {
          id: provision.id,
          name: provisionDisplayNames[provisionType] || provisionType,
          provision_type: provisionType,
          requirement: getRequirementString(provisionType),
          current_value: provision.limit_amount ?? provision.provision_value ?? null,
          formatted_value: formattedValue,
          is_valid: validation.is_valid,
          severity: validation.severity,
          message: validation.message,
        };
      });

      // Add deductible as a display item if it exists
      if (policy.deductible !== null && policy.deductible !== undefined) {
        const deductibleValidation = validateDeductible(policy.deductible);
        displayItems.push({
          id: 'policy-deductible',
          name: 'Deductible',
          provision_type: 'other' as ProvisionType,
          requirement: `Max ${formatCurrency(glMaxDeductible)}`,
          current_value: policy.deductible,
          formatted_value: formatCurrency(policy.deductible),
          is_valid: deductibleValidation.is_valid,
          severity: deductibleValidation.severity,
          message: deductibleValidation.message,
        });
      }

      const hasRedFlags = displayItems.some((item) => !item.is_valid && item.severity === 'error');

      return {
        policy,
        display_items: displayItems,
        has_red_flags: hasRedFlags,
      };
    }),
});
