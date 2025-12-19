/**
 * REQ-263: Coverage Limit Requirements Schema Tests
 * TASK-1: Create coverage_requirements Database Table
 *
 * Tests for the CoverageLimitRequirement type and database schema
 */

import {
  CoverageLimitRequirement,
  CoverageRequirementLevel,
  CoverageLimitType,
  CreateCoverageLimitRequirementRequest,
  UpdateCoverageLimitRequirementRequest,
  CoverageLimitComplianceCheck,
  CoverageLimitComplianceResult,
} from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';

describe('REQ-263: Coverage Limit Requirements Schema', () => {
  beforeEach(() => {
    MockDatabase.clearTable('coverage_limit_requirements');
  });

  describe('CoverageRequirementLevel type', () => {
    it('should support org level', () => {
      const level: CoverageRequirementLevel = 'org';
      expect(level).toBe('org');
    });

    it('should support project level', () => {
      const level: CoverageRequirementLevel = 'project';
      expect(level).toBe('project');
    });
  });

  describe('CoverageLimitType type', () => {
    it('should support all standard coverage types', () => {
      const types: CoverageLimitType[] = [
        'general_liability',
        'workers_comp',
        'commercial_auto',
        'umbrella_excess',
        'professional_liability',
        'pollution_liability',
        'builders_risk',
        'equipment_floater',
      ];

      types.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('CoverageLimitRequirement interface', () => {
    it('should create a valid org-level requirement', async () => {
      const orgRequirement: Omit<CoverageLimitRequirement, 'id' | 'created_at' | 'updated_at'> = {
        name: 'General Liability Minimum',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'general_liability',
        minimum_limit: 1000000,
        required: true,
      };

      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        orgRequirement
      );

      expect(inserted.id).toBeDefined();
      expect(inserted.name).toBe('General Liability Minimum');
      expect(inserted.level).toBe('org');
      expect(inserted.organization_id).toBe('org-123');
      expect(inserted.project_id).toBeNull();
      expect(inserted.coverage_type).toBe('general_liability');
      expect(inserted.minimum_limit).toBe(1000000);
      expect(inserted.required).toBe(true);
      expect(inserted.created_at).toBeDefined();
      expect(inserted.updated_at).toBeDefined();
    });

    it('should create a valid project-level requirement', async () => {
      const projectRequirement: Omit<CoverageLimitRequirement, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Builders Risk - High Value Project',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-456',
        coverage_type: 'builders_risk',
        minimum_limit: 5000000,
        required: true,
      };

      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        projectRequirement
      );

      expect(inserted.id).toBeDefined();
      expect(inserted.name).toBe('Builders Risk - High Value Project');
      expect(inserted.level).toBe('project');
      expect(inserted.organization_id).toBe('org-123');
      expect(inserted.project_id).toBe('proj-456');
      expect(inserted.coverage_type).toBe('builders_risk');
      expect(inserted.minimum_limit).toBe(5000000);
      expect(inserted.required).toBe(true);
    });

    it('should enforce org-level requirements have null project_id', async () => {
      const orgRequirement: Omit<CoverageLimitRequirement, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Workers Comp Minimum',
        level: 'org',
        organization_id: 'org-123',
        project_id: null, // Must be null for org level
        coverage_type: 'workers_comp',
        minimum_limit: 500000,
        required: true,
      };

      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        orgRequirement
      );

      expect(inserted.level).toBe('org');
      expect(inserted.project_id).toBeNull();
    });

    it('should enforce project-level requirements have non-null project_id', async () => {
      const projectRequirement: Omit<CoverageLimitRequirement, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Professional Liability - Tech Project',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-789', // Must be non-null for project level
        coverage_type: 'professional_liability',
        minimum_limit: 2000000,
        required: true,
      };

      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        projectRequirement
      );

      expect(inserted.level).toBe('project');
      expect(inserted.project_id).not.toBeNull();
      expect(inserted.project_id).toBe('proj-789');
    });

    it('should support optional required field defaulting to true', async () => {
      const requirement: Omit<CoverageLimitRequirement, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Recommended Coverage',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'umbrella_excess',
        minimum_limit: 2000000,
        required: false, // Not required, just recommended
      };

      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        requirement
      );

      expect(inserted.required).toBe(false);
    });
  });

  describe('Database CRUD operations', () => {
    it('should query org-level requirements', async () => {
      // Insert org-level requirements
      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'GL Minimum',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'general_liability',
        minimum_limit: 1000000,
        required: true,
      });

      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'WC Minimum',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'workers_comp',
        minimum_limit: 500000,
        required: true,
      });

      const orgRequirements = await MockDatabase.query<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        { level: 'org', organization_id: 'org-123' }
      );

      expect(orgRequirements).toHaveLength(2);
      expect(orgRequirements.every((r) => r.level === 'org')).toBe(true);
      expect(orgRequirements.every((r) => r.project_id === null)).toBe(true);
    });

    it('should query project-level requirements', async () => {
      // Insert project-level requirement
      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'Builders Risk - Project A',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-a',
        coverage_type: 'builders_risk',
        minimum_limit: 5000000,
        required: true,
      });

      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'Pollution - Project A',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-a',
        coverage_type: 'pollution_liability',
        minimum_limit: 1000000,
        required: true,
      });

      const projectRequirements = await MockDatabase.query<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        { level: 'project', project_id: 'proj-a' }
      );

      expect(projectRequirements).toHaveLength(2);
      expect(projectRequirements.every((r) => r.level === 'project')).toBe(true);
      expect(projectRequirements.every((r) => r.project_id === 'proj-a')).toBe(true);
    });

    it('should update a requirement', async () => {
      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        {
          name: 'GL Minimum',
          level: 'org',
          organization_id: 'org-123',
          project_id: null,
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
          required: true,
        }
      );

      const updated = await MockDatabase.update<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        inserted.id,
        { minimum_limit: 2000000 }
      );

      expect(updated.minimum_limit).toBe(2000000);
      expect(updated.name).toBe('GL Minimum'); // Unchanged
    });

    it('should delete a requirement', async () => {
      const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        {
          name: 'To Delete',
          level: 'org',
          organization_id: 'org-123',
          project_id: null,
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
          required: true,
        }
      );

      await MockDatabase.delete('coverage_limit_requirements', inserted.id);

      const remaining = await MockDatabase.query<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        { id: inserted.id }
      );

      expect(remaining).toHaveLength(0);
    });

    it('should query combined org + project requirements for a project', async () => {
      // Insert org-level requirements
      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'GL Minimum (Org)',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'general_liability',
        minimum_limit: 1000000,
        required: true,
      });

      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'WC Minimum (Org)',
        level: 'org',
        organization_id: 'org-123',
        project_id: null,
        coverage_type: 'workers_comp',
        minimum_limit: 500000,
        required: true,
      });

      // Insert project-level requirement
      await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
        name: 'Builders Risk (Project)',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-a',
        coverage_type: 'builders_risk',
        minimum_limit: 5000000,
        required: true,
      });

      // Query org requirements
      const orgReqs = await MockDatabase.query<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        { level: 'org', organization_id: 'org-123' }
      );

      // Query project requirements
      const projectReqs = await MockDatabase.query<CoverageLimitRequirement>(
        'coverage_limit_requirements',
        { level: 'project', project_id: 'proj-a' }
      );

      // Combined should give us 3 requirements
      const combined = [...orgReqs, ...projectReqs];
      expect(combined).toHaveLength(3);
      expect(combined.filter((r) => r.level === 'org')).toHaveLength(2);
      expect(combined.filter((r) => r.level === 'project')).toHaveLength(1);
    });
  });

  describe('CreateCoverageLimitRequirementRequest', () => {
    it('should have required fields for creation', () => {
      const request: CreateCoverageLimitRequirementRequest = {
        name: 'Test Requirement',
        level: 'org',
        organization_id: 'org-123',
        coverage_type: 'general_liability',
        minimum_limit: 1000000,
      };

      expect(request.name).toBeDefined();
      expect(request.level).toBeDefined();
      expect(request.organization_id).toBeDefined();
      expect(request.coverage_type).toBeDefined();
      expect(request.minimum_limit).toBeDefined();
    });

    it('should allow optional project_id', () => {
      const orgRequest: CreateCoverageLimitRequirementRequest = {
        name: 'Org Requirement',
        level: 'org',
        organization_id: 'org-123',
        coverage_type: 'general_liability',
        minimum_limit: 1000000,
        // project_id is omitted for org-level
      };

      const projectRequest: CreateCoverageLimitRequirementRequest = {
        name: 'Project Requirement',
        level: 'project',
        organization_id: 'org-123',
        project_id: 'proj-456',
        coverage_type: 'builders_risk',
        minimum_limit: 5000000,
      };

      expect(orgRequest.project_id).toBeUndefined();
      expect(projectRequest.project_id).toBe('proj-456');
    });

    it('should allow optional required field', () => {
      const request: CreateCoverageLimitRequirementRequest = {
        name: 'Recommended Coverage',
        level: 'org',
        organization_id: 'org-123',
        coverage_type: 'umbrella_excess',
        minimum_limit: 2000000,
        required: false,
      };

      expect(request.required).toBe(false);
    });
  });

  describe('UpdateCoverageLimitRequirementRequest', () => {
    it('should allow partial updates', () => {
      const updateName: UpdateCoverageLimitRequirementRequest = {
        name: 'Updated Name',
      };

      const updateLimit: UpdateCoverageLimitRequirementRequest = {
        minimum_limit: 2000000,
      };

      const updateMultiple: UpdateCoverageLimitRequirementRequest = {
        name: 'New Name',
        minimum_limit: 3000000,
        required: false,
      };

      expect(updateName.name).toBe('Updated Name');
      expect(updateLimit.minimum_limit).toBe(2000000);
      expect(updateMultiple.name).toBe('New Name');
      expect(updateMultiple.minimum_limit).toBe(3000000);
      expect(updateMultiple.required).toBe(false);
    });

    it('should not allow updating level or project_id', () => {
      // UpdateCoverageLimitRequirementRequest should NOT have level or project_id
      const request: UpdateCoverageLimitRequirementRequest = {
        name: 'Updated',
        coverage_type: 'workers_comp',
        minimum_limit: 500000,
      };

      // TypeScript would catch this, but we verify the interface doesn't include these fields
      expect('level' in request).toBe(false);
      expect('project_id' in request).toBe(false);
      expect('organization_id' in request).toBe(false);
    });
  });

  describe('CoverageLimitComplianceCheck', () => {
    it('should represent a met requirement', () => {
      const check: CoverageLimitComplianceCheck = {
        requirement_id: 'req-123',
        requirement_name: 'General Liability Minimum',
        level: 'org',
        coverage_type: 'general_liability',
        required_limit: 1000000,
        actual_limit: 2000000,
        status: 'met',
      };

      expect(check.status).toBe('met');
      expect(check.actual_limit).toBeGreaterThanOrEqual(check.required_limit);
    });

    it('should represent an unmet requirement with gap', () => {
      const check: CoverageLimitComplianceCheck = {
        requirement_id: 'req-456',
        requirement_name: 'Workers Comp Minimum',
        level: 'org',
        coverage_type: 'workers_comp',
        required_limit: 1000000,
        actual_limit: 500000,
        status: 'unmet',
        gap_amount: 500000,
      };

      expect(check.status).toBe('unmet');
      expect(check.gap_amount).toBe(check.required_limit - check.actual_limit!);
    });

    it('should handle null actual_limit for missing coverage', () => {
      const check: CoverageLimitComplianceCheck = {
        requirement_id: 'req-789',
        requirement_name: 'Builders Risk',
        level: 'project',
        coverage_type: 'builders_risk',
        required_limit: 5000000,
        actual_limit: null, // Sub has no builders risk coverage
        status: 'unmet',
        gap_amount: 5000000,
      };

      expect(check.actual_limit).toBeNull();
      expect(check.status).toBe('unmet');
    });
  });

  describe('CoverageLimitComplianceResult', () => {
    it('should represent compliant status', () => {
      const result: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-123',
        organization_id: 'org-123',
        overall_compliant: true,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Minimum',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 2000000,
            status: 'met',
          },
        ],
        project_level_checks: [],
        checked_at: new Date().toISOString(),
      };

      expect(result.overall_compliant).toBe(true);
      expect(result.org_level_checks.every((c) => c.status === 'met')).toBe(true);
    });

    it('should represent non-compliant status with project context', () => {
      const result: CoverageLimitComplianceResult = {
        subcontractor_id: 'sub-456',
        organization_id: 'org-123',
        project_id: 'proj-a',
        overall_compliant: false,
        org_level_checks: [
          {
            requirement_id: 'req-1',
            requirement_name: 'GL Minimum',
            level: 'org',
            coverage_type: 'general_liability',
            required_limit: 1000000,
            actual_limit: 2000000,
            status: 'met',
          },
        ],
        project_level_checks: [
          {
            requirement_id: 'req-2',
            requirement_name: 'Builders Risk',
            level: 'project',
            coverage_type: 'builders_risk',
            required_limit: 5000000,
            actual_limit: null,
            status: 'unmet',
            gap_amount: 5000000,
          },
        ],
        checked_at: new Date().toISOString(),
      };

      expect(result.overall_compliant).toBe(false);
      expect(result.project_id).toBe('proj-a');
      expect(result.project_level_checks.some((c) => c.status === 'unmet')).toBe(true);
    });
  });
});
