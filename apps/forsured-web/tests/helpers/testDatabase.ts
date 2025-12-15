/**
 * REQ-133: System Integration & End-to-End Testing
 * Test database helper for seeding and cleaning test data
 *
 * Migrated from FRS-Prototype/tests/helpers/testDatabase.ts
 */

import mockDatabase from '@/utils/mockDataStore';
import { User, Project, PolicyData } from '@/types';
import { CoverageType, RequirementStatus, ComplianceRequirement } from '@/lib/compliance/types';
import { v4 as uuidv4 } from 'uuid';

export class TestDatabase {
  /**
   * Seed database with test users (Manager, Subcontractor, Broker)
   */
  static async seedUsers(): Promise<{
    manager: User;
    subcontractor: User;
    broker: User;
  }> {
    const manager: User = {
      id: 'test-manager-1',
      organization_id: 'org-manager-1',
      name: 'Test Manager',
      email: 'manager@test.com',
      role: 'manager',
      company: 'GC Test Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const subcontractor: User = {
      id: 'test-subcontractor-1',
      organization_id: 'org-subcontractor-1',
      name: 'Test Subcontractor',
      email: 'subcontractor@test.com',
      role: 'subcontractor',
      company: 'Subcontractor Test Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const broker: User = {
      id: 'test-broker-1',
      organization_id: 'org-broker-1',
      name: 'Test Broker',
      email: 'broker@test.com',
      role: 'broker',
      broker_role: 'agent',
      company: 'Broker Test Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDatabase.seedData('users', [manager, subcontractor, broker]);

    return { manager, subcontractor, broker };
  }

  /**
   * Seed database with test project
   */
  static async seedProject(managerId: string): Promise<Project> {
    const project: Project = {
      id: 'test-project-1',
      name: 'Test Construction Project',
      description: 'Integration test project',
      client_id: 'test-client-1',
      start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: '123 Test St, Test City, TS 12345',
      contract_value: 1000000,
      project_manager: managerId,
      compliance_status: 'non_compliant',
      general_liability_required: 1000000,
      workers_comp_required: 1000000,
      auto_liability_required: 1000000,
      umbrella_required: 2000000,
      additional_insureds: ['Test GC Company'],
      waiver_of_subrogation_required: true,
      primary_non_contributory_required: true,
      certificate_holder: 'Test GC Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDatabase.seedData('projects', [project]);

    return project;
  }

  /**
   * Seed database with compliance requirements
   */
  static async seedComplianceRequirements(organizationId: string): Promise<ComplianceRequirement[]> {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'req-gl-test',
        name: 'General Liability Requirement',
        type: CoverageType.GENERAL_LIABILITY,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: 'test-manager-1',
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000,
          },
          required_endorsements: [
            {
              endorsement_type: 'additional_insured',
              description: 'Additional Insured endorsement required',
            },
            {
              endorsement_type: 'waiver_of_subrogation',
              description: 'Waiver of Subrogation required',
            },
          ],
          policy_conditions: [],
          documentation_requirements: [],
        },
        version: 1,
        parent_requirement_id: null,
        effective_date: '2024-01-01',
        superseded_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      },
      {
        id: 'req-wc-test',
        name: 'Workers Compensation Requirement',
        type: CoverageType.WORKERS_COMP,
        status: RequirementStatus.ACTIVE,
        is_template: false,
        created_by: 'test-manager-1',
        organization_id: organizationId,
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
          },
          required_endorsements: [
            {
              endorsement_type: 'waiver_of_subrogation',
              description: 'Waiver of Subrogation required',
            },
          ],
          policy_conditions: [],
          documentation_requirements: [],
        },
        version: 1,
        parent_requirement_id: null,
        effective_date: '2024-01-01',
        superseded_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      },
    ];

    mockDatabase.seedData('compliance_requirements' as Parameters<typeof mockDatabase.seedData>[0], requirements);

    return requirements;
  }

  /**
   * Seed database with test policy
   */
  static async seedPolicy(clientId: string): Promise<PolicyData> {
    const policy: PolicyData = {
      id: 'test-policy-1',
      client_id: clientId,
      policy_type: 'general_liability',
      policy_number: 'POL-TEST-12345',
      provider: 'Test Insurance Co',
      coverage_amount: 1000000,
      premium_amount: 5000,
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      deductible: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDatabase.seedData('policies', [policy]);

    return policy;
  }

  /**
   * Clean all test data from database
   */
  static async cleanAll(): Promise<void> {
    mockDatabase.clearAll();
  }

  /**
   * Clean specific table
   */
  static async cleanTable(table: string): Promise<void> {
    mockDatabase.clearTable(table as Parameters<typeof mockDatabase.clearTable>[0]);
  }

  /**
   * Generate unique ID for test data
   */
  static generateId(prefix: string): string {
    return `${prefix}-${uuidv4()}`;
  }
}
