/**
 * REQ-261: Task Type Definitions & Settings Page
 * TASK-1: Create Task Type Database Schema
 *
 * Tests for the task type schema types and MockDatabase support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MockDatabase from '../../../utils/mockDataStore';
import { TaskType, TaskTypeCategory, TaskTypeAssigneeRole } from '../../../types';

describe('REQ-261: Task Type Schema', () => {
  beforeEach(() => {
    MockDatabase.clearAll();
  });

  describe('TaskTypeCategory type', () => {
    it('should support all required category types', () => {
      const categories: TaskTypeCategory[] = [
        'document_review',
        'policy_management',
        'compliance',
        'onboarding',
        'custom',
      ];

      // Type check passes if this compiles
      expect(categories).toHaveLength(5);
    });
  });

  describe('TaskTypeAssigneeRole type', () => {
    it('should support all required role types', () => {
      const roles: TaskTypeAssigneeRole[] = ['broker', 'gc', 'subcontractor'];

      expect(roles).toHaveLength(3);
    });
  });

  describe('TaskType CRUD operations', () => {
    it('should create a task type with all required fields', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Policy Renewal',
        description: 'Annual policy renewal tasks',
        default_priority: 'high',
        default_due_date_offset: 30,
        category: 'policy_management',
        is_active: true,
      });

      expect(taskType.id).toBeDefined();
      expect(taskType.name).toBe('Policy Renewal');
      expect(taskType.default_priority).toBe('high');
      expect(taskType.default_due_date_offset).toBe(30);
      expect(taskType.category).toBe('policy_management');
      expect(taskType.is_active).toBe(true);
    });

    it('should create a task type with icon and color', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Document Review',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'document_review',
        icon: 'file-text',
        color: '#3B82F6',
        is_active: true,
      });

      expect(taskType.icon).toBe('file-text');
      expect(taskType.color).toBe('#3B82F6');
    });

    it('should create a task type with default assignee role', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Compliance Check',
        default_priority: 'high',
        default_due_date_offset: 14,
        category: 'compliance',
        default_assignee_role: 'broker',
        is_active: true,
      });

      expect(taskType.default_assignee_role).toBe('broker');
    });

    it('should create a task type with auto-assignment rules', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Project Onboarding',
        default_priority: 'medium',
        default_due_date_offset: 3,
        category: 'onboarding',
        auto_assignment_rules: {
          assign_to_project_manager: true,
          assign_to_role: 'gc',
        },
        is_active: true,
      });

      expect(taskType.auto_assignment_rules).toBeDefined();
      expect(taskType.auto_assignment_rules?.assign_to_project_manager).toBe(true);
      expect(taskType.auto_assignment_rules?.assign_to_role).toBe('gc');
    });

    it('should query task types by category', async () => {
      // Create task types in different categories
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Type A',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'policy_management',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Type B',
        default_priority: 'low',
        default_due_date_offset: 14,
        category: 'compliance',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Type C',
        default_priority: 'high',
        default_due_date_offset: 3,
        category: 'policy_management',
        is_active: true,
      });

      // Query by category
      const policyTypes = await MockDatabase.query<TaskType>('task_types', {
        category: 'policy_management',
      });

      expect(policyTypes).toHaveLength(2);
      policyTypes.forEach((t) => {
        expect(t.category).toBe('policy_management');
      });
    });

    it('should update a task type', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'Original Name',
        default_priority: 'low',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const updatedTaskType = await MockDatabase.update<TaskType>('task_types', taskType.id, {
        name: 'Updated Name',
        default_priority: 'high',
        default_due_date_offset: 14,
      });

      expect(updatedTaskType.name).toBe('Updated Name');
      expect(updatedTaskType.default_priority).toBe('high');
      expect(updatedTaskType.default_due_date_offset).toBe(14);
      expect(updatedTaskType.category).toBe('custom'); // unchanged
    });

    it('should delete a task type', async () => {
      const taskType = await MockDatabase.insert<TaskType>('task_types', {
        name: 'To Be Deleted',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      // Verify it exists
      const found = MockDatabase.findById('task_types', taskType.id);
      expect(found).toBeDefined();

      // Delete it
      await MockDatabase.delete('task_types', taskType.id);

      // Verify it's gone
      const deleted = MockDatabase.findById('task_types', taskType.id);
      expect(deleted).toBeNull();
    });

    it('should query active task types only', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Active Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Inactive Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: false,
      });

      const activeTypes = await MockDatabase.query<TaskType>('task_types', {
        is_active: true,
      });

      expect(activeTypes).toHaveLength(1);
      expect(activeTypes[0].name).toBe('Active Type');
    });

    it('should support all category types in database', async () => {
      const categories: TaskTypeCategory[] = [
        'document_review',
        'policy_management',
        'compliance',
        'onboarding',
        'custom',
      ];

      for (const category of categories) {
        const taskType = await MockDatabase.insert<TaskType>('task_types', {
          name: `Type for ${category}`,
          default_priority: 'medium',
          default_due_date_offset: 7,
          category,
          is_active: true,
        });

        expect(taskType.category).toBe(category);
      }

      const allTypes = await MockDatabase.query<TaskType>('task_types', {});
      expect(allTypes).toHaveLength(5);
    });

    it('should support all priority types for default_priority', async () => {
      const priorities = ['low', 'medium', 'high', 'urgent'] as const;

      for (const priority of priorities) {
        const taskType = await MockDatabase.insert<TaskType>('task_types', {
          name: `${priority} priority type`,
          default_priority: priority,
          default_due_date_offset: 7,
          category: 'custom',
          is_active: true,
        });

        expect(taskType.default_priority).toBe(priority);
      }
    });

    it('should query task types ordered by name', async () => {
      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Zebra Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Alpha Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      await MockDatabase.insert<TaskType>('task_types', {
        name: 'Beta Type',
        default_priority: 'medium',
        default_due_date_offset: 7,
        category: 'custom',
        is_active: true,
      });

      const orderedTypes = await MockDatabase.query<TaskType>(
        'task_types',
        {},
        { column: 'name', ascending: true }
      );

      expect(orderedTypes[0].name).toBe('Alpha Type');
      expect(orderedTypes[1].name).toBe('Beta Type');
      expect(orderedTypes[2].name).toBe('Zebra Type');
    });
  });
});
