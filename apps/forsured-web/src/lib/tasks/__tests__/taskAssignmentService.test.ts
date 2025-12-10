/**
 * REQ-127: Task Auto-Generation from Compliance Gaps
 * Unit tests for task assignment service (TDD - Red phase)
 */

import { describe, it, expect } from 'vitest';
import { TaskAssignmentService } from '../taskAssignmentService';
import { GapType, GapSeverity } from '../../compliance/evaluator/types';
import { TASK_TYPES } from '../types';

describe('TaskAssignmentService', () => {
  const service = new TaskAssignmentService();

  describe('assignTask', () => {
    it('assigns COI upload tasks to unassigned (subcontractor action)', () => {
      const result = service.assignTask(
        GapType.MISSING_COVERAGE,
        GapSeverity.CRITICAL,
        TASK_TYPES.COI_UPLOAD
      );

      expect(result.assigned_to_user_id).toBeUndefined();
      expect(result.assignment_strategy).toBe('subcontractor');
      expect(result.assignment_reason).toContain('subcontractor');
    });

    it('assigns endorsement correction tasks to unassigned (subcontractor action)', () => {
      const result = service.assignTask(
        GapType.MISSING_ENDORSEMENT,
        GapSeverity.CRITICAL,
        TASK_TYPES.ENDORSEMENT_CORRECTION
      );

      expect(result.assigned_to_user_id).toBeUndefined();
      expect(result.assignment_strategy).toBe('subcontractor');
    });

    it('assigns coverage increase tasks to unassigned (subcontractor action)', () => {
      const result = service.assignTask(
        GapType.INSUFFICIENT_AMOUNT,
        GapSeverity.WARNING,
        TASK_TYPES.COVERAGE_INCREASE
      );

      expect(result.assigned_to_user_id).toBeUndefined();
      expect(result.assignment_strategy).toBe('subcontractor');
    });

    it('assigns policy renewal tasks to unassigned (subcontractor action)', () => {
      const result = service.assignTask(
        GapType.EXPIRED_POLICY,
        GapSeverity.CRITICAL,
        TASK_TYPES.POLICY_RENEWAL
      );

      expect(result.assigned_to_user_id).toBeUndefined();
      expect(result.assignment_strategy).toBe('subcontractor');
    });

    it('assigns policy extension tasks to unassigned (subcontractor action)', () => {
      const result = service.assignTask(
        GapType.EXPIRING_SOON,
        GapSeverity.WARNING,
        TASK_TYPES.POLICY_EXTENSION
      );

      expect(result.assigned_to_user_id).toBeUndefined();
      expect(result.assignment_strategy).toBe('subcontractor');
    });

    it('includes gap severity in assignment reason', () => {
      const criticalResult = service.assignTask(
        GapType.MISSING_COVERAGE,
        GapSeverity.CRITICAL,
        TASK_TYPES.COI_UPLOAD
      );

      expect(criticalResult.assignment_reason.toLowerCase()).toContain('critical');

      const warningResult = service.assignTask(
        GapType.INSUFFICIENT_AMOUNT,
        GapSeverity.WARNING,
        TASK_TYPES.COVERAGE_INCREASE
      );

      expect(warningResult.assignment_reason.toLowerCase()).toContain('warning');
    });
  });

  describe('getDefaultStrategy', () => {
    it('returns subcontractor strategy for COI upload', () => {
      const strategy = service.getDefaultStrategy(TASK_TYPES.COI_UPLOAD);
      expect(strategy).toBe('subcontractor');
    });

    it('returns subcontractor strategy for all task types', () => {
      expect(service.getDefaultStrategy(TASK_TYPES.COI_UPLOAD)).toBe('subcontractor');
      expect(service.getDefaultStrategy(TASK_TYPES.ENDORSEMENT_CORRECTION)).toBe('subcontractor');
      expect(service.getDefaultStrategy(TASK_TYPES.COVERAGE_INCREASE)).toBe('subcontractor');
      expect(service.getDefaultStrategy(TASK_TYPES.POLICY_RENEWAL)).toBe('subcontractor');
      expect(service.getDefaultStrategy(TASK_TYPES.POLICY_EXTENSION)).toBe('subcontractor');
    });
  });

  describe('formatAssignmentReason', () => {
    it('formats reason with gap type and severity', () => {
      const reason = service.formatAssignmentReason(
        GapType.MISSING_COVERAGE,
        GapSeverity.CRITICAL,
        'subcontractor'
      );

      expect(reason).toContain('missing_coverage');
      expect(reason).toContain('critical');
      expect(reason).toContain('subcontractor');
    });

    it('creates readable assignment reason', () => {
      const reason = service.formatAssignmentReason(
        GapType.EXPIRED_POLICY,
        GapSeverity.CRITICAL,
        'subcontractor'
      );

      expect(reason).toBeTruthy();
      expect(reason.length).toBeGreaterThan(10);
    });
  });
});
