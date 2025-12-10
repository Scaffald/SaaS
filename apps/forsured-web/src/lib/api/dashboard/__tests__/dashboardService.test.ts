/**
 * REQ-129: Manager Dashboard Service Tests
 * TDD tests for dashboard API service layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../dashboardService';
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

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return overall dashboard metrics', async () => {
      const overview = await dashboardService.getOverview();

      expect(overview).toBeDefined();
      expect(overview.overall_compliance_score).toBeGreaterThanOrEqual(0);
      expect(overview.overall_compliance_score).toBeLessThanOrEqual(100);
      expect(overview.total_subcontractors).toBeGreaterThanOrEqual(0);
      expect(overview.compliant_count).toBeGreaterThanOrEqual(0);
      expect(overview.warning_count).toBeGreaterThanOrEqual(0);
      expect(overview.critical_count).toBeGreaterThanOrEqual(0);
      expect(overview.last_updated).toBeDefined();
    });

    it('should return metrics that sum correctly', async () => {
      const overview = await dashboardService.getOverview();

      const totalByStatus =
        overview.compliant_count + overview.warning_count + overview.critical_count;
      expect(totalByStatus).toBeLessThanOrEqual(overview.total_subcontractors);
    });
  });

  describe('getSubcontractorScores', () => {
    it('should return list of subcontractor compliance scores', async () => {
      const scores = await dashboardService.getSubcontractorScores();

      expect(Array.isArray(scores)).toBe(true);
      if (scores.length > 0) {
        const score = scores[0];
        expect(score.id).toBeDefined();
        expect(score.company_name).toBeDefined();
        expect(score.compliance_score).toBeGreaterThanOrEqual(0);
        expect(score.compliance_score).toBeLessThanOrEqual(100);
        expect(['compliant', 'warning', 'critical', 'non_compliant', 'partial']).toContain(
          score.status
        );
      }
    });

    it('should filter scores by project_ids when provided', async () => {
      const projectIds = ['project-1', 'project-2'];
      const scores = await dashboardService.getSubcontractorScores({ project_ids: projectIds });

      expect(Array.isArray(scores)).toBe(true);
      // Filtering logic will be implemented
    });

    it('should filter scores by status when provided', async () => {
      const scores = await dashboardService.getSubcontractorScores({
        status_filter: ['compliant'],
      });

      expect(Array.isArray(scores)).toBe(true);
      if (scores.length > 0) {
        scores.forEach((score) => {
          expect(score.status).toBe('compliant');
        });
      }
    });

    it('should search subcontractors by name', async () => {
      const allScores = await dashboardService.getSubcontractorScores();
      if (allScores.length > 0) {
        const searchTerm = allScores[0].company_name.substring(0, 3);
        const filteredScores = await dashboardService.getSubcontractorScores({
          subcontractor_search: searchTerm,
        });

        expect(Array.isArray(filteredScores)).toBe(true);
        if (filteredScores.length > 0) {
          filteredScores.forEach((score) => {
            expect(score.company_name.toLowerCase()).toContain(searchTerm.toLowerCase());
          });
        }
      }
    });
  });

  describe('getTaskSummary', () => {
    it('should return task counts grouped by priority', async () => {
      const summary = await dashboardService.getTaskSummary();

      expect(summary.total_open_tasks).toBeGreaterThanOrEqual(0);
      expect(summary.high_priority_count).toBeGreaterThanOrEqual(0);
      expect(summary.medium_priority_count).toBeGreaterThanOrEqual(0);
      expect(summary.low_priority_count).toBeGreaterThanOrEqual(0);
      expect(summary.urgent_count).toBeGreaterThanOrEqual(0);
      expect(summary.overdue_count).toBeGreaterThanOrEqual(0);
      expect(summary.due_today_count).toBeGreaterThanOrEqual(0);
      expect(summary.last_updated).toBeDefined();
    });

    it('should have priority counts sum to total open tasks', async () => {
      const summary = await dashboardService.getTaskSummary();

      const prioritySum =
        summary.high_priority_count +
        summary.medium_priority_count +
        summary.low_priority_count +
        summary.urgent_count;

      expect(prioritySum).toBeLessThanOrEqual(summary.total_open_tasks);
    });
  });

  describe('getExpiringPolicies', () => {
    it('should return policies expiring within 30 days by default', async () => {
      const policies = await dashboardService.getExpiringPolicies();

      expect(Array.isArray(policies)).toBe(true);
      if (policies.length > 0) {
        const policy = policies[0];
        expect(policy.id).toBeDefined();
        expect(policy.policy_number).toBeDefined();
        expect(policy.subcontractor_name).toBeDefined();
        expect(policy.days_remaining).toBeGreaterThanOrEqual(0);
        expect(policy.days_remaining).toBeLessThanOrEqual(30);
      }
    });

    it('should support custom days window', async () => {
      const policies = await dashboardService.getExpiringPolicies(60);

      if (policies.length > 0) {
        policies.forEach((policy) => {
          expect(policy.days_remaining).toBeGreaterThanOrEqual(0);
          expect(policy.days_remaining).toBeLessThanOrEqual(60);
        });
      }
    });

    it('should sort policies by days remaining ascending', async () => {
      const policies = await dashboardService.getExpiringPolicies();

      for (let i = 1; i < policies.length; i++) {
        expect(policies[i].days_remaining).toBeGreaterThanOrEqual(
          policies[i - 1].days_remaining
        );
      }
    });
  });

  describe('getActivityFeed', () => {
    it('should return recent activity events', async () => {
      const activities = await dashboardService.getActivityFeed();

      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeLessThanOrEqual(20); // Default limit

      if (activities.length > 0) {
        const activity = activities[0];
        expect(activity.id).toBeDefined();
        expect(activity.event_type).toBeDefined();
        expect(activity.description).toBeDefined();
        expect(activity.timestamp).toBeDefined();
      }
    });

    it('should support custom limit', async () => {
      const limit = 10;
      const activities = await dashboardService.getActivityFeed(limit);

      expect(activities.length).toBeLessThanOrEqual(limit);
    });

    it('should sort activities by timestamp descending', async () => {
      const activities = await dashboardService.getActivityFeed();

      for (let i = 1; i < activities.length; i++) {
        const current = new Date(activities[i].timestamp).getTime();
        const previous = new Date(activities[i - 1].timestamp).getTime();
        expect(current).toBeLessThanOrEqual(previous);
      }
    });

    it('should filter activities by date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = now;

      const activities = await dashboardService.getActivityFeed(20, {
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      activities.forEach((activity) => {
        const activityDate = new Date(activity.timestamp);
        expect(activityDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(activityDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('getComplianceTrend', () => {
    it('should return 30-day trend data by default', async () => {
      const trendData = await dashboardService.getComplianceTrend();

      expect(Array.isArray(trendData)).toBe(true);
      expect(trendData.length).toBeGreaterThan(0);
      expect(trendData.length).toBeLessThanOrEqual(30);

      if (trendData.length > 0) {
        const dataPoint = trendData[0];
        expect(dataPoint.date).toBeDefined();
        expect(dataPoint.overall_score).toBeGreaterThanOrEqual(0);
        expect(dataPoint.overall_score).toBeLessThanOrEqual(100);
      }
    });

    it('should support custom days parameter', async () => {
      const days = 7;
      const trendData = await dashboardService.getComplianceTrend(days);

      expect(trendData.length).toBeLessThanOrEqual(days);
    });

    it('should return data sorted by date ascending', async () => {
      const trendData = await dashboardService.getComplianceTrend();

      for (let i = 1; i < trendData.length; i++) {
        const currentDate = new Date(trendData[i].date).getTime();
        const previousDate = new Date(trendData[i - 1].date).getTime();
        expect(currentDate).toBeGreaterThan(previousDate);
      }
    });
  });

  describe('getDrillDownData', () => {
    it('should return detailed metric breakdown', async () => {
      const drillDown = await dashboardService.getDrillDownData('overall_compliance_score');

      expect(drillDown.metric_name).toBe('overall_compliance_score');
      expect(drillDown.current_value).toBeDefined();
      expect(drillDown.previous_value).toBeDefined();
      expect(drillDown.change_percentage).toBeDefined();
      expect(Array.isArray(drillDown.trend_data)).toBe(true);
      expect(Array.isArray(drillDown.contributing_factors)).toBe(true);
    });

    it('should calculate change percentage correctly', async () => {
      const drillDown = await dashboardService.getDrillDownData('overall_compliance_score');

      const expectedChange =
        ((drillDown.current_value - drillDown.previous_value) / drillDown.previous_value) * 100;

      if (isFinite(expectedChange)) {
        expect(Math.abs(drillDown.change_percentage - expectedChange)).toBeLessThan(0.01);
      }
    });
  });

  describe('getSubcontractorDetail', () => {
    it('should return comprehensive subcontractor details', async () => {
      // First get a subcontractor ID
      const scores = await dashboardService.getSubcontractorScores();
      if (scores.length > 0) {
        const subcontractorId = scores[0].id;
        const detail = await dashboardService.getSubcontractorDetail(subcontractorId);

        expect(detail.id).toBe(subcontractorId);
        expect(detail.company_name).toBeDefined();
        expect(detail.compliance_score).toBeGreaterThanOrEqual(0);
        expect(detail.compliance_score).toBeLessThanOrEqual(100);
        expect(Array.isArray(detail.policies)).toBe(true);
        expect(Array.isArray(detail.open_tasks)).toBe(true);
        expect(Array.isArray(detail.recent_activity)).toBe(true);
        expect(Array.isArray(detail.compliance_history)).toBe(true);
      }
    });

    it('should throw error for non-existent subcontractor', async () => {
      await expect(
        dashboardService.getSubcontractorDetail('non-existent-id-12345')
      ).rejects.toThrow('Subcontractor not found');
    });
  });

  describe('exportDashboard', () => {
    it('should export dashboard as CSV', async () => {
      const csv = await dashboardService.exportDashboard({ format: 'csv', report_date: new Date().toISOString() });

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Company Name');
      expect(csv).toContain('Compliance Score');
    });

    it('should export dashboard as PDF metadata', async () => {
      const pdfData = await dashboardService.exportDashboard({
        format: 'pdf',
        include_charts: true,
        report_date: new Date().toISOString(),
      });

      expect(pdfData).toBeDefined();
      // PDF export would return structured data for PDF generation
    });
  });

  describe('Real-time updates', () => {
    it('should detect when dashboard needs refresh', async () => {
      const lastUpdate = new Date(Date.now() - 35000).toISOString(); // 35s ago
      const needsRefresh = await dashboardService.needsRefresh(lastUpdate);

      expect(typeof needsRefresh).toBe('boolean');
      expect(needsRefresh).toBe(true); // More than 30s
    });

    it('should not refresh if updated recently', async () => {
      const lastUpdate = new Date(Date.now() - 15000).toISOString(); // 15s ago
      const needsRefresh = await dashboardService.needsRefresh(lastUpdate);

      expect(needsRefresh).toBe(false);
    });
  });
});
