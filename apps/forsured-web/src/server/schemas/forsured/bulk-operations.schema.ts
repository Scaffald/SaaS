/**
 * Bulk Operations Zod Schemas
 * Input validation schemas for bulk import/export tRPC endpoints
 */

import { z } from 'zod';
import {
  coverageTypeEnum,
  requirementStatusEnum,
  requirementDefinitionSchema,
} from './compliance-requirements.schema';

// =============================================================================
// Enums
// =============================================================================

export const importFormatEnum = z.enum(['json', 'csv']);
export const exportFormatEnum = z.enum(['json', 'csv']);

// =============================================================================
// Import Schemas
// =============================================================================

/**
 * Single requirement data for import
 */
export const importRequirementDataSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes'),
  name: z.string().min(1).max(255),
  type: coverageTypeEnum,
  description: z.string().nullable().optional(),
  status: requirementStatusEnum.optional().default('draft'),
  is_template: z.boolean().optional().default(false),
  effective_date: z.string().date().optional(),
  expiration_date: z.string().date().nullable().optional(),
  requirement_definition: requirementDefinitionSchema,
});

/**
 * Import preview request
 */
export const importPreviewInputSchema = z.object({
  organizationId: z.string().uuid(),
  data: z.string().min(1, 'Import data is required'),
  format: importFormatEnum.optional(), // Auto-detect if not provided
});

/**
 * Import preview response
 */
export const importPreviewResultSchema = z.object({
  totalRows: z.number(),
  validRows: z.number(),
  invalidRows: z.number(),
  warningRows: z.number(),
  duplicateCodes: z.array(z.string()),
  canProceed: z.boolean(),
  rows: z.array(
    z.object({
      rowIndex: z.number(),
      isValid: z.boolean(),
      errors: z.array(
        z.object({
          field: z.string(),
          message: z.string(),
          code: z.string(),
        })
      ),
      warnings: z.array(
        z.object({
          field: z.string(),
          message: z.string(),
          code: z.string(),
        })
      ),
    })
  ),
});

/**
 * Execute import request
 */
export const importExecuteInputSchema = z.object({
  organizationId: z.string().uuid(),
  data: z.string().min(1, 'Import data is required'),
  format: importFormatEnum.optional(), // Auto-detect if not provided
  skipDuplicates: z.boolean().optional().default(true),
});

/**
 * Import result
 */
export const importResultSchema = z.object({
  success: z.boolean(),
  totalAttempted: z.number(),
  successfulImports: z.number(),
  failedImports: z.number(),
  createdIds: z.array(z.string()),
  errors: z.array(
    z.object({
      rowIndex: z.number(),
      code: z.string(),
      message: z.string(),
    })
  ),
});

/**
 * Get import templates request
 */
export const importTemplatesInputSchema = z.object({
  format: importFormatEnum.optional(), // Return all formats if not specified
});

// =============================================================================
// Export Schemas
// =============================================================================

/**
 * Export filters
 */
export const exportFiltersSchema = z.object({
  types: z.array(coverageTypeEnum).optional(),
  statuses: z.array(requirementStatusEnum).optional(),
  is_template: z.boolean().optional(),
  search: z.string().optional(),
  effectiveDateFrom: z.string().date().optional(),
  effectiveDateTo: z.string().date().optional(),
  codes: z.array(z.string()).optional(),
  includeArchived: z.boolean().optional().default(false),
});

/**
 * Export request
 */
export const exportInputSchema = z.object({
  organizationId: z.string().uuid(),
  format: exportFormatEnum,
  filters: exportFiltersSchema.optional(),
  includeVersionHistory: z.boolean().optional().default(false),
  includeDependencies: z.boolean().optional().default(false),
  prettyPrint: z.boolean().optional().default(false),
});

/**
 * Export summary request (without data)
 */
export const exportSummaryInputSchema = z.object({
  organizationId: z.string().uuid(),
  filters: exportFiltersSchema.optional(),
});

/**
 * Export result
 */
export const exportResultSchema = z.object({
  data: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  totalRecords: z.number(),
  filteredRecords: z.number(),
});

/**
 * Export summary result
 */
export const exportSummaryResultSchema = z.object({
  totalRequirements: z.number(),
  templates: z.number(),
  byType: z.record(z.string(), z.number()),
  byStatus: z.record(z.string(), z.number()),
});

// =============================================================================
// Bulk Delete/Archive Schemas
// =============================================================================

/**
 * Bulk archive request
 */
export const bulkArchiveInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementIds: z.array(z.string().uuid()).min(1, 'At least one requirement ID is required'),
});

/**
 * Bulk archive result
 */
export const bulkArchiveResultSchema = z.object({
  success: z.boolean(),
  archivedCount: z.number(),
  errors: z.array(
    z.object({
      requirementId: z.string(),
      message: z.string(),
    })
  ),
});

/**
 * Bulk status update request
 */
export const bulkStatusUpdateInputSchema = z.object({
  organizationId: z.string().uuid(),
  requirementIds: z.array(z.string().uuid()).min(1, 'At least one requirement ID is required'),
  status: requirementStatusEnum,
  change_summary: z.string().min(1, 'Change summary is required'),
});

/**
 * Bulk status update result
 */
export const bulkStatusUpdateResultSchema = z.object({
  success: z.boolean(),
  updatedCount: z.number(),
  errors: z.array(
    z.object({
      requirementId: z.string(),
      message: z.string(),
    })
  ),
});

// =============================================================================
// Type Exports
// =============================================================================

export type ImportFormat = z.infer<typeof importFormatEnum>;
export type ExportFormat = z.infer<typeof exportFormatEnum>;
export type ImportRequirementData = z.infer<typeof importRequirementDataSchema>;
export type ImportPreviewInput = z.infer<typeof importPreviewInputSchema>;
export type ImportPreviewResult = z.infer<typeof importPreviewResultSchema>;
export type ImportExecuteInput = z.infer<typeof importExecuteInputSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ImportTemplatesInput = z.infer<typeof importTemplatesInputSchema>;
export type ExportFilters = z.infer<typeof exportFiltersSchema>;
export type ExportInput = z.infer<typeof exportInputSchema>;
export type ExportSummaryInput = z.infer<typeof exportSummaryInputSchema>;
export type ExportResult = z.infer<typeof exportResultSchema>;
export type ExportSummaryResult = z.infer<typeof exportSummaryResultSchema>;
export type BulkArchiveInput = z.infer<typeof bulkArchiveInputSchema>;
export type BulkArchiveResult = z.infer<typeof bulkArchiveResultSchema>;
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateInputSchema>;
export type BulkStatusUpdateResult = z.infer<typeof bulkStatusUpdateResultSchema>;
