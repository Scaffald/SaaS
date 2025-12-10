import MockDatabase from './mockDataStore';
import usersData from '../data/seed/users.json';
import projectsData from '../data/seed/projects.json';
import subcontractorsData from '../data/seed/subcontractors.json';
import policiesData from '../data/seed/policies.json';
import documentsData from '../data/seed/documents.json';
import endorsementsData from '../data/seed/endorsements.json';
import requirementsData from '../data/seed/requirements.json';
import complianceScoresData from '../data/seed/complianceScores.json';
import tasksData from '../data/seed/tasks.json';

export function initializeMockData() {
  try {
    MockDatabase.clearAll();

    // Seed in dependency order
    // 1. Users (no dependencies)
    MockDatabase.seedData('users', usersData);

    // 2. Projects (references users via manager_org_id)
    MockDatabase.seedData('projects', projectsData);

    // 3. Subcontractors (no dependencies on our seed data)
    MockDatabase.seedData('subcontractors', subcontractorsData);

    // 4. Policies (references subcontractors)
    MockDatabase.seedData('policies', policiesData);

    // 5. Documents (references users, projects, subcontractors, policies)
    MockDatabase.seedData('documents', documentsData);

    // 6. Endorsements (references policies, documents, users)
    MockDatabase.seedData('endorsements', endorsementsData);

    // 7. Requirements (references projects)
    MockDatabase.seedData('requirements', requirementsData);

    // 8. ComplianceScores (references projects, subcontractors, users)
    MockDatabase.seedData('compliance_scores', complianceScoresData);

    // 9. Tasks (references users, projects, subcontractors, policies, documents)
    MockDatabase.seedData('tasks', tasksData);

    // Seed additional tables not yet in new schema but still needed by existing code
    MockDatabase.seedData('relationships', [
      {
        id: 'rel-1',
        manager_org_id: 'org-gc-1',
        subcontractor_org_id: 'org-sub-1',
        status: 'active',
        relationship_health_score: 95,
        projects_together_count: 12,
        total_contract_value: 8500000,
        last_project_date: '2024-10-01T00:00:00Z',
        notes:
          'Excellent long-term relationship. Reliable and high-quality work.',
        created_at: '2022-03-15T08:00:00Z',
        updated_at: '2024-10-24T12:00:00Z',
      },
      {
        id: 'rel-2',
        manager_org_id: 'org-gc-1',
        subcontractor_org_id: 'org-sub-2',
        status: 'active',
        relationship_health_score: 88,
        projects_together_count: 8,
        total_contract_value: 4200000,
        last_project_date: '2024-09-15T00:00:00Z',
        notes:
          'Good relationship, some minor communication issues but overall reliable.',
        created_at: '2022-08-20T08:00:00Z',
        updated_at: '2024-10-24T12:00:00Z',
      },
      {
        id: 'rel-3',
        manager_org_id: 'org-gc-1',
        subcontractor_org_id: 'org-sub-3',
        status: 'active',
        relationship_health_score: 92,
        projects_together_count: 6,
        total_contract_value: 3100000,
        last_project_date: '2024-08-30T00:00:00Z',
        notes: 'Professional and detail-oriented. Strong safety record.',
        created_at: '2023-01-10T08:00:00Z',
        updated_at: '2024-10-24T12:00:00Z',
      },
    ]);

    MockDatabase.seedData('project_participants', [
      {
        id: 'pp-1',
        project_id: 'proj-1',
        organization_id: 'org-sub-1',
        user_id: 'user-sub-1',
        role: 'subcontractor',
        status: 'active',
        invited_at: '2024-01-05T08:00:00Z',
        accepted_at: '2024-01-05T10:30:00Z',
        created_at: '2024-01-05T08:00:00Z',
        updated_at: '2024-01-05T10:30:00Z',
      },
      {
        id: 'pp-2',
        project_id: 'proj-1',
        organization_id: 'org-sub-2',
        user_id: 'user-sub-3',
        role: 'subcontractor',
        status: 'active',
        invited_at: '2024-01-06T08:00:00Z',
        accepted_at: '2024-01-06T14:20:00Z',
        created_at: '2024-01-06T08:00:00Z',
        updated_at: '2024-01-06T14:20:00Z',
      },
      {
        id: 'pp-3',
        project_id: 'proj-2',
        organization_id: 'org-sub-1',
        user_id: 'user-sub-1',
        role: 'subcontractor',
        status: 'active',
        invited_at: '2024-03-05T08:00:00Z',
        accepted_at: '2024-03-05T11:00:00Z',
        created_at: '2024-03-05T08:00:00Z',
        updated_at: '2024-03-05T11:00:00Z',
      },
      {
        id: 'pp-4',
        project_id: 'proj-2',
        organization_id: 'org-sub-3',
        user_id: 'user-sub-4',
        role: 'subcontractor',
        status: 'active',
        invited_at: '2024-03-06T08:00:00Z',
        accepted_at: '2024-03-06T15:45:00Z',
        created_at: '2024-03-06T08:00:00Z',
        updated_at: '2024-03-06T15:45:00Z',
      },
    ]);

    MockDatabase.seedData('broker_delegations', []);

    console.log('Mock data initialized successfully');
    console.log('Seeded tables:');
    console.log('- users:', usersData.length);
    console.log('- projects:', projectsData.length);
    console.log('- subcontractors:', subcontractorsData.length);
    console.log('- policies:', policiesData.length);
    console.log('- documents:', documentsData.length);
    console.log('- endorsements:', endorsementsData.length);
    console.log('- requirements:', requirementsData.length);
    console.log('- compliance_scores:', complianceScoresData.length);
    console.log('- tasks:', tasksData.length);
  } catch (error) {
    console.error('Error initializing mock data:', error);
    throw error;
  }
}
