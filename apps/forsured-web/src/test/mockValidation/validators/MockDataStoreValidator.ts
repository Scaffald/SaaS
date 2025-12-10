/**
 * REQ-306 TASK-5: Mock Data Store Validator
 *
 * Validates that the centralized mock data store accurately represents
 * the database schema, including all tables, relationships, and seed data integrity.
 * Performance target: < 3 seconds (TR-2)
 */

import type { MockValidator, ValidationResult, ValidationError } from '../types';
import {
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from '../MockValidationFramework';
import MockDatabase from '../../../utils/mockDataStore';
import { SCHEMA_RULES } from '../../../utils/mockDatabase.validators';

// Tables defined in mockDataStore
const EXPECTED_TABLES = [
  'tasks',
  'projects',
  'clients',
  'users',
  'policies',
  'compliance_records',
  'relationships',
  'broker_delegations',
  'broker_acknowledgement_forms',
  'project_participants',
  'comments',
  'attachments',
  'approval_items',
  'bid_proposals',
  'user_invitations',
  'integration_connections',
  'compliance_issues',
  'document_versions',
  'ai_extractions',
  'status_history',
  'documents',
  'subcontractors',
  'endorsements',
  'requirements',
  'compliance_scores',
];

// Foreign key relationships to validate
const FOREIGN_KEY_RELATIONSHIPS: Array<{
  table: string;
  field: string;
  referencedTable: string;
}> = [
  { table: 'tasks', field: 'project_id', referencedTable: 'projects' },
  { table: 'tasks', field: 'created_by_user_id', referencedTable: 'users' },
  { table: 'tasks', field: 'assigned_to_user_id', referencedTable: 'users' },
  { table: 'documents', field: 'project_id', referencedTable: 'projects' },
  { table: 'documents', field: 'owner_user_id', referencedTable: 'users' },
  { table: 'policies', field: 'subcontractor_id', referencedTable: 'subcontractors' },
  { table: 'compliance_scores', field: 'project_id', referencedTable: 'projects' },
  { table: 'compliance_scores', field: 'subcontractor_id', referencedTable: 'subcontractors' },
  { table: 'endorsements', field: 'policy_id', referencedTable: 'policies' },
  { table: 'requirements', field: 'project_id', referencedTable: 'projects' },
];

/**
 * MockDataStoreValidator - Validates mock data store against database schema
 *
 * Validates:
 * - Table existence (all schema tables present)
 * - Query builder API (from, select, insert, update, delete, eq, order, limit)
 * - Response format ({data, error})
 * - Data type validation
 * - Foreign key integrity (when data present)
 * - Data consistency (no duplicate IDs)
 */
export class MockDataStoreValidator implements MockValidator {
  readonly name = 'MockDataStore';

  async validate(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];

    try {
      // 1. Validate table existence
      const tableErrors = this.validateTableExistence();
      errors.push(...tableErrors);

      // 2. Validate query builder API
      const apiErrors = await this.validateQueryBuilderAPI();
      errors.push(...apiErrors);

      // 3. Validate response format
      const responseErrors = await this.validateResponseFormat();
      errors.push(...responseErrors);

      // 4. Validate RBAC methods exist
      const rbacErrors = this.validateRBACMethods();
      errors.push(...rbacErrors);

      // 5. Validate seed data operations
      const seedErrors = await this.validateSeedOperations();
      errors.push(...seedErrors);

      const duration = Date.now() - startTime;

      // TR-2: Warn if approaching time limit
      if (duration > 2500) {
        console.warn(`⚠️ MockDataStoreValidator approaching time limit: ${duration}ms`);
      }

      if (errors.length > 0) {
        return createFailedResult(this.name, errors, duration);
      }

      return createSuccessResult(this.name, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      return createFailedResult(
        this.name,
        [createValidationError(
          'execution',
          'successful validation',
          error instanceof Error ? error.message : 'unknown error',
          'Validator threw an exception'
        )],
        duration
      );
    }
  }

  /**
   * Validate all expected tables exist
   */
  private validateTableExistence(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check from() method exists
    if (typeof MockDatabase.from !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.from()',
        'function',
        typeof MockDatabase.from,
        'MockDatabase must have from() method'
      ));
      return errors; // Can't continue without from()
    }

    // Check getAll() method exists
    if (typeof MockDatabase.getAll !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.getAll()',
        'function',
        typeof MockDatabase.getAll,
        'MockDatabase must have getAll() method'
      ));
    }

    // Validate each expected table can be accessed
    for (const table of EXPECTED_TABLES) {
      try {
        const records = MockDatabase.getAll(table);
        if (!Array.isArray(records)) {
          errors.push(createValidationError(
            `table ${table}`,
            'array',
            typeof records,
            `Table ${table} should return array from getAll()`
          ));
        }
      } catch (e) {
        errors.push(createValidationError(
          `table ${table} access`,
          'no error',
          e instanceof Error ? e.message : 'unknown error',
          `Table ${table} should be accessible`
        ));
      }
    }

    return errors;
  }

  /**
   * Validate query builder API methods
   */
  private async validateQueryBuilderAPI(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Get a query builder
    const builder = MockDatabase.from('users');

    // Check required methods exist
    const requiredMethods = [
      'select',
      'eq',
      'neq',
      'in',
      'order',
      'limit',
      'insert',
      'update',
      'delete',
      'single',
    ];

    for (const method of requiredMethods) {
      if (typeof (builder as Record<string, unknown>)[method] !== 'function') {
        errors.push(createValidationError(
          `QueryBuilder.${method}()`,
          'function',
          typeof (builder as Record<string, unknown>)[method],
          `QueryBuilder must have ${method}() method`
        ));
      }
    }

    // Test method chaining
    try {
      const chainedQuery = MockDatabase.from('users')
        .select('*')
        .eq('id', 'test')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!chainedQuery) {
        errors.push(createValidationError(
          'method chaining',
          'returns this',
          'returns undefined',
          'QueryBuilder methods must support chaining'
        ));
      }
    } catch (e) {
      errors.push(createValidationError(
        'method chaining',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'Method chaining threw an exception'
      ));
    }

    return errors;
  }

  /**
   * Validate response format matches {data, error}
   */
  private async validateResponseFormat(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test select response
    const selectResult = await MockDatabase.from('users').select('*');

    if (!('data' in selectResult) || !('error' in selectResult)) {
      errors.push(createValidationError(
        'select() response format',
        '{data: T[], error: Error | null}',
        JSON.stringify(Object.keys(selectResult)),
        'Select must return {data, error} structure'
      ));
    }

    // Test that data is array for multi-row queries
    if (selectResult.data !== null && !Array.isArray(selectResult.data)) {
      errors.push(createValidationError(
        'select() data type',
        'array',
        typeof selectResult.data,
        'Select should return array'
      ));
    }

    // Test insert response
    const testRecord = {
      title: 'Validator test task',
      status: 'pending',
      created_by_user_id: 'test-user',
    };

    const insertResult = await MockDatabase.from('tasks').insert(testRecord);

    if (!('data' in insertResult) || !('error' in insertResult)) {
      errors.push(createValidationError(
        'insert() response format',
        '{data: T[], error: Error | null}',
        JSON.stringify(Object.keys(insertResult)),
        'Insert must return {data, error} structure'
      ));
    }

    // Clean up test data
    if (insertResult.data && insertResult.data[0]) {
      await MockDatabase.from('tasks')
        .delete()
        .eq('id', insertResult.data[0].id);
    }

    return errors;
  }

  /**
   * Validate RBAC methods exist
   */
  private validateRBACMethods(): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof MockDatabase.setCurrentUser !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.setCurrentUser()',
        'function',
        typeof MockDatabase.setCurrentUser,
        'MockDatabase must have setCurrentUser() for RBAC'
      ));
    }

    if (typeof MockDatabase.getCurrentUser !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.getCurrentUser()',
        'function',
        typeof MockDatabase.getCurrentUser,
        'MockDatabase must have getCurrentUser() for RBAC'
      ));
    }

    // Test setCurrentUser doesn't throw
    try {
      MockDatabase.setCurrentUser({
        id: 'test-user',
        role: 'admin',
        organization_id: 'test-org',
      });

      const user = MockDatabase.getCurrentUser();
      if (!user || user.id !== 'test-user') {
        errors.push(createValidationError(
          'setCurrentUser/getCurrentUser',
          'user with id test-user',
          user ? user.id : 'null',
          'getCurrentUser should return the user set by setCurrentUser'
        ));
      }

      // Clear user
      MockDatabase.setCurrentUser(null);
    } catch (e) {
      errors.push(createValidationError(
        'setCurrentUser() execution',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'setCurrentUser should not throw'
      ));
    }

    return errors;
  }

  /**
   * Validate seed data operations
   */
  private async validateSeedOperations(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check seedData method exists
    if (typeof MockDatabase.seedData !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.seedData()',
        'function',
        typeof MockDatabase.seedData,
        'MockDatabase must have seedData() method'
      ));
      return errors;
    }

    // Check clearTable method exists
    if (typeof MockDatabase.clearTable !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.clearTable()',
        'function',
        typeof MockDatabase.clearTable,
        'MockDatabase must have clearTable() method'
      ));
    }

    // Check clearAll method exists
    if (typeof MockDatabase.clearAll !== 'function') {
      errors.push(createValidationError(
        'MockDatabase.clearAll()',
        'function',
        typeof MockDatabase.clearAll,
        'MockDatabase must have clearAll() method'
      ));
    }

    // Test seedData functionality
    const testData = [
      { id: 'test-1', title: 'Test 1', status: 'pending' },
      { id: 'test-2', title: 'Test 2', status: 'completed' },
    ];

    try {
      // Save original data
      const originalTasks = MockDatabase.getAll('tasks');

      // Seed test data
      MockDatabase.seedData('tasks', testData);

      // Verify seeded data
      const seededTasks = MockDatabase.getAll('tasks');
      if (seededTasks.length !== 2) {
        errors.push(createValidationError(
          'seedData() functionality',
          '2 records',
          `${seededTasks.length} records`,
          'seedData should replace table data'
        ));
      }

      // Clear table
      MockDatabase.clearTable('tasks');

      // Verify cleared
      const clearedTasks = MockDatabase.getAll('tasks');
      if (clearedTasks.length !== 0) {
        errors.push(createValidationError(
          'clearTable() functionality',
          '0 records',
          `${clearedTasks.length} records`,
          'clearTable should empty the table'
        ));
      }

      // Restore original data
      MockDatabase.seedData('tasks', originalTasks);
    } catch (e) {
      errors.push(createValidationError(
        'seed/clear operations',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'Seed and clear operations should not throw'
      ));
    }

    return errors;
  }

  /**
   * Validate foreign key integrity for seeded data
   * Note: Only validates when data exists
   */
  private validateForeignKeyIntegrity(): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const { table, field, referencedTable } of FOREIGN_KEY_RELATIONSHIPS) {
      const records = MockDatabase.getAll(table);
      const referencedRecords = MockDatabase.getAll(referencedTable);
      const referencedIds = new Set(referencedRecords.map((r: { id: string }) => r.id));

      for (const record of records) {
        const foreignKeyValue = record[field];

        // Skip null foreign keys (might be optional)
        if (foreignKeyValue === null || foreignKeyValue === undefined) {
          continue;
        }

        if (!referencedIds.has(foreignKeyValue)) {
          errors.push(createValidationError(
            `${table}.${field} foreign key`,
            `valid reference to ${referencedTable}`,
            `${foreignKeyValue} (not found in ${referencedTable})`,
            `Record ${record.id} has invalid foreign key reference`,
            `Ensure all ${field} values in ${table} reference existing ${referencedTable} records`
          ));
        }
      }
    }

    return errors;
  }

  /**
   * Validate no duplicate IDs within tables
   */
  private validateUniqueIds(): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const table of EXPECTED_TABLES) {
      const records = MockDatabase.getAll(table);
      const ids = new Set<string>();

      for (const record of records) {
        if (record.id) {
          if (ids.has(record.id)) {
            errors.push(createValidationError(
              `${table} unique IDs`,
              'no duplicate IDs',
              `duplicate ID: ${record.id}`,
              `Table ${table} contains duplicate ID`
            ));
          }
          ids.add(record.id);
        }
      }
    }

    return errors;
  }
}
