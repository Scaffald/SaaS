/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Integration tests for the main evaluation engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceEvaluationEngine } from '../evaluationEngine';
import { ComplianceRequirement, CoverageType, RequirementStatus } from '../../types';
import { EvaluationRequest, ComplianceStatus, ExtractedPolicyData } from '../types';

describe('ComplianceEvaluationEngine', () => {
  let engine: ComplianceEvaluationEngine;
  let mockRequirements: ComplianceRequirement[];
  let projectStartDate: string;
  let projectEndDate: string;

  beforeEach(() => {
    engine = new ComplianceEvaluationEngine();

    // Set up project dates (future dates)
    const start = new Date();
    start.setDate(start.getDate() + 10);
    projectStartDate = start.toISOString().split('T')[0];

    const end = new Date();
    end.setDate(end.getDate() + 100);
    projectEndDate = end.toISOString().split('T')[0];

    // Set up mock requirements
    mockRequirements = [
      {
        id: 'req-gl',
        name: 'General Liability Requirement',
        type: CoverageType.GENERAL_LIABILITY,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: 'test-user',
        organization_id: 'org-1',
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000
          },
          required_endorsements: [
            {
              endorsement_type: 'additional_insured',
              description: 'Additional Insured'
            },
            {
              endorsement_type: 'waiver_of_subrogation',
              description: 'Waiver of Subrogation'
            }
          ],
          policy_conditions: [],
          documentation_requirements: []
        },
        version: 1,
        parent_requirement_id: null,
        effective_date: '2024-01-01',
        superseded_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        archived_at: null
      },
      {
        id: 'req-wc',
        name: 'Workers Compensation Requirement',
        type: CoverageType.WORKERS_COMP,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: 'test-user',
        organization_id: 'org-1',
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000
          },
          required_endorsements: [
            {
              endorsement_type: 'waiver_of_subrogation',
              description: 'Waiver of Subrogation'
            }
          ],
          policy_conditions: [],
          documentation_requirements: []
        },
        version: 1,
        parent_requirement_id: null,
        effective_date: '2024-01-01',
        superseded_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        archived_at: null
      }
    ];
  });

  describe('evaluate - Full Compliance', () => {
    it('returns 100 score for fully compliant policy', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        policy_number: 'POL-12345',
        carrier: 'Test Insurance Co',
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000
          }
        ],
        endorsements: [
          'additional_insured',
          'waiver_of_subrogation'
        ]
      };

      const request: EvaluationRequest = {
        policy_id: 'policy-1',
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(100);
      expect(result.status).toBe(ComplianceStatus.COMPLIANT);
      expect(result.gaps).toHaveLength(0);
      expect(result.policy_id).toBe('policy-1');
      expect(result.project_id).toBe('project-1');
    });
  });

  describe('evaluate - Missing Coverage', () => {
    it('deducts 20 points for missing coverage type', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          }
          // Missing Workers Comp
        ],
        endorsements: [
          'additional_insured',
          'waiver_of_subrogation'
        ]
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(80); // 100 - 20 for missing coverage
      expect(result.status).toBe(ComplianceStatus.WARNING);
      expect(result.gaps.length).toBeGreaterThan(0);

      const missingCoverage = result.gaps.find(g => g.type === 'missing_coverage');
      expect(missingCoverage).toBeDefined();
      expect(missingCoverage?.coverage_type).toBe(CoverageType.WORKERS_COMP);
    });
  });

  describe('evaluate - Insufficient Limits', () => {
    it('deducts 10 points for insufficient coverage amount', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000, // Insufficient (requires 1M)
            aggregate_limit: 2000000
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000
          }
        ],
        endorsements: [
          'additional_insured',
          'waiver_of_subrogation'
        ]
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(90); // 100 - 10 for insufficient amount
      expect(result.status).toBe(ComplianceStatus.COMPLIANT);

      const insufficientGap = result.gaps.find(g => g.type === 'insufficient_amount');
      expect(insufficientGap).toBeDefined();
      expect(insufficientGap?.current_value).toBe(500000);
      expect(insufficientGap?.required_value).toBe(1000000);
    });
  });

  describe('evaluate - Missing Endorsements', () => {
    it('deducts 15 points per missing endorsement', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000
          }
        ],
        endorsements: [
          'additional_insured'
          // Missing waiver_of_subrogation
        ]
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(85); // 100 - 15 for missing endorsement
      expect(result.status).toBe(ComplianceStatus.WARNING);

      const missingEndorsement = result.gaps.find(g => g.type === 'missing_endorsement');
      expect(missingEndorsement).toBeDefined();
      expect(missingEndorsement?.endorsement).toBe('waiver_of_subrogation');
    });
  });

  describe('evaluate - Expired Policy', () => {
    it('deducts 50 points for expired policy', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 90);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() - 10); // Expired

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000
          }
        ],
        endorsements: [
          'additional_insured',
          'waiver_of_subrogation'
        ]
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(50); // 100 - 50 for expired
      expect(result.status).toBe(ComplianceStatus.CRITICAL);

      const expiredGap = result.gaps.find(g => g.type === 'expired_policy');
      expect(expiredGap).toBeDefined();
    });
  });

  describe('evaluate - Multiple Issues', () => {
    it('combines all deductions correctly', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000, // Insufficient (-10)
            aggregate_limit: 2000000
          }
          // Missing Workers Comp (-20)
        ],
        endorsements: [
          'additional_insured'
          // Missing waiver_of_subrogation (-15)
        ]
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.score).toBe(55); // 100 - 10 - 20 - 15
      expect(result.status).toBe(ComplianceStatus.CRITICAL);
      expect(result.gaps.length).toBe(3);
    });
  });

  describe('evaluate - Metadata', () => {
    it('includes evaluation metadata', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          }
        ],
        endorsements: ['additional_insured']
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.rule_engine_version).toBe('1.0.0');
      expect(result.metadata.evaluation_duration_ms).toBeGreaterThan(0);
      expect(result.metadata.total_requirements_checked).toBe(2);
      expect(result.metadata.coverage_types_evaluated).toContain(CoverageType.GENERAL_LIABILITY);
    });

    it('completes evaluation in under 5 seconds (performance requirement)', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          }
        ],
        endorsements: ['additional_insured']
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      // Performance requirement: <5000ms (5 seconds)
      expect(result.metadata.evaluation_duration_ms).toBeLessThan(5000);
    });
  });

  describe('evaluate - Rules Applied', () => {
    it('records all rules applied', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const policyData: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          }
        ],
        endorsements: ['additional_insured']
      };

      const request: EvaluationRequest = {
        project_id: 'project-1',
        extracted_data: policyData
      };

      const result = await engine.evaluate(
        request,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.rules_applied).toHaveLength(3);
      expect(result.rules_applied.some(r => r.rule_id === 'coverage-validation')).toBe(true);
      expect(result.rules_applied.some(r => r.rule_id === 'date-validation')).toBe(true);
      expect(result.rules_applied.some(r => r.rule_id === 'endorsement-validation')).toBe(true);
    });
  });

  describe('evaluateBatch', () => {
    it('evaluates multiple policies and returns summary', async () => {
      const policyEffective = new Date();
      policyEffective.setDate(policyEffective.getDate() - 30);

      const policyExpiration = new Date();
      policyExpiration.setDate(policyExpiration.getDate() + 120);

      const compliantPolicy: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000
          }
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation']
      };

      const noncompliantPolicy: ExtractedPolicyData = {
        effective_date: policyEffective.toISOString().split('T')[0],
        expiration_date: policyExpiration.toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000, // Insufficient
            aggregate_limit: 2000000
          }
        ],
        endorsements: []
      };

      const batchRequest = {
        project_id: 'project-1',
        evaluations: [
          { policy_id: 'policy-1', extracted_data: compliantPolicy },
          { policy_id: 'policy-2', extracted_data: noncompliantPolicy }
        ]
      };

      const result = await engine.evaluateBatch(
        batchRequest,
        mockRequirements,
        projectStartDate,
        projectEndDate
      );

      expect(result.results).toHaveLength(2);
      expect(result.summary.total_evaluated).toBe(2);
      expect(result.summary.compliant).toBe(1);
      expect(result.summary.critical).toBe(1);
    });
  });
});
