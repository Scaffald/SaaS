/**
 * Bulk Operations Router
 * REQ-2, TASK-12: tRPC Endpoints for Bulk Import/Export
 * TASK-19: Integrated with Compliance Authorization System
 *
 * Implements bulk operations with:
 * - Import preview and execution
 * - Export with filtering
 * - Bulk status updates
 * - Bulk archiving
 */

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import {
  importPreviewInputSchema,
  importExecuteInputSchema,
  importTemplatesInputSchema,
  exportInputSchema,
  exportSummaryInputSchema,
  bulkArchiveInputSchema,
  bulkStatusUpdateInputSchema,
} from '../../schemas/forsured/bulk-operations.schema';
import {
  generateImportPreview,
  detectFormat,
  generateCSVTemplate,
  generateJSONTemplate,
  type ImportFormat,
  type NormalizedImportRow,
} from '../../../lib/compliance/bulkImportService';
import {
  applyFilters,
  generateExport,
  generateSummaryReport,
  prepareForExport,
  validateExportOptions,
  type ExportableRequirement,
  type ExportableVersion,
  type ExportableDependency,
} from '../../../lib/compliance/bulkExportService';
import { requirePermission, createComplianceAuthService } from '../helpers/complianceAuthorization';
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
 * Get existing requirement codes for an organization
 */
async function getExistingCodes(organizationId: string): Promise<string[]> {
  const { data } = await forsured('compliance_requirements')
    .select('code')
    .eq('organization_id', organizationId);

  return (data ?? []).map((r) => r.code);
}

// =============================================================================
// Bulk Operations Router
// =============================================================================

export const bulkOperationsRouter = createTRPCRouter({
  /**
   * Preview import data without actually importing
   * Returns validation results for each row
   * Requires BULK_IMPORT permission
   */
  importPreview: protectedProcedure
    .input(importPreviewInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to preview import (requires bulk import permission)
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_IMPORT
      );

      // Detect format if not provided
      const format = input.format ?? detectFormat(input.data);

      // Get existing codes to check for duplicates
      const existingCodes = await getExistingCodes(input.organizationId);

      // Generate preview
      const preview = generateImportPreview(input.data, format, existingCodes);

      return preview;
    }),

  /**
   * Execute import operation
   * Requires BULK_IMPORT permission (broker or admin only)
   */
  importExecute: protectedProcedure
    .input(importExecuteInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to execute bulk import
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_IMPORT
      );

      // Detect format if not provided
      const format = input.format ?? detectFormat(input.data);

      // Get existing codes
      const existingCodes = await getExistingCodes(input.organizationId);
      const existingCodesUpper = new Set(existingCodes.map((c) => c.toUpperCase()));

      // Parse and validate
      const preview = generateImportPreview(input.data, format, existingCodes);

      // Filter to valid rows, optionally skipping duplicates
      const validRows = preview.rows.filter((row) => {
        if (!row.isValid || !row.normalizedData) return false;
        if (input.skipDuplicates && existingCodesUpper.has(row.normalizedData.code.toUpperCase())) {
          return false;
        }
        return true;
      });

      if (validRows.length === 0) {
        return {
          success: false,
          totalAttempted: preview.totalRows,
          successfulImports: 0,
          failedImports: preview.invalidRows,
          createdIds: [],
          errors: preview.rows
            .filter((r) => !r.isValid)
            .map((r) => ({
              rowIndex: r.rowIndex,
              code: r.data?.code ?? 'unknown',
              message: r.errors.map((e) => e.message).join('; '),
            })),
        };
      }

      // Insert all valid requirements
      const createdIds: string[] = [];
      const errors: Array<{ rowIndex: number; code: string; message: string }> = [];

      for (const row of validRows) {
        const data = row.normalizedData as NormalizedImportRow;

        const { data: created, error } = await forsured('compliance_requirements')
          .insert({
            code: data.code,
            name: data.name,
            type: data.type,
            description: data.description,
            status: data.status,
            is_template: data.is_template,
            effective_date: data.effective_date,
            expiration_date: data.expiration_date,
            organization_id: input.organizationId,
            created_by: ctx.userId,
            requirement_definition: data.requirement_definition,
            change_summary: 'Imported via bulk import',
          })
          .select('id')
          .single();

        if (error || !created) {
          errors.push({
            rowIndex: row.rowIndex,
            code: data.code,
            message: error?.message ?? 'Unknown error during insert',
          });
        } else {
          createdIds.push(created.id);
        }
      }

      return {
        success: errors.length === 0,
        totalAttempted: preview.totalRows,
        successfulImports: createdIds.length,
        failedImports: errors.length + preview.invalidRows,
        createdIds,
        errors: [
          ...preview.rows
            .filter((r) => !r.isValid)
            .map((r) => ({
              rowIndex: r.rowIndex,
              code: r.data?.code ?? 'unknown',
              message: r.errors.map((e) => e.message).join('; '),
            })),
          ...errors,
        ],
      };
    }),

  /**
   * Get import templates
   */
  importTemplates: protectedProcedure
    .input(importTemplatesInputSchema)
    .query(({ input }) => {
      const templates: Array<{ format: ImportFormat; template: string; filename: string }> = [];

      if (!input.format || input.format === 'csv') {
        templates.push({
          format: 'csv',
          template: generateCSVTemplate(),
          filename: 'compliance-requirements-template.csv',
        });
      }

      if (!input.format || input.format === 'json') {
        templates.push({
          format: 'json',
          template: generateJSONTemplate(),
          filename: 'compliance-requirements-template.json',
        });
      }

      return templates;
    }),

  /**
   * Export requirements with filtering
   * Requires BULK_EXPORT permission
   */
  export: protectedProcedure
    .input(exportInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to export requirements
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_EXPORT
      );

      // Validate options
      const validation = validateExportOptions(input);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors.join('; '),
        });
      }

      // Fetch requirements
      const { data: requirements, error } = await forsured('compliance_requirements')
        .select('*')
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch requirements: ${error.message}`,
        });
      }

      // Map to exportable format
      const exportableRequirements: ExportableRequirement[] = (requirements ?? []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        description: r.description,
        status: r.status,
        is_template: r.is_template,
        effective_date: r.effective_date,
        expiration_date: r.expiration_date,
        requirement_definition: r.requirement_definition as ExportableRequirement['requirement_definition'],
        current_version: r.current_version,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      // Apply filters
      const filtered = applyFilters(exportableRequirements, input.filters);

      // Optionally fetch version history
      let versionsMap: Map<string, ExportableVersion[]> | undefined;
      if (input.includeVersionHistory && filtered.length > 0) {
        const requirementIds = filtered.map((r) => r.id);
        const { data: versions } = await forsured('compliance_requirement_versions')
          .select('requirement_id, version, changed_at, change_summary, changed_fields')
          .in('requirement_id', requirementIds)
          .order('version', { ascending: false });

        if (versions) {
          versionsMap = new Map();
          for (const v of versions) {
            if (!versionsMap.has(v.requirement_id)) {
              versionsMap.set(v.requirement_id, []);
            }
            versionsMap.get(v.requirement_id)!.push({
              version: v.version,
              changed_at: v.changed_at,
              change_summary: v.change_summary,
              changed_fields: v.changed_fields as Record<string, unknown> | null,
            });
          }
        }
      }

      // Optionally fetch dependencies
      let dependenciesMap: Map<string, ExportableDependency[]> | undefined;
      if (input.includeDependencies && filtered.length > 0) {
        const requirementIds = filtered.map((r) => r.id);
        const { data: dependencies } = await forsured('compliance_requirement_dependencies')
          .select(`
            requirement_id,
            dependency_type,
            notes,
            depends_on:depends_on_id (
              code,
              name
            )
          `)
          .in('requirement_id', requirementIds);

        if (dependencies) {
          dependenciesMap = new Map();
          for (const d of dependencies) {
            if (!dependenciesMap.has(d.requirement_id)) {
              dependenciesMap.set(d.requirement_id, []);
            }
            const dependsOn = d.depends_on as { code: string; name: string } | null;
            if (dependsOn) {
              dependenciesMap.get(d.requirement_id)!.push({
                depends_on_code: dependsOn.code,
                depends_on_name: dependsOn.name,
                dependency_type: d.dependency_type,
                notes: d.notes,
              });
            }
          }
        }
      }

      // Prepare export data
      const exportData = prepareForExport(filtered, versionsMap, dependenciesMap);

      // Generate export
      const result = generateExport(exportData, input);

      return result;
    }),

  /**
   * Get export summary without downloading data
   * Requires BULK_EXPORT permission
   */
  exportSummary: protectedProcedure
    .input(exportSummaryInputSchema)
    .query(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to export requirements
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_EXPORT
      );

      // Fetch requirements
      const { data: requirements, error } = await forsured('compliance_requirements')
        .select('id, type, status, is_template, effective_date, code, name, description')
        .eq('organization_id', input.organizationId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch requirements: ${error.message}`,
        });
      }

      // Map to minimal exportable format for filtering
      const exportableRequirements: ExportableRequirement[] = (requirements ?? []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        description: null,
        status: r.status,
        is_template: r.is_template,
        effective_date: r.effective_date,
        expiration_date: null,
        requirement_definition: { coverage_limits: {}, required_endorsements: [], policy_conditions: [], documentation_requirements: [] },
        current_version: 1,
        created_at: '',
        updated_at: '',
      }));

      // Apply filters
      const filtered = applyFilters(exportableRequirements, input.filters);

      // Generate summary
      const reportJson = generateSummaryReport(filtered);
      const report = JSON.parse(reportJson);

      return report.summary;
    }),

  /**
   * Bulk archive requirements
   * Requires BULK_ARCHIVE permission (admin only)
   */
  bulkArchive: protectedProcedure
    .input(bulkArchiveInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to bulk archive
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_ARCHIVE
      );

      const errors: Array<{ requirementId: string; message: string }> = [];
      let archivedCount = 0;

      for (const requirementId of input.requirementIds) {
        const { error } = await forsured('compliance_requirements')
          .update({
            status: 'archived',
            archived_at: new Date().toISOString(),
            change_summary: 'Bulk archived',
          })
          .eq('id', requirementId)
          .eq('organization_id', input.organizationId);

        if (error) {
          errors.push({
            requirementId,
            message: error.message,
          });
        } else {
          archivedCount++;
        }
      }

      return {
        success: errors.length === 0,
        archivedCount,
        errors,
      };
    }),

  /**
   * Bulk update requirement status
   * Requires BULK_STATUS_UPDATE permission (broker or admin only)
   */
  bulkStatusUpdate: protectedProcedure
    .input(bulkStatusUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      verifyOrganizationAccess(ctx.organizationId, input.organizationId);

      // Check permission to bulk status update
      await requirePermission(
        ctx.userId,
        input.organizationId,
        CompliancePermission.BULK_STATUS_UPDATE
      );

      const errors: Array<{ requirementId: string; message: string }> = [];
      let updatedCount = 0;

      for (const requirementId of input.requirementIds) {
        const { error } = await forsured('compliance_requirements')
          .update({
            status: input.status,
            change_summary: input.change_summary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requirementId)
          .eq('organization_id', input.organizationId);

        if (error) {
          errors.push({
            requirementId,
            message: error.message,
          });
        } else {
          updatedCount++;
        }
      }

      return {
        success: errors.length === 0,
        updatedCount,
        errors,
      };
    }),
});
