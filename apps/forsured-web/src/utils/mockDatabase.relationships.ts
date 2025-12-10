import MockDatabase from './mockDataStore';
import { applyRBACFilter } from './mockDatabase.rbac';

// Relationship types
export type RelationshipType = 'one-to-many' | 'many-to-one';

// Relationship definition
export interface Relationship {
  fromTable: string;
  toTable: string;
  foreignKey: string; // FK column in the child table
  type: RelationshipType;
  fieldName: string; // Name to use in nested result (e.g., 'documents', 'project')
}

/**
 * All foreign key relationships in the schema
 * Format: fromTable defines where the data will be nested
 */
export const RELATIONSHIPS: Relationship[] = [
  // ========== PROJECTS ==========
  // One-to-many: projects → documents
  {
    fromTable: 'projects',
    toTable: 'documents',
    foreignKey: 'project_id',
    type: 'one-to-many',
    fieldName: 'documents',
  },
  // One-to-many: projects → tasks
  {
    fromTable: 'projects',
    toTable: 'tasks',
    foreignKey: 'project_id',
    type: 'one-to-many',
    fieldName: 'tasks',
  },
  // One-to-many: projects → requirements
  {
    fromTable: 'projects',
    toTable: 'requirements',
    foreignKey: 'project_id',
    type: 'one-to-many',
    fieldName: 'requirements',
  },
  // One-to-many: projects → compliance_scores
  {
    fromTable: 'projects',
    toTable: 'compliance_scores',
    foreignKey: 'project_id',
    type: 'one-to-many',
    fieldName: 'compliance_scores',
  },

  // ========== DOCUMENTS ==========
  // Many-to-one: documents → projects
  {
    fromTable: 'documents',
    toTable: 'projects',
    foreignKey: 'project_id',
    type: 'many-to-one',
    fieldName: 'project',
  },
  // Many-to-one: documents → subcontractors
  {
    fromTable: 'documents',
    toTable: 'subcontractors',
    foreignKey: 'subcontractor_id',
    type: 'many-to-one',
    fieldName: 'subcontractor',
  },
  // Many-to-one: documents → policies
  {
    fromTable: 'documents',
    toTable: 'policies',
    foreignKey: 'policy_id',
    type: 'many-to-one',
    fieldName: 'policy',
  },
  // Many-to-one: documents → users (owner)
  {
    fromTable: 'documents',
    toTable: 'users',
    foreignKey: 'owner_user_id',
    type: 'many-to-one',
    fieldName: 'owner',
  },
  // Many-to-one: documents → users (uploaded_by)
  {
    fromTable: 'documents',
    toTable: 'users',
    foreignKey: 'uploaded_by_user_id',
    type: 'many-to-one',
    fieldName: 'uploaded_by',
  },

  // ========== POLICIES ==========
  // Many-to-one: policies → subcontractors
  {
    fromTable: 'policies',
    toTable: 'subcontractors',
    foreignKey: 'subcontractor_id',
    type: 'many-to-one',
    fieldName: 'subcontractor',
  },
  // One-to-many: policies → endorsements
  {
    fromTable: 'policies',
    toTable: 'endorsements',
    foreignKey: 'policy_id',
    type: 'one-to-many',
    fieldName: 'endorsements',
  },

  // ========== ENDORSEMENTS ==========
  // Many-to-one: endorsements → policies
  {
    fromTable: 'endorsements',
    toTable: 'policies',
    foreignKey: 'policy_id',
    type: 'many-to-one',
    fieldName: 'policy',
  },
  // Many-to-one: endorsements → users (verified_by)
  {
    fromTable: 'endorsements',
    toTable: 'users',
    foreignKey: 'verified_by_user_id',
    type: 'many-to-one',
    fieldName: 'verified_by',
  },

  // ========== REQUIREMENTS ==========
  // Many-to-one: requirements → projects
  {
    fromTable: 'requirements',
    toTable: 'projects',
    foreignKey: 'project_id',
    type: 'many-to-one',
    fieldName: 'project',
  },

  // ========== COMPLIANCE_SCORES ==========
  // Many-to-one: compliance_scores → projects
  {
    fromTable: 'compliance_scores',
    toTable: 'projects',
    foreignKey: 'project_id',
    type: 'many-to-one',
    fieldName: 'project',
  },
  // Many-to-one: compliance_scores → subcontractors
  {
    fromTable: 'compliance_scores',
    toTable: 'subcontractors',
    foreignKey: 'subcontractor_id',
    type: 'many-to-one',
    fieldName: 'subcontractor',
  },
  // Many-to-one: compliance_scores → users (evaluated_by)
  {
    fromTable: 'compliance_scores',
    toTable: 'users',
    foreignKey: 'evaluated_by_user_id',
    type: 'many-to-one',
    fieldName: 'evaluated_by',
  },

  // ========== TASKS ==========
  // Many-to-one: tasks → projects
  {
    fromTable: 'tasks',
    toTable: 'projects',
    foreignKey: 'project_id',
    type: 'many-to-one',
    fieldName: 'project',
  },
  // Many-to-one: tasks → users (created_by)
  {
    fromTable: 'tasks',
    toTable: 'users',
    foreignKey: 'created_by_user_id',
    type: 'many-to-one',
    fieldName: 'created_by',
  },
  // Many-to-one: tasks → users (assigned_to)
  {
    fromTable: 'tasks',
    toTable: 'users',
    foreignKey: 'assigned_to_user_id',
    type: 'many-to-one',
    fieldName: 'assigned_to',
  },

  // ========== SUBCONTRACTORS ==========
  // One-to-many: subcontractors → documents
  {
    fromTable: 'subcontractors',
    toTable: 'documents',
    foreignKey: 'subcontractor_id',
    type: 'one-to-many',
    fieldName: 'documents',
  },
  // One-to-many: subcontractors → policies
  {
    fromTable: 'subcontractors',
    toTable: 'policies',
    foreignKey: 'subcontractor_id',
    type: 'one-to-many',
    fieldName: 'policies',
  },
  // One-to-many: subcontractors → compliance_scores
  {
    fromTable: 'subcontractors',
    toTable: 'compliance_scores',
    foreignKey: 'subcontractor_id',
    type: 'one-to-many',
    fieldName: 'compliance_scores',
  },
];

/**
 * Parse nested select syntax
 * Examples:
 *   '*, documents(*)' → { baseColumns: ['*'], nested: [{ table: 'documents', columns: ['*'] }] }
 *   'id, name, tasks(id, title)' → { baseColumns: ['id', 'name'], nested: [{ table: 'tasks', columns: ['id', 'title'] }] }
 */
export interface ParsedSelect {
  baseColumns: string[];
  nested: Array<{
    table: string;
    columns: string[];
  }>;
}

export function parseSelectWithNested(selectString: string): ParsedSelect {
  const result: ParsedSelect = {
    baseColumns: [],
    nested: [],
  };

  // Match nested queries: tableName(columns) or tableName(*)
  const nestedRegex = /(\w+)\(([^)]+)\)/g;
  const nestedMatches = [...selectString.matchAll(nestedRegex)];

  // Extract nested queries
  nestedMatches.forEach(match => {
    const table = match[1];
    const columns = match[2].split(',').map(c => c.trim());
    result.nested.push({ table, columns });
  });

  // Remove nested queries from select string to get base columns
  let baseString = selectString.replace(nestedRegex, '').trim();

  // Clean up commas
  baseString = baseString.replace(/,\s*,/g, ',').replace(/^,|,$/g, '');

  // Parse base columns
  if (baseString) {
    result.baseColumns = baseString.split(',').map(c => c.trim()).filter(c => c);
  }

  // If no base columns specified but nested exists, default to '*'
  if (result.baseColumns.length === 0 && result.nested.length > 0) {
    result.baseColumns = ['*'];
  }

  return result;
}

/**
 * Find relationship between two tables
 */
export function findRelationship(
  fromTable: string,
  toTable: string
): Relationship | null {
  return (
    RELATIONSHIPS.find(
      r => r.fromTable === fromTable && r.fieldName === toTable
    ) || null
  );
}

/**
 * Resolve nested relationships for a set of records
 * Uses batched queries for efficiency
 */
export function resolveRelationships(
  fromTable: string,
  records: any[],
  nested: Array<{ table: string; columns: string[] }>,
  currentUser: any = null
): any[] {
  if (records.length === 0 || nested.length === 0) {
    return records;
  }

  // Create a copy of records to avoid mutation
  const enrichedRecords = records.map(r => ({ ...r }));

  // Process each nested query
  nested.forEach(({ table: nestedTable, columns: nestedColumns }) => {
    const relationship = findRelationship(fromTable, nestedTable);
    if (!relationship) {
      console.warn(
        `No relationship found from ${fromTable} to ${nestedTable}`
      );
      return;
    }

    if (relationship.type === 'one-to-many') {
      // Fetch all related records in one query
      const parentIds = records.map(r => r.id);
      let allRelatedRecords = MockDatabase.getAll(relationship.toTable);

      // Apply RBAC filtering to related records
      allRelatedRecords = applyRBACFilter(
        relationship.toTable,
        allRelatedRecords,
        currentUser
      );

      // Filter to only records related to our parents
      allRelatedRecords = allRelatedRecords.filter((record: any) =>
        parentIds.includes(record[relationship.foreignKey])
      );

      // Project columns if specific columns requested
      if (nestedColumns.length > 0 && !nestedColumns.includes('*')) {
        allRelatedRecords = allRelatedRecords.map((record: any) => {
          const projected: any = {};
          nestedColumns.forEach(col => {
            if (col in record) {
              projected[col] = record[col];
            }
          });
          return projected;
        });
      }

      // Attach related records to each parent
      enrichedRecords.forEach(record => {
        record[relationship.fieldName] = allRelatedRecords.filter(
          (related: any) => related[relationship.foreignKey] === record.id
        );
      });
    } else {
      // many-to-one
      // Fetch all related records in one query
      const foreignKeyValues = records
        .map(r => r[relationship.foreignKey])
        .filter(v => v != null);
      const uniqueForeignKeys = [...new Set(foreignKeyValues)];

      let allRelatedRecords = MockDatabase.getAll(relationship.toTable);

      // Apply RBAC filtering to related records
      allRelatedRecords = applyRBACFilter(
        relationship.toTable,
        allRelatedRecords,
        currentUser
      );

      // Filter to only records we need
      allRelatedRecords = allRelatedRecords.filter((record: any) =>
        uniqueForeignKeys.includes(record.id)
      );

      // Create lookup map
      const relatedMap = new Map();
      allRelatedRecords.forEach((record: any) => {
        // Project columns if specific columns requested
        if (nestedColumns.length > 0 && !nestedColumns.includes('*')) {
          const projected: any = {};
          nestedColumns.forEach(col => {
            if (col in record) {
              projected[col] = record[col];
            }
          });
          relatedMap.set(record.id, projected);
        } else {
          relatedMap.set(record.id, record);
        }
      });

      // Attach related record to each parent
      enrichedRecords.forEach(record => {
        const foreignKeyValue = record[relationship.foreignKey];
        record[relationship.fieldName] =
          relatedMap.get(foreignKeyValue) || null;
      });
    }
  });

  return enrichedRecords;
}
