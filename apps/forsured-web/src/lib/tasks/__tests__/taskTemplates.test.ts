/**
 * Task Auto-Generation from Compliance Gaps
 * Unit tests for task templates (TDD - Red phase)
 */

import { describe, it, expect } from 'vitest';
import { TaskTemplates } from '../taskTemplates';
import { GapType, GapSeverity, ComplianceGap } from '../../compliance/evaluator/types';
import { CoverageType } from '../../compliance/types';

describe('TaskTemplates', () => {
  describe('Missing Certificate of Insurance', () => {
    it('generates correct title for missing COI', () => {
      const gap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate of Insurance',
        remediation: 'Upload certificate of insurance',
        points_deducted: 20
      };

      const template = TaskTemplates.getTemplate(GapType.MISSING_COVERAGE);
      const title = template.title_template(gap);

      expect(title).toContain('Upload');
      expect(title).toContain('General Liability');
      expect(title).toContain('Certificate of Insurance');
    });

    it('generates detailed description for missing COI', () => {
      const gap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate of Insurance',
        remediation: 'Upload certificate of insurance',
        points_deducted: 20
      };

      const template = TaskTemplates.getTemplate(GapType.MISSING_COVERAGE);
      const description = template.description_template(gap);

      expect(description).toContain('missing');
      expect(description).toContain('General Liability');
      expect(description).toContain('certificate');
    });

    it('maps severity to correct priority for missing COI', () => {
      const template = TaskTemplates.getTemplate(GapType.MISSING_COVERAGE);

      expect(template.priority_mapping[GapSeverity.CRITICAL]).toBe('urgent');
      expect(template.priority_mapping[GapSeverity.WARNING]).toBe('high');
      expect(template.priority_mapping[GapSeverity.INFO]).toBe('medium');
    });

    it('maps severity to correct due date days for missing COI', () => {
      const template = TaskTemplates.getTemplate(GapType.MISSING_COVERAGE);

      expect(template.due_date_days[GapSeverity.CRITICAL]).toBe(3);
      expect(template.due_date_days[GapSeverity.WARNING]).toBe(7);
      expect(template.due_date_days[GapSeverity.INFO]).toBe(14);
    });
  });

  describe('Missing Endorsement', () => {
    it('generates correct title for missing endorsement', () => {
      const gap: ComplianceGap = {
        id: 'gap-2',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        endorsement: 'additional_insured',
        required_value: 'Additional Insured Endorsement',
        remediation: 'Add additional insured endorsement',
        points_deducted: 15
      };

      const template = TaskTemplates.getTemplate(GapType.MISSING_ENDORSEMENT);
      const title = template.title_template(gap);

      expect(title).toContain('Add');
      expect(title).toContain('Endorsement');
      expect(title.toLowerCase()).toContain('additional');
    });

    it('generates detailed description for missing endorsement', () => {
      const gap: ComplianceGap = {
        id: 'gap-2',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        endorsement: 'waiver_of_subrogation',
        required_value: 'Waiver of Subrogation',
        remediation: 'Add waiver of subrogation endorsement',
        points_deducted: 15
      };

      const template = TaskTemplates.getTemplate(GapType.MISSING_ENDORSEMENT);
      const description = template.description_template(gap);

      expect(description).toContain('missing');
      expect(description).toContain('endorsement');
      expect(description.toLowerCase()).toContain('waiver');
    });
  });

  describe('Insufficient Coverage Amount', () => {
    it('generates correct title for insufficient coverage', () => {
      const gap: ComplianceGap = {
        id: 'gap-3',
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        current_value: 500000,
        required_value: 1000000,
        remediation: 'Increase coverage to meet requirements',
        points_deducted: 10
      };

      const template = TaskTemplates.getTemplate(GapType.INSUFFICIENT_AMOUNT);
      const title = template.title_template(gap);

      expect(title).toContain('Increase');
      expect(title).toContain('Coverage');
      expect(title).toContain('General Liability');
    });

    it('generates detailed description with amounts for insufficient coverage', () => {
      const gap: ComplianceGap = {
        id: 'gap-3',
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        current_value: 500000,
        required_value: 1000000,
        remediation: 'Increase coverage to meet requirements',
        points_deducted: 10
      };

      const template = TaskTemplates.getTemplate(GapType.INSUFFICIENT_AMOUNT);
      const description = template.description_template(gap);

      expect(description).toContain('500,000');
      expect(description).toContain('1,000,000');
      expect(description).toContain('insufficient');
    });
  });

  describe('Expired Policy', () => {
    it('generates correct title for expired policy', () => {
      const gap: ComplianceGap = {
        id: 'gap-4',
        type: GapType.EXPIRED_POLICY,
        severity: GapSeverity.CRITICAL,
        current_value: '2024-01-01',
        required_value: 'Active policy through project end date',
        remediation: 'Renew or replace expired policy',
        points_deducted: 50
      };

      const template = TaskTemplates.getTemplate(GapType.EXPIRED_POLICY);
      const title = template.title_template(gap);

      expect(title).toContain('Renew');
      expect(title).toContain('Expired');
      expect(title).toContain('Policy');
    });

    it('generates detailed description for expired policy', () => {
      const gap: ComplianceGap = {
        id: 'gap-4',
        type: GapType.EXPIRED_POLICY,
        severity: GapSeverity.CRITICAL,
        current_value: '2024-01-01',
        required_value: 'Active policy through project end date',
        remediation: 'Renew or replace expired policy',
        points_deducted: 50
      };

      const template = TaskTemplates.getTemplate(GapType.EXPIRED_POLICY);
      const description = template.description_template(gap);

      expect(description).toContain('expired');
      expect(description).toContain('2024-01-01');
      expect(description.toLowerCase()).toContain('renew');
    });

    it('has urgent priority for expired policy', () => {
      const template = TaskTemplates.getTemplate(GapType.EXPIRED_POLICY);

      expect(template.priority_mapping[GapSeverity.CRITICAL]).toBe('urgent');
    });

    it('has short due date for expired policy', () => {
      const template = TaskTemplates.getTemplate(GapType.EXPIRED_POLICY);

      expect(template.due_date_days[GapSeverity.CRITICAL]).toBe(3);
    });
  });

  describe('Expiring Soon Policy', () => {
    it('generates correct title for expiring soon policy', () => {
      const gap: ComplianceGap = {
        id: 'gap-5',
        type: GapType.EXPIRING_SOON,
        severity: GapSeverity.WARNING,
        current_value: '2025-02-01',
        required_value: 'Policy must extend through project end',
        remediation: 'Extend or renew policy before expiration',
        points_deducted: 5
      };

      const template = TaskTemplates.getTemplate(GapType.EXPIRING_SOON);
      const title = template.title_template(gap);

      expect(title).toContain('Renew');
      expect(title).toContain('Policy');
      expect(title.toLowerCase()).toContain('expiring');
    });

    it('generates detailed description for expiring soon policy', () => {
      const gap: ComplianceGap = {
        id: 'gap-5',
        type: GapType.EXPIRING_SOON,
        severity: GapSeverity.WARNING,
        current_value: '2025-02-01',
        required_value: 'Policy must extend through project end',
        remediation: 'Extend or renew policy before expiration',
        points_deducted: 5
      };

      const template = TaskTemplates.getTemplate(GapType.EXPIRING_SOON);
      const description = template.description_template(gap);

      expect(description).toContain('expiring');
      expect(description).toContain('2025-02-01');
      expect(description.toLowerCase()).toContain('renew');
    });
  });

  describe('Template Registry', () => {
    it('has templates for all 5 gap types', () => {
      expect(TaskTemplates.getTemplate(GapType.MISSING_COVERAGE)).toBeDefined();
      expect(TaskTemplates.getTemplate(GapType.MISSING_ENDORSEMENT)).toBeDefined();
      expect(TaskTemplates.getTemplate(GapType.INSUFFICIENT_AMOUNT)).toBeDefined();
      expect(TaskTemplates.getTemplate(GapType.EXPIRED_POLICY)).toBeDefined();
      expect(TaskTemplates.getTemplate(GapType.EXPIRING_SOON)).toBeDefined();
    });

    it('throws error for unsupported gap type', () => {
      expect(() => {
        TaskTemplates.getTemplate('unsupported_gap' as GapType);
      }).toThrow();
    });

    it('returns all templates', () => {
      const allTemplates = TaskTemplates.getAllTemplates();

      expect(allTemplates).toHaveLength(5);
      expect(allTemplates.every(t => t.gap_type)).toBe(true);
      expect(allTemplates.every(t => t.title_template)).toBe(true);
      expect(allTemplates.every(t => t.description_template)).toBe(true);
    });
  });

  describe('Task Type Mapping', () => {
    it('maps missing coverage to COI upload task type', () => {
      const template = TaskTemplates.getTemplate(GapType.MISSING_COVERAGE);
      expect(template.task_type).toBe('coi_upload');
    });

    it('maps missing endorsement to endorsement correction task type', () => {
      const template = TaskTemplates.getTemplate(GapType.MISSING_ENDORSEMENT);
      expect(template.task_type).toBe('endorsement_correction');
    });

    it('maps insufficient amount to coverage increase task type', () => {
      const template = TaskTemplates.getTemplate(GapType.INSUFFICIENT_AMOUNT);
      expect(template.task_type).toBe('coverage_increase');
    });

    it('maps expired policy to policy renewal task type', () => {
      const template = TaskTemplates.getTemplate(GapType.EXPIRED_POLICY);
      expect(template.task_type).toBe('policy_renewal');
    });

    it('maps expiring soon to policy extension task type', () => {
      const template = TaskTemplates.getTemplate(GapType.EXPIRING_SOON);
      expect(template.task_type).toBe('policy_extension');
    });
  });
});
