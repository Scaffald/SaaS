/**
 * REQ-2, TASK-11: Bulk Export System for Compliance Requirements
 * Provides filtering and export functionality for requirements data
 */

import type {
  CoverageType,
  RequirementStatus,
  RequirementDefinition,
} from '../../server/schemas/forsured/compliance-requirements.schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Export format type
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Requirement data for export
 */
export interface ExportableRequirement {
  id: string;
  code: string;
  name: string;
  type: CoverageType;
  description: string | null;
  status: RequirementStatus;
  is_template: boolean;
  effective_date: string;
  expiration_date: string | null;
  requirement_definition: RequirementDefinition;
  current_version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Version data for export
 */
export interface ExportableVersion {
  version: number;
  changed_at: string;
  change_summary: string | null;
  changed_fields: Record<string, unknown> | null;
}

/**
 * Dependency data for export
 */
export interface ExportableDependency {
  depends_on_code: string;
  depends_on_name: string;
  dependency_type: string;
  notes: string | null;
}

/**
 * Complete export data with optional related entities
 */
export interface ExportData {
  requirement: ExportableRequirement;
  versions?: ExportableVersion[];
  dependencies?: ExportableDependency[];
}

/**
 * Filter options for export
 */
export interface ExportFilters {
  types?: CoverageType[];
  statuses?: RequirementStatus[];
  is_template?: boolean;
  search?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  codes?: string[];
  includeArchived?: boolean;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  filters?: ExportFilters;
  includeVersionHistory?: boolean;
  includeDependencies?: boolean;
  prettyPrint?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  data: string;
  filename: string;
  mimeType: string;
  totalRecords: number;
  filteredRecords: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escape CSV field value
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Check if field needs quoting
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Apply filters to requirements
 */
export function applyFilters(requirements: ExportableRequirement[], filters?: ExportFilters): ExportableRequirement[] {
  if (!filters) {
    return requirements;
  }

  let filtered = [...requirements];

  // Filter by types
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((r) => filters.types!.includes(r.type));
  }

  // Filter by statuses
  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filtered.filter((r) => filters.statuses!.includes(r.status));
  }

  // Filter by template flag
  if (filters.is_template !== undefined) {
    filtered = filtered.filter((r) => r.is_template === filters.is_template);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.code.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
    );
  }

  // Filter by effective date range
  if (filters.effectiveDateFrom) {
    const fromDate = new Date(filters.effectiveDateFrom);
    filtered = filtered.filter((r) => new Date(r.effective_date) >= fromDate);
  }

  if (filters.effectiveDateTo) {
    const toDate = new Date(filters.effectiveDateTo);
    filtered = filtered.filter((r) => new Date(r.effective_date) <= toDate);
  }

  // Filter by specific codes
  if (filters.codes && filters.codes.length > 0) {
    const codesUpper = filters.codes.map((c) => c.toUpperCase());
    filtered = filtered.filter((r) => codesUpper.includes(r.code.toUpperCase()));
  }

  // Filter archived (excluded by default)
  if (!filters.includeArchived) {
    filtered = filtered.filter((r) => r.status !== 'archived');
  }

  return filtered;
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Export requirements to JSON format
 */
export function exportToJSON(data: ExportData[], options: ExportOptions): string {
  const exportObject = {
    exportedAt: new Date().toISOString(),
    totalRecords: data.length,
    options: {
      includeVersionHistory: options.includeVersionHistory ?? false,
      includeDependencies: options.includeDependencies ?? false,
    },
    requirements: data.map((item) => {
      const result: Record<string, unknown> = {
        code: item.requirement.code,
        name: item.requirement.name,
        type: item.requirement.type,
        description: item.requirement.description,
        status: item.requirement.status,
        is_template: item.requirement.is_template,
        effective_date: item.requirement.effective_date,
        expiration_date: item.requirement.expiration_date,
        requirement_definition: item.requirement.requirement_definition,
        current_version: item.requirement.current_version,
      };

      if (options.includeVersionHistory && item.versions) {
        result.version_history = item.versions;
      }

      if (options.includeDependencies && item.dependencies) {
        result.dependencies = item.dependencies;
      }

      return result;
    }),
  };

  return options.prettyPrint ? JSON.stringify(exportObject, null, 2) : JSON.stringify(exportObject);
}

/**
 * Export requirements to CSV format
 */
export function exportToCSV(data: ExportData[], options: ExportOptions): string {
  // Define headers
  const baseHeaders = [
    'code',
    'name',
    'type',
    'description',
    'status',
    'is_template',
    'effective_date',
    'expiration_date',
    'requirement_definition',
    'current_version',
    'created_at',
    'updated_at',
  ];

  const dependencyHeaders = options.includeDependencies ? ['dependencies'] : [];
  const versionHeaders = options.includeVersionHistory ? ['version_history'] : [];

  const headers = [...baseHeaders, ...dependencyHeaders, ...versionHeaders];
  const rows: string[] = [headers.join(',')];

  for (const item of data) {
    const baseValues = [
      escapeCSVField(item.requirement.code),
      escapeCSVField(item.requirement.name),
      escapeCSVField(item.requirement.type),
      escapeCSVField(item.requirement.description),
      escapeCSVField(item.requirement.status),
      escapeCSVField(item.requirement.is_template),
      escapeCSVField(item.requirement.effective_date),
      escapeCSVField(item.requirement.expiration_date),
      escapeCSVField(item.requirement.requirement_definition),
      escapeCSVField(item.requirement.current_version),
      escapeCSVField(item.requirement.created_at),
      escapeCSVField(item.requirement.updated_at),
    ];

    const dependencyValues = options.includeDependencies && item.dependencies
      ? [escapeCSVField(item.dependencies)]
      : [];

    const versionValues = options.includeVersionHistory && item.versions
      ? [escapeCSVField(item.versions)]
      : [];

    const values = [...baseValues, ...dependencyValues, ...versionValues];
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

/**
 * Generate export data
 */
export function generateExport(
  data: ExportData[],
  options: ExportOptions
): ExportResult {
  const format = options.format;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  let exportData: string;
  let mimeType: string;
  let extension: string;

  if (format === 'json') {
    exportData = exportToJSON(data, options);
    mimeType = 'application/json';
    extension = 'json';
  } else {
    exportData = exportToCSV(data, options);
    mimeType = 'text/csv';
    extension = 'csv';
  }

  return {
    data: exportData,
    filename: `compliance-requirements-export-${timestamp}.${extension}`,
    mimeType,
    totalRecords: data.length,
    filteredRecords: data.length,
  };
}

/**
 * Generate a summary report of requirements
 */
export function generateSummaryReport(requirements: ExportableRequirement[]): string {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let templates = 0;

  for (const req of requirements) {
    byType[req.type] = (byType[req.type] || 0) + 1;
    byStatus[req.status] = (byStatus[req.status] || 0) + 1;
    if (req.is_template) templates++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequirements: requirements.length,
      templates,
      byType,
      byStatus,
    },
    filters: {
      description: 'This summary includes all requirements in the filtered set.',
    },
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Prepare requirements for export (flattens nested structures for CSV)
 */
export function prepareForExport(
  requirements: ExportableRequirement[],
  versionsMap?: Map<string, ExportableVersion[]>,
  dependenciesMap?: Map<string, ExportableDependency[]>
): ExportData[] {
  return requirements.map((requirement) => ({
    requirement,
    versions: versionsMap?.get(requirement.id),
    dependencies: dependenciesMap?.get(requirement.id),
  }));
}

/**
 * Get available export formats
 */
export function getAvailableFormats(): Array<{ format: ExportFormat; label: string; mimeType: string }> {
  return [
    { format: 'json', label: 'JSON', mimeType: 'application/json' },
    { format: 'csv', label: 'CSV', mimeType: 'text/csv' },
  ];
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!['json', 'csv'].includes(options.format)) {
    errors.push('Invalid export format. Must be "json" or "csv".');
  }

  if (options.filters?.effectiveDateFrom) {
    const fromDate = new Date(options.filters.effectiveDateFrom);
    if (Number.isNaN(fromDate.getTime())) {
      errors.push('Invalid effectiveDateFrom format.');
    }
  }

  if (options.filters?.effectiveDateTo) {
    const toDate = new Date(options.filters.effectiveDateTo);
    if (Number.isNaN(toDate.getTime())) {
      errors.push('Invalid effectiveDateTo format.');
    }
  }

  if (options.filters?.effectiveDateFrom && options.filters?.effectiveDateTo) {
    const fromDate = new Date(options.filters.effectiveDateFrom);
    const toDate = new Date(options.filters.effectiveDateTo);
    if (fromDate > toDate) {
      errors.push('effectiveDateFrom must be before effectiveDateTo.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
