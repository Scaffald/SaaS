/**
 * Bulk Import Service Tests
 * REQ-2, TASK-10: Bulk Import System with Validation and Preview
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseJSON,
  validateRow,
  generateImportPreview,
  generateCSVTemplate,
  generateJSONTemplate,
  detectFormat,
  type ImportRow,
  type ImportFormat,
} from '../bulkImportService';

describe('Bulk Import Service', () => {
  describe('parseCSV', () => {
    it('parses simple CSV data', () => {
      const csv = `code,name,type
GL-001,General Liability,general_liability
WC-001,Workers Comp,workers_comp`;

      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('GL-001');
      expect(result[0].name).toBe('General Liability');
      expect(result[1].type).toBe('workers_comp');
    });

    it('handles quoted fields with commas', () => {
      const csv = `code,name,description
GL-001,"General Liability, Inc.",Contains comma`;

      const result = parseCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('General Liability, Inc.');
    });

    it('handles escaped quotes in CSV', () => {
      const csv = `code,name,description
GL-001,"Test ""Quoted"" Name",Description`;

      const result = parseCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test "Quoted" Name');
    });

    it('returns empty array for invalid CSV', () => {
      const result = parseCSV('');
      expect(result).toHaveLength(0);
    });

    it('skips empty lines', () => {
      const csv = `code,name,type

GL-001,General Liability,general_liability

WC-001,Workers Comp,workers_comp
`;

      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
    });
  });

  describe('parseJSON', () => {
    it('parses array of requirements', () => {
      const json = JSON.stringify([
        { code: 'GL-001', name: 'General Liability', type: 'general_liability' },
        { code: 'WC-001', name: 'Workers Comp', type: 'workers_comp' },
      ]);

      const result = parseJSON(json);
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('GL-001');
    });

    it('parses object with requirements array', () => {
      const json = JSON.stringify({
        requirements: [
          { code: 'GL-001', name: 'General Liability', type: 'general_liability' },
        ],
      });

      const result = parseJSON(json);
      expect(result).toHaveLength(1);
    });

    it('throws for invalid JSON structure', () => {
      const json = JSON.stringify({ data: 'invalid' });
      expect(() => parseJSON(json)).toThrow('JSON must be an array or object with "requirements" array');
    });

    it('throws for invalid JSON syntax', () => {
      expect(() => parseJSON('{ invalid json }')).toThrow();
    });
  });

  describe('validateRow', () => {
    const validRow: ImportRow = {
      code: 'GL-001',
      name: 'General Liability $1M/$2M',
      type: 'general_liability',
      description: 'Standard GL requirement',
      status: 'draft',
      is_template: false,
      effective_date: '2024-01-01',
      expiration_date: null,
      requirement_definition: {
        coverage_limits: { per_occurrence: 1000000 },
        required_endorsements: [],
        policy_conditions: [],
        documentation_requirements: [],
      },
    };

    it('validates a complete valid row', () => {
      const result = validateRow(validRow, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates row with minimum required fields', () => {
      const minRow: Partial<ImportRow> = {
        code: 'GL-001',
        name: 'General Liability',
        type: 'general_liability',
        requirement_definition: {
          coverage_limits: {},
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: [],
        },
      };

      const result = validateRow(minRow, 0);
      expect(result.isValid).toBe(true);
    });

    it('fails validation for missing code', () => {
      const row: Partial<ImportRow> = {
        name: 'General Liability',
        type: 'general_liability',
        requirement_definition: {
          coverage_limits: {},
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: [],
        },
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'code')).toBe(true);
    });

    it('fails validation for invalid code format', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        code: 'GL@001!', // Invalid characters
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'code' && e.message.includes('alphanumeric'))).toBe(true);
    });

    it('fails validation for invalid type', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        type: 'invalid_type' as 'general_liability',
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
    });

    it('fails validation for invalid date format', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        effective_date: '01/01/2024', // Wrong format
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'effective_date')).toBe(true);
    });

    it('fails validation when expiration_date is before effective_date', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        effective_date: '2024-06-01',
        expiration_date: '2024-01-01',
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'expiration_date' && e.code === 'INVALID_DATE_RANGE')).toBe(true);
    });

    it('handles JSON string requirement_definition', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        requirement_definition: JSON.stringify({
          coverage_limits: { per_occurrence: 500000 },
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: [],
        }),
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(true);
      expect(result.normalizedData?.requirement_definition.coverage_limits.per_occurrence).toBe(500000);
    });

    it('fails validation for invalid JSON in requirement_definition', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        requirement_definition: '{ invalid json }',
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_JSON')).toBe(true);
    });

    it('adds warning for past effective_date', () => {
      const row: Partial<ImportRow> = {
        ...validRow,
        effective_date: '2020-01-01', // Past date
      };

      const result = validateRow(row, 0);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'DATE_IN_PAST')).toBe(true);
    });
  });

  describe('generateImportPreview', () => {
    it('generates preview for valid JSON data', () => {
      const json = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        {
          code: 'WC-001',
          name: 'Workers Comp',
          type: 'workers_comp',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const result = generateImportPreview(json, 'json');
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.canProceed).toBe(true);
    });

    it('generates preview for valid CSV data', () => {
      const csv = `code,name,type,requirement_definition
GL-001,General Liability,general_liability,"{""coverage_limits"":{},""required_endorsements"":[],""policy_conditions"":[],""documentation_requirements"":[]}"`;

      const result = generateImportPreview(csv, 'csv');
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.canProceed).toBe(true);
    });

    it('detects duplicate codes within import', () => {
      const json = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability 1',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        {
          code: 'GL-001', // Duplicate
          name: 'General Liability 2',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const result = generateImportPreview(json, 'json');
      expect(result.duplicateCodes).toContain('GL-001');
      expect(result.invalidRows).toBe(2);
      expect(result.canProceed).toBe(false);
    });

    it('detects codes that already exist in organization', () => {
      const json = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const result = generateImportPreview(json, 'json', ['GL-001']);
      expect(result.duplicateCodes).toContain('GL-001');
      expect(result.rows[0].errors.some((e) => e.code === 'CODE_EXISTS')).toBe(true);
      expect(result.canProceed).toBe(false);
    });

    it('handles parse errors gracefully', () => {
      const result = generateImportPreview('invalid json {{{{', 'json');
      expect(result.canProceed).toBe(false);
      expect(result.rows[0].errors.some((e) => e.code === 'PARSE_ERROR')).toBe(true);
    });

    it('counts warning rows correctly', () => {
      const json = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          effective_date: '2020-01-01', // Past date - warning
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const result = generateImportPreview(json, 'json');
      expect(result.validRows).toBe(1);
      expect(result.warningRows).toBe(1);
      expect(result.canProceed).toBe(true);
    });
  });

  describe('generateCSVTemplate', () => {
    it('generates valid CSV template with headers', () => {
      const template = generateCSVTemplate();
      expect(template).toContain('code,name,type');
      expect(template).toContain('GL-001');
    });

    it('template is parseable', () => {
      const template = generateCSVTemplate();
      const parsed = parseCSV(template);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].code).toBe('GL-001');
    });
  });

  describe('generateJSONTemplate', () => {
    it('generates valid JSON template', () => {
      const template = generateJSONTemplate();
      const parsed = JSON.parse(template);
      expect(parsed.requirements).toHaveLength(1);
      expect(parsed.requirements[0].code).toBe('GL-001');
    });

    it('template passes validation', () => {
      const template = generateJSONTemplate();
      const result = generateImportPreview(template, 'json');
      expect(result.validRows).toBe(1);
      expect(result.canProceed).toBe(true);
    });
  });

  describe('detectFormat', () => {
    it('detects JSON format from array', () => {
      expect(detectFormat('[{}, {}]')).toBe('json');
    });

    it('detects JSON format from object', () => {
      expect(detectFormat('{ "requirements": [] }')).toBe('json');
    });

    it('detects CSV format', () => {
      expect(detectFormat('code,name,type\nGL-001,Test,general_liability')).toBe('csv');
    });

    it('detects CSV format for whitespace-prefixed data', () => {
      expect(detectFormat('  code,name,type')).toBe('csv');
    });

    it('detects JSON for whitespace-prefixed JSON', () => {
      expect(detectFormat('  [{}]')).toBe('json');
    });
  });
});
