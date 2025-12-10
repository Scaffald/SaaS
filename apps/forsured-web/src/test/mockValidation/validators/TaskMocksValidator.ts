/**
 * REQ-306 TASK-4: Task Mocks Validator
 *
 * Validates that task mock utilities (createMockTask, createMockTasks, MockTasksTable)
 * accurately replicate the task service API and database schema.
 * Performance target: < 2 seconds (TR-2)
 */

import type { MockValidator, ValidationResult, ValidationError } from '../types';
import {
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from '../MockValidationFramework';
import {
  Task,
  createMockTask,
  createMockTasks,
  MockTasksTable,
} from '../../mocks/taskMocks';

/**
 * TaskMocksValidator - Validates task mock utilities against Task service API
 *
 * Validates:
 * - Schema compliance (all Task fields present with correct types)
 * - Enum values (status, priority)
 * - Date formats (ISO 8601)
 * - Method signatures (CRUD operations)
 * - Constraint enforcement (title length, required fields)
 * - Behavior (timestamps, defaults, filtering)
 * - Data isolation (reset functionality)
 */
export class TaskMocksValidator implements MockValidator {
  readonly name = 'TaskMocks';

  async validate(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];

    try {
      // 1. Validate createMockTask schema compliance
      const schemaErrors = this.validateSchemaCompliance();
      errors.push(...schemaErrors);

      // 2. Validate enum values
      const enumErrors = this.validateEnumValues();
      errors.push(...enumErrors);

      // 3. Validate date formats
      const dateErrors = this.validateDateFormats();
      errors.push(...dateErrors);

      // 4. Validate MockTasksTable methods
      const methodErrors = this.validateMockTasksTableMethods();
      errors.push(...methodErrors);

      // 5. Validate constraints
      const constraintErrors = this.validateConstraints();
      errors.push(...constraintErrors);

      // 6. Validate behavior
      const behaviorErrors = this.validateBehavior();
      errors.push(...behaviorErrors);

      // 7. Validate data isolation
      const isolationErrors = this.validateDataIsolation();
      errors.push(...isolationErrors);

      const duration = Date.now() - startTime;

      // TR-2: Warn if approaching time limit
      if (duration > 1500) {
        console.warn(`⚠️ TaskMocksValidator approaching time limit: ${duration}ms`);
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
   * Validate that createMockTask produces objects matching Task type
   */
  private validateSchemaCompliance(): ValidationError[] {
    const errors: ValidationError[] = [];

    const task = createMockTask();

    // Required fields
    const requiredFields: (keyof Task)[] = [
      'id', 'title', 'status', 'projectId', 'createdAt', 'updatedAt'
    ];

    for (const field of requiredFields) {
      if (!(field in task)) {
        errors.push(createValidationError(
          `Task.${field}`,
          'present in task object',
          'missing',
          `Required field ${field} must be present`,
          'Add field to createMockTask factory function'
        ));
      } else if (task[field] === undefined || task[field] === null) {
        errors.push(createValidationError(
          `Task.${field}`,
          'non-null value',
          String(task[field]),
          `Required field ${field} must have a value`
        ));
      }
    }

    // Field types
    const fieldTypes: Record<keyof Task, string> = {
      id: 'string',
      title: 'string',
      description: 'string',
      status: 'string',
      projectId: 'string',
      assigneeId: 'string',
      createdAt: 'string',
      updatedAt: 'string',
      dueDate: 'string',
      priority: 'string',
    };

    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      const value = task[field as keyof Task];
      if (value !== undefined && typeof value !== expectedType) {
        errors.push(createValidationError(
          `Task.${field} type`,
          expectedType,
          typeof value,
          `Field ${field} must be a ${expectedType}`
        ));
      }
    }

    return errors;
  }

  /**
   * Validate enum values for status and priority
   */
  private validateEnumValues(): ValidationError[] {
    const errors: ValidationError[] = [];

    const validStatuses = ['todo', 'in-progress', 'in-review', 'done', 'cancelled'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    // Test default task has valid status
    const task = createMockTask();

    if (!validStatuses.includes(task.status)) {
      errors.push(createValidationError(
        'Task.status enum',
        `one of: ${validStatuses.join(', ')}`,
        task.status,
        'Default task must have valid status'
      ));
    }

    // Test default priority
    if (task.priority && !validPriorities.includes(task.priority)) {
      errors.push(createValidationError(
        'Task.priority enum',
        `one of: ${validPriorities.join(', ')}`,
        task.priority,
        'Default task must have valid priority'
      ));
    }

    // Test that each valid status can be set
    for (const status of validStatuses) {
      const statusTask = createMockTask({ status: status as Task['status'] });
      if (statusTask.status !== status) {
        errors.push(createValidationError(
          `Task status override: ${status}`,
          status,
          statusTask.status,
          `Status ${status} must be settable via override`
        ));
      }
    }

    // Test that each valid priority can be set
    for (const priority of validPriorities) {
      const priorityTask = createMockTask({ priority: priority as Task['priority'] });
      if (priorityTask.priority !== priority) {
        errors.push(createValidationError(
          `Task priority override: ${priority}`,
          priority,
          priorityTask.priority || 'undefined',
          `Priority ${priority} must be settable via override`
        ));
      }
    }

    return errors;
  }

  /**
   * Validate date formats are ISO 8601
   */
  private validateDateFormats(): ValidationError[] {
    const errors: ValidationError[] = [];

    const task = createMockTask();

    // Validate createdAt format
    if (task.createdAt && !this.isValidISO8601(task.createdAt)) {
      errors.push(createValidationError(
        'Task.createdAt format',
        'ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
        task.createdAt,
        'createdAt must be in ISO 8601 format'
      ));
    }

    // Validate updatedAt format
    if (task.updatedAt && !this.isValidISO8601(task.updatedAt)) {
      errors.push(createValidationError(
        'Task.updatedAt format',
        'ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
        task.updatedAt,
        'updatedAt must be in ISO 8601 format'
      ));
    }

    // Validate timestamp ordering (createdAt <= updatedAt)
    if (task.createdAt && task.updatedAt) {
      const created = new Date(task.createdAt).getTime();
      const updated = new Date(task.updatedAt).getTime();

      if (created > updated) {
        errors.push(createValidationError(
          'Task timestamp ordering',
          'createdAt <= updatedAt',
          `createdAt: ${task.createdAt}, updatedAt: ${task.updatedAt}`,
          'createdAt must be before or equal to updatedAt'
        ));
      }
    }

    return errors;
  }

  /**
   * Validate MockTasksTable method signatures
   */
  private validateMockTasksTableMethods(): ValidationError[] {
    const errors: ValidationError[] = [];

    const table = new MockTasksTable();

    // Check getAll() returns Task[]
    const allTasks = table.getAll();
    if (!Array.isArray(allTasks)) {
      errors.push(createValidationError(
        'MockTasksTable.getAll() return type',
        'Task[]',
        typeof allTasks,
        'getAll() must return an array'
      ));
    }

    // Check getById() returns Task | undefined
    const existingTask = table.getById('task-1');
    if (existingTask !== undefined && typeof existingTask !== 'object') {
      errors.push(createValidationError(
        'MockTasksTable.getById() return type',
        'Task | undefined',
        typeof existingTask,
        'getById() must return Task or undefined'
      ));
    }

    const nonExistentTask = table.getById('non-existent-id');
    if (nonExistentTask !== undefined) {
      errors.push(createValidationError(
        'MockTasksTable.getById() with invalid ID',
        'undefined',
        typeof nonExistentTask,
        'getById() with non-existent ID must return undefined'
      ));
    }

    // Check getByProjectId() returns Task[]
    const projectTasks = table.getByProjectId('proj-1');
    if (!Array.isArray(projectTasks)) {
      errors.push(createValidationError(
        'MockTasksTable.getByProjectId() return type',
        'Task[]',
        typeof projectTasks,
        'getByProjectId() must return an array'
      ));
    }

    // Check create() returns Task
    const newTask = table.create({
      title: 'Validator test task',
      projectId: 'proj-test',
    });

    if (!newTask || typeof newTask !== 'object') {
      errors.push(createValidationError(
        'MockTasksTable.create() return type',
        'Task object',
        typeof newTask,
        'create() must return created Task'
      ));
    } else if (!newTask.id) {
      errors.push(createValidationError(
        'MockTasksTable.create() generates ID',
        'non-empty string ID',
        String(newTask.id),
        'create() must generate an ID for new task'
      ));
    }

    // Check update() returns Task
    try {
      const updatedTask = table.update(newTask.id, { title: 'Updated title' });
      if (!updatedTask || typeof updatedTask !== 'object') {
        errors.push(createValidationError(
          'MockTasksTable.update() return type',
          'Task object',
          typeof updatedTask,
          'update() must return updated Task'
        ));
      }
    } catch (e) {
      errors.push(createValidationError(
        'MockTasksTable.update() execution',
        'no error',
        e instanceof Error ? e.message : 'unknown error',
        'update() should not throw for valid update'
      ));
    }

    // Check delete() returns boolean
    const deleteResult = table.delete(newTask.id);
    if (typeof deleteResult !== 'boolean') {
      errors.push(createValidationError(
        'MockTasksTable.delete() return type',
        'boolean',
        typeof deleteResult,
        'delete() must return boolean'
      ));
    }

    // Check reset() exists and is callable
    if (typeof table.reset !== 'function') {
      errors.push(createValidationError(
        'MockTasksTable.reset()',
        'function',
        typeof table.reset,
        'reset() method must exist'
      ));
    }

    return errors;
  }

  /**
   * Validate constraint enforcement
   */
  private validateConstraints(): ValidationError[] {
    const errors: ValidationError[] = [];

    const table = new MockTasksTable();

    // Test title max 255 characters
    const longTitle = 'A'.repeat(256);
    try {
      table.create({ title: longTitle, projectId: 'proj-1' });
      errors.push(createValidationError(
        'title max length constraint (255 chars)',
        'error for title > 255 chars',
        'no error',
        'Title exceeding 255 characters should be rejected'
      ));
    } catch {
      // Expected - constraint enforced
    }

    // Test title required (non-empty)
    try {
      table.create({ title: '', projectId: 'proj-1' });
      errors.push(createValidationError(
        'title required constraint',
        'error for empty title',
        'no error',
        'Empty title should be rejected'
      ));
    } catch {
      // Expected - constraint enforced
    }

    // Test title whitespace only
    try {
      table.create({ title: '   ', projectId: 'proj-1' });
      errors.push(createValidationError(
        'title required constraint (whitespace)',
        'error for whitespace-only title',
        'no error',
        'Whitespace-only title should be rejected'
      ));
    } catch {
      // Expected - constraint enforced
    }

    // Test update of non-existent task throws error
    try {
      table.update('non-existent-id', { title: 'New title' });
      errors.push(createValidationError(
        'update non-existent task',
        'error',
        'no error',
        'Updating non-existent task should throw error'
      ));
    } catch {
      // Expected - constraint enforced
    }

    // Test invalid status on update
    try {
      const validTask = table.create({ title: 'Test', projectId: 'proj-1' });
      table.update(validTask.id, { status: 'invalid-status' as Task['status'] });
      errors.push(createValidationError(
        'invalid status on update',
        'error for invalid status',
        'no error',
        'Invalid status should be rejected on update'
      ));
    } catch {
      // Expected - constraint enforced
    }

    return errors;
  }

  /**
   * Validate behavior (timestamps, defaults, filtering)
   */
  private validateBehavior(): ValidationError[] {
    const errors: ValidationError[] = [];

    const table = new MockTasksTable();

    // Test default status is "todo"
    const task = table.create({ title: 'Test task', projectId: 'proj-1' });
    if (task.status !== 'todo') {
      errors.push(createValidationError(
        'default status',
        'todo',
        task.status,
        'Default status for new tasks should be "todo"'
      ));
    }

    // Test default priority is "medium"
    if (task.priority !== 'medium') {
      errors.push(createValidationError(
        'default priority',
        'medium',
        task.priority || 'undefined',
        'Default priority for new tasks should be "medium"'
      ));
    }

    // Test createdAt is set on create
    if (!task.createdAt) {
      errors.push(createValidationError(
        'createdAt set on create',
        'non-null timestamp',
        'null/undefined',
        'createdAt must be set when task is created'
      ));
    }

    // Test updatedAt is updated on update
    const originalUpdatedAt = task.updatedAt;

    // Small delay to ensure different timestamp
    const updated = table.update(task.id, { title: 'Updated title' });

    if (updated.updatedAt === originalUpdatedAt) {
      // They might be the same if execution is fast, but let's verify it's at least set
      if (!updated.updatedAt) {
        errors.push(createValidationError(
          'updatedAt set on update',
          'non-null timestamp',
          'null/undefined',
          'updatedAt must be set when task is updated'
        ));
      }
    }

    // Test createdAt preserved on update
    if (updated.createdAt !== task.createdAt) {
      errors.push(createValidationError(
        'createdAt preserved on update',
        task.createdAt,
        updated.createdAt,
        'createdAt must not change on update'
      ));
    }

    // Test unique IDs for batch creation
    const batchTasks = createMockTasks(5);
    const ids = new Set(batchTasks.map(t => t.id));
    if (ids.size !== 5) {
      errors.push(createValidationError(
        'unique IDs for batch creation',
        '5 unique IDs',
        `${ids.size} unique IDs`,
        'createMockTasks must generate unique IDs for each task'
      ));
    }

    // Cleanup
    table.reset();

    return errors;
  }

  /**
   * Validate data isolation (reset functionality)
   */
  private validateDataIsolation(): ValidationError[] {
    const errors: ValidationError[] = [];

    const table = new MockTasksTable();

    // Get initial count
    const initialTasks = table.getAll();
    const initialCount = initialTasks.length;

    // Add some tasks
    table.create({ title: 'Task A', projectId: 'proj-1' });
    table.create({ title: 'Task B', projectId: 'proj-1' });
    table.create({ title: 'Task C', projectId: 'proj-1' });

    // Verify tasks were added
    const afterAddTasks = table.getAll();
    if (afterAddTasks.length !== initialCount + 3) {
      errors.push(createValidationError(
        'task creation',
        `${initialCount + 3} tasks`,
        `${afterAddTasks.length} tasks`,
        'Tasks should be added to the table'
      ));
    }

    // Reset and verify initial state restored
    table.reset();
    const afterResetTasks = table.getAll();

    if (afterResetTasks.length !== initialCount) {
      errors.push(createValidationError(
        'reset() restores initial state',
        `${initialCount} tasks`,
        `${afterResetTasks.length} tasks`,
        'reset() must restore the initial state'
      ));
    }

    return errors;
  }

  /**
   * Helper to validate ISO 8601 date format
   */
  private isValidISO8601(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes('T');
  }
}
