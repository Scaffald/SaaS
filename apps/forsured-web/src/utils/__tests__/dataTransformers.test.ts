/**
 * Tests for Data Transformation Utilities
 * Frontend Data Layer Migration
 */

import { describe, it, expect } from 'vitest';
import {
  transformStatus,
  reverseTransformStatus,
  transformPriority,
  reverseTransformPriority,
  selectPrimaryAssignee,
  expandAssigneeToArray,
  transformTaskFields,
  reverseTransformTaskFields,
  transformTasksArray,
  reverseTransformTasksArray,
  isOldStatus,
  isNewStatus,
  isOldPriority,
  isNewPriority,
  OldTaskStructure,
  NewTaskStructure,
} from '../dataTransformers';

describe('dataTransformers', () => {
  describe('transformStatus', () => {
    it('should transform OPEN to pending', () => {
      expect(transformStatus('OPEN')).toBe('pending');
    });

    it('should transform IN_PROGRESS to in_progress', () => {
      expect(transformStatus('IN_PROGRESS')).toBe('in_progress');
    });

    it('should transform BLOCKED to in_progress', () => {
      expect(transformStatus('BLOCKED')).toBe('in_progress');
    });

    it('should transform DONE to completed', () => {
      expect(transformStatus('DONE')).toBe('completed');
    });

    it('should handle lowercase input', () => {
      expect(transformStatus('open')).toBe('pending');
      expect(transformStatus('done')).toBe('completed');
    });

    it('should handle null/undefined with default', () => {
      expect(transformStatus(null)).toBe('pending');
      expect(transformStatus(undefined)).toBe('pending');
    });

    it('should handle unknown status with default', () => {
      expect(transformStatus('UNKNOWN')).toBe('pending');
    });
  });

  describe('reverseTransformStatus', () => {
    it('should transform pending to OPEN', () => {
      expect(reverseTransformStatus('pending')).toBe('OPEN');
    });

    it('should transform in_progress to IN_PROGRESS', () => {
      expect(reverseTransformStatus('in_progress')).toBe('IN_PROGRESS');
    });

    it('should transform completed to DONE', () => {
      expect(reverseTransformStatus('completed')).toBe('DONE');
    });

    it('should transform cancelled to DONE', () => {
      expect(reverseTransformStatus('cancelled')).toBe('DONE');
    });

    it('should handle null/undefined with default', () => {
      expect(reverseTransformStatus(null)).toBe('OPEN');
      expect(reverseTransformStatus(undefined)).toBe('OPEN');
    });
  });

  describe('transformPriority', () => {
    it('should transform CRITICAL to urgent', () => {
      expect(transformPriority('CRITICAL')).toBe('urgent');
    });

    it('should transform HIGH to high', () => {
      expect(transformPriority('HIGH')).toBe('high');
    });

    it('should transform MEDIUM to medium', () => {
      expect(transformPriority('MEDIUM')).toBe('medium');
    });

    it('should transform LOW to low', () => {
      expect(transformPriority('LOW')).toBe('low');
    });

    it('should handle lowercase input', () => {
      expect(transformPriority('critical')).toBe('urgent');
      expect(transformPriority('high')).toBe('high');
    });

    it('should handle null/undefined with default', () => {
      expect(transformPriority(null)).toBe('medium');
      expect(transformPriority(undefined)).toBe('medium');
    });

    it('should handle unknown priority with default', () => {
      expect(transformPriority('UNKNOWN')).toBe('medium');
    });
  });

  describe('reverseTransformPriority', () => {
    it('should transform urgent to CRITICAL', () => {
      expect(reverseTransformPriority('urgent')).toBe('CRITICAL');
    });

    it('should transform high to HIGH', () => {
      expect(reverseTransformPriority('high')).toBe('HIGH');
    });

    it('should transform medium to MEDIUM', () => {
      expect(reverseTransformPriority('medium')).toBe('MEDIUM');
    });

    it('should transform low to LOW', () => {
      expect(reverseTransformPriority('low')).toBe('LOW');
    });

    it('should handle null/undefined with default', () => {
      expect(reverseTransformPriority(null)).toBe('MEDIUM');
      expect(reverseTransformPriority(undefined)).toBe('MEDIUM');
    });
  });

  describe('selectPrimaryAssignee', () => {
    it('should return first assignee from array', () => {
      expect(selectPrimaryAssignee(['usr_1', 'usr_2'])).toBe('usr_1');
    });

    it('should return null for empty array', () => {
      expect(selectPrimaryAssignee([])).toBeNull();
    });

    it('should return null for null input', () => {
      expect(selectPrimaryAssignee(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(selectPrimaryAssignee(undefined)).toBeNull();
    });
  });

  describe('expandAssigneeToArray', () => {
    it('should wrap single assignee in array', () => {
      expect(expandAssigneeToArray('usr_1')).toEqual(['usr_1']);
    });

    it('should return empty array for null', () => {
      expect(expandAssigneeToArray(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(expandAssigneeToArray(undefined)).toEqual([]);
    });
  });

  describe('transformTaskFields', () => {
    const oldTask: OldTaskStructure = {
      id: 'tsk_001',
      project_id: 'prj_001',
      project_name: 'Test Project',
      company_id: 'cmp_001',
      assignees: ['usr_1', 'usr_2'],
      title: 'Test Task',
      summary: 'Test description',
      status: 'OPEN',
      priority: 'HIGH',
      due_at: '2025-01-01T12:00:00Z',
      blockers: ['blocker_1'],
      quick_actions: ['action_1'],
      tags: ['tag_1'],
    };

    it('should transform all fields correctly', () => {
      const result = transformTaskFields(oldTask);

      expect(result.id).toBe('tsk_001');
      expect(result.project_id).toBe('prj_001');
      expect(result.subcontractor_id).toBe('cmp_001');
      expect(result.assigned_to_user_id).toBe('usr_1');
      expect(result.title).toBe('Test Task');
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('pending');
      expect(result.priority).toBe('high');
      expect(result.due_date).toBe('2025-01-01T12:00:00Z');
    });

    it('should preserve metadata fields', () => {
      const result = transformTaskFields(oldTask);

      expect(result.metadata?.blockers).toEqual(['blocker_1']);
      expect(result.metadata?.quick_actions).toEqual(['action_1']);
      expect(result.metadata?.tags).toEqual(['tag_1']);
      expect(result.metadata?.project_name).toBe('Test Project');
      expect(result.metadata?.legacy_assignees).toEqual(['usr_1', 'usr_2']);
    });
  });

  describe('reverseTransformTaskFields', () => {
    const newTask: NewTaskStructure = {
      id: 'tsk_001',
      project_id: 'prj_001',
      subcontractor_id: 'cmp_001',
      assigned_to_user_id: 'usr_1',
      title: 'Test Task',
      description: 'Test description',
      status: 'pending',
      priority: 'high',
      due_date: '2025-01-01T12:00:00Z',
      metadata: {
        blockers: ['blocker_1'],
        quick_actions: ['action_1'],
        tags: ['tag_1'],
        project_name: 'Test Project',
        legacy_assignees: ['usr_1', 'usr_2'],
      },
    };

    it('should transform all fields correctly', () => {
      const result = reverseTransformTaskFields(newTask);

      expect(result.id).toBe('tsk_001');
      expect(result.project_id).toBe('prj_001');
      expect(result.company_id).toBe('cmp_001');
      expect(result.project_name).toBe('Test Project');
      expect(result.title).toBe('Test Task');
      expect(result.summary).toBe('Test description');
      expect(result.status).toBe('OPEN');
      expect(result.priority).toBe('HIGH');
      expect(result.due_at).toBe('2025-01-01T12:00:00Z');
    });

    it('should restore legacy assignees if available', () => {
      const result = reverseTransformTaskFields(newTask);
      expect(result.assignees).toEqual(['usr_1', 'usr_2']);
    });

    it('should fallback to assigned_to_user_id if no legacy_assignees', () => {
      const taskWithoutLegacy: NewTaskStructure = {
        ...newTask,
        metadata: {},
      };
      const result = reverseTransformTaskFields(taskWithoutLegacy);
      expect(result.assignees).toEqual(['usr_1']);
    });
  });

  describe('transformTasksArray', () => {
    it('should transform array of tasks', () => {
      const oldTasks: OldTaskStructure[] = [
        {
          id: 'tsk_001',
          project_id: 'prj_001',
          project_name: 'Project 1',
          company_id: 'cmp_001',
          assignees: ['usr_1'],
          title: 'Task 1',
          summary: 'Description 1',
          status: 'OPEN',
          priority: 'HIGH',
          due_at: '2025-01-01T12:00:00Z',
        },
        {
          id: 'tsk_002',
          project_id: 'prj_002',
          project_name: 'Project 2',
          company_id: 'cmp_002',
          assignees: ['usr_2'],
          title: 'Task 2',
          summary: 'Description 2',
          status: 'IN_PROGRESS',
          priority: 'CRITICAL',
          due_at: '2025-01-02T12:00:00Z',
        },
      ];

      const result = transformTasksArray(oldTasks);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[0].priority).toBe('high');
      expect(result[1].status).toBe('in_progress');
      expect(result[1].priority).toBe('urgent');
    });
  });

  describe('reverseTransformTasksArray', () => {
    it('should reverse transform array of tasks', () => {
      const newTasks: NewTaskStructure[] = [
        {
          id: 'tsk_001',
          project_id: 'prj_001',
          subcontractor_id: 'cmp_001',
          assigned_to_user_id: 'usr_1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending',
          priority: 'high',
          due_date: '2025-01-01T12:00:00Z',
        },
      ];

      const result = reverseTransformTasksArray(newTasks);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('OPEN');
      expect(result[0].priority).toBe('HIGH');
    });
  });

  describe('isOldStatus', () => {
    it('should return true for old status values', () => {
      expect(isOldStatus('OPEN')).toBe(true);
      expect(isOldStatus('IN_PROGRESS')).toBe(true);
      expect(isOldStatus('BLOCKED')).toBe(true);
      expect(isOldStatus('DONE')).toBe(true);
    });

    it('should return false for new status values', () => {
      expect(isOldStatus('pending')).toBe(false);
      expect(isOldStatus('in_progress')).toBe(false);
      expect(isOldStatus('completed')).toBe(false);
    });
  });

  describe('isNewStatus', () => {
    it('should return true for new status values', () => {
      expect(isNewStatus('pending')).toBe(true);
      expect(isNewStatus('in_progress')).toBe(true);
      expect(isNewStatus('completed')).toBe(true);
      expect(isNewStatus('cancelled')).toBe(true);
    });

    it('should return false for old status values', () => {
      expect(isNewStatus('OPEN')).toBe(false);
      expect(isNewStatus('DONE')).toBe(false);
    });
  });

  describe('isOldPriority', () => {
    it('should return true for old priority values', () => {
      expect(isOldPriority('CRITICAL')).toBe(true);
      expect(isOldPriority('HIGH')).toBe(true);
      expect(isOldPriority('MEDIUM')).toBe(true);
      expect(isOldPriority('LOW')).toBe(true);
    });

    it('should return false for new priority values', () => {
      expect(isOldPriority('urgent')).toBe(false);
      expect(isOldPriority('high')).toBe(false);
    });
  });

  describe('isNewPriority', () => {
    it('should return true for new priority values', () => {
      expect(isNewPriority('urgent')).toBe(true);
      expect(isNewPriority('high')).toBe(true);
      expect(isNewPriority('medium')).toBe(true);
      expect(isNewPriority('low')).toBe(true);
    });

    it('should return false for old priority values', () => {
      expect(isNewPriority('CRITICAL')).toBe(false);
      expect(isNewPriority('HIGH')).toBe(false);
    });
  });
});
