/**
 * REQ-129: Dashboard Mock Validation Tests
 * Validates that our mocks match the real system (CLAUDE.md requirement)
 */

import { describe, it, expect } from 'vitest';
import type {
  DashboardOverview,
  SubcontractorScore,
  TaskSummary,
  ExpiringPolicy,
  ActivityEvent,
  ComplianceTrendData,
  DrillDownData,
  SubcontractorDetail,
} from '../types';
import { dashboardService } from '../dashboardService';

describe('Dashboard Mock Validation', () => {
  describe('DashboardOverview mock structure', () => {
    it('should match expected interface structure', async () => {
      const overview = await dashboardService.getOverview();

      // Verify all required fields exist
      expect(overview).toHaveProperty('overall_compliance_score');
      expect(overview).toHaveProperty('total_subcontractors');
      expect(overview).toHaveProperty('compliant_count');
      expect(overview).toHaveProperty('warning_count');
      expect(overview).toHaveProperty('critical_count');
      expect(overview).toHaveProperty('total_projects');
      expect(overview).toHaveProperty('active_projects');
      expect(overview).toHaveProperty('last_updated');

      // Verify field types
      expect(typeof overview.overall_compliance_score).toBe('number');
      expect(typeof overview.total_subcontractors).toBe('number');
      expect(typeof overview.compliant_count).toBe('number');
      expect(typeof overview.warning_count).toBe('number');
      expect(typeof overview.critical_count).toBe('number');
      expect(typeof overview.total_projects).toBe('number');
      expect(typeof overview.active_projects).toBe('number');
      expect(typeof overview.last_updated).toBe('string');

      // Verify data validity
      expect(overview.overall_compliance_score).toBeGreaterThanOrEqual(0);
      expect(overview.overall_compliance_score).toBeLessThanOrEqual(100);
      expect(overview.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });
  });

  describe('SubcontractorScore mock structure', () => {
    it('should match expected interface structure', async () => {
      const scores = await dashboardService.getSubcontractorScores();

      if (scores.length > 0) {
        const score = scores[0];

        // Verify all required fields exist
        expect(score).toHaveProperty('id');
        expect(score).toHaveProperty('company_name');
        expect(score).toHaveProperty('compliance_score');
        expect(score).toHaveProperty('status');
        expect(score).toHaveProperty('open_tasks_count');
        expect(score).toHaveProperty('policies_expiring_count');
        expect(score).toHaveProperty('last_updated');
        expect(score).toHaveProperty('project_count');
        expect(score).toHaveProperty('risk_level');

        // Verify field types
        expect(typeof score.id).toBe('string');
        expect(typeof score.company_name).toBe('string');
        expect(typeof score.compliance_score).toBe('number');
        expect(typeof score.status).toBe('string');
        expect(typeof score.open_tasks_count).toBe('number');
        expect(typeof score.policies_expiring_count).toBe('number');
        expect(typeof score.last_updated).toBe('string');
        expect(typeof score.project_count).toBe('number');
        expect(typeof score.risk_level).toBe('string');

        // Verify data validity
        expect(score.compliance_score).toBeGreaterThanOrEqual(0);
        expect(score.compliance_score).toBeLessThanOrEqual(100);
        expect(['compliant', 'warning', 'critical', 'non_compliant', 'partial']).toContain(
          score.status
        );
        expect(['low', 'medium', 'high', 'critical']).toContain(score.risk_level);
      }
    });
  });

  describe('TaskSummary mock structure', () => {
    it('should match expected interface structure', async () => {
      const summary = await dashboardService.getTaskSummary();

      // Verify all required fields exist
      expect(summary).toHaveProperty('total_open_tasks');
      expect(summary).toHaveProperty('high_priority_count');
      expect(summary).toHaveProperty('medium_priority_count');
      expect(summary).toHaveProperty('low_priority_count');
      expect(summary).toHaveProperty('urgent_count');
      expect(summary).toHaveProperty('overdue_count');
      expect(summary).toHaveProperty('due_today_count');
      expect(summary).toHaveProperty('last_updated');

      // Verify field types
      expect(typeof summary.total_open_tasks).toBe('number');
      expect(typeof summary.high_priority_count).toBe('number');
      expect(typeof summary.medium_priority_count).toBe('number');
      expect(typeof summary.low_priority_count).toBe('number');
      expect(typeof summary.urgent_count).toBe('number');
      expect(typeof summary.overdue_count).toBe('number');
      expect(typeof summary.due_today_count).toBe('number');
      expect(typeof summary.last_updated).toBe('string');

      // Verify data validity
      expect(summary.total_open_tasks).toBeGreaterThanOrEqual(0);
      expect(summary.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('ExpiringPolicy mock structure', () => {
    it('should match expected interface structure', async () => {
      const policies = await dashboardService.getExpiringPolicies();

      if (policies.length > 0) {
        const policy = policies[0];

        // Verify all required fields exist
        expect(policy).toHaveProperty('id');
        expect(policy).toHaveProperty('policy_number');
        expect(policy).toHaveProperty('policy_type');
        expect(policy).toHaveProperty('subcontractor_id');
        expect(policy).toHaveProperty('subcontractor_name');
        expect(policy).toHaveProperty('expiration_date');
        expect(policy).toHaveProperty('days_remaining');
        expect(policy).toHaveProperty('project_count');
        expect(policy).toHaveProperty('status');

        // Verify field types
        expect(typeof policy.id).toBe('string');
        expect(typeof policy.policy_number).toBe('string');
        expect(typeof policy.policy_type).toBe('string');
        expect(typeof policy.subcontractor_id).toBe('string');
        expect(typeof policy.subcontractor_name).toBe('string');
        expect(typeof policy.expiration_date).toBe('string');
        expect(typeof policy.days_remaining).toBe('number');
        expect(typeof policy.project_count).toBe('number');
        expect(typeof policy.status).toBe('string');

        // Verify data validity
        expect(policy.days_remaining).toBeGreaterThanOrEqual(0);
        expect(['active', 'expired']).toContain(policy.status);
      }
    });
  });

  describe('ActivityEvent mock structure', () => {
    it('should match expected interface structure', async () => {
      const activities = await dashboardService.getActivityFeed();

      if (activities.length > 0) {
        const activity = activities[0];

        // Verify all required fields exist
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('event_type');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('timestamp');

        // Verify field types
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.event_type).toBe('string');
        expect(typeof activity.description).toBe('string');
        expect(typeof activity.timestamp).toBe('string');

        // Verify data validity
        expect([
          'policy_uploaded',
          'policy_updated',
          'policy_expired',
          'task_created',
          'task_completed',
          'compliance_score_changed',
          'subcontractor_added',
          'project_status_changed',
        ]).toContain(activity.event_type);
        expect(activity.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe('ComplianceTrendData mock structure', () => {
    it('should match expected interface structure', async () => {
      const trendData = await dashboardService.getComplianceTrend();

      expect(trendData.length).toBeGreaterThan(0);

      const dataPoint = trendData[0];

      // Verify all required fields exist
      expect(dataPoint).toHaveProperty('date');
      expect(dataPoint).toHaveProperty('overall_score');
      expect(dataPoint).toHaveProperty('compliant_count');
      expect(dataPoint).toHaveProperty('warning_count');
      expect(dataPoint).toHaveProperty('critical_count');

      // Verify field types
      expect(typeof dataPoint.date).toBe('string');
      expect(typeof dataPoint.overall_score).toBe('number');
      expect(typeof dataPoint.compliant_count).toBe('number');
      expect(typeof dataPoint.warning_count).toBe('number');
      expect(typeof dataPoint.critical_count).toBe('number');

      // Verify data validity
      expect(dataPoint.overall_score).toBeGreaterThanOrEqual(0);
      expect(dataPoint.overall_score).toBeLessThanOrEqual(100);
      expect(dataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });

  describe('DrillDownData mock structure', () => {
    it('should match expected interface structure', async () => {
      const drillDown = await dashboardService.getDrillDownData('overall_compliance_score');

      // Verify all required fields exist
      expect(drillDown).toHaveProperty('metric_name');
      expect(drillDown).toHaveProperty('current_value');
      expect(drillDown).toHaveProperty('previous_value');
      expect(drillDown).toHaveProperty('change_percentage');
      expect(drillDown).toHaveProperty('trend_data');
      expect(drillDown).toHaveProperty('contributing_factors');

      // Verify field types
      expect(typeof drillDown.metric_name).toBe('string');
      expect(typeof drillDown.current_value).toBe('number');
      expect(typeof drillDown.previous_value).toBe('number');
      expect(typeof drillDown.change_percentage).toBe('number');
      expect(Array.isArray(drillDown.trend_data)).toBe(true);
      expect(Array.isArray(drillDown.contributing_factors)).toBe(true);

      // Verify contributing factors structure
      if (drillDown.contributing_factors.length > 0) {
        const factor = drillDown.contributing_factors[0];
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('value');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('description');

        expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
      }
    });
  });

  describe('SubcontractorDetail mock structure', () => {
    it('should match expected interface structure', async () => {
      const scores = await dashboardService.getSubcontractorScores();

      if (scores.length > 0) {
        const detail = await dashboardService.getSubcontractorDetail(scores[0].id);

        // Verify all required fields exist
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('company_name');
        expect(detail).toHaveProperty('compliance_score');
        expect(detail).toHaveProperty('status');
        expect(detail).toHaveProperty('policies');
        expect(detail).toHaveProperty('open_tasks');
        expect(detail).toHaveProperty('recent_activity');
        expect(detail).toHaveProperty('compliance_history');

        // Verify field types
        expect(typeof detail.id).toBe('string');
        expect(typeof detail.company_name).toBe('string');
        expect(typeof detail.compliance_score).toBe('number');
        expect(typeof detail.status).toBe('string');
        expect(Array.isArray(detail.policies)).toBe(true);
        expect(Array.isArray(detail.open_tasks)).toBe(true);
        expect(Array.isArray(detail.recent_activity)).toBe(true);
        expect(Array.isArray(detail.compliance_history)).toBe(true);

        // Verify nested structures
        if (detail.policies.length > 0) {
          const policyInfo = detail.policies[0];
          expect(policyInfo).toHaveProperty('id');
          expect(policyInfo).toHaveProperty('policy_number');
          expect(policyInfo).toHaveProperty('policy_type');
          expect(policyInfo).toHaveProperty('provider');
          expect(policyInfo).toHaveProperty('expiration_date');
          expect(policyInfo).toHaveProperty('days_remaining');
          expect(policyInfo).toHaveProperty('status');

          expect(['active', 'expired', 'expiring_soon']).toContain(policyInfo.status);
        }

        if (detail.open_tasks.length > 0) {
          const taskInfo = detail.open_tasks[0];
          expect(taskInfo).toHaveProperty('id');
          expect(taskInfo).toHaveProperty('title');
          expect(taskInfo).toHaveProperty('priority');
          expect(taskInfo).toHaveProperty('status');

          expect(['low', 'medium', 'high', 'urgent']).toContain(taskInfo.priority);
          expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(taskInfo.status);
        }
      }
    });
  });

  describe('Data consistency across services', () => {
    it('should have consistent subcontractor counts', async () => {
      const overview = await dashboardService.getOverview();
      const scores = await dashboardService.getSubcontractorScores();

      // Total subcontractors in overview should match scores array length
      expect(overview.total_subcontractors).toBe(scores.length);
    });

    it('should have consistent compliance status distribution', async () => {
      const overview = await dashboardService.getOverview();
      const scores = await dashboardService.getSubcontractorScores();

      // Count status distribution from scores
      const compliant = scores.filter((s) => s.status === 'compliant').length;
      const warning = scores.filter((s) => s.status === 'warning').length;
      const critical = scores.filter((s) => s.status === 'critical').length;

      // Should match overview counts
      expect(overview.compliant_count).toBe(compliant);
      expect(overview.warning_count).toBe(warning);
      expect(overview.critical_count).toBe(critical);
    });
  });
});
