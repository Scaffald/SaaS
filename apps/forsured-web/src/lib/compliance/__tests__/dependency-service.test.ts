/**
 * Dependency Validation Service Tests
 * Tests for dependency validation including umbrella insurance validation
 */

import { describe, expect, it } from 'vitest';
import {
  getEffectiveCoverageLimit,
  hasValidUmbrellaUnderlying,
  summarizeValidationResult,
  validateDependencies,
  validateUmbrellaUnderlying,
} from '../dependency-service';
import {
  createEmptyValidationResult,
  createErrorValidationResult,
  DependencyType,
  formatCoverageType,
  formatCurrency,
  ProjectRequirementInfo,
  RequirementDependency,
  UmbrellaUnderlyingSchedule,
  UnderlyingCoverageType,
} from '../dependency-types';
import { CoverageType } from '../types';

describe('dependency-service', () => {
  describe('validateDependencies', () => {
    it('returns valid result when no dependencies exist', () => {
      const input = {
        requirement_id: 'req-1',
        requirement_type: CoverageType.GENERAL_LIABILITY,
        organization_id: 'org-1',
        project_requirements: [],
      };

      const result = validateDependencies(input, [], null, new Map());

      expect(result.valid).toBe(true);
      expect(result.missing_dependencies).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing required dependency', () => {
      const input = {
        requirement_id: 'umbrella-req',
        requirement_type: CoverageType.UMBRELLA,
        organization_id: 'org-1',
        project_requirements: [], // No GL coverage in project
      };

      const dependencies: RequirementDependency[] = [
        {
          id: 'dep-1',
          requirement_id: 'umbrella-req',
          depends_on_id: 'gl-req',
          dependency_type: DependencyType.REQUIRES,
          condition: null,
          notes: null,
          created_at: new Date().toISOString(),
        },
      ];

      const depRequirements = new Map([
        ['gl-req', { id: 'gl-req', name: 'General Liability $2M', type: 'general_liability' }],
      ]);

      const result = validateDependencies(input, dependencies, null, depRequirements);

      expect(result.valid).toBe(false);
      expect(result.missing_dependencies).toHaveLength(1);
      expect(result.missing_dependencies[0].required_dependency_id).toBe('gl-req');
      expect(result.missing_dependencies[0].required_dependency_name).toBe('General Liability $2M');
    });

    it('passes when required dependency is present', () => {
      const glRequirement: ProjectRequirementInfo = {
        id: 'gl-req',
        type: CoverageType.GENERAL_LIABILITY,
        name: 'General Liability $2M',
        coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
      };

      const input = {
        requirement_id: 'umbrella-req',
        requirement_type: CoverageType.UMBRELLA,
        organization_id: 'org-1',
        project_requirements: [glRequirement],
      };

      const dependencies: RequirementDependency[] = [
        {
          id: 'dep-1',
          requirement_id: 'umbrella-req',
          depends_on_id: 'gl-req',
          dependency_type: DependencyType.REQUIRES,
          condition: null,
          notes: null,
          created_at: new Date().toISOString(),
        },
      ];

      const result = validateDependencies(input, dependencies, null, new Map());

      expect(result.valid).toBe(true);
      expect(result.missing_dependencies).toHaveLength(0);
    });

    it('ignores recommended dependencies', () => {
      const input = {
        requirement_id: 'req-1',
        requirement_type: CoverageType.GENERAL_LIABILITY,
        organization_id: 'org-1',
        project_requirements: [], // No dependencies present
      };

      const dependencies: RequirementDependency[] = [
        {
          id: 'dep-1',
          requirement_id: 'req-1',
          depends_on_id: 'optional-req',
          dependency_type: DependencyType.RECOMMENDED, // Not required
          condition: null,
          notes: null,
          created_at: new Date().toISOString(),
        },
      ];

      const result = validateDependencies(input, dependencies, null, new Map());

      expect(result.valid).toBe(true);
      expect(result.missing_dependencies).toHaveLength(0);
    });
  });

  describe('validateUmbrellaUnderlying', () => {
    it('returns valid result when all underlying coverages are present and sufficient', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = [
        {
          id: 'gl-req',
          type: CoverageType.GENERAL_LIABILITY,
          name: 'General Liability',
          coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
        },
      ];

      const result = validateUmbrellaUnderlying(schedule, projectRequirements);

      expect(result.valid).toBe(true);
      expect(result.insufficient_limits).toHaveLength(0);
      expect(result.missing_underlying).toHaveLength(0);
    });

    it('detects missing underlying coverage', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = []; // No GL coverage

      const result = validateUmbrellaUnderlying(schedule, projectRequirements);

      expect(result.valid).toBe(false);
      expect(result.missing_underlying).toHaveLength(1);
      expect(result.missing_underlying[0].coverage_type).toBe(UnderlyingCoverageType.GENERAL_LIABILITY);
      expect(result.missing_underlying[0].required_limit).toBe(2_000_000);
    });

    it('detects insufficient underlying limit', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = [
        {
          id: 'gl-req',
          type: CoverageType.GENERAL_LIABILITY,
          name: 'General Liability',
          coverage_limits: { per_occurrence: 500_000, aggregate: 1_000_000 }, // Insufficient!
        },
      ];

      const result = validateUmbrellaUnderlying(schedule, projectRequirements);

      expect(result.valid).toBe(false);
      expect(result.insufficient_limits).toHaveLength(1);
      expect(result.insufficient_limits[0].coverage_type).toBe(UnderlyingCoverageType.GENERAL_LIABILITY);
      expect(result.insufficient_limits[0].required_limit).toBe(2_000_000);
      expect(result.insufficient_limits[0].actual_limit).toBe(1_000_000);
      expect(result.insufficient_limits[0].shortfall).toBe(1_000_000);
    });

    it('validates multiple underlying coverages', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
        {
          id: 'sched-2',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.AUTO_LIABILITY,
          required_minimum_limit: 1_000_000,
          attachment_point: 1_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = [
        {
          id: 'gl-req',
          type: CoverageType.GENERAL_LIABILITY,
          name: 'General Liability',
          coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
        },
        {
          id: 'auto-req',
          type: CoverageType.AUTO_LIABILITY,
          name: 'Auto Liability',
          coverage_limits: { per_occurrence: 1_000_000 },
        },
      ];

      const result = validateUmbrellaUnderlying(schedule, projectRequirements);

      expect(result.valid).toBe(true);
      expect(result.insufficient_limits).toHaveLength(0);
      expect(result.missing_underlying).toHaveLength(0);
    });

    it('detects attachment point mismatch', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 1_000_000,
          attachment_point: 2_000_000, // Attaches at $2M
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = [
        {
          id: 'gl-req',
          type: CoverageType.GENERAL_LIABILITY,
          name: 'General Liability',
          coverage_limits: { per_occurrence: 500_000, aggregate: 1_000_000 }, // Only $1M aggregate
        },
      ];

      const result = validateUmbrellaUnderlying(schedule, projectRequirements);

      expect(result.valid).toBe(false);
      // Should have attachment point error in the errors array
      expect(result.errors.some((e) => e.includes('Attachment point mismatch'))).toBe(true);
    });
  });

  describe('getEffectiveCoverageLimit', () => {
    it('returns per_occurrence limit by default', () => {
      const req: ProjectRequirementInfo = {
        id: 'req-1',
        type: CoverageType.GENERAL_LIABILITY,
        name: 'GL',
        coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
      };

      expect(getEffectiveCoverageLimit(req)).toBe(1_000_000);
    });

    it('returns aggregate limit when specified', () => {
      const req: ProjectRequirementInfo = {
        id: 'req-1',
        type: CoverageType.GENERAL_LIABILITY,
        name: 'GL',
        coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
      };

      expect(getEffectiveCoverageLimit(req, 'aggregate')).toBe(2_000_000);
    });

    it('returns null when limit not found', () => {
      const req: ProjectRequirementInfo = {
        id: 'req-1',
        type: CoverageType.GENERAL_LIABILITY,
        name: 'GL',
        coverage_limits: {},
      };

      expect(getEffectiveCoverageLimit(req)).toBeNull();
    });
  });

  describe('hasValidUmbrellaUnderlying', () => {
    it('returns true when all underlying requirements met', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 1_000_000,
          attachment_point: 1_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = [
        {
          id: 'gl-req',
          type: CoverageType.GENERAL_LIABILITY,
          name: 'GL',
          coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
        },
      ];

      expect(hasValidUmbrellaUnderlying(schedule, projectRequirements)).toBe(true);
    });

    it('returns false when underlying requirements not met', () => {
      const schedule: UmbrellaUnderlyingSchedule[] = [
        {
          id: 'sched-1',
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      const projectRequirements: ProjectRequirementInfo[] = []; // No GL

      expect(hasValidUmbrellaUnderlying(schedule, projectRequirements)).toBe(false);
    });
  });

  describe('summarizeValidationResult', () => {
    it('returns success message when valid', () => {
      const result = createEmptyValidationResult();
      expect(summarizeValidationResult(result)).toBe('All dependencies satisfied');
    });

    it('summarizes missing dependencies', () => {
      const result = createErrorValidationResult({
        missing_dependencies: [
          {
            requirement_id: 'req-1',
            required_dependency_id: 'dep-1',
            required_dependency_name: 'GL $2M',
            dependency_type: DependencyType.REQUIRES,
            message: 'Missing GL',
          },
        ],
      });

      const summary = summarizeValidationResult(result);
      expect(summary).toContain('1 missing required dependency');
    });

    it('summarizes insufficient limits with shortfall', () => {
      const result = createErrorValidationResult({
        insufficient_limits: [
          {
            coverage_type: UnderlyingCoverageType.GENERAL_LIABILITY,
            required_limit: 2_000_000,
            actual_limit: 1_000_000,
            shortfall: 1_000_000,
            message: 'Insufficient GL',
          },
        ],
      });

      const summary = summarizeValidationResult(result);
      expect(summary).toContain('1 insufficient limit');
      expect(summary).toContain('$1,000,000');
    });

    it('summarizes multiple issue types', () => {
      const result = createErrorValidationResult({
        missing_dependencies: [
          {
            requirement_id: 'req-1',
            required_dependency_id: 'dep-1',
            required_dependency_name: 'GL',
            dependency_type: DependencyType.REQUIRES,
            message: 'Missing',
          },
        ],
        missing_underlying: [
          {
            coverage_type: UnderlyingCoverageType.AUTO_LIABILITY,
            required_limit: 1_000_000,
            message: 'Missing Auto',
          },
        ],
      });

      const summary = summarizeValidationResult(result);
      expect(summary).toContain('1 missing required dependency');
      expect(summary).toContain('1 missing underlying coverage');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1_000_000)).toBe('$1,000,000');
      expect(formatCurrency(2_500_000)).toBe('$2,500,000');
      expect(formatCurrency(500_000)).toBe('$500,000');
    });
  });

  describe('formatCoverageType', () => {
    it('formats coverage types for display', () => {
      expect(formatCoverageType(UnderlyingCoverageType.GENERAL_LIABILITY)).toBe('General Liability');
      expect(formatCoverageType(UnderlyingCoverageType.AUTO_LIABILITY)).toBe('Auto Liability');
      expect(formatCoverageType(UnderlyingCoverageType.EMPLOYERS_LIABILITY)).toBe("Employer's Liability");
    });
  });
});
