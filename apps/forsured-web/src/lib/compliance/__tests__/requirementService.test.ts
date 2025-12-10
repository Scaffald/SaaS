/**
 * REQ-165: Compliance Requirements Management System
 * TDD tests for requirement CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import mockDatabase from '../../../utils/mockDataStore';
import {
  createRequirement,
  getRequirement,
  listRequirements,
  updateRequirement,
  deleteRequirement,
  cloneRequirement
} from '../requirementService';
import {
  CoverageType,
  RequirementStatus,
  CreateComplianceRequirementInput
} from '../types';
import { getGeneralLiabilityTemplate1M2M } from '../templates';

describe('Requirement Service - CRUD Operations', () => {
  const organizationId = 'org-123';
  const userId = 'user-456';

  beforeEach(() => {
    mockDatabase.clearAll();
  });

  describe('createRequirement', () => {
    it('should create a new requirement with version 1', async () => {
      const input: CreateComplianceRequirementInput = {
        name: 'Test GL Requirement',
        type: CoverageType.GENERAL_LIABILITY,
        description: 'Test description',
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: userId,
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000
          },
          required_endorsements: [
            {
              endorsement_type: 'Additional Insured',
              description: 'Test endorsement'
            }
          ],
          policy_conditions: [],
          documentation_requirements: [
            {
              document_type: 'Certificate of Insurance',
              is_required: true
            }
          ]
        },
        effective_date: new Date().toISOString()
      };

      const result = await createRequirement(input);

      expect(result.id).toBeDefined();
      expect(result.version).toBe(1);
      expect(result.parent_requirement_id).toBeNull();
      expect(result.superseded_date).toBeNull();
      expect(result.name).toBe(input.name);
      expect(result.status).toBe(input.status);
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should validate JSON schema and reject invalid requirement', async () => {
      const input: CreateComplianceRequirementInput = {
        name: 'Invalid GL Requirement',
        type: CoverageType.GENERAL_LIABILITY,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: userId,
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {
            // Missing required per_occurrence and aggregate for GL
          },
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: []
        },
        effective_date: new Date().toISOString()
      };

      await expect(createRequirement(input)).rejects.toThrow();
    });

    it('should reject duplicate requirement names in same organization', async () => {
      const input: CreateComplianceRequirementInput = {
        name: 'Duplicate Name',
        type: CoverageType.GENERAL_LIABILITY,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: userId,
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000
          },
          required_endorsements: [
            {
              endorsement_type: 'Test',
              description: 'Test'
            }
          ],
          policy_conditions: [],
          documentation_requirements: [
            {
              document_type: 'COI',
              is_required: true
            }
          ]
        },
        effective_date: new Date().toISOString()
      };

      await createRequirement(input);
      await expect(createRequirement(input)).rejects.toThrow('already exists');
    });

    it('should create template from template function', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const result = await createRequirement(template);

      expect(result.is_template).toBe(true);
      expect(result.type).toBe(CoverageType.GENERAL_LIABILITY);
      expect(result.requirement_definition.coverage_limits.per_occurrence).toBe(1000000);
      expect(result.requirement_definition.coverage_limits.aggregate).toBe(2000000);
      expect(result.requirement_definition.required_endorsements.length).toBeGreaterThan(0);
    });
  });

  describe('getRequirement', () => {
    it('should retrieve a requirement by ID', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const created = await createRequirement(template);

      const retrieved = await getRequirement(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe(created.name);
      expect(retrieved!.version).toBe(1);
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await getRequirement('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('listRequirements', () => {
    beforeEach(async () => {
      // Create test requirements
      const template1 = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      await createRequirement(template1);

      const template2: CreateComplianceRequirementInput = {
        name: 'Workers Comp Test',
        type: CoverageType.WORKERS_COMP,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: userId,
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {},
          required_endorsements: [
            {
              endorsement_type: 'Waiver',
              description: 'Waiver of subrogation'
            }
          ],
          policy_conditions: [
            {
              condition_type: 'State Coverage',
              description: 'Must cover all states'
            }
          ],
          documentation_requirements: [
            {
              document_type: 'COI',
              is_required: true
            }
          ]
        },
        effective_date: new Date().toISOString()
      };
      await createRequirement(template2);
    });

    it('should list all requirements without filters', async () => {
      const result = await listRequirements({});

      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by type', async () => {
      const result = await listRequirements({
        filters: { type: CoverageType.GENERAL_LIABILITY }
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe(CoverageType.GENERAL_LIABILITY);
    });

    it('should filter by status', async () => {
      const result = await listRequirements({
        filters: { status: RequirementStatus.ACTIVE }
      });

      expect(result.data.length).toBe(2);
      expect(result.data.every(r => r.status === RequirementStatus.ACTIVE)).toBe(true);
    });

    it('should filter by is_template', async () => {
      const result = await listRequirements({
        filters: { is_template: true }
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].is_template).toBe(true);
    });

    it('should filter by organization_id', async () => {
      const result = await listRequirements({
        filters: { organization_id: organizationId }
      });

      expect(result.data.length).toBe(2);
      expect(result.data.every(r => r.organization_id === organizationId)).toBe(true);
    });

    it('should search by name', async () => {
      const result = await listRequirements({
        filters: { search: 'Workers' }
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toContain('Workers');
    });

    it('should handle pagination', async () => {
      const result = await listRequirements({
        page: 1,
        limit: 1
      });

      expect(result.data.length).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.total_pages).toBe(2);
    });

    it('should sort by name ascending', async () => {
      const result = await listRequirements({
        sort_by: 'name',
        ascending: true
      });

      expect(result.data[0].name < result.data[1].name).toBe(true);
    });

    it('should sort by name descending', async () => {
      const result = await listRequirements({
        sort_by: 'name',
        ascending: false
      });

      expect(result.data[0].name > result.data[1].name).toBe(true);
    });
  });

  describe('updateRequirement', () => {
    it('should create a new version when updating', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const original = await createRequirement(template);

      const updated = await updateRequirement(original.id, {
        name: 'Updated Name',
        change_summary: 'Updated the name'
      });

      expect(updated.id).not.toBe(original.id);
      expect(updated.version).toBe(2);
      expect(updated.parent_requirement_id).toBe(original.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.change_summary).toBe('Updated the name');

      // Original should be marked as superseded
      const originalAfterUpdate = await getRequirement(original.id);
      expect(originalAfterUpdate!.superseded_date).toBeDefined();
    });

    it('should validate JSON schema when updating definition', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const original = await createRequirement(template);

      await expect(
        updateRequirement(original.id, {
          requirement_definition: {
            coverage_limits: {
              per_occurrence: -1000 // Invalid negative value
            },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: []
          },
          change_summary: 'Invalid update'
        })
      ).rejects.toThrow();
    });

    it('should preserve unchanged fields', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const original = await createRequirement(template);

      const updated = await updateRequirement(original.id, {
        description: 'New description only',
        change_summary: 'Updated description'
      });

      expect(updated.name).toBe(original.name);
      expect(updated.type).toBe(original.type);
      expect(updated.description).toBe('New description only');
      expect(updated.requirement_definition).toEqual(original.requirement_definition);
    });
  });

  describe('deleteRequirement', () => {
    it('should soft delete a requirement', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const created = await createRequirement(template);

      await deleteRequirement(created.id);

      const deleted = await getRequirement(created.id);
      expect(deleted!.status).toBe(RequirementStatus.ARCHIVED);
      expect(deleted!.archived_at).toBeDefined();
    });

    it('should throw error for non-existent requirement', async () => {
      await expect(deleteRequirement('non-existent-id')).rejects.toThrow();
    });
  });

  describe('cloneRequirement', () => {
    it('should create a copy of an existing requirement', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const original = await createRequirement(template);

      const cloned = await cloneRequirement(original.id, {
        name: 'Cloned Requirement'
      });

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.version).toBe(1);
      expect(cloned.parent_requirement_id).toBeNull();
      expect(cloned.name).toBe('Cloned Requirement');
      expect(cloned.type).toBe(original.type);
      expect(cloned.requirement_definition).toEqual(original.requirement_definition);
    });

    it('should allow overriding description when cloning', async () => {
      const template = getGeneralLiabilityTemplate1M2M(organizationId, userId);
      const original = await createRequirement(template);

      const cloned = await cloneRequirement(original.id, {
        name: 'Cloned',
        description: 'Custom description'
      });

      expect(cloned.description).toBe('Custom description');
    });
  });
});
