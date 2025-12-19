/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-5: Implement Dual-Level Compliance Validation Logic
 *
 * Tests for coverageComplianceService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateOrgLevelCompliance,
  validateProjectLevelCompliance,
  validateDualLevelCompliance,
  getComplianceGaps,
  calculateComplianceScore,
  calculateRequiredComplianceScore,
  formatLimitValue,
  getCoverageTypeName,
  SubcontractorCoverage,
} from '../coverageComplianceService';
import { CoverageLimitRequirement, CoverageLimitComplianceResult } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';

// Mock the MockDatabase
vi.mock('../../../utils/mockDataStore', () => ({
  default: {
    query: vi.fn(),
  },
}));

const mockOrgRequirements: CoverageLimitRequirement[] = [
  {
    id: 'org-req-1',
    name: 'Org GL Coverage',
    level: 'org',
    organization_id: 'org-1',
    project_id: null,
    coverage_type: 'general_liability',
    minimum_limit: 1000000,
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'org-req-2',
    name: 'Org Workers Comp',
    level: 'org',
    organization_id: 'org-1',
    project_id: null,
    coverage_type: 'workers_comp',
    minimum_limit: 500000,
    required: false, // Optional requirement
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockProjectRequirements: CoverageLimitRequirement[] = [
  {
    id: 'proj-req-1',
    name: 'Project GL Coverage',
    level: 'project',
    organization_id: 'org-1',
    project_id: 'proj-1',
    coverage_type: 'general_liability',
    minimum_limit: 2000000, // Higher than org requirement
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'proj-req-2',
    name: 'Project Auto Coverage',
    level: 'project',
    organization_id: 'org-1',
    project_id: 'proj-1',
    coverage_type: 'commercial_auto',
    minimum_limit: 1000000,
    required: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const subcontractorCoverages: SubcontractorCoverage[] = [
  {
    subcontractor_id: 'sub-1',
    coverage_type: 'general_liability',
    limit: 2500000, // Meets both org (1M) and project (2M) requirements
  },
  {
    subcontractor_id: 'sub-1',
    coverage_type: 'workers_comp',
    limit: 500000, // Meets org requirement (500K)
  },
  {
    subcontractor_id: 'sub-1',
    coverage_type: 'commercial_auto',
    limit: 750000, // Below project requirement (1M)
  },
];

describe('coverageComplianceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOrgLevelCompliance', () => {
    it('should validate against org-level requirements only', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockOrgRequirements);

      const result = await validateOrgLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: subcontractorCoverages,
      });

      expect(result.subcontractor_id).toBe('sub-1');
      expect(result.organization_id).toBe('org-1');
      expect(result.org_level_checks).toHaveLength(2);
      expect(result.project_level_checks).toHaveLength(0);
      expect(result.overall_compliant).toBe(true);
    });

    it('should mark overall as compliant when all required org requirements are met', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockOrgRequirements);

      const result = await validateOrgLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: subcontractorCoverages,
      });

      expect(result.overall_compliant).toBe(true);
      // GL is required and met
      const glCheck = result.org_level_checks.find(
        (c) => c.coverage_type === 'general_liability'
      );
      expect(glCheck?.status).toBe('met');
    });

    it('should mark overall as non-compliant when a required org requirement is not met', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockOrgRequirements);

      const insufficientCoverages: SubcontractorCoverage[] = [
        {
          subcontractor_id: 'sub-1',
          coverage_type: 'general_liability',
          limit: 500000, // Below required 1M
        },
      ];

      const result = await validateOrgLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: insufficientCoverages,
      });

      expect(result.overall_compliant).toBe(false);
    });

    it('should still be compliant if only optional requirements are unmet', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockOrgRequirements);

      // Only provide GL coverage, not workers comp (which is optional)
      const partialCoverages: SubcontractorCoverage[] = [
        {
          subcontractor_id: 'sub-1',
          coverage_type: 'general_liability',
          limit: 1000000,
        },
      ];

      const result = await validateOrgLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: partialCoverages,
      });

      expect(result.overall_compliant).toBe(true);
      // Workers comp check should show as unmet but not affect overall
      const wcCheck = result.org_level_checks.find(
        (c) => c.coverage_type === 'workers_comp'
      );
      expect(wcCheck?.status).toBe('unmet');
    });
  });

  describe('validateProjectLevelCompliance', () => {
    it('should validate against project-level requirements only', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockProjectRequirements);

      const result = await validateProjectLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: subcontractorCoverages,
      });

      expect(result.subcontractor_id).toBe('sub-1');
      expect(result.project_id).toBe('proj-1');
      expect(result.org_level_checks).toHaveLength(0);
      expect(result.project_level_checks).toHaveLength(2);
    });

    it('should mark non-compliant when project requirements are not met', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockProjectRequirements);

      const result = await validateProjectLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: subcontractorCoverages,
      });

      // Auto coverage is below requirement (750K vs 1M)
      expect(result.overall_compliant).toBe(false);
      const autoCheck = result.project_level_checks.find(
        (c) => c.coverage_type === 'commercial_auto'
      );
      expect(autoCheck?.status).toBe('unmet');
      expect(autoCheck?.gap_amount).toBe(250000);
    });
  });

  describe('validateDualLevelCompliance', () => {
    beforeEach(() => {
      // Setup mock to return different results based on query params
      vi.mocked(MockDatabase.query).mockImplementation((table, params) => {
        if (params?.level === 'org') {
          return Promise.resolve(mockOrgRequirements);
        }
        if (params?.level === 'project') {
          return Promise.resolve(mockProjectRequirements);
        }
        return Promise.resolve([]);
      });
    });

    it('should validate against both org and project requirements', async () => {
      const result = await validateDualLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: subcontractorCoverages,
      });

      expect(result.org_level_checks).toHaveLength(2);
      expect(result.project_level_checks).toHaveLength(2);
    });

    it('should be compliant only if both org AND project requirements are met', async () => {
      // Create coverages that meet both org and project requirements
      const fullCoverages: SubcontractorCoverage[] = [
        {
          subcontractor_id: 'sub-1',
          coverage_type: 'general_liability',
          limit: 2500000, // Meets both org (1M) and project (2M)
        },
        {
          subcontractor_id: 'sub-1',
          coverage_type: 'workers_comp',
          limit: 500000, // Meets org (500K, optional)
        },
        {
          subcontractor_id: 'sub-1',
          coverage_type: 'commercial_auto',
          limit: 1500000, // Meets project (1M)
        },
      ];

      const result = await validateDualLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: fullCoverages,
      });

      expect(result.overall_compliant).toBe(true);
    });

    it('should be non-compliant if org requirements are met but project requirements are not', async () => {
      const result = await validateDualLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: subcontractorCoverages,
      });

      // Org requirements are met, but project auto requirement is not
      expect(result.overall_compliant).toBe(false);
    });

    it('should work without project_id (org-only validation)', async () => {
      const result = await validateDualLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: subcontractorCoverages,
      });

      expect(result.org_level_checks).toHaveLength(2);
      expect(result.project_level_checks).toHaveLength(0);
      expect(result.overall_compliant).toBe(true);
    });

    it('should include checked_at timestamp', async () => {
      const result = await validateDualLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: subcontractorCoverages,
      });

      expect(result.checked_at).toBeDefined();
      expect(new Date(result.checked_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('checkRequirementCompliance (through public functions)', () => {
    it('should calculate gap amount when coverage is below requirement', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockProjectRequirements);

      const result = await validateProjectLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: subcontractorCoverages,
      });

      const autoCheck = result.project_level_checks.find(
        (c) => c.coverage_type === 'commercial_auto'
      );
      expect(autoCheck?.gap_amount).toBe(250000); // 1M required - 750K actual
    });

    it('should set gap amount to full requirement when coverage is missing', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockProjectRequirements);

      const noCoverages: SubcontractorCoverage[] = [];

      const result = await validateProjectLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        project_id: 'proj-1',
        coverages: noCoverages,
      });

      const autoCheck = result.project_level_checks.find(
        (c) => c.coverage_type === 'commercial_auto'
      );
      expect(autoCheck?.actual_limit).toBeNull();
      expect(autoCheck?.gap_amount).toBe(1000000); // Full requirement amount
    });

    it('should not set gap amount when requirement is met', async () => {
      vi.mocked(MockDatabase.query).mockResolvedValue(mockOrgRequirements);

      const result = await validateOrgLevelCompliance({
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        coverages: subcontractorCoverages,
      });

      const glCheck = result.org_level_checks.find(
        (c) => c.coverage_type === 'general_liability'
      );
      expect(glCheck?.status).toBe('met');
      expect(glCheck?.gap_amount).toBeUndefined();
    });
  });

  describe('getComplianceGaps', () => {
    it('should return only unmet requirements', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
        ],
        project_level_checks: [
          {
            requirement_id: 'req-2',
            requirement_name: 'Auto Coverage',
            level: 'project',
            coverage_type: 'commercial_auto',
            required_limit: 1000000,
            actual_limit: 500000,
            status: 'unmet',
            gap_amount: 500000,
          },
        ],
        checked_at: new Date().toISOString(),
      };

      const gaps = getComplianceGaps(mockResult);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].requirement_name).toBe('Auto Coverage');
      expect(gaps[0].gap_amount).toBe(500000);
    });

    it('should return empty array when all requirements are met', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: true,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      const gaps = getComplianceGaps(mockResult);

      expect(gaps).toHaveLength(0);
    });
  });

  describe('calculateComplianceScore', () => {
    it('should return 100 when all requirements are met', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: true,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
          {
            requirement_id: 'req-2',
            requirement_name: 'WC Coverage',
            level: 'org',
            coverage_type: 'workers_comp',
            required_limit: 500000,
            actual_limit: 500000,
            status: 'met',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      expect(calculateComplianceScore(mockResult)).toBe(100);
    });

    it('should return 50 when half of requirements are met', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
          {
            requirement_id: 'req-2',
            requirement_name: 'WC Coverage',
            level: 'org',
            coverage_type: 'workers_comp',
            required_limit: 500000,
            actual_limit: null,
            status: 'unmet',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      expect(calculateComplianceScore(mockResult)).toBe(50);
    });

    it('should return 100 when there are no requirements', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: true,
        org_level_checks: [],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      expect(calculateComplianceScore(mockResult)).toBe(100);
    });

    it('should include both org and project checks in calculation', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
        ],
        project_level_checks: [
          {
            requirement_id: 'req-2',
            requirement_name: 'Auto Coverage',
            level: 'project',
            coverage_type: 'commercial_auto',
            required_limit: 1000000,
            actual_limit: 500000,
            status: 'unmet',
          },
          {
            requirement_id: 'req-3',
            requirement_name: 'Umbrella',
            level: 'project',
            coverage_type: 'umbrella_excess',
            required_limit: 5000000,
            actual_limit: null,
            status: 'unmet',
          },
        ],
        checked_at: new Date().toISOString(),
      };

      // 1 met out of 3 total = 33%
      expect(calculateComplianceScore(mockResult)).toBe(33);
    });
  });

  describe('calculateRequiredComplianceScore', () => {
    it('should only consider required requirements', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'org-req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
          {
            requirement_id: 'org-req-2',
            requirement_name: 'WC Coverage',
            level: 'org',
            coverage_type: 'workers_comp',
            required_limit: 500000,
            actual_limit: null,
            status: 'unmet',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      // org-req-1 is required, org-req-2 is optional
      const score = calculateRequiredComplianceScore(mockResult, mockOrgRequirements);

      // Only the required GL is counted, and it's met = 100%
      expect(score).toBe(100);
    });

    it('should include both org and project required requirements', () => {
      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'org-req-1',
            requirement_name: 'GL Coverage',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 1500000,
            status: 'met',
          },
        ],
        project_level_checks: [
          {
            requirement_id: 'proj-req-1',
            requirement_name: 'Project GL',
            level: 'project',
            coverage_type: 'general_liability',
            required_limit: 2000000,
            actual_limit: 2500000,
            status: 'met',
          },
          {
            requirement_id: 'proj-req-2',
            requirement_name: 'Project Auto',
            level: 'project',
            coverage_type: 'commercial_auto',
            required_limit: 1000000,
            actual_limit: 500000,
            status: 'unmet',
          },
        ],
        checked_at: new Date().toISOString(),
      };

      // All requirements in mockOrgRequirements and mockProjectRequirements are required except org-req-2
      // org-req-1: met, proj-req-1: met, proj-req-2: unmet = 2/3 = 67%
      const score = calculateRequiredComplianceScore(
        mockResult,
        mockOrgRequirements,
        mockProjectRequirements
      );

      expect(score).toBe(67);
    });

    it('should return 100 when no required requirements exist', () => {
      const optionalOnlyOrgReqs: CoverageLimitRequirement[] = [
        { ...mockOrgRequirements[1] }, // Workers comp is optional
      ];

      const mockResult: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-1',
        organization_id: 'org-1',
        overall_compliant: true,
        org_level_checks: [
          {
            requirement_id: 'org-req-2',
            requirement_name: 'WC Coverage',
            level: 'org',
            coverage_type: 'workers_comp',
            required_limit: 500000,
            actual_limit: null,
            status: 'unmet',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      const score = calculateRequiredComplianceScore(mockResult, optionalOnlyOrgReqs);

      expect(score).toBe(100);
    });
  });

  describe('formatLimitValue', () => {
    it('should format positive numbers as USD currency', () => {
      expect(formatLimitValue(1000000)).toBe('$1,000,000');
      expect(formatLimitValue(500000)).toBe('$500,000');
      expect(formatLimitValue(2500000)).toBe('$2,500,000');
    });

    it('should format zero correctly', () => {
      expect(formatLimitValue(0)).toBe('$0');
    });

    it('should return "Not provided" for null', () => {
      expect(formatLimitValue(null)).toBe('Not provided');
    });
  });

  describe('getCoverageTypeName', () => {
    it('should return human-readable names for all coverage types', () => {
      expect(getCoverageTypeName('general_liability')).toBe('General Liability');
      expect(getCoverageTypeName('workers_comp')).toBe("Workers' Compensation");
      expect(getCoverageTypeName('commercial_auto')).toBe('Commercial Auto');
      expect(getCoverageTypeName('umbrella_excess')).toBe('Umbrella/Excess Liability');
      expect(getCoverageTypeName('professional_liability')).toBe('Professional Liability');
      expect(getCoverageTypeName('pollution_liability')).toBe('Pollution Liability');
      expect(getCoverageTypeName('builders_risk')).toBe("Builder's Risk");
      expect(getCoverageTypeName('equipment_floater')).toBe('Equipment Floater');
    });

    it('should return the original type if not in mapping', () => {
      // This tests the fallback behavior
      const unknownType = 'unknown_type' as any;
      expect(getCoverageTypeName(unknownType)).toBe('unknown_type');
    });
  });
});
