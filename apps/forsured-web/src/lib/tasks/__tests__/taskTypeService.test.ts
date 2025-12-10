/**
 * REQ-261: Task Type Definitions & Settings Page
 * TASK-2: Build Task Type CRUD API Endpoints
 *
 * Tests for the task type CRUD service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MockDatabase from '../../../utils/mockDataStore';
import { TaskType } from '../../../types';
import {
  getAllTaskTypes,
  getTaskTypeById,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  getActiveTaskTypes,
  isAdmin,
  validateCategory,
  validatePriority,
  validateDueDateOffset,
  validateColor,
  validateUniqueName,
  validateCreateInput,
  validateUpdateInput,
  UserContext,
  CreateTaskTypeInput,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
} from '../taskTypeService';

describe('REQ-261: Task Type CRUD API Service', () => {
  const adminUser: UserContext = { id: 'admin-1', role: 'admin' };
  const brokerUser: UserContext = { id: 'broker-1', role: 'broker' };
  const gcUser: UserContext = { id: 'gc-1', role: 'gc' };

  beforeEach(() => {
    MockDatabase.clearAll();
  });

  describe('Authorization', () => {
    it('should identify admin users correctly', () => {
      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(brokerUser)).toBe(false);
      expect(isAdmin(gcUser)).toBe(false);
    });
  });

  describe('Validation Functions', () => {
    describe('validateCategory', () => {
      it('should accept valid categories', () => {
        for (const category of VALID_CATEGORIES) {
          expect(validateCategory(category)).toBeUndefined();
        }
      });

      it('should reject invalid category', () => {
        const error = validateCategory('invalid_category');
        expect(error).toBeDefined();
        expect(error?.field).toBe('category');
        expect(error?.message).toContain('Invalid category');
      });
    });

    describe('validatePriority', () => {
      it('should accept valid priorities', () => {
        for (const priority of VALID_PRIORITIES) {
          expect(validatePriority(priority)).toBeUndefined();
        }
      });

      it('should reject invalid priority', () => {
        const error = validatePriority('critical');
        expect(error).toBeDefined();
        expect(error?.field).toBe('default_priority');
      });
    });

    describe('validateDueDateOffset', () => {
      it('should accept non-negative integers', () => {
        expect(validateDueDateOffset(0)).toBeUndefined();
        expect(validateDueDateOffset(7)).toBeUndefined();
        expect(validateDueDateOffset(30)).toBeUndefined();
      });

      it('should reject negative numbers', () => {
        const error = validateDueDateOffset(-1);
        expect(error).toBeDefined();
        expect(error?.field).toBe('default_due_date_offset');
      });

      it('should reject non-integers', () => {
        const error = validateDueDateOffset(7.5);
        expect(error).toBeDefined();
        expect(error?.field).toBe('default_due_date_offset');
      });
    });

    describe('validateColor', () => {
      it('should accept valid hex colors', () => {
        expect(validateColor('#3B82F6')).toBeUndefined();
        expect(validateColor('#ffffff')).toBeUndefined();
        expect(validateColor('#000000')).toBeUndefined();
        expect(validateColor('#ABCDEF')).toBeUndefined();
      });

      it('should reject invalid hex colors', () => {
        expect(validateColor('red')).toBeDefined();
        expect(validateColor('#FFF')).toBeDefined(); // 3-digit not allowed
        expect(validateColor('3B82F6')).toBeDefined(); // missing #
        expect(validateColor('#GGGGGG')).toBeDefined(); // invalid hex chars
      });
    });

    describe('validateUniqueName', () => {
      it('should pass for unique name', async () => {
        await MockDatabase.insert<TaskType>('task_types', {
          name: 'Existing Type',
          default_priority: 'medium',
          default_due_date_offset: 7,
          category: 'custom',
          is_active: true,
        });

        const error = await validateUniqueName('New Type');
        expect(error).toBeUndefined();
      });

      it('should fail for duplicate name (case-insensitive)', async () => {
        await MockDatabase.insert<TaskType>('task_types', {
          name: 'Existing Type',
          default_priority: 'medium',
          default_due_date_offset: 7,
          category: 'custom',
          is_active: true,
        });

        const error = await validateUniqueName('existing type');
        expect(error).toBeDefined();
        expect(error?.field).toBe('name');
      });

      it('should allow same name when excluding self (for updates)', async () => {
        const taskType = await MockDatabase.insert<TaskType>('task_types', {
          name: 'My Type',
          default_priority: 'medium',
          default_due_date_offset: 7,
          category: 'custom',
          is_active: true,
        });

        const error = await validateUniqueName('My Type', taskType.id);
        expect(error).toBeUndefined();
      });
    });

    describe('validateCreateInput', () => {
      it('should pass with valid input', async () => {
        const input: CreateTaskTypeInput = {
          name: 'Valid Type',
          category: 'compliance',
          default_priority: 'high',
          default_due_date_offset: 14,
        };

        const errors = await validateCreateInput(input);
        expect(errors).toHaveLength(0);
      });

      it('should require name', async () => {
        const input: CreateTaskTypeInput = {
          name: '',
          category: 'compliance',
        };

        const errors = await validateCreateInput(input);
        expect(errors.some((e) => e.field === 'name')).toBe(true);
      });

      it('should enforce name max length', async () => {
        const input: CreateTaskTypeInput = {
          name: 'A'.repeat(101),
          category: 'compliance',
        };

        const errors = await validateCreateInput(input);
        expect(errors.some((e) => e.field === 'name' && e.message.includes('100'))).toBe(true);
      });

      it('should require category', async () => {
        const input = {
          name: 'Test Type',
        } as CreateTaskTypeInput;

        const errors = await validateCreateInput(input);
        expect(errors.some((e) => e.field === 'category')).toBe(true);
      });
    });
  });

  describe('getAllTaskTypes', () => {
    it('should return all task types sorted by name', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Zebra Type',
        default_priority: 'low',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Alpha Type',
        default_priority: 'high',
        default_due_date_offset: 14,
        category: 'compliance',
        is_active: true,
      });

      const response = await getAllTaskTypes();

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data).toHaveLength(2);
      expect(response.data![0].name).toBe('Alpha Type');
      expect(response.data![1].name).toBe('Zebra Type');
    });

    it('should filter by category', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Policy Type',
        default_priority: 'medium',
        default_due_date_offset: 30,
        category: 'policy_management',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Compliance Type',
        default_priority: 'high',
        default_due_date_offset: 14,
        category: 'compliance',
        is_active: true,
      });

      const response = await getAllTaskTypes('policy_management');

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data![0].category).toBe('policy_management');
    });

    it('should reject invalid category filter', async () => {
      const response = await getAllTaskTypes('invalid' as never);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('Invalid category');
    });

    it('should return empty array when no task types exist', async () => {
      const response = await getAllTaskTypes();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(0);
    });
  });

  describe('getTaskTypeById', () => {
    it('should return task type by ID', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Test Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await getTaskTypeById(created.id);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data?.id).toBe(created.id);
      expect(response.data?.name).toBe('Test Type');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await getTaskTypeById('non-existent-id');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.error).toContain('not found');
    });
  });

  describe('createTaskType', () => {
    it('should create task type with valid data (Test 8)', async () => {
      const input: CreateTaskTypeInput = {
        name: 'Policy Renewal',
        category: 'policy_management',
        description: 'Annual policy renewal tasks',
        default_priority: 'high',
        default_due_date_offset: 7,
      };

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.data?.id).toBeDefined();
      expect(response.data?.name).toBe('Policy Renewal');
      expect(response.data?.category).toBe('policy_management');
      expect(response.data?.default_priority).toBe('high');
    });

    it('should reject invalid category (Test 9)', async () => {
      const input = {
        name: 'Test',
        category: 'InvalidCategory',
      } as CreateTaskTypeInput;

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('category');
    });

    it('should reject non-admin user (Test 10)', async () => {
      const input: CreateTaskTypeInput = {
        name: 'Test Type',
        category: 'custom',
      };

      const response = await createTaskType(input, brokerUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
      expect(response.error).toContain('Unauthorized');
    });

    it('should apply default values', async () => {
      const input: CreateTaskTypeInput = {
        name: 'Minimal Type',
        category: 'custom',
      };

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(true);
      expect(response.data?.default_priority).toBe('medium');
      expect(response.data?.default_due_date_offset).toBe(7);
      expect(response.data?.is_active).toBe(true);
    });

    it('should create task type with all optional fields', async () => {
      const input: CreateTaskTypeInput = {
        name: 'Full Type',
        description: 'A complete task type',
        default_priority: 'urgent',
        default_due_date_offset: 3,
        category: 'compliance',
        icon: 'shield-check',
        color: '#10B981',
        default_assignee_role: 'broker',
        auto_assignment_rules: {
          assign_to_project_manager: true,
          assign_to_role: 'gc',
        },
        is_active: true,
      };

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(true);
      expect(response.data?.icon).toBe('shield-check');
      expect(response.data?.color).toBe('#10B981');
      expect(response.data?.default_assignee_role).toBe('broker');
      expect(response.data?.auto_assignment_rules?.assign_to_project_manager).toBe(true);
    });

    it('should reject duplicate name', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Existing Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const input: CreateTaskTypeInput = {
        name: 'Existing Type',
        category: 'custom',
      };

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('already exists');
    });

    it('should reject invalid color format', async () => {
      const input: CreateTaskTypeInput = {
        name: 'Bad Color Type',
        category: 'custom',
        color: 'not-a-color',
      };

      const response = await createTaskType(input, adminUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('color');
    });
  });

  describe('updateTaskType', () => {
    it('should update task type successfully (Test 11)', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Original Name',
        default_priority: 'low',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await updateTaskType(
        created.id,
        { default_due_date_offset: 14 },
        adminUser
      );

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.data?.default_due_date_offset).toBe(14);
      expect(response.data?.name).toBe('Original Name'); // Unchanged
    });

    it('should reject non-admin user', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Test Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await updateTaskType(
        created.id,
        { name: 'New Name' },
        brokerUser
      );

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
    });

    it('should return 404 for non-existent task type', async () => {
      const response = await updateTaskType(
        'non-existent-id',
        { name: 'New Name' },
        adminUser
      );

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
    });

    it('should prevent duplicate names on update', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'First Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const second = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Second Type',
        default_priority: 'high',
        default_due_date_offset: 14,
        category: 'compliance',
        is_active: true,
      });

      const response = await updateTaskType(
        second.id,
        { name: 'First Type' },
        adminUser
      );

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('already exists');
    });

    it('should update multiple fields at once', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Original',
        default_priority: 'low',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await updateTaskType(
        created.id,
        {
          name: 'Updated',
          default_priority: 'urgent',
          category: 'compliance',
          color: '#EF4444',
        },
        adminUser
      );

      expect(response.success).toBe(true);
      expect(response.data?.name).toBe('Updated');
      expect(response.data?.default_priority).toBe('urgent');
      expect(response.data?.category).toBe('compliance');
      expect(response.data?.color).toBe('#EF4444');
    });
  });

  describe('deleteTaskType', () => {
    it('should delete task type successfully', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'To Delete',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await deleteTaskType(created.id, adminUser);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);

      // Verify deleted
      const checkDeleted = MockDatabase.findById('task_types', created.id);
      expect(checkDeleted).toBeNull();
    });

    it('should reject non-admin user', async () => {
      const created = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Protected',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const response = await deleteTaskType(created.id, gcUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);

      // Verify not deleted
      const stillExists = MockDatabase.findById('task_types', created.id);
      expect(stillExists).toBeDefined();
    });

    it('should return 404 for non-existent task type', async () => {
      const response = await deleteTaskType('non-existent-id', adminUser);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('getActiveTaskTypes', () => {
    it('should return only active task types', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Active Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Inactive Type',
        default_priority: 'low',
        default_due_date_offset: 14,
        category: 'custom',
        is_active: false,
      });

      const response = await getActiveTaskTypes();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data![0].name).toBe('Active Type');
    });

    it('should filter active task types by category', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Active Compliance',
        default_priority: 'high',
        default_due_date_offset: 14,
        category: 'compliance',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Active Custom',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Inactive Compliance',
        default_priority: 'low',
        default_due_date_offset: 30,
        category: 'compliance',
        is_active: false,
      });

      const response = await getActiveTaskTypes('compliance');

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data![0].name).toBe('Active Compliance');
    });
  });
});
