/**
 * REQ-306 TASK-2: MockDatabase Validator
 *
 * Validates that MockDatabase accurately replicates the Supabase client API.
 * Performance target: < 5 seconds (TR-2)
 */

import type { MockValidator, ValidationResult, ValidationError } from '../types';
import {
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from '../MockValidationFramework';
import { MockDatabase } from '../../../lib/database/mockDatabase';

/**
 * MockDatabaseValidator - Validates MockDatabase against Supabase API contract
 *
 * Validates:
 * - API method signatures (from, select, insert, update, delete, eq, neq, order, limit, single)
 * - Response format ({data, error})
 * - PostgreSQL error codes (23502, 23505, PGRST116)
 * - Constraint enforcement (required fields, enums, numeric ranges, dates)
 * - RBAC filtering
 */
export class MockDatabaseValidator implements MockValidator {
  readonly name = 'MockDatabase';

  async validate(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];

    try {
      const db = new MockDatabase();
      db.seed(); // Initialize with seed data

      // 1. Validate API signatures
      const apiErrors = this.validateAPISignatures(db);
      errors.push(...apiErrors);

      // 2. Validate response format
      const responseErrors = await this.validateResponseFormat(db);
      errors.push(...responseErrors);

      // 3. Validate error codes
      const errorCodeErrors = await this.validateErrorCodes(db);
      errors.push(...errorCodeErrors);

      // 4. Validate constraint enforcement
      const constraintErrors = await this.validateConstraints(db);
      errors.push(...constraintErrors);

      // 5. Validate RBAC filtering
      const rbacErrors = await this.validateRBAC(db);
      errors.push(...rbacErrors);

      const duration = Date.now() - startTime;

      // TR-2: Warn if approaching time limit
      if (duration > 4000) {
        console.warn(`⚠️ MockDatabaseValidator approaching time limit: ${duration}ms`);
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
   * Validate that all required API methods exist
   */
  private validateAPISignatures(db: MockDatabase): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check from() method returns query builder
    if (typeof db.from !== 'function') {
      errors.push(createValidationError(
        'from()',
        'function that returns QueryBuilder',
        typeof db.from,
        'MockDatabase must have from() method',
        'Implement from() method that returns a QueryBuilder instance'
      ));
      return errors; // Can't continue if from() doesn't exist
    }

    // Check QueryBuilder methods
    const queryBuilder = db.from('users');
    const requiredMethods = [
      'select',
      'insert',
      'update',
      'delete',
      'eq',
      'neq',
      'order',
      'limit',
      'single',
    ];

    for (const method of requiredMethods) {
      if (typeof (queryBuilder as Record<string, unknown>)[method] !== 'function') {
        errors.push(createValidationError(
          `QueryBuilder.${method}()`,
          'function',
          typeof (queryBuilder as Record<string, unknown>)[method],
          `QueryBuilder must have ${method}() method`,
          `Implement ${method}() method on QueryBuilder class`
        ));
      }
    }

    // Check method chaining works
    try {
      const chainedQuery = db.from('users').select('*').eq('id', 'test');
      if (!chainedQuery) {
        errors.push(createValidationError(
          'method chaining',
          'returns this for chaining',
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

    // Check setCurrentUser and getCurrentUser exist
    if (typeof db.setCurrentUser !== 'function') {
      errors.push(createValidationError(
        'setCurrentUser()',
        'function',
        typeof db.setCurrentUser,
        'MockDatabase must have setCurrentUser() for RBAC'
      ));
    }

    if (typeof db.getCurrentUser !== 'function') {
      errors.push(createValidationError(
        'getCurrentUser()',
        'function',
        typeof db.getCurrentUser,
        'MockDatabase must have getCurrentUser() for RBAC'
      ));
    }

    return errors;
  }

  /**
   * Validate response format matches {data, error}
   */
  private async validateResponseFormat(db: MockDatabase): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test select response
    const selectResult = await db.from('users').select('*');

    if (!('data' in selectResult) || !('error' in selectResult)) {
      errors.push(createValidationError(
        'select() response format',
        '{data: T | null, error: PostgrestError | null}',
        JSON.stringify(Object.keys(selectResult)),
        'Select must return {data, error} structure',
        'Ensure QueryBuilder.execute() returns {data, error}'
      ));
    }

    // Test that data is array for multi-row queries
    if (selectResult.data !== null && !Array.isArray(selectResult.data)) {
      errors.push(createValidationError(
        'select() data type',
        'array for multi-row queries',
        typeof selectResult.data,
        'Select without single() should return array'
      ));
    }

    // Test single() returns single object (not array)
    const singleResult = await db.from('users').select('*').eq('id', 'user-manager-1').single();

    if (singleResult.data !== null && Array.isArray(singleResult.data)) {
      errors.push(createValidationError(
        'single() data type',
        'single object (not array)',
        'array',
        'single() should return single row, not array'
      ));
    }

    // Test insert response format
    const insertResult = await db.from('users').insert({
      email: 'validator-test@example.com',
      role: 'manager',
    });

    if (!('data' in insertResult) || !('error' in insertResult)) {
      errors.push(createValidationError(
        'insert() response format',
        '{data: T | null, error: PostgrestError | null}',
        JSON.stringify(Object.keys(insertResult)),
        'Insert must return {data, error} structure'
      ));
    }

    return errors;
  }

  /**
   * Validate PostgreSQL error codes
   */
  private async validateErrorCodes(db: MockDatabase): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test 23502: NOT NULL violation
    const nullResult = await db.from('users').insert({
      email: null as unknown as string,
      role: 'manager',
    });

    if (nullResult.error?.code !== '23502') {
      errors.push(createValidationError(
        'NOT NULL violation error code',
        '23502',
        nullResult.error?.code || 'no error',
        'Missing required field should return error code 23502',
        'Check validateRow() returns correct error code for required fields'
      ));
    }

    // Test 23505: Unique constraint violation
    const uniqueResult = await db.from('users').insert({
      email: 'manager1@example.com', // Already exists in seed data
      role: 'manager',
    });

    if (uniqueResult.error?.code !== '23505') {
      errors.push(createValidationError(
        'unique constraint violation error code',
        '23505',
        uniqueResult.error?.code || 'no error',
        'Duplicate key should return error code 23505',
        'Check validateRow() returns correct error code for unique constraint'
      ));
    }

    // Test PGRST116: Row not found
    const notFoundResult = await db.from('users')
      .select('*')
      .eq('id', 'non-existent-id')
      .single();

    if (notFoundResult.error?.code !== 'PGRST116') {
      errors.push(createValidationError(
        'row not found error code',
        'PGRST116',
        notFoundResult.error?.code || 'no error',
        'single() with no results should return PGRST116',
        'Check single() execution returns PGRST116 when no rows found'
      ));
    }

    // Test error format has required fields
    if (notFoundResult.error) {
      const requiredErrorFields = ['message', 'code'];
      for (const field of requiredErrorFields) {
        if (!(field in notFoundResult.error)) {
          errors.push(createValidationError(
            `error.${field}`,
            'present in error object',
            'missing',
            `Error object must have ${field} property`
          ));
        }
      }
    }

    return errors;
  }

  /**
   * Validate constraint enforcement
   */
  private async validateConstraints(db: MockDatabase): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test enum validation
    const invalidEnumResult = await db.from('users').insert({
      email: 'enum-test@example.com',
      role: 'invalid_role' as 'manager',
    });

    if (!invalidEnumResult.error) {
      errors.push(createValidationError(
        'enum validation',
        'error for invalid enum value',
        'no error',
        'Invalid enum values should be rejected',
        'Add enum validation to validateRow()'
      ));
    }

    // Test numeric constraint (score 0-100)
    // First insert valid records to set up foreign keys
    const projectResult = await db.from('projects').select('*').limit(1);
    const subResult = await db.from('subcontractors').select('*').limit(1);

    if (projectResult.data?.[0] && subResult.data?.[0]) {
      const invalidScoreResult = await db.from('compliance_scores').insert({
        project_id: projectResult.data[0].id,
        subcontractor_id: subResult.data[0].id,
        score: 150, // Invalid: exceeds max 100
        last_evaluated: new Date().toISOString(),
        gaps: [],
      });

      if (!invalidScoreResult.error) {
        errors.push(createValidationError(
          'numeric max constraint (score <= 100)',
          'error for value > 100',
          'no error',
          'Score > 100 should be rejected',
          'Add max constraint validation'
        ));
      }

      const negativeScoreResult = await db.from('compliance_scores').insert({
        project_id: projectResult.data[0].id,
        subcontractor_id: subResult.data[0].id,
        score: -10, // Invalid: below min 0
        last_evaluated: new Date().toISOString(),
        gaps: [],
      });

      if (!negativeScoreResult.error) {
        errors.push(createValidationError(
          'numeric min constraint (score >= 0)',
          'error for value < 0',
          'no error',
          'Score < 0 should be rejected',
          'Add min constraint validation'
        ));
      }
    }

    // Test date constraint (end_date > start_date for policies)
    const docResult = await db.from('documents').select('*').limit(1);

    if (docResult.data?.[0]) {
      const invalidDateResult = await db.from('policies').insert({
        document_id: docResult.data[0].id,
        policy_number: 'POL-INVALID-DATE',
        carrier: 'Test Carrier',
        start_date: '2024-12-31',
        end_date: '2024-01-01', // Invalid: end before start
        coverage_type: 'general_liability',
        coverage_amount: 1000000,
      });

      if (!invalidDateResult.error) {
        errors.push(createValidationError(
          'date constraint (end_date > start_date)',
          'error for end_date before start_date',
          'no error',
          'Policy end_date must be after start_date',
          'Add date constraint validation'
        ));
      }
    }

    return errors;
  }

  /**
   * Validate RBAC filtering
   */
  private async validateRBAC(db: MockDatabase): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Test that admin sees all projects
    db.setCurrentUser({ id: 'user-admin-1', role: 'admin' });
    const adminProjects = await db.from('projects').select('*');

    if (!adminProjects.data || adminProjects.data.length === 0) {
      errors.push(createValidationError(
        'RBAC: admin access',
        'admin sees all projects',
        `${adminProjects.data?.length || 0} projects`,
        'Admin role should have access to all data'
      ));
    }

    // Test that manager only sees their own projects
    db.setCurrentUser({ id: 'user-manager-1', role: 'manager' });
    const managerProjects = await db.from('projects').select('*');

    if (!managerProjects.data) {
      errors.push(createValidationError(
        'RBAC: manager access',
        'manager sees their own projects',
        'no data returned',
        'Manager should see their own projects'
      ));
    } else {
      // Check all returned projects belong to this manager
      const invalidProjects = managerProjects.data.filter(
        (p: Record<string, unknown>) => p.manager_id !== 'user-manager-1'
      );

      if (invalidProjects.length > 0) {
        errors.push(createValidationError(
          'RBAC: manager filtering',
          'only manager\'s own projects',
          `${invalidProjects.length} projects from other managers`,
          'Manager should only see projects they manage',
          'Check applyRBACFiltering() in QueryBuilder'
        ));
      }
    }

    // Test that setCurrentUser affects subsequent queries
    db.setCurrentUser(null); // Clear user
    const noUserProjects = await db.from('projects').select('*');

    // Without user, should return all data (no RBAC applied)
    if (!noUserProjects.data || noUserProjects.data.length === 0) {
      errors.push(createValidationError(
        'RBAC: no user',
        'returns all data when no user set',
        `${noUserProjects.data?.length || 0} projects`,
        'When no user is set, RBAC should not filter data'
      ));
    }

    return errors;
  }
}
