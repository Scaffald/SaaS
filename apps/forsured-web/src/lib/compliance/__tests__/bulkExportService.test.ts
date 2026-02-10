/**
 * Bulk Export Service Tests
 * Bulk Export System with Filtering
 */

import { describe, it, expect } from 'vitest';
import {
  applyFilters,
  exportToJSON,
  exportToCSV,
  generateExport,
  generateSummaryReport,
  prepareForExport,
  getAvailableFormats,
  validateExportOptions,
  type ExportableRequirement,
  type ExportData,
  type ExportOptions,
} from '../bulkExportService';

// Test data factory
const createMockRequirement = (overrides: Partial<ExportableRequirement> = {}): ExportableRequirement => ({
  id: 'test-id-1',
  code: 'GL-001',
  name: 'General Liability $1M/$2M',
  type: 'general_liability',
  description: 'Standard GL requirement',
  status: 'active',
  is_template: false,
  effective_date: '2024-01-01',
  expiration_date: null,
  requirement_definition: {
    coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
    required_endorsements: [],
    policy_conditions: [],
    documentation_requirements: [],
  },
  current_version: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Bulk Export Service', () => {
  describe('applyFilters', () => {
    const requirements = [
      createMockRequirement({ id: '1', code: 'GL-001', name: 'General Liability Policy', type: 'general_liability', status: 'active' }),
      createMockRequirement({ id: '2', code: 'WC-001', name: 'Workers Compensation', type: 'workers_comp', status: 'draft' }),
      createMockRequirement({ id: '3', code: 'AL-001', name: 'Auto Liability Coverage', type: 'auto_liability', status: 'active' }),
      createMockRequirement({ id: '4', code: 'GL-002', name: 'General Liability Template', type: 'general_liability', status: 'archived', is_template: true }),
    ];

    it('returns all requirements when no filters object provided', () => {
      const result = applyFilters(requirements);
      expect(result).toHaveLength(4); // No filtering applied
    });

    it('returns non-archived when empty filters provided', () => {
      const result = applyFilters(requirements, {});
      expect(result).toHaveLength(3); // Archived excluded by default
    });

    it('filters by types', () => {
      // Note: GL-002 is archived and excluded by default, so only GL-001 matches
      const result = applyFilters(requirements, { types: ['general_liability'] });
      expect(result).toHaveLength(1);
      expect(result.every((r) => r.type === 'general_liability')).toBe(true);
    });

    it('filters by types including archived', () => {
      const result = applyFilters(requirements, { types: ['general_liability'], includeArchived: true });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.type === 'general_liability')).toBe(true);
    });

    it('filters by multiple types', () => {
      // Note: GL-002 is archived and excluded by default
      const result = applyFilters(requirements, { types: ['general_liability', 'workers_comp'] });
      expect(result).toHaveLength(2);
    });

    it('filters by statuses', () => {
      const result = applyFilters(requirements, { statuses: ['active'] });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'active')).toBe(true);
    });

    it('filters by is_template', () => {
      const result = applyFilters(requirements, { is_template: true, includeArchived: true });
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('GL-002');
    });

    it('filters by search term in name', () => {
      const result = applyFilters(requirements, { search: 'General', includeArchived: true });
      expect(result).toHaveLength(2);
    });

    it('filters by search term in code', () => {
      const result = applyFilters(requirements, { search: 'WC-001' });
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('WC-001');
    });

    it('filters by specific codes', () => {
      const result = applyFilters(requirements, { codes: ['GL-001', 'AL-001'] });
      expect(result).toHaveLength(2);
    });

    it('excludes archived by default', () => {
      const result = applyFilters(requirements, {});
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.status !== 'archived')).toBe(true);
    });

    it('includes archived when flag is set', () => {
      const result = applyFilters(requirements, { includeArchived: true });
      expect(result).toHaveLength(4);
    });

    it('filters by effective date range', () => {
      const datedRequirements = [
        createMockRequirement({ id: '1', effective_date: '2024-01-01' }),
        createMockRequirement({ id: '2', effective_date: '2024-06-01' }),
        createMockRequirement({ id: '3', effective_date: '2024-12-01' }),
      ];

      const result = applyFilters(datedRequirements, {
        effectiveDateFrom: '2024-05-01',
        effectiveDateTo: '2024-07-01',
      });

      expect(result).toHaveLength(1);
      expect(result[0].effective_date).toBe('2024-06-01');
    });

    it('combines multiple filters', () => {
      const result = applyFilters(requirements, {
        types: ['general_liability'],
        statuses: ['active'],
        search: 'GL-001',
      });

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('GL-001');
    });
  });

  describe('exportToJSON', () => {
    const requirement = createMockRequirement();
    const exportData: ExportData[] = [{ requirement }];

    it('exports basic requirement data', () => {
      const result = exportToJSON(exportData, { format: 'json' });
      const parsed = JSON.parse(result);

      expect(parsed.totalRecords).toBe(1);
      expect(parsed.requirements).toHaveLength(1);
      expect(parsed.requirements[0].code).toBe('GL-001');
    });

    it('includes version history when requested', () => {
      const data: ExportData[] = [
        {
          requirement,
          versions: [
            { version: 1, changed_at: '2024-01-01', change_summary: 'Initial', changed_fields: null },
            { version: 2, changed_at: '2024-02-01', change_summary: 'Update', changed_fields: { name: 'changed' } },
          ],
        },
      ];

      const result = exportToJSON(data, { format: 'json', includeVersionHistory: true });
      const parsed = JSON.parse(result);

      expect(parsed.requirements[0].version_history).toHaveLength(2);
    });

    it('includes dependencies when requested', () => {
      const data: ExportData[] = [
        {
          requirement,
          dependencies: [
            { depends_on_code: 'WC-001', depends_on_name: 'Workers Comp', dependency_type: 'requires', notes: null },
          ],
        },
      ];

      const result = exportToJSON(data, { format: 'json', includeDependencies: true });
      const parsed = JSON.parse(result);

      expect(parsed.requirements[0].dependencies).toHaveLength(1);
    });

    it('pretty prints when requested', () => {
      const result = exportToJSON(exportData, { format: 'json', prettyPrint: true });
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('compact output by default', () => {
      const result = exportToJSON(exportData, { format: 'json' });
      expect(result).not.toContain('\n  ');
    });
  });

  describe('exportToCSV', () => {
    const requirement = createMockRequirement();
    const exportData: ExportData[] = [{ requirement }];

    it('exports with headers', () => {
      const result = exportToCSV(exportData, { format: 'csv' });
      const lines = result.split('\n');

      expect(lines[0]).toContain('code');
      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('type');
    });

    it('exports requirement values', () => {
      const result = exportToCSV(exportData, { format: 'csv' });
      const lines = result.split('\n');

      expect(lines[1]).toContain('GL-001');
      expect(lines[1]).toContain('General Liability');
    });

    it('handles fields with commas', () => {
      const data: ExportData[] = [
        {
          requirement: createMockRequirement({ name: 'Test, with comma' }),
        },
      ];

      const result = exportToCSV(data, { format: 'csv' });
      expect(result).toContain('"Test, with comma"');
    });

    it('handles fields with quotes', () => {
      const data: ExportData[] = [
        {
          requirement: createMockRequirement({ name: 'Test "quoted" name' }),
        },
      ];

      const result = exportToCSV(data, { format: 'csv' });
      expect(result).toContain('"Test ""quoted"" name"');
    });

    it('adds dependencies column when requested', () => {
      const data: ExportData[] = [
        {
          requirement,
          dependencies: [
            { depends_on_code: 'WC-001', depends_on_name: 'Workers Comp', dependency_type: 'requires', notes: null },
          ],
        },
      ];

      const result = exportToCSV(data, { format: 'csv', includeDependencies: true });
      const lines = result.split('\n');

      expect(lines[0]).toContain('dependencies');
    });

    it('adds version_history column when requested', () => {
      const data: ExportData[] = [
        {
          requirement,
          versions: [{ version: 1, changed_at: '2024-01-01', change_summary: 'Initial', changed_fields: null }],
        },
      ];

      const result = exportToCSV(data, { format: 'csv', includeVersionHistory: true });
      const lines = result.split('\n');

      expect(lines[0]).toContain('version_history');
    });
  });

  describe('generateExport', () => {
    const requirement = createMockRequirement();
    const exportData: ExportData[] = [{ requirement }];

    it('generates JSON export with correct metadata', () => {
      const result = generateExport(exportData, { format: 'json' });

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('.json');
      expect(result.totalRecords).toBe(1);
    });

    it('generates CSV export with correct metadata', () => {
      const result = generateExport(exportData, { format: 'csv' });

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
      expect(result.totalRecords).toBe(1);
    });

    it('includes timestamp in filename', () => {
      const result = generateExport(exportData, { format: 'json' });
      expect(result.filename).toMatch(/compliance-requirements-export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);
    });
  });

  describe('generateSummaryReport', () => {
    it('generates correct summary statistics', () => {
      const requirements = [
        createMockRequirement({ type: 'general_liability', status: 'active', is_template: false }),
        createMockRequirement({ type: 'general_liability', status: 'draft', is_template: true }),
        createMockRequirement({ type: 'workers_comp', status: 'active', is_template: false }),
      ];

      const result = generateSummaryReport(requirements);
      const parsed = JSON.parse(result);

      expect(parsed.summary.totalRequirements).toBe(3);
      expect(parsed.summary.templates).toBe(1);
      expect(parsed.summary.byType.general_liability).toBe(2);
      expect(parsed.summary.byType.workers_comp).toBe(1);
      expect(parsed.summary.byStatus.active).toBe(2);
      expect(parsed.summary.byStatus.draft).toBe(1);
    });
  });

  describe('prepareForExport', () => {
    it('maps requirements with versions and dependencies', () => {
      const requirements = [
        createMockRequirement({ id: 'req-1' }),
        createMockRequirement({ id: 'req-2' }),
      ];

      const versionsMap = new Map([
        ['req-1', [{ version: 1, changed_at: '2024-01-01', change_summary: 'Initial', changed_fields: null }]],
      ]);

      const dependenciesMap = new Map([
        ['req-2', [{ depends_on_code: 'WC-001', depends_on_name: 'Workers Comp', dependency_type: 'requires', notes: null }]],
      ]);

      const result = prepareForExport(requirements, versionsMap, dependenciesMap);

      expect(result).toHaveLength(2);
      expect(result[0].versions).toHaveLength(1);
      expect(result[0].dependencies).toBeUndefined();
      expect(result[1].versions).toBeUndefined();
      expect(result[1].dependencies).toHaveLength(1);
    });

    it('handles missing maps gracefully', () => {
      const requirements = [createMockRequirement()];
      const result = prepareForExport(requirements);

      expect(result).toHaveLength(1);
      expect(result[0].versions).toBeUndefined();
      expect(result[0].dependencies).toBeUndefined();
    });
  });

  describe('getAvailableFormats', () => {
    it('returns supported export formats', () => {
      const formats = getAvailableFormats();

      expect(formats).toContainEqual({
        format: 'json',
        label: 'JSON',
        mimeType: 'application/json',
      });

      expect(formats).toContainEqual({
        format: 'csv',
        label: 'CSV',
        mimeType: 'text/csv',
      });
    });
  });

  describe('validateExportOptions', () => {
    it('validates correct options', () => {
      const result = validateExportOptions({
        format: 'json',
        filters: {
          effectiveDateFrom: '2024-01-01',
          effectiveDateTo: '2024-12-31',
        },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid format', () => {
      const result = validateExportOptions({
        format: 'xml' as 'json',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid export format. Must be "json" or "csv".');
    });

    it('rejects invalid effectiveDateFrom', () => {
      const result = validateExportOptions({
        format: 'json',
        filters: { effectiveDateFrom: 'invalid-date' },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid effectiveDateFrom format.');
    });

    it('rejects invalid effectiveDateTo', () => {
      const result = validateExportOptions({
        format: 'json',
        filters: { effectiveDateTo: 'invalid-date' },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid effectiveDateTo format.');
    });

    it('rejects date range where from is after to', () => {
      const result = validateExportOptions({
        format: 'json',
        filters: {
          effectiveDateFrom: '2024-12-31',
          effectiveDateTo: '2024-01-01',
        },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('effectiveDateFrom must be before effectiveDateTo.');
    });
  });
});
