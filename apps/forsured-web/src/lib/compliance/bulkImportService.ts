/**
 * Bulk Import System for Compliance Requirements
 * Provides validation, preview, and import functionality for bulk requirement data
 */

import { z } from 'zod';
import {
  coverageTypeEnum,
  requirementStatusEnum,
  requirementDefinitionSchema,
  type CoverageType,
  type RequirementStatus,
  type RequirementDefinition,
} from '../../server/schemas/forsured/compliance-requirements.schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Import format type
 */
export type ImportFormat = 'json' | 'csv';

/**
 * Single row in the import data
 */
export interface ImportRow {
  code: string;
  name: string;
  type: CoverageType;
  description?: string | null;
  status?: RequirementStatus;
  is_template?: boolean;
  effective_date?: string;
  expiration_date?: string | null;
  requirement_definition: RequirementDefinition | string; // String for CSV, object for JSON
}

/**
 * Validation error for a single row
 */
export interface RowValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  rowIndex: number;
  isValid: boolean;
  errors: RowValidationError[];
  warnings: RowValidationError[];
  data?: ImportRow;
  normalizedData?: NormalizedImportRow;
}

/**
 * Normalized import row with all fields resolved
 */
export interface NormalizedImportRow {
  code: string;
  name: string;
  type: CoverageType;
  description: string | null;
  status: RequirementStatus;
  is_template: boolean;
  effective_date: string;
  expiration_date: string | null;
  requirement_definition: RequirementDefinition;
}

/**
 * Preview result for bulk import
 */
export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  duplicateCodes: string[];
  rows: RowValidationResult[];
  canProceed: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  totalAttempted: number;
  successfulImports: number;
  failedImports: number;
  createdIds: string[];
  errors: Array<{
    rowIndex: number;
    code: string;
    message: string;
  }>;
}

/**
 * Import options
 */
export interface ImportOptions {
  organizationId: string;
  userId: string;
  skipDuplicates?: boolean;
  setDefaultsForMissing?: boolean;
}

// =============================================================================
// Row Validation Schema
// =============================================================================

/**
 * Schema for validating import row data
 */
const importRowSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/i, 'Code must be alphanumeric with dashes only'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  type: coverageTypeEnum,
  description: z.string().nullable().optional(),
  status: requirementStatusEnum.optional().default('draft'),
  is_template: z.boolean().optional().default(false),
  effective_date: z
    .string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Effective date must be in YYYY-MM-DD format',
    })
    .optional(),
  expiration_date: z
    .string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Expiration date must be in YYYY-MM-DD format',
    })
    .nullable()
    .optional(),
  requirement_definition: z.union([
    requirementDefinitionSchema,
    z.string().min(1, 'Requirement definition is required'), // For CSV, will be parsed
  ]),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse CSV content into rows
 * Supports quoted fields and escaped quotes
 */
export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() ?? '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parse JSON content into rows
 */
export function parseJSON(content: string): ImportRow[] {
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed.requirements && Array.isArray(parsed.requirements)) {
    return parsed.requirements;
  }
  throw new Error('JSON must be an array or object with "requirements" array');
}

/**
 * Convert CSV row to ImportRow format
 */
function csvRowToImportRow(row: Record<string, string>): Partial<ImportRow> {
  return {
    code: row.code || row.Code || '',
    name: row.name || row.Name || '',
    type: (row.type || row.Type || 'general_liability') as CoverageType,
    description: row.description || row.Description || null,
    status: (row.status || row.Status || 'draft') as RequirementStatus,
    is_template: row.is_template === 'true' || row.is_template === '1' || row.IsTemplate === 'true',
    effective_date: row.effective_date || row.EffectiveDate || undefined,
    expiration_date: row.expiration_date || row.ExpirationDate || null,
    requirement_definition: row.requirement_definition || row.RequirementDefinition || '{}',
  };
}

/**
 * Normalize a validated row to the final format
 */
function normalizeRow(row: ImportRow): NormalizedImportRow {
  let definition: RequirementDefinition;

  if (typeof row.requirement_definition === 'string') {
    try {
      definition = JSON.parse(row.requirement_definition);
    } catch {
      definition = {
        coverage_limits: {},
        required_endorsements: [],
        policy_conditions: [],
        documentation_requirements: [],
      };
    }
  } else {
    definition = row.requirement_definition;
  }

  return {
    code: row.code,
    name: row.name,
    type: row.type,
    description: row.description ?? null,
    status: row.status ?? 'draft',
    is_template: row.is_template ?? false,
    effective_date: row.effective_date ?? new Date().toISOString().split('T')[0],
    expiration_date: row.expiration_date ?? null,
    requirement_definition: definition,
  };
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Validate a single row of import data
 */
export function validateRow(row: Partial<ImportRow>, rowIndex: number): RowValidationResult {
  const errors: RowValidationError[] = [];
  const warnings: RowValidationError[] = [];

  // Parse requirement_definition if it's a string
  let processedRow = { ...row };
  if (typeof row.requirement_definition === 'string') {
    try {
      processedRow = {
        ...row,
        requirement_definition: JSON.parse(row.requirement_definition as string),
      };
    } catch (e) {
      errors.push({
        field: 'requirement_definition',
        message: 'Invalid JSON in requirement_definition',
        code: 'INVALID_JSON',
      });
      return {
        rowIndex,
        isValid: false,
        errors,
        warnings,
        data: row as ImportRow,
      };
    }
  }

  // Validate against schema
  const result = importRowSchema.safeParse(processedRow);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      });
    }
  }

  // Add warnings for potential issues
  if (row.effective_date) {
    const effectiveDate = new Date(row.effective_date);
    if (effectiveDate < new Date()) {
      warnings.push({
        field: 'effective_date',
        message: 'Effective date is in the past',
        code: 'DATE_IN_PAST',
      });
    }
  }

  if (row.expiration_date && row.effective_date) {
    const effective = new Date(row.effective_date);
    const expiration = new Date(row.expiration_date);
    if (expiration <= effective) {
      errors.push({
        field: 'expiration_date',
        message: 'Expiration date must be after effective date',
        code: 'INVALID_DATE_RANGE',
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    rowIndex,
    isValid,
    errors,
    warnings,
    data: row as ImportRow,
    normalizedData: isValid ? normalizeRow(row as ImportRow) : undefined,
  };
}

/**
 * Generate a preview of the import without actually importing
 */
export function generateImportPreview(
  data: string,
  format: ImportFormat,
  existingCodes: string[] = []
): ImportPreviewResult {
  let rows: Partial<ImportRow>[];

  try {
    if (format === 'csv') {
      const csvRows = parseCSV(data);
      rows = csvRows.map(csvRowToImportRow);
    } else {
      rows = parseJSON(data);
    }
  } catch (e) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 1,
      warningRows: 0,
      duplicateCodes: [],
      rows: [
        {
          rowIndex: 0,
          isValid: false,
          errors: [
            {
              field: '_parse',
              message: e instanceof Error ? e.message : 'Failed to parse input data',
              code: 'PARSE_ERROR',
            },
          ],
          warnings: [],
        },
      ],
      canProceed: false,
    };
  }

  // Validate each row
  const validationResults: RowValidationResult[] = rows.map((row, index) => validateRow(row, index));

  // Check for duplicate codes within the import
  const codesSeen = new Map<string, number[]>();
  rows.forEach((row, index) => {
    if (row.code) {
      const code = row.code.toUpperCase();
      if (!codesSeen.has(code)) {
        codesSeen.set(code, []);
      }
      codesSeen.get(code)!.push(index);
    }
  });

  const duplicateCodes: string[] = [];

  // Mark duplicates within import
  codesSeen.forEach((indices, code) => {
    if (indices.length > 1) {
      duplicateCodes.push(code);
      indices.forEach((idx) => {
        validationResults[idx].errors.push({
          field: 'code',
          message: `Duplicate code "${code}" found in import data (rows: ${indices.map((i) => i + 1).join(', ')})`,
          code: 'DUPLICATE_IN_IMPORT',
        });
        validationResults[idx].isValid = false;
      });
    }
  });

  // Check for codes that already exist
  const existingCodesUpper = existingCodes.map((c) => c.toUpperCase());
  rows.forEach((row, index) => {
    if (row.code && existingCodesUpper.includes(row.code.toUpperCase())) {
      validationResults[index].errors.push({
        field: 'code',
        message: `Code "${row.code}" already exists in the organization`,
        code: 'CODE_EXISTS',
      });
      validationResults[index].isValid = false;
      if (!duplicateCodes.includes(row.code.toUpperCase())) {
        duplicateCodes.push(row.code.toUpperCase());
      }
    }
  });

  const validRows = validationResults.filter((r) => r.isValid).length;
  const invalidRows = validationResults.filter((r) => !r.isValid).length;
  const warningRows = validationResults.filter((r) => r.isValid && r.warnings.length > 0).length;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    warningRows,
    duplicateCodes,
    rows: validationResults,
    canProceed: invalidRows === 0,
  };
}

/**
 * Execute the actual import
 * This function is designed to be called from the tRPC router
 * and will use the actual database connection
 */
export function prepareImportData(
  validatedRows: RowValidationResult[],
  options: ImportOptions
): NormalizedImportRow[] {
  return validatedRows
    .filter((row) => row.isValid && row.normalizedData)
    .map((row) => ({
      ...row.normalizedData!,
      // These will be set by the tRPC router
    }));
}

/**
 * Generate a sample CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    'code',
    'name',
    'type',
    'description',
    'status',
    'is_template',
    'effective_date',
    'expiration_date',
    'requirement_definition',
  ];

  const sampleRow = [
    'GL-001',
    'General Liability $1M/$2M',
    'general_liability',
    'Standard general liability requirement',
    'draft',
    'false',
    new Date().toISOString().split('T')[0],
    '',
    JSON.stringify({
      coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
      required_endorsements: [],
      policy_conditions: [],
      documentation_requirements: [],
    }),
  ];

  return [headers.join(','), sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')].join('\n');
}

/**
 * Generate a sample JSON template
 */
export function generateJSONTemplate(): string {
  const sample = {
    requirements: [
      {
        code: 'GL-001',
        name: 'General Liability $1M/$2M',
        type: 'general_liability',
        description: 'Standard general liability requirement',
        status: 'draft',
        is_template: false,
        effective_date: new Date().toISOString().split('T')[0],
        expiration_date: null,
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000,
          },
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: [],
        },
      },
    ],
  };

  return JSON.stringify(sample, null, 2);
}

/**
 * Detect the format of import data
 */
export function detectFormat(data: string): ImportFormat {
  const trimmed = data.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  return 'csv';
}
