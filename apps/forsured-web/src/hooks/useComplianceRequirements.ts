/**
 * Compliance Requirements Hook
 * REQ-2, TASK-13: Requirements List View with Filtering and Search
 *
 * Provides typed hooks for managing compliance requirements using tRPC.
 */

import { trpc } from '../lib/trpc';
import type {
  CoverageType,
  RequirementStatus,
  RequirementDefinition,
} from '../server/schemas/forsured/compliance-requirements.schema';

export interface ComplianceRequirement {
  id: string;
  code: string;
  name: string;
  type: CoverageType;
  description: string | null;
  status: RequirementStatus;
  is_template: boolean;
  effective_date: string;
  expiration_date: string | null;
  organization_id: string;
  created_by: string | null;
  requirement_definition: RequirementDefinition;
  current_version: number;
  is_current: boolean;
  parent_requirement_id: string | null;
  change_summary: string | null;
  superseded_date: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface UseComplianceRequirementsOptions {
  organizationId: string;
  page?: number;
  pageSize?: number;
  types?: CoverageType[];
  statuses?: RequirementStatus[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  isTemplate?: boolean;
}

export interface CreateRequirementInput {
  code: string;
  name: string;
  type: CoverageType;
  description?: string;
  status?: RequirementStatus;
  is_template?: boolean;
  effective_date: string;
  expiration_date?: string | null;
  requirement_definition: RequirementDefinition;
  change_summary?: string;
}

export interface UpdateRequirementInput {
  name?: string;
  type?: CoverageType;
  description?: string;
  status?: RequirementStatus;
  is_template?: boolean;
  effective_date?: string;
  expiration_date?: string | null;
  requirement_definition?: RequirementDefinition;
  change_summary?: string;
}

/**
 * Hook for listing compliance requirements with filtering and pagination
 */
export function useComplianceRequirements(options: UseComplianceRequirementsOptions) {
  const {
    organizationId,
    page = 1,
    pageSize = 20,
    types,
    statuses,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    includeArchived = false,
    isTemplate,
  } = options;

  return trpc.complianceRequirements.list.useQuery(
    {
      organizationId,
      page,
      pageSize,
      types,
      statuses,
      search,
      sortBy,
      sortOrder,
      includeArchived,
      isTemplate,
    },
    {
      enabled: !!organizationId,
      keepPreviousData: true,
    }
  );
}

/**
 * Hook for getting a single requirement by ID
 */
export function useComplianceRequirement(organizationId: string, requirementId: string) {
  return trpc.complianceRequirements.get.useQuery(
    { organizationId, requirementId },
    { enabled: !!organizationId && !!requirementId }
  );
}

/**
 * Hook for getting requirement by code
 */
export function useComplianceRequirementByCode(organizationId: string, code: string) {
  return trpc.complianceRequirements.getByCode.useQuery(
    { organizationId, code },
    { enabled: !!organizationId && !!code }
  );
}

/**
 * Hook for creating a requirement
 */
export function useCreateComplianceRequirement() {
  const utils = trpc.useContext();

  return trpc.complianceRequirements.create.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the list query to refetch data
      utils.complianceRequirements.list.invalidate({ organizationId: variables.organizationId });
    },
  });
}

/**
 * Hook for updating a requirement
 */
export function useUpdateComplianceRequirement() {
  const utils = trpc.useContext();

  return trpc.complianceRequirements.update.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate both list and single requirement queries
      utils.complianceRequirements.list.invalidate({ organizationId: variables.organizationId });
      utils.complianceRequirements.get.invalidate({
        organizationId: variables.organizationId,
        requirementId: variables.requirementId,
      });
    },
  });
}

/**
 * Hook for archiving a requirement
 */
export function useArchiveComplianceRequirement() {
  const utils = trpc.useContext();

  return trpc.complianceRequirements.archive.useMutation({
    onSuccess: (_, variables) => {
      utils.complianceRequirements.list.invalidate({ organizationId: variables.organizationId });
      utils.complianceRequirements.get.invalidate({
        organizationId: variables.organizationId,
        requirementId: variables.requirementId,
      });
    },
  });
}

/**
 * Hook for restoring an archived requirement
 */
export function useRestoreComplianceRequirement() {
  const utils = trpc.useContext();

  return trpc.complianceRequirements.restore.useMutation({
    onSuccess: (_, variables) => {
      utils.complianceRequirements.list.invalidate({ organizationId: variables.organizationId });
      utils.complianceRequirements.get.invalidate({
        organizationId: variables.organizationId,
        requirementId: variables.requirementId,
      });
    },
  });
}

/**
 * Hook for getting version history
 */
export function useRequirementVersionHistory(organizationId: string, requirementId: string) {
  return trpc.complianceRequirements.listVersions.useQuery(
    { organizationId, requirementId },
    { enabled: !!organizationId && !!requirementId }
  );
}

/**
 * Hook for getting dependencies
 */
export function useRequirementDependencies(organizationId: string, requirementId: string) {
  return trpc.complianceDependencies.listForRequirement.useQuery(
    { organizationId, requirementId },
    { enabled: !!organizationId && !!requirementId }
  );
}

// Re-export types for convenience
export type { CoverageType, RequirementStatus, RequirementDefinition };
