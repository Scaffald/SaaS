/**
 * REQ-165: Compliance Requirements Management System
 * Tests for project-requirement associations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import mockDatabase from '../../../utils/mockDataStore';
import {
  associateRequirementWithProject,
  getProjectRequirements,
  removeRequirementFromProject,
  updateProjectRequirement
} from '../projectRequirementService';
import { createRequirement } from '../requirementService';
import {
  CoverageType,
  RequirementStatus
} from '../types';

describe('Project Requirement Service', () => {
  const organizationId = 'org-123';
  const userId = 'user-456';
  const projectId = 'project-789';

  beforeEach(() => {
    mockDatabase.clearAll();
  });

  describe('associateRequirementWithProject', () => {
    it('should associate a requirement with a project', async () => {
      const requirement = await createRequirement({
        name: 'Test GL',
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
      });

      const association = await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: requirement.id,
        is_mandatory: true,
        assigned_by: userId
      });

      expect(association.id).toBeDefined();
      expect(association.project_id).toBe(projectId);
      expect(association.requirement_id).toBe(requirement.id);
      expect(association.is_mandatory).toBe(true);
      expect(association.assigned_at).toBeDefined();
      expect(association.assigned_by).toBe(userId);
    });

    it('should prevent duplicate associations', async () => {
      const requirement = await createRequirement({
        name: 'Test GL',
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
      });

      await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: requirement.id,
        is_mandatory: true,
        assigned_by: userId
      });

      await expect(
        associateRequirementWithProject({
          project_id: projectId,
          requirement_id: requirement.id,
          is_mandatory: true,
          assigned_by: userId
        })
      ).rejects.toThrow('already associated');
    });

    it('should prevent associating draft requirements', async () => {
      const requirement = await createRequirement({
        name: 'Draft GL',
        type: CoverageType.GENERAL_LIABILITY,
        status: RequirementStatus.DRAFT,
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
      });

      await expect(
        associateRequirementWithProject({
          project_id: projectId,
          requirement_id: requirement.id,
          is_mandatory: true,
          assigned_by: userId
        })
      ).rejects.toThrow('draft');
    });
  });

  describe('getProjectRequirements', () => {
    it('should retrieve all requirements for a project', async () => {
      const req1 = await createRequirement({
        name: 'GL Requirement',
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
      });

      const req2 = await createRequirement({
        name: 'Workers Comp',
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
              description: 'Test'
            }
          ],
          policy_conditions: [
            {
              condition_type: 'State Coverage',
              description: 'Test'
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
      });

      await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: req1.id,
        is_mandatory: true,
        assigned_by: userId
      });

      await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: req2.id,
        is_mandatory: false,
        assigned_by: userId
      });

      const requirements = await getProjectRequirements(projectId);

      expect(requirements.length).toBe(2);
      expect(requirements.some(r => r.requirement.id === req1.id)).toBe(true);
      expect(requirements.some(r => r.requirement.id === req2.id)).toBe(true);
    });

    it('should return empty array for project with no requirements', async () => {
      const requirements = await getProjectRequirements('empty-project');
      expect(requirements.length).toBe(0);
    });

    it('should filter mandatory requirements only', async () => {
      const req1 = await createRequirement({
        name: 'Mandatory GL',
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
      });

      await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: req1.id,
        is_mandatory: true,
        assigned_by: userId
      });

      const requirements = await getProjectRequirements(projectId, true);
      expect(requirements.length).toBe(1);
      expect(requirements[0].is_mandatory).toBe(true);
    });
  });

  describe('removeRequirementFromProject', () => {
    it('should remove a requirement association', async () => {
      const requirement = await createRequirement({
        name: 'Test GL',
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
      });

      const association = await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: requirement.id,
        is_mandatory: true,
        assigned_by: userId
      });

      await removeRequirementFromProject(association.id);

      const requirements = await getProjectRequirements(projectId);
      expect(requirements.length).toBe(0);
    });
  });

  describe('updateProjectRequirement', () => {
    it('should update is_mandatory flag', async () => {
      const requirement = await createRequirement({
        name: 'Test GL',
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
      });

      const association = await associateRequirementWithProject({
        project_id: projectId,
        requirement_id: requirement.id,
        is_mandatory: true,
        assigned_by: userId
      });

      const updated = await updateProjectRequirement(association.id, {
        is_mandatory: false
      });

      expect(updated.is_mandatory).toBe(false);
    });
  });
});
