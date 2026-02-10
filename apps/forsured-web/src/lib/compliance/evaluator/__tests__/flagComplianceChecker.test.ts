/**
 * Unit Tests for FlagComplianceChecker
 * Policy & Endorsement Level Flags
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FlagComplianceChecker,
  createFlagComplianceChecker,
  flagSeverityToGapSeverity,
  getLocationLabel,
  flagToComplianceIssue,
  FlagComplianceReport,
} from '../flagComplianceChecker';
import { GapSeverity } from '../types';
import {
  ComplianceFlag,
  InsurancePolicy,
  PolicyProvision,
  PolicyEndorsement,
} from '../../../../types';

// Test data factory functions
function createTestPolicy(overrides?: Partial<InsurancePolicy>): InsurancePolicy {
  return {
    id: 'policy-123',
    organization_id: 'org-1',
    policy_type: 'GL',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    policy_number: 'POL-001',
    provisions: [],
    endorsements: [],
    ...overrides,
  };
}

function createTestProvision(overrides?: Partial<PolicyProvision>): PolicyProvision {
  return {
    id: 'provision-1',
    policy_id: 'policy-123',
    organization_id: 'org-1',
    provision_type: 'per_occurrence',
    limit_amount: 1000000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createTestEndorsement(overrides?: Partial<PolicyEndorsement>): PolicyEndorsement {
  return {
    id: 'endorsement-1',
    policy_id: 'policy-123',
    organization_id: 'org-1',
    endorsement_type: 'Additional Insured',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createTestFlag(overrides?: Partial<ComplianceFlag>): ComplianceFlag {
  return {
    id: 'flag-1',
    entity_type: 'policy',
    entity_id: 'policy-123',
    flag_type: 'coverage_gap',
    severity: 'warning',
    status: 'active',
    title: 'Test Flag',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('FlagComplianceChecker', () => {
  let checker: FlagComplianceChecker;

  beforeEach(() => {
    checker = createFlagComplianceChecker();
  });

  describe('Utility Functions', () => {
    describe('flagSeverityToGapSeverity', () => {
      it('should convert critical severity', () => {
        expect(flagSeverityToGapSeverity('critical')).toBe(GapSeverity.CRITICAL);
      });

      it('should convert warning severity', () => {
        expect(flagSeverityToGapSeverity('warning')).toBe(GapSeverity.WARNING);
      });

      it('should convert info severity', () => {
        expect(flagSeverityToGapSeverity('info')).toBe(GapSeverity.INFO);
      });
    });

    describe('getLocationLabel', () => {
      it('should return "Policy Flag" for policy entity type', () => {
        expect(getLocationLabel('policy')).toBe('Policy Flag');
      });

      it('should return "Provision Flag" for provision entity type', () => {
        expect(getLocationLabel('provision')).toBe('Provision Flag');
      });

      it('should return "Endorsement Flag" for endorsement entity type', () => {
        expect(getLocationLabel('endorsement')).toBe('Endorsement Flag');
      });
    });

    describe('flagToComplianceIssue', () => {
      it('should convert flag to compliance issue with correct fields', () => {
        const flag = createTestFlag({
          id: 'flag-test',
          entity_type: 'policy',
          entity_id: 'policy-test',
          flag_type: 'coverage_gap',
          severity: 'critical',
          title: 'Missing Coverage',
          description: 'GL coverage is required',
        });

        const issue = flagToComplianceIssue(flag);

        expect(issue.flagId).toBe('flag-test');
        expect(issue.entityType).toBe('policy');
        expect(issue.entityId).toBe('policy-test');
        expect(issue.flagType).toBe('coverage_gap');
        expect(issue.severity).toBe('critical');
        expect(issue.title).toBe('Missing Coverage');
        expect(issue.description).toBe('GL coverage is required');
        expect(issue.location).toBe('Policy Flag');
      });

      it('should include entity details when provided', () => {
        const flag = createTestFlag();
        const issue = flagToComplianceIssue(flag, {
          policyNumber: 'POL-001',
          policyType: 'GL',
        });

        expect(issue.entityDetails).toEqual({
          policyNumber: 'POL-001',
          policyType: 'GL',
        });
      });
    });
  });

  describe('checkPolicyFlags', () => {
    it('should return policy-level flags for matching policy', () => {
      const flags = [
        createTestFlag({
          id: 'flag-1',
          entity_type: 'policy',
          entity_id: 'policy-123',
        }),
        createTestFlag({
          id: 'flag-2',
          entity_type: 'policy',
          entity_id: 'policy-456', // Different policy
        }),
        createTestFlag({
          id: 'flag-3',
          entity_type: 'endorsement', // Different entity type
          entity_id: 'policy-123',
        }),
      ];

      const result = checker.checkPolicyFlags('policy-123', flags);

      expect(result).toHaveLength(1);
      expect(result[0].flagId).toBe('flag-1');
      expect(result[0].location).toBe('Policy Flag');
    });

    it('should return empty array when no policy flags exist', () => {
      const flags = [
        createTestFlag({
          entity_type: 'provision',
          entity_id: 'provision-1',
        }),
      ];

      const result = checker.checkPolicyFlags('policy-123', flags);

      expect(result).toHaveLength(0);
    });

    it('should include policy details when provided', () => {
      const flags = [
        createTestFlag({
          entity_type: 'policy',
          entity_id: 'policy-123',
        }),
      ];

      const policy = createTestPolicy({
        id: 'policy-123',
        policy_number: 'POL-001',
        policy_type: 'GL',
      });

      const result = checker.checkPolicyFlags('policy-123', flags, policy);

      expect(result[0].entityDetails).toEqual({
        policyNumber: 'POL-001',
        policyType: 'GL',
      });
    });
  });

  describe('checkProvisionFlags', () => {
    it('should return provision-level flags for matching provisions', () => {
      const provisions = [
        createTestProvision({ id: 'provision-1', provision_type: 'per_occurrence' }),
        createTestProvision({ id: 'provision-2', provision_type: 'aggregate_limit' }),
      ];

      const flags = [
        createTestFlag({
          id: 'flag-1',
          entity_type: 'provision',
          entity_id: 'provision-1',
        }),
        createTestFlag({
          id: 'flag-2',
          entity_type: 'provision',
          entity_id: 'provision-2',
        }),
        createTestFlag({
          id: 'flag-3',
          entity_type: 'provision',
          entity_id: 'provision-999', // Not in our provisions
        }),
      ];

      const result = checker.checkProvisionFlags(provisions, flags);

      expect(result).toHaveLength(2);
      expect(result[0].flagId).toBe('flag-1');
      expect(result[0].location).toBe('Provision Flag');
      expect(result[0].entityDetails?.provisionType).toBe('per_occurrence');
      expect(result[1].entityDetails?.provisionType).toBe('aggregate_limit');
    });

    it('should return empty array when provisions is empty', () => {
      const flags = [
        createTestFlag({
          entity_type: 'provision',
          entity_id: 'provision-1',
        }),
      ];

      const result = checker.checkProvisionFlags([], flags);

      expect(result).toHaveLength(0);
    });
  });

  describe('checkEndorsementFlags', () => {
    it('should return endorsement-level flags for matching endorsements', () => {
      const endorsements = [
        createTestEndorsement({ id: 'endorsement-1', endorsement_type: 'Additional Insured' }),
        createTestEndorsement({ id: 'endorsement-2', endorsement_type: 'Waiver of Subrogation' }),
      ];

      const flags = [
        createTestFlag({
          id: 'flag-1',
          entity_type: 'endorsement',
          entity_id: 'endorsement-1',
        }),
        createTestFlag({
          id: 'flag-2',
          entity_type: 'policy',
          entity_id: 'endorsement-1', // Different entity type
        }),
      ];

      const result = checker.checkEndorsementFlags(endorsements, flags);

      expect(result).toHaveLength(1);
      expect(result[0].flagId).toBe('flag-1');
      expect(result[0].location).toBe('Endorsement Flag');
      expect(result[0].entityDetails?.endorsementType).toBe('Additional Insured');
    });

    it('should return empty array when endorsements is empty', () => {
      const flags = [
        createTestFlag({
          entity_type: 'endorsement',
          entity_id: 'endorsement-1',
        }),
      ];

      const result = checker.checkEndorsementFlags([], flags);

      expect(result).toHaveLength(0);
    });
  });

  describe('aggregateComplianceReport', () => {
    it('should aggregate compliance report with multi-level flags', () => {
      const policy = createTestPolicy({
        id: 'pol-123',
        provisions: [
          createTestProvision({ id: 'prov-1' }),
          createTestProvision({ id: 'prov-2' }),
        ],
        endorsements: [
          createTestEndorsement({ id: 'end-1' }),
        ],
      });

      const flags = [
        // 1 policy-level flag
        createTestFlag({
          id: 'flag-policy',
          entity_type: 'policy',
          entity_id: 'pol-123',
          severity: 'critical',
        }),
        // 2 provision-level flags
        createTestFlag({
          id: 'flag-prov-1',
          entity_type: 'provision',
          entity_id: 'prov-1',
          severity: 'warning',
        }),
        createTestFlag({
          id: 'flag-prov-2',
          entity_type: 'provision',
          entity_id: 'prov-2',
          severity: 'info',
        }),
        // 1 endorsement-level flag
        createTestFlag({
          id: 'flag-end',
          entity_type: 'endorsement',
          entity_id: 'end-1',
          severity: 'warning',
        }),
      ];

      const report = checker.aggregateComplianceReport('pol-123', flags, policy);

      expect(report.policyId).toBe('pol-123');
      expect(report.policyFlags).toHaveLength(1);
      expect(report.provisionFlags).toHaveLength(2);
      expect(report.endorsementFlags).toHaveLength(1);
      expect(report.summary.totalFlags).toBe(4);
      expect(report.summary.criticalCount).toBe(1);
      expect(report.summary.warningCount).toBe(2);
      expect(report.summary.infoCount).toBe(1);
      expect(report.summary.byLevel).toEqual({
        policy: 1,
        provision: 2,
        endorsement: 1,
      });
    });

    it('should handle policy with no flags', () => {
      const policy = createTestPolicy({
        id: 'pol-456',
        provisions: [createTestProvision()],
        endorsements: [createTestEndorsement()],
      });

      const report = checker.aggregateComplianceReport('pol-456', [], policy);

      expect(report.policyId).toBe('pol-456');
      expect(report.policyFlags).toHaveLength(0);
      expect(report.provisionFlags).toHaveLength(0);
      expect(report.endorsementFlags).toHaveLength(0);
      expect(report.summary.totalFlags).toBe(0);
      expect(report.summary.byLevel).toEqual({
        policy: 0,
        provision: 0,
        endorsement: 0,
      });
    });

    it('should handle policy without provisions or endorsements', () => {
      const flags = [
        createTestFlag({
          entity_type: 'policy',
          entity_id: 'pol-789',
        }),
      ];

      const report = checker.aggregateComplianceReport('pol-789', flags);

      expect(report.policyFlags).toHaveLength(1);
      expect(report.provisionFlags).toHaveLength(0);
      expect(report.endorsementFlags).toHaveLength(0);
    });
  });

  describe('filterComplianceIssues', () => {
    let report: FlagComplianceReport;

    beforeEach(() => {
      const policy = createTestPolicy({
        id: 'pol-123',
        provisions: [createTestProvision({ id: 'prov-1' })],
        endorsements: [createTestEndorsement({ id: 'end-1' })],
      });

      const flags = [
        createTestFlag({
          id: 'flag-1',
          entity_type: 'policy',
          entity_id: 'pol-123',
          severity: 'critical',
        }),
        createTestFlag({
          id: 'flag-2',
          entity_type: 'provision',
          entity_id: 'prov-1',
          severity: 'warning',
        }),
        createTestFlag({
          id: 'flag-3',
          entity_type: 'endorsement',
          entity_id: 'end-1',
          severity: 'warning',
        }),
      ];

      report = checker.aggregateComplianceReport('pol-123', flags, policy);
    });

    it('should filter by entity type - policy', () => {
      const filtered = checker.filterComplianceIssues(report, { entityType: 'policy' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityType).toBe('policy');
    });

    it('should filter by entity type - provision', () => {
      const filtered = checker.filterComplianceIssues(report, { entityType: 'provision' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityType).toBe('provision');
    });

    it('should filter by entity type - endorsement', () => {
      const filtered = checker.filterComplianceIssues(report, { entityType: 'endorsement' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityType).toBe('endorsement');
    });

    it('should filter by severity', () => {
      const filtered = checker.filterComplianceIssues(report, { severity: 'warning' });

      expect(filtered).toHaveLength(2);
      filtered.forEach((issue) => {
        expect(issue.severity).toBe('warning');
      });
    });

    it('should combine entity type and severity filters', () => {
      const filtered = checker.filterComplianceIssues(report, {
        entityType: 'provision',
        severity: 'warning',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].entityType).toBe('provision');
      expect(filtered[0].severity).toBe('warning');
    });

    it('should return all issues when no filters specified', () => {
      const filtered = checker.filterComplianceIssues(report, {});

      expect(filtered).toHaveLength(3);
    });
  });

  describe('getAllIssues', () => {
    it('should return flat array of all issues', () => {
      const policy = createTestPolicy({
        id: 'pol-123',
        provisions: [createTestProvision({ id: 'prov-1' })],
        endorsements: [createTestEndorsement({ id: 'end-1' })],
      });

      const flags = [
        createTestFlag({ entity_type: 'policy', entity_id: 'pol-123' }),
        createTestFlag({ entity_type: 'provision', entity_id: 'prov-1' }),
        createTestFlag({ entity_type: 'endorsement', entity_id: 'end-1' }),
      ];

      const report = checker.aggregateComplianceReport('pol-123', flags, policy);
      const allIssues = checker.getAllIssues(report);

      expect(allIssues).toHaveLength(3);
    });
  });
});
