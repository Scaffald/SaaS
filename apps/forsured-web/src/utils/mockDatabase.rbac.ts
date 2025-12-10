import MockDatabase from './mockDataStore';

// User interface matching UserContext
export interface RBACUser {
  id: string;
  role: 'admin' | 'manager' | 'subcontractor' | 'broker';
  organization_id?: string;
}

// RBAC filter function type
export type RBACFilterFn = (user: RBACUser, record: any) => boolean;

// RBAC rule definition for a table + role
export interface RBACRule {
  table: string;
  role: string;
  filter: RBACFilterFn;
}

/**
 * Get accessible project IDs for a user
 * Used for cascading filters
 */
export function getAccessibleProjectIds(user: RBACUser): string[] {
  const projects = MockDatabase.getAll('projects');

  if (user.role === 'admin') {
    return projects.map((p: any) => p.id);
  }

  if (user.role === 'manager') {
    return projects
      .filter((p: any) => p.manager_org_id === user.organization_id)
      .map((p: any) => p.id);
  }

  if (user.role === 'subcontractor') {
    // Get all projects where this subcontractor has documents/policies
    const documents = MockDatabase.getAll('documents');
    const projectIds = new Set<string>();

    documents
      .filter((d: any) => d.subcontractor_id === user.id || d.owner_user_id === user.id)
      .forEach((d: any) => {
        if (d.project_id) {
          projectIds.add(d.project_id);
        }
      });

    return Array.from(projectIds);
  }

  if (user.role === 'broker') {
    // Brokers see projects for their assigned clients
    // For now, return all projects (would need broker_delegations table for proper filtering)
    return projects.map((p: any) => p.id);
  }

  return [];
}

/**
 * Get accessible document IDs for a user
 * Used for cascading filters to policies
 */
export function getAccessibleDocumentIds(user: RBACUser): string[] {
  const documents = MockDatabase.getAll('documents');
  const accessibleProjectIds = getAccessibleProjectIds(user);

  if (user.role === 'admin') {
    return documents.map((d: any) => d.id);
  }

  if (user.role === 'subcontractor') {
    return documents
      .filter((d: any) =>
        d.subcontractor_id === user.id ||
        d.owner_user_id === user.id ||
        accessibleProjectIds.includes(d.project_id)
      )
      .map((d: any) => d.id);
  }

  // Managers and brokers: filter by accessible projects
  return documents
    .filter((d: any) => accessibleProjectIds.includes(d.project_id))
    .map((d: any) => d.id);
}

/**
 * Get accessible policy IDs for a user
 * Used for cascading filters to endorsements
 */
export function getAccessiblePolicyIds(user: RBACUser): string[] {
  const policies = MockDatabase.getAll('policies');
  const accessibleDocumentIds = getAccessibleDocumentIds(user);

  if (user.role === 'admin') {
    return policies.map((p: any) => p.id);
  }

  if (user.role === 'subcontractor') {
    return policies
      .filter((p: any) => p.subcontractor_id === user.id)
      .map((p: any) => p.id);
  }

  // Managers and brokers: filter by accessible documents
  const documents = MockDatabase.getAll('documents');
  const accessiblePolicyIdsFromDocs = documents
    .filter((d: any) => accessibleDocumentIds.includes(d.id) && d.policy_id)
    .map((d: any) => d.policy_id);

  return policies
    .filter((p: any) => accessiblePolicyIdsFromDocs.includes(p.id))
    .map((p: any) => p.id);
}

/**
 * RBAC rules for all tables and roles
 */
export const RBAC_RULES: RBACRule[] = [
  // ========== PROJECTS ==========
  {
    table: 'projects',
    role: 'admin',
    filter: () => true, // Admin sees all
  },
  {
    table: 'projects',
    role: 'manager',
    filter: (user, record) => record.manager_org_id === user.organization_id,
  },
  {
    table: 'projects',
    role: 'subcontractor',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.id);
    },
  },
  {
    table: 'projects',
    role: 'broker',
    filter: () => true, // Brokers see all projects (would refine with broker_delegations)
  },

  // ========== SUBCONTRACTORS ==========
  {
    table: 'subcontractors',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'subcontractors',
    role: 'manager',
    filter: () => true, // Managers see all subcontractors
  },
  {
    table: 'subcontractors',
    role: 'subcontractor',
    filter: (user, record) => record.id === user.id || record.organization_id === user.organization_id,
  },
  {
    table: 'subcontractors',
    role: 'broker',
    filter: () => true, // Brokers see all subcontractors
  },

  // ========== DOCUMENTS ==========
  {
    table: 'documents',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'documents',
    role: 'manager',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },
  {
    table: 'documents',
    role: 'subcontractor',
    filter: (user, record) => {
      return (
        record.subcontractor_id === user.id ||
        record.owner_user_id === user.id ||
        record.uploaded_by_user_id === user.id
      );
    },
  },
  {
    table: 'documents',
    role: 'broker',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },

  // ========== POLICIES ==========
  {
    table: 'policies',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'policies',
    role: 'manager',
    filter: (user, record) => {
      const accessiblePolicyIds = getAccessiblePolicyIds(user);
      return accessiblePolicyIds.includes(record.id);
    },
  },
  {
    table: 'policies',
    role: 'subcontractor',
    filter: (user, record) => record.subcontractor_id === user.id,
  },
  {
    table: 'policies',
    role: 'broker',
    filter: (user, record) => {
      const accessiblePolicyIds = getAccessiblePolicyIds(user);
      return accessiblePolicyIds.includes(record.id);
    },
  },

  // ========== ENDORSEMENTS ==========
  {
    table: 'endorsements',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'endorsements',
    role: 'manager',
    filter: (user, record) => {
      const accessiblePolicyIds = getAccessiblePolicyIds(user);
      return accessiblePolicyIds.includes(record.policy_id);
    },
  },
  {
    table: 'endorsements',
    role: 'subcontractor',
    filter: (user, record) => {
      const accessiblePolicyIds = getAccessiblePolicyIds(user);
      return accessiblePolicyIds.includes(record.policy_id);
    },
  },
  {
    table: 'endorsements',
    role: 'broker',
    filter: (user, record) => {
      const accessiblePolicyIds = getAccessiblePolicyIds(user);
      return accessiblePolicyIds.includes(record.policy_id);
    },
  },

  // ========== REQUIREMENTS ==========
  {
    table: 'requirements',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'requirements',
    role: 'manager',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },
  {
    table: 'requirements',
    role: 'subcontractor',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },
  {
    table: 'requirements',
    role: 'broker',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },

  // ========== COMPLIANCE_SCORES ==========
  {
    table: 'compliance_scores',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'compliance_scores',
    role: 'manager',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },
  {
    table: 'compliance_scores',
    role: 'subcontractor',
    filter: (user, record) => record.subcontractor_id === user.id,
  },
  {
    table: 'compliance_scores',
    role: 'broker',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return accessibleProjectIds.includes(record.project_id);
    },
  },

  // ========== TASKS ==========
  {
    table: 'tasks',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'tasks',
    role: 'manager',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return (
        accessibleProjectIds.includes(record.project_id) ||
        record.created_by_user_id === user.id ||
        record.assigned_to_user_id === user.id
      );
    },
  },
  {
    table: 'tasks',
    role: 'subcontractor',
    filter: (user, record) => {
      return (
        record.assigned_to_user_id === user.id ||
        record.created_by_user_id === user.id
      );
    },
  },
  {
    table: 'tasks',
    role: 'broker',
    filter: (user, record) => {
      const accessibleProjectIds = getAccessibleProjectIds(user);
      return (
        accessibleProjectIds.includes(record.project_id) ||
        record.assigned_to_user_id === user.id
      );
    },
  },

  // ========== USERS ==========
  // All roles can see all users (needed for assignment dropdowns, etc.)
  {
    table: 'users',
    role: 'admin',
    filter: () => true,
  },
  {
    table: 'users',
    role: 'manager',
    filter: () => true,
  },
  {
    table: 'users',
    role: 'subcontractor',
    filter: () => true,
  },
  {
    table: 'users',
    role: 'broker',
    filter: () => true,
  },
];

/**
 * Get RBAC filter function for a table and role
 */
export function getRBACFilter(table: string, role: string): RBACFilterFn | null {
  const rule = RBAC_RULES.find(r => r.table === table && r.role === role);
  return rule ? rule.filter : null;
}

/**
 * Apply RBAC filtering to a dataset
 */
export function applyRBACFilter(
  table: string,
  data: any[],
  user: RBACUser | null
): any[] {
  // No user or admin role - no filtering
  if (!user || user.role === 'admin') {
    return data;
  }

  const filterFn = getRBACFilter(table, user.role);
  if (!filterFn) {
    return data; // No RBAC rules for this table/role - return all data
  }

  return data.filter(record => filterFn(user, record));
}
