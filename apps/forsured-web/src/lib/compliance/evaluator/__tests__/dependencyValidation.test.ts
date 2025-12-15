/**
 * REQ-2, TASK-6: Dependency Validation Tests
 * Tests for dependency validation integration with evaluation engine
 */

import { describe, expect, it } from 'vitest';
import {
  validateRequirementDependencies,
  createDependencyContext,
  createEmptyDependencyContext,
} from '../dependencyValidation';
import {
  GapType,
  GapSeverity,
  DEFAULT_SCORE_DEDUCTIONS,
  DependencyInfo,
  UmbrellaScheduleInfo,
  RequirementInfoForEvaluation,
} from '../types';
import { ComplianceRequirement, CoverageType, RequirementStatus } from '../../types';

// Helper to create a mock compliance requirement
function createMockRequirement(
  id: string,
  type: CoverageType,
  name: string,
  coverageLimits: { per_occurrence?: number; aggregate?: number } = {}
): ComplianceRequirement {
  return {
    id,
    name,
    type,
    description: `Mock ${name} requirement`,
    status: RequirementStatus.ACTIVE,
    is_template: false,
    created_by: 'test-user',
    organization_id: 'org-1',
    requirement_definition: {
      coverage_limits: coverageLimits,
      required_endorsements: [],
      policy_conditions: [],
      documentation_requirements: [],
    },
    version: 1,
    parent_requirement_id: null,
    effective_date: new Date().toISOString(),
    superseded_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  };
}

describe('dependencyValidation', () => {
  describe('validateRequirementDependencies', () => {
    it('returns empty array when no dependency context provided', () => {
      const requirements = [
        createMockRequirement('req-1', CoverageType.GENERAL_LIABILITY, 'GL $2M'),
      ];

      const gaps = validateRequirementDependencies(requirements, null);

      expect(gaps).toHaveLength(0);
    });

    it('returns empty array when dependency context has no dependencies', () => {
      const requirements = [
        createMockRequirement('req-1', CoverageType.GENERAL_LIABILITY, 'GL $2M'),
      ];

      const context = createEmptyDependencyContext();
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(0);
    });

    it('creates gap for missing required dependency', () => {
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const requirements = [umbrellaReq]; // Only umbrella, no GL

      const dependencies: DependencyInfo[] = [
        {
          requirement_id: 'umbrella-req',
          depends_on_id: 'gl-req',
          dependency_type: 'requires',
        },
      ];

      const reqInfo: RequirementInfoForEvaluation[] = [
        { id: 'gl-req', name: 'General Liability $2M', type: 'general_liability' },
      ];

      const context = createDependencyContext(dependencies, [], reqInfo);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].type).toBe(GapType.MISSING_DEPENDENCY);
      expect(gaps[0].severity).toBe(GapSeverity.CRITICAL);
      expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.MISSING_DEPENDENCY);
      expect(gaps[0].remediation).toContain('General Liability $2M');
    });

    it('creates gap for missing underlying coverage (umbrella)', () => {
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const requirements = [umbrellaReq]; // Only umbrella, no GL

      const umbrellaSchedules: UmbrellaScheduleInfo[] = [
        {
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
        },
      ];

      const context = createDependencyContext([], umbrellaSchedules, []);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].type).toBe(GapType.MISSING_UNDERLYING_COVERAGE);
      expect(gaps[0].severity).toBe(GapSeverity.CRITICAL);
      expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.MISSING_UNDERLYING_COVERAGE);
      expect(gaps[0].required_value).toBe('$2,000,000');
      expect(gaps[0].remediation).toContain('General Liability');
    });

    it('creates gap for insufficient underlying limit', () => {
      const glReq = createMockRequirement('gl-req', CoverageType.GENERAL_LIABILITY, 'GL $1M', {
        per_occurrence: 500_000,
        aggregate: 1_000_000,
      });
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const requirements = [glReq, umbrellaReq];

      const umbrellaSchedules: UmbrellaScheduleInfo[] = [
        {
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
        },
      ];

      const context = createDependencyContext([], umbrellaSchedules, []);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].type).toBe(GapType.INSUFFICIENT_UNDERLYING_LIMIT);
      expect(gaps[0].severity).toBe(GapSeverity.WARNING);
      expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_UNDERLYING_LIMIT);
      expect(gaps[0].required_value).toBe('$2,000,000');
      expect(gaps[0].current_value).toBe('$1,000,000');
      expect(gaps[0].remediation).toContain('shortfall');
    });

    it('passes when all dependencies are satisfied', () => {
      const glReq = createMockRequirement('gl-req', CoverageType.GENERAL_LIABILITY, 'GL $2M', {
        per_occurrence: 1_000_000,
        aggregate: 2_000_000,
      });
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const requirements = [glReq, umbrellaReq];

      const dependencies: DependencyInfo[] = [
        {
          requirement_id: 'umbrella-req',
          depends_on_id: 'gl-req',
          dependency_type: 'requires',
        },
      ];

      const umbrellaSchedules: UmbrellaScheduleInfo[] = [
        {
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
        },
      ];

      const reqInfo: RequirementInfoForEvaluation[] = [
        { id: 'gl-req', name: 'GL $2M', type: 'general_liability' },
      ];

      const context = createDependencyContext(dependencies, umbrellaSchedules, reqInfo);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(0);
    });

    it('ignores recommended dependencies', () => {
      const glReq = createMockRequirement('gl-req', CoverageType.GENERAL_LIABILITY, 'GL $2M');
      const requirements = [glReq]; // No cyber coverage

      const dependencies: DependencyInfo[] = [
        {
          requirement_id: 'gl-req',
          depends_on_id: 'cyber-req',
          dependency_type: 'recommended', // Not required
        },
      ];

      const context = createDependencyContext(dependencies, [], []);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(0);
    });

    it('handles multiple missing dependencies', () => {
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const requirements = [umbrellaReq]; // Only umbrella, missing GL and Auto

      const dependencies: DependencyInfo[] = [
        {
          requirement_id: 'umbrella-req',
          depends_on_id: 'gl-req',
          dependency_type: 'requires',
        },
        {
          requirement_id: 'umbrella-req',
          depends_on_id: 'auto-req',
          dependency_type: 'requires',
        },
      ];

      const reqInfo: RequirementInfoForEvaluation[] = [
        { id: 'gl-req', name: 'General Liability $2M', type: 'general_liability' },
        { id: 'auto-req', name: 'Auto Liability $1M', type: 'auto_liability' },
      ];

      const context = createDependencyContext(dependencies, [], reqInfo);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(2);
      expect(gaps.every(g => g.type === GapType.MISSING_DEPENDENCY)).toBe(true);
      expect(gaps.every(g => g.severity === GapSeverity.CRITICAL)).toBe(true);
    });

    it('handles multiple underlying coverage issues', () => {
      const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');
      const glReq = createMockRequirement('gl-req', CoverageType.GENERAL_LIABILITY, 'GL $1M', {
        per_occurrence: 500_000,
        aggregate: 1_000_000,
      });
      const requirements = [umbrellaReq, glReq]; // Has GL but insufficient, missing Auto

      const umbrellaSchedules: UmbrellaScheduleInfo[] = [
        {
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
        },
        {
          umbrella_requirement_id: 'umbrella-req',
          underlying_coverage_type: 'auto_liability',
          required_minimum_limit: 1_000_000,
          attachment_point: 1_000_000,
        },
      ];

      const context = createDependencyContext([], umbrellaSchedules, []);
      const gaps = validateRequirementDependencies(requirements, context);

      expect(gaps).toHaveLength(2);
      // One insufficient limit for GL
      expect(gaps.filter(g => g.type === GapType.INSUFFICIENT_UNDERLYING_LIMIT)).toHaveLength(1);
      // One missing for Auto
      expect(gaps.filter(g => g.type === GapType.MISSING_UNDERLYING_COVERAGE)).toHaveLength(1);
    });
  });

  describe('createDependencyContext', () => {
    it('creates context with all provided data', () => {
      const dependencies: DependencyInfo[] = [
        { requirement_id: 'req-1', depends_on_id: 'req-2', dependency_type: 'requires' },
      ];
      const schedules: UmbrellaScheduleInfo[] = [
        {
          umbrella_requirement_id: 'req-1',
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 2_000_000,
          attachment_point: 2_000_000,
        },
      ];
      const reqInfo: RequirementInfoForEvaluation[] = [
        { id: 'req-1', name: 'Req 1', type: 'umbrella' },
        { id: 'req-2', name: 'Req 2', type: 'general_liability' },
      ];

      const context = createDependencyContext(dependencies, schedules, reqInfo);

      expect(context.dependencies).toHaveLength(1);
      expect(context.umbrella_schedules).toHaveLength(1);
      expect(context.requirement_info.size).toBe(2);
      expect(context.requirement_info.get('req-1')?.name).toBe('Req 1');
    });
  });

  describe('createEmptyDependencyContext', () => {
    it('creates context with empty collections', () => {
      const context = createEmptyDependencyContext();

      expect(context.dependencies).toHaveLength(0);
      expect(context.umbrella_schedules).toHaveLength(0);
      expect(context.requirement_info.size).toBe(0);
    });
  });
});

describe('Evaluation Engine with Dependency Context', () => {
  it('runs dependency validation as first rule', async () => {
    // Import the engine
    const { ComplianceEvaluationEngine } = await import('../evaluationEngine');
    const engine = new ComplianceEvaluationEngine();

    const glReq = createMockRequirement('gl-req', CoverageType.GENERAL_LIABILITY, 'GL $2M', {
      per_occurrence: 1_000_000,
      aggregate: 2_000_000,
    });

    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 30);

    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 120);

    const projectStart = new Date().toISOString().split('T')[0];
    const projectEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await engine.evaluate(
      {
        project_id: 'project-1',
        extracted_data: {
          effective_date: policyEffective.toISOString().split('T')[0],
          expiration_date: policyExpiration.toISOString().split('T')[0],
          coverage_types: [
            {
              type: CoverageType.GENERAL_LIABILITY,
              per_occurrence_limit: 1_000_000,
              aggregate_limit: 2_000_000,
            },
          ],
          endorsements: [],
        },
      },
      [glReq],
      projectStart,
      projectEnd,
      createEmptyDependencyContext()
    );

    // Dependency validation should be the first rule applied
    expect(result.rules_applied[0].rule_id).toBe('dependency-validation');
  });

  it('deducts points for dependency gaps', async () => {
    const { ComplianceEvaluationEngine } = await import('../evaluationEngine');
    const engine = new ComplianceEvaluationEngine();

    const umbrellaReq = createMockRequirement('umbrella-req', CoverageType.UMBRELLA, 'Umbrella $5M');

    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 30);

    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 120);

    const projectStart = new Date().toISOString().split('T')[0];
    const projectEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const umbrellaSchedules: UmbrellaScheduleInfo[] = [
      {
        umbrella_requirement_id: 'umbrella-req',
        underlying_coverage_type: 'general_liability',
        required_minimum_limit: 2_000_000,
        attachment_point: 2_000_000,
      },
    ];

    const context = createDependencyContext([], umbrellaSchedules, []);

    const result = await engine.evaluate(
      {
        project_id: 'project-1',
        extracted_data: {
          effective_date: policyEffective.toISOString().split('T')[0],
          expiration_date: policyExpiration.toISOString().split('T')[0],
          coverage_types: [
            {
              type: CoverageType.UMBRELLA,
              per_occurrence_limit: 5_000_000,
              aggregate_limit: 5_000_000,
            },
          ],
          endorsements: [],
        },
      },
      [umbrellaReq],
      projectStart,
      projectEnd,
      context
    );

    // Should have deducted 25 points for missing underlying coverage
    expect(result.score).toBeLessThanOrEqual(100 - DEFAULT_SCORE_DEDUCTIONS.MISSING_UNDERLYING_COVERAGE);
    expect(result.gaps.some(g => g.type === GapType.MISSING_UNDERLYING_COVERAGE)).toBe(true);
  });
});
