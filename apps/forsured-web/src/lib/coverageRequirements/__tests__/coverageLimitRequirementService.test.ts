/**
 * REQ-263: Coverage Limit Requirements Service Tests
 * TASK-2: Build API Endpoints for Coverage Requirements Management
 *
 * Tests for the coverage limit requirement CRUD operations and authorization.
 */

import {
  getCoverageLimitRequirements,
  getCoverageLimitRequirementById,
  createCoverageLimitRequirement,
  updateCoverageLimitRequirement,
  deleteCoverageLimitRequirement,
  getOrgLevelRequirements,
  getProjectLevelRequirements,
  isAdmin,
  canManageOrgLevel,
  canManageProjectLevel,
  validateLevel,
  validateCoverageType,
  validateMinimumLimit,
  validateLevelProjectIdConsistency,
  validateCreateInput,
  validateUpdateInput,
  UserContext,
  VALID_LEVELS,
  VALID_COVERAGE_TYPES,
} from '../coverageLimitRequirementService';
import { CoverageLimitRequirement, CreateCoverageLimitRequirementRequest } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';

describe('REQ-263: Coverage Limit Requirements Service', () => {
  const adminUser: UserContext = {
    id: 'admin-1',
    role: 'admin',
    organization_id: 'org-123',
  };

  const projectManagerUser: UserContext = {
    id: 'pm-1',
    role: 'project_manager',
    organization_id: 'org-123',
    project_ids: ['proj-a', 'proj-b'],
  };

  const subcontractorUser: UserContext = {
    id: 'sub-1',
    role: 'subcontractor',
    organization_id: 'org-456',
  };

  beforeEach(() => {
    MockDatabase.clearTable('coverage_limit_requirements');
  });

  describe('Authorization utilities', () => {
    describe('isAdmin', () => {
      it('should return true for admin role', () => {
        expect(isAdmin(adminUser)).toBe(true);
      });

      it('should return false for non-admin roles', () => {
        expect(isAdmin(projectManagerUser)).toBe(false);
        expect(isAdmin(subcontractorUser)).toBe(false);
      });
    });

    describe('canManageOrgLevel', () => {
      it('should return true only for admin', () => {
        expect(canManageOrgLevel(adminUser)).toBe(true);
        expect(canManageOrgLevel(projectManagerUser)).toBe(false);
        expect(canManageOrgLevel(subcontractorUser)).toBe(false);
      });
    });

    describe('canManageProjectLevel', () => {
      it('should return true for admin regardless of project', () => {
        expect(canManageProjectLevel(adminUser, 'any-project')).toBe(true);
      });

      it('should return true for project manager with access to project', () => {
        expect(canManageProjectLevel(projectManagerUser, 'proj-a')).toBe(true);
        expect(canManageProjectLevel(projectManagerUser, 'proj-b')).toBe(true);
      });

      it('should return false for project manager without access', () => {
        expect(canManageProjectLevel(projectManagerUser, 'proj-c')).toBe(false);
      });

      it('should return false for subcontractor', () => {
        expect(canManageProjectLevel(subcontractorUser, 'proj-a')).toBe(false);
      });
    });
  });

  describe('Validation utilities', () => {
    describe('validateLevel', () => {
      it('should accept valid levels', () => {
        expect(validateLevel('org')).toBeUndefined();
        expect(validateLevel('project')).toBeUndefined();
      });

      it('should reject invalid levels', () => {
        const error = validateLevel('invalid');
        expect(error).toBeDefined();
        expect(error?.field).toBe('level');
      });
    });

    describe('validateCoverageType', () => {
      it('should accept valid coverage types', () => {
        VALID_COVERAGE_TYPES.forEach((type) => {
          expect(validateCoverageType(type)).toBeUndefined();
        });
      });

      it('should reject invalid coverage types', () => {
        const error = validateCoverageType('invalid_type');
        expect(error).toBeDefined();
        expect(error?.field).toBe('coverage_type');
      });
    });

    describe('validateMinimumLimit', () => {
      it('should accept non-negative numbers', () => {
        expect(validateMinimumLimit(0)).toBeUndefined();
        expect(validateMinimumLimit(1000000)).toBeUndefined();
        expect(validateMinimumLimit(0.01)).toBeUndefined();
      });

      it('should reject negative numbers', () => {
        const error = validateMinimumLimit(-100);
        expect(error).toBeDefined();
        expect(error?.field).toBe('minimum_limit');
      });
    });

    describe('validateLevelProjectIdConsistency', () => {
      it('should accept org level without project_id', () => {
        expect(validateLevelProjectIdConsistency('org', null)).toBeUndefined();
        expect(validateLevelProjectIdConsistency('org', undefined)).toBeUndefined();
      });

      it('should reject org level with project_id', () => {
        const error = validateLevelProjectIdConsistency('org', 'proj-123');
        expect(error).toBeDefined();
        expect(error?.field).toBe('project_id');
        expect(error?.message).toContain('must not have');
      });

      it('should accept project level with project_id', () => {
        expect(validateLevelProjectIdConsistency('project', 'proj-123')).toBeUndefined();
      });

      it('should reject project level without project_id', () => {
        const error = validateLevelProjectIdConsistency('project', null);
        expect(error).toBeDefined();
        expect(error?.field).toBe('project_id');
        expect(error?.message).toContain('must have');
      });
    });

    describe('validateCreateInput', () => {
      it('should accept valid org-level input', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'GL Minimum',
          level: 'org',
          organization_id: 'org-123',
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
        };

        const errors = await validateCreateInput(input);
        expect(errors).toHaveLength(0);
      });

      it('should accept valid project-level input', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Builders Risk',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-123',
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
        };

        const errors = await validateCreateInput(input);
        expect(errors).toHaveLength(0);
      });

      it('should reject missing required fields', async () => {
        const input = {} as CreateCoverageLimitRequirementRequest;
        const errors = await validateCreateInput(input);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.field === 'name')).toBe(true);
        expect(errors.some((e) => e.field === 'level')).toBe(true);
        expect(errors.some((e) => e.field === 'organization_id')).toBe(true);
        expect(errors.some((e) => e.field === 'coverage_type')).toBe(true);
        expect(errors.some((e) => e.field === 'minimum_limit')).toBe(true);
      });

      it('should reject level/project_id mismatch', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Test',
          level: 'org',
          organization_id: 'org-123',
          project_id: 'proj-123', // Should not have project_id for org level
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
        };

        const errors = await validateCreateInput(input);
        expect(errors.some((e) => e.field === 'project_id')).toBe(true);
      });
    });
  });

  describe('CRUD Operations', () => {
    describe('createCoverageLimitRequirement', () => {
      it('should create org-level requirement as admin', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'GL Minimum',
          level: 'org',
          organization_id: 'org-123',
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
        };

        const result = await createCoverageLimitRequirement(input, adminUser);

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('GL Minimum');
        expect(result.data?.level).toBe('org');
        expect(result.data?.project_id).toBeNull();
        expect(result.data?.required).toBe(true);
      });

      it('should create project-level requirement as admin', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Builders Risk',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-a',
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
          required: true,
        };

        const result = await createCoverageLimitRequirement(input, adminUser);

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);
        expect(result.data?.level).toBe('project');
        expect(result.data?.project_id).toBe('proj-a');
      });

      it('should create project-level requirement as project manager with access', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Professional Liability',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-a',
          coverage_type: 'professional_liability',
          minimum_limit: 2000000,
        };

        const result = await createCoverageLimitRequirement(input, projectManagerUser);

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);
      });

      it('should reject org-level creation by non-admin', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'GL Minimum',
          level: 'org',
          organization_id: 'org-123',
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
        };

        const result = await createCoverageLimitRequirement(input, projectManagerUser);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(403);
        expect(result.error).toContain('Unauthorized');
      });

      it('should reject project-level creation by PM without access', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Test',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-c', // PM doesn't have access to this project
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
        };

        const result = await createCoverageLimitRequirement(input, projectManagerUser);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(403);
      });

      it('should reject invalid level/project_id combination', async () => {
        const input: CreateCoverageLimitRequirementRequest = {
          name: 'Test',
          level: 'org',
          organization_id: 'org-123',
          project_id: 'proj-123', // Invalid: org level shouldn't have project_id
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
        };

        const result = await createCoverageLimitRequirement(input, adminUser);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.error).toContain('project_id');
      });
    });

    describe('getCoverageLimitRequirements', () => {
      beforeEach(async () => {
        // Seed test data
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

        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'Builders Risk (Project A)',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-a',
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
          required: true,
        });

        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'Pollution (Project B)',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-b',
          coverage_type: 'pollution_liability',
          minimum_limit: 1000000,
          required: true,
        });
      });

      it('should return org-level requirements only without project_id', async () => {
        const result = await getCoverageLimitRequirements('org-123');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data?.every((r) => r.level === 'org')).toBe(true);
      });

      it('should return combined org + project requirements with project_id', async () => {
        const result = await getCoverageLimitRequirements('org-123', 'proj-a');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3); // 2 org + 1 project
        expect(result.data?.filter((r) => r.level === 'org')).toHaveLength(2);
        expect(result.data?.filter((r) => r.level === 'project')).toHaveLength(1);
        expect(result.data?.find((r) => r.level === 'project')?.project_id).toBe('proj-a');
      });

      it('should return empty array for org with no requirements', async () => {
        const result = await getCoverageLimitRequirements('org-999');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should require organization_id', async () => {
        const result = await getCoverageLimitRequirements('');

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
      });
    });

    describe('getCoverageLimitRequirementById', () => {
      it('should return requirement by ID', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'Test Requirement',
            level: 'org',
            organization_id: 'org-123',
            project_id: null,
            coverage_type: 'general_liability',
            minimum_limit: 1000000,
            required: true,
          }
        );

        const result = await getCoverageLimitRequirementById(inserted.id);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(inserted.id);
        expect(result.data?.name).toBe('Test Requirement');
      });

      it('should return 404 for non-existent ID', async () => {
        const result = await getCoverageLimitRequirementById('non-existent-id');

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
      });
    });

    describe('updateCoverageLimitRequirement', () => {
      it('should update requirement as admin', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'Original Name',
            level: 'org',
            organization_id: 'org-123',
            project_id: null,
            coverage_type: 'general_liability',
            minimum_limit: 1000000,
            required: true,
          }
        );

        const result = await updateCoverageLimitRequirement(
          inserted.id,
          { name: 'Updated Name', minimum_limit: 2000000 },
          adminUser
        );

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('Updated Name');
        expect(result.data?.minimum_limit).toBe(2000000);
        expect(result.data?.level).toBe('org'); // Level unchanged
      });

      it('should update project-level requirement as PM with access', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'Project Requirement',
            level: 'project',
            organization_id: 'org-123',
            project_id: 'proj-a',
            coverage_type: 'builders_risk',
            minimum_limit: 5000000,
            required: true,
          }
        );

        const result = await updateCoverageLimitRequirement(
          inserted.id,
          { minimum_limit: 7500000 },
          projectManagerUser
        );

        expect(result.success).toBe(true);
        expect(result.data?.minimum_limit).toBe(7500000);
      });

      it('should reject update of org-level by non-admin', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'Org Requirement',
            level: 'org',
            organization_id: 'org-123',
            project_id: null,
            coverage_type: 'general_liability',
            minimum_limit: 1000000,
            required: true,
          }
        );

        const result = await updateCoverageLimitRequirement(
          inserted.id,
          { minimum_limit: 2000000 },
          projectManagerUser
        );

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(403);
      });

      it('should return 404 for non-existent ID', async () => {
        const result = await updateCoverageLimitRequirement(
          'non-existent-id',
          { name: 'Test' },
          adminUser
        );

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
      });
    });

    describe('deleteCoverageLimitRequirement', () => {
      it('should delete requirement as admin', async () => {
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

        const result = await deleteCoverageLimitRequirement(inserted.id, adminUser);

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Verify deleted
        const checkResult = await getCoverageLimitRequirementById(inserted.id);
        expect(checkResult.success).toBe(false);
        expect(checkResult.statusCode).toBe(404);
      });

      it('should delete project-level requirement as PM with access', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'To Delete',
            level: 'project',
            organization_id: 'org-123',
            project_id: 'proj-a',
            coverage_type: 'builders_risk',
            minimum_limit: 5000000,
            required: true,
          }
        );

        const result = await deleteCoverageLimitRequirement(inserted.id, projectManagerUser);

        expect(result.success).toBe(true);
      });

      it('should reject deletion of org-level by non-admin', async () => {
        const inserted = await MockDatabase.insert<CoverageLimitRequirement>(
          'coverage_limit_requirements',
          {
            name: 'Org Requirement',
            level: 'org',
            organization_id: 'org-123',
            project_id: null,
            coverage_type: 'general_liability',
            minimum_limit: 1000000,
            required: true,
          }
        );

        const result = await deleteCoverageLimitRequirement(inserted.id, projectManagerUser);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(403);
      });

      it('should return 404 for non-existent ID', async () => {
        const result = await deleteCoverageLimitRequirement('non-existent-id', adminUser);

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
      });
    });

    describe('getOrgLevelRequirements', () => {
      beforeEach(async () => {
        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'GL (Org)',
          level: 'org',
          organization_id: 'org-123',
          project_id: null,
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
          required: true,
        });

        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'Builders Risk (Project)',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-a',
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
          required: true,
        });
      });

      it('should return only org-level requirements', async () => {
        const result = await getOrgLevelRequirements('org-123');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].level).toBe('org');
        expect(result.data?.[0].name).toBe('GL (Org)');
      });
    });

    describe('getProjectLevelRequirements', () => {
      beforeEach(async () => {
        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'GL (Org)',
          level: 'org',
          organization_id: 'org-123',
          project_id: null,
          coverage_type: 'general_liability',
          minimum_limit: 1000000,
          required: true,
        });

        await MockDatabase.insert<CoverageLimitRequirement>('coverage_limit_requirements', {
          name: 'Builders Risk (Project A)',
          level: 'project',
          organization_id: 'org-123',
          project_id: 'proj-a',
          coverage_type: 'builders_risk',
          minimum_limit: 5000000,
          required: true,
        });
      });

      it('should return only project-level requirements for specific project', async () => {
        const result = await getProjectLevelRequirements('proj-a');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].level).toBe('project');
        expect(result.data?.[0].project_id).toBe('proj-a');
      });
    });
  });
});
