/**
 * REQ-266: Task Correlation with Compliance Score
 * Tests for severity utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTaskSeverity,
  calculateSeverityFromTask,
  enrichTaskWithSeverity,
  enrichTasksWithSeverity,
  groupTasksBySeverity,
  countTasksBySeverity,
  formatSeverityBreakdown,
  isUrgentTask,
  sortTasksBySeverity,
  isValidTaskSeverity,
} from '../severityUtils';
import { Task, ConsequenceType } from '../../../types';

// Helper to create a minimal task object
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    status: 'pending',
    priority: 'medium',
    created_by_user_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('severityUtils', () => {
  describe('calculateTaskSeverity', () => {
    it('should return critical for site_access_denied consequence', () => {
      expect(calculateTaskSeverity('site_access_denied')).toBe('critical');
    });

    it('should return critical for payment_hold consequence', () => {
      expect(calculateTaskSeverity('payment_hold')).toBe('critical');
    });

    it('should return critical for contract_termination consequence', () => {
      expect(calculateTaskSeverity('contract_termination')).toBe('critical');
    });

    it('should return high for incomplete_bid consequence', () => {
      expect(calculateTaskSeverity('incomplete_bid')).toBe('high');
    });

    it('should return high for project_delay consequence', () => {
      expect(calculateTaskSeverity('project_delay')).toBe('high');
    });

    it('should return high for audit_failure consequence', () => {
      expect(calculateTaskSeverity('audit_failure')).toBe('high');
    });

    it('should return medium for coverage_gap consequence', () => {
      expect(calculateTaskSeverity('coverage_gap')).toBe('medium');
    });

    it('should return medium for endorsement_missing consequence', () => {
      expect(calculateTaskSeverity('endorsement_missing')).toBe('medium');
    });

    it('should return low for expiring_soon consequence', () => {
      expect(calculateTaskSeverity('expiring_soon')).toBe('low');
    });

    it('should return low for documentation_needed consequence', () => {
      expect(calculateTaskSeverity('documentation_needed')).toBe('low');
    });

    it('should return info for review_recommended consequence', () => {
      expect(calculateTaskSeverity('review_recommended')).toBe('info');
    });

    it('should return info for notification consequence', () => {
      expect(calculateTaskSeverity('notification')).toBe('info');
    });

    it('should return info for null consequence', () => {
      expect(calculateTaskSeverity(null)).toBe('info');
    });

    it('should return info for undefined consequence', () => {
      expect(calculateTaskSeverity(undefined)).toBe('info');
    });

    it('should return info for empty string consequence', () => {
      expect(calculateTaskSeverity('')).toBe('info');
    });

    it('should return info for unknown consequence type', () => {
      expect(calculateTaskSeverity('unknown_consequence')).toBe('info');
    });
  });

  describe('calculateSeverityFromTask', () => {
    it('should use existing severity field if present', () => {
      const task = createTask({ severity: 'high' });
      expect(calculateSeverityFromTask(task)).toBe('high');
    });

    it('should use consequence_type field if present', () => {
      const task = createTask({ consequence_type: 'payment_hold' });
      expect(calculateSeverityFromTask(task)).toBe('critical');
    });

    it('should check metadata.consequence_type', () => {
      const task = createTask({
        metadata: { consequence_type: 'incomplete_bid' },
      });
      expect(calculateSeverityFromTask(task)).toBe('high');
    });

    it('should map metadata.severity_level to TaskSeverity', () => {
      const task = createTask({
        metadata: { severity_level: 'critical' },
      });
      expect(calculateSeverityFromTask(task)).toBe('critical');
    });

    it('should map gap_severity (critical) to critical', () => {
      const task = createTask({
        metadata: { gap_severity: 'critical' },
      });
      expect(calculateSeverityFromTask(task)).toBe('critical');
    });

    it('should map gap_severity (warning) to high', () => {
      const task = createTask({
        metadata: { gap_severity: 'warning' },
      });
      expect(calculateSeverityFromTask(task)).toBe('high');
    });

    it('should map gap_severity (info) to info', () => {
      const task = createTask({
        metadata: { gap_severity: 'info' },
      });
      expect(calculateSeverityFromTask(task)).toBe('info');
    });

    it('should infer from priority as fallback', () => {
      const task = createTask({ priority: 'urgent' });
      expect(calculateSeverityFromTask(task)).toBe('critical');
    });

    it('should map high priority to high severity', () => {
      const task = createTask({ priority: 'high' });
      expect(calculateSeverityFromTask(task)).toBe('high');
    });

    it('should map medium priority to medium severity', () => {
      const task = createTask({ priority: 'medium' });
      expect(calculateSeverityFromTask(task)).toBe('medium');
    });

    it('should map low priority to low severity', () => {
      const task = createTask({ priority: 'low' });
      expect(calculateSeverityFromTask(task)).toBe('low');
    });
  });

  describe('enrichTaskWithSeverity', () => {
    it('should add severity field to task', () => {
      const task = createTask({ priority: 'high' });
      const enriched = enrichTaskWithSeverity(task);

      expect(enriched.severity).toBe('high');
      expect(enriched.id).toBe(task.id);
    });

    it('should not mutate original task', () => {
      const task = createTask({ priority: 'high' });
      enrichTaskWithSeverity(task);

      expect(task.severity).toBeUndefined();
    });

    it('should preserve existing severity', () => {
      const task = createTask({ severity: 'critical' });
      const enriched = enrichTaskWithSeverity(task);

      expect(enriched.severity).toBe('critical');
    });
  });

  describe('enrichTasksWithSeverity', () => {
    it('should enrich all tasks in array', () => {
      const tasks = [
        createTask({ id: '1', priority: 'urgent' }),
        createTask({ id: '2', priority: 'high' }),
        createTask({ id: '3', priority: 'medium' }),
      ];

      const enriched = enrichTasksWithSeverity(tasks);

      expect(enriched[0].severity).toBe('critical');
      expect(enriched[1].severity).toBe('high');
      expect(enriched[2].severity).toBe('medium');
    });

    it('should return empty array for empty input', () => {
      expect(enrichTasksWithSeverity([])).toEqual([]);
    });
  });

  describe('groupTasksBySeverity', () => {
    it('should group tasks by severity level', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'critical' }),
        createTask({ id: '3', severity: 'high' }),
        createTask({ id: '4', severity: 'medium' }),
        createTask({ id: '5', severity: 'low' }),
        createTask({ id: '6', severity: 'info' }),
      ];

      const grouped = groupTasksBySeverity(tasks);

      expect(grouped.critical.length).toBe(2);
      expect(grouped.high.length).toBe(1);
      expect(grouped.medium.length).toBe(1);
      expect(grouped.low.length).toBe(1);
      expect(grouped.info.length).toBe(1);
    });

    it('should return empty arrays for missing severity levels', () => {
      const tasks = [createTask({ id: '1', severity: 'critical' })];

      const grouped = groupTasksBySeverity(tasks);

      expect(grouped.high).toEqual([]);
      expect(grouped.medium).toEqual([]);
      expect(grouped.low).toEqual([]);
      expect(grouped.info).toEqual([]);
    });
  });

  describe('countTasksBySeverity', () => {
    it('should count tasks by severity level', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'critical' }),
        createTask({ id: '3', severity: 'high' }),
        createTask({ id: '4', severity: 'high' }),
        createTask({ id: '5', severity: 'high' }),
        createTask({ id: '6', severity: 'medium' }),
        createTask({ id: '7', severity: 'low' }),
        createTask({ id: '8', severity: 'info' }),
      ];

      const counts = countTasksBySeverity(tasks);

      expect(counts).toEqual({
        critical: 2,
        high: 3,
        medium: 1,
        low: 1,
        info: 1,
      });
    });

    it('should return zero counts for empty array', () => {
      const counts = countTasksBySeverity([]);

      expect(counts).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      });
    });
  });

  describe('formatSeverityBreakdown', () => {
    it('should format breakdown correctly', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'critical' }),
        createTask({ id: '3', severity: 'high' }),
        createTask({ id: '4', severity: 'high' }),
        createTask({ id: '5', severity: 'high' }),
        createTask({ id: '6', severity: 'medium' }),
      ];

      const result = formatSeverityBreakdown(tasks);

      expect(result).toBe('6 tasks (2 critical, 3 high, 1 medium)');
    });

    it('should omit zero-count severities', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'medium' }),
      ];

      const result = formatSeverityBreakdown(tasks);

      expect(result).toBe('2 tasks (1 critical, 1 medium)');
    });

    it('should not include info by default', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'info' }),
      ];

      const result = formatSeverityBreakdown(tasks);

      expect(result).toBe('2 tasks (1 critical)');
    });

    it('should include info when requested', () => {
      const tasks = [
        createTask({ id: '1', severity: 'critical' }),
        createTask({ id: '2', severity: 'info' }),
      ];

      const result = formatSeverityBreakdown(tasks, true);

      expect(result).toBe('2 tasks (1 critical, 1 info)');
    });

    it('should handle empty tasks array', () => {
      expect(formatSeverityBreakdown([])).toBe('0 tasks');
    });

    it('should handle all info tasks without includeInfo', () => {
      const tasks = [
        createTask({ id: '1', severity: 'info' }),
        createTask({ id: '2', severity: 'info' }),
      ];

      expect(formatSeverityBreakdown(tasks)).toBe('2 tasks');
    });
  });

  describe('isUrgentTask', () => {
    it('should return true for critical severity', () => {
      const task = createTask({ severity: 'critical' });
      expect(isUrgentTask(task)).toBe(true);
    });

    it('should return true for high severity', () => {
      const task = createTask({ severity: 'high' });
      expect(isUrgentTask(task)).toBe(true);
    });

    it('should return false for medium severity', () => {
      const task = createTask({ severity: 'medium' });
      expect(isUrgentTask(task)).toBe(false);
    });

    it('should return false for low severity', () => {
      const task = createTask({ severity: 'low' });
      expect(isUrgentTask(task)).toBe(false);
    });

    it('should return false for info severity', () => {
      const task = createTask({ severity: 'info' });
      expect(isUrgentTask(task)).toBe(false);
    });

    it('should calculate severity if not present', () => {
      const task = createTask({ priority: 'urgent' });
      expect(isUrgentTask(task)).toBe(true);
    });
  });

  describe('sortTasksBySeverity', () => {
    it('should sort tasks with critical first', () => {
      const tasks = [
        createTask({ id: '1', severity: 'low' }),
        createTask({ id: '2', severity: 'critical' }),
        createTask({ id: '3', severity: 'high' }),
        createTask({ id: '4', severity: 'info' }),
        createTask({ id: '5', severity: 'medium' }),
      ];

      const sorted = sortTasksBySeverity(tasks);

      expect(sorted[0].id).toBe('2'); // critical
      expect(sorted[1].id).toBe('3'); // high
      expect(sorted[2].id).toBe('5'); // medium
      expect(sorted[3].id).toBe('1'); // low
      expect(sorted[4].id).toBe('4'); // info
    });

    it('should not mutate original array', () => {
      const tasks = [
        createTask({ id: '1', severity: 'low' }),
        createTask({ id: '2', severity: 'critical' }),
      ];

      sortTasksBySeverity(tasks);

      expect(tasks[0].id).toBe('1');
      expect(tasks[1].id).toBe('2');
    });

    it('should handle empty array', () => {
      expect(sortTasksBySeverity([])).toEqual([]);
    });
  });

  describe('isValidTaskSeverity', () => {
    it('should return true for valid severities', () => {
      expect(isValidTaskSeverity('critical')).toBe(true);
      expect(isValidTaskSeverity('high')).toBe(true);
      expect(isValidTaskSeverity('medium')).toBe(true);
      expect(isValidTaskSeverity('low')).toBe(true);
      expect(isValidTaskSeverity('info')).toBe(true);
    });

    it('should return false for invalid severities', () => {
      expect(isValidTaskSeverity('urgent')).toBe(false);
      expect(isValidTaskSeverity('warning')).toBe(false);
      expect(isValidTaskSeverity('unknown')).toBe(false);
      expect(isValidTaskSeverity('')).toBe(false);
    });
  });
});
