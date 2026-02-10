/**
 * CA Attorney General Annual Reporting Tests
 * CCPA Compliance Implementation - TASK-15
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CAAgReportingService,
  createCAAgReportingService,
  type CAAgAnnualReport,
  type CAAgReportPeriod,
  type ReportDataSource,
  type RequestMetrics,
  type OptOutMetrics,
  type BreachMetrics,
} from '../ca-ag-reporting';

describe('CA Attorney General Reporting Service', () => {
  let reportingService: CAAgReportingService;

  beforeEach(() => {
    reportingService = createCAAgReportingService({
      organizationName: 'Test Organization',
      organizationAddress: '123 Test St, Test City, CA 90210',
      contactEmail: 'privacy@test.com',
      contactPhone: '(555) 123-4567',
    });
  });

  describe('Report Period Generation', () => {
    it('should generate correct report period for a year', () => {
      const period = reportingService.getReportPeriod(2024);

      expect(period.reportYear).toBe(2024);
      expect(period.startDate.getFullYear()).toBe(2024);
      expect(period.startDate.getMonth()).toBe(0); // January
      expect(period.startDate.getDate()).toBe(1);
      expect(period.endDate.getFullYear()).toBe(2024);
      expect(period.endDate.getMonth()).toBe(11); // December
      expect(period.endDate.getDate()).toBe(31);
    });

    it('should handle leap years correctly', () => {
      const period = reportingService.getReportPeriod(2024); // Leap year

      expect(period.startDate).toBeInstanceOf(Date);
      expect(period.endDate).toBeInstanceOf(Date);
      expect(period.endDate.getTime()).toBeGreaterThan(period.startDate.getTime());
    });
  });

  describe('Annual Report Generation', () => {
    it('should generate a complete annual report', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe', 'Jane Smith');

      expect(report.reportId).toMatch(/^CCPA-AR-2024-/);
      expect(report.generatedAt).toBeTruthy();
      expect(report.reportPeriod.reportYear).toBe(2024);
      expect(report.organizationInfo.name).toBe('Test Organization');
      expect(report.preparedBy).toBe('John Doe');
      expect(report.approvedBy).toBe('Jane Smith');
    });

    it('should include all required metrics sections', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.requestMetrics).toBeDefined();
      expect(report.optOutMetrics).toBeDefined();
      expect(report.breachMetrics).toBeDefined();
      expect(report.complianceMetrics).toBeDefined();
    });

    it('should generate narrative summary', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.narrativeSummary).toBeTruthy();
      expect(report.narrativeSummary.length).toBeGreaterThan(100);
      expect(report.narrativeSummary).toContain('Test Organization');
    });

    it('should generate certification statement', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.certificationStatement).toBeTruthy();
      expect(report.certificationStatement).toContain('John Doe');
      expect(report.certificationStatement).toContain('2024');
      expect(report.certificationStatement).toContain('Test Organization');
    });

    it('should work without approver', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.preparedBy).toBe('John Doe');
      expect(report.approvedBy).toBeUndefined();
    });
  });

  describe('Request Metrics', () => {
    it('should include all request types', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.requestMetrics;

      expect(metrics.byType.right_to_know).toBeDefined();
      expect(metrics.byType.right_to_delete).toBeDefined();
      expect(metrics.byType.right_to_correct).toBeDefined();
      expect(metrics.byType.opt_out_sale).toBeDefined();
      expect(metrics.byType.limit_sensitive_pi).toBeDefined();
    });

    it('should include all status types', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.requestMetrics;

      expect(metrics.byStatus.received).toBeDefined();
      expect(metrics.byStatus.verification_pending).toBeDefined();
      expect(metrics.byStatus.in_progress).toBeDefined();
      expect(metrics.byStatus.completed).toBeDefined();
      expect(metrics.byStatus.denied).toBeDefined();
      expect(metrics.byStatus.expired).toBeDefined();
    });

    it('should have reasonable response time metrics', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.requestMetrics;

      expect(metrics.averageResponseDays).toBeGreaterThan(0);
      expect(metrics.averageResponseDays).toBeLessThan(45); // Should be under deadline
      expect(metrics.medianResponseDays).toBeGreaterThan(0);
    });

    it('should track deadline compliance', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.requestMetrics;

      expect(metrics.completedWithinDeadline).toBeGreaterThanOrEqual(0);
      expect(metrics.completedAfterDeadline).toBeGreaterThanOrEqual(0);
      expect(metrics.completedWithinDeadline + metrics.completedAfterDeadline).toBeLessThanOrEqual(
        metrics.total
      );
    });
  });

  describe('Opt-Out Metrics', () => {
    it('should include all opt-out categories', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.optOutMetrics;

      expect(metrics.byCategory.sale).toBeDefined();
      expect(metrics.byCategory.sharing).toBeDefined();
      expect(metrics.byCategory.targeted_advertising).toBeDefined();
      expect(metrics.byCategory.profiling).toBeDefined();
    });

    it('should track GPC vs manual opt-outs', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.optOutMetrics;

      expect(metrics.gpcSignalOptOuts).toBeGreaterThanOrEqual(0);
      expect(metrics.manualOptOuts).toBeGreaterThanOrEqual(0);
      expect(metrics.gpcSignalOptOuts + metrics.manualOptOuts).toBe(metrics.totalOptOuts);
    });

    it('should track opt-ins (reversals)', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.optOutMetrics.optIns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Breach Metrics', () => {
    it('should include breach severity breakdown', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const metrics = report.breachMetrics;

      expect(metrics.bySeverity.critical).toBeDefined();
      expect(metrics.bySeverity.high).toBeDefined();
      expect(metrics.bySeverity.medium).toBeDefined();
      expect(metrics.bySeverity.low).toBeDefined();
    });

    it('should track California resident impact', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.breachMetrics.affectedCaliforniaResidents).toBeGreaterThanOrEqual(0);
    });

    it('should track notification compliance', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.breachMetrics.notifiedWithin72Hours).toBeGreaterThanOrEqual(0);
      expect(report.breachMetrics.notifiedWithin72Hours).toBeLessThanOrEqual(
        report.breachMetrics.totalIncidents
      );
    });
  });

  describe('Compliance Metrics Calculation', () => {
    it('should calculate overall compliance rate between 0 and 1', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.complianceMetrics.overallComplianceRate).toBeGreaterThanOrEqual(0);
      expect(report.complianceMetrics.overallComplianceRate).toBeLessThanOrEqual(1);
    });

    it('should calculate deadline compliance rate', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.complianceMetrics.deadlineComplianceRate).toBeGreaterThanOrEqual(0);
      expect(report.complianceMetrics.deadlineComplianceRate).toBeLessThanOrEqual(1);
    });

    it('should calculate verification compliance rate', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.complianceMetrics.verificationComplianceRate).toBeGreaterThanOrEqual(0);
      expect(report.complianceMetrics.verificationComplianceRate).toBeLessThanOrEqual(1);
    });

    it('should calculate data minimization score', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report.complianceMetrics.dataMinimizationScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceMetrics.dataMinimizationScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Report Export Formats', () => {
    let report: CAAgAnnualReport;

    beforeEach(async () => {
      report = await reportingService.generateAnnualReport(2024, 'John Doe');
    });

    it('should export to JSON format', () => {
      const json = reportingService.exportToJSON(report);

      expect(json).toBeTruthy();
      const parsed = JSON.parse(json);
      expect(parsed.reportId).toBe(report.reportId);
      expect(parsed.reportPeriod.reportYear).toBe(2024);
    });

    it('should export to CSV format', () => {
      const csv = reportingService.exportToCSV(report);

      expect(csv).toBeTruthy();
      expect(csv).toContain('CA Attorney General Annual CCPA Report');
      expect(csv).toContain('REQUEST METRICS');
      expect(csv).toContain('OPT-OUT METRICS');
      expect(csv).toContain('BREACH METRICS');
      expect(csv).toContain('COMPLIANCE METRICS');
    });

    it('should include key metrics in CSV', () => {
      const csv = reportingService.exportToCSV(report);

      expect(csv).toContain('Total Requests');
      expect(csv).toContain('Right to Know');
      expect(csv).toContain('Right to Delete');
      expect(csv).toContain('GPC Signal Opt-Outs');
      expect(csv).toContain('Overall Compliance Rate');
    });
  });

  describe('Report Validation', () => {
    it('should validate a complete report as valid', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      const validation = reportingService.validateReport(report);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing report ID', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      report.reportId = '';

      const validation = reportingService.validateReport(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing report ID');
    });

    it('should detect missing preparer', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      report.preparedBy = '';

      const validation = reportingService.validateReport(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing preparer information');
    });

    it('should detect invalid compliance rates', async () => {
      const report = await reportingService.generateAnnualReport(2024, 'John Doe');
      report.complianceMetrics.overallComplianceRate = 1.5; // Invalid

      const validation = reportingService.validateReport(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Overall compliance rate out of range');
    });
  });

  describe('Custom Data Source', () => {
    it('should use custom data source when provided', async () => {
      const mockRequestMetrics: RequestMetrics = {
        total: 100,
        byType: {
          right_to_know: 40,
          right_to_delete: 30,
          right_to_correct: 10,
          opt_out_sale: 15,
          limit_sensitive_pi: 5,
        },
        byStatus: {
          received: 5,
          verification_pending: 10,
          in_progress: 15,
          completed: 60,
          denied: 8,
          expired: 2,
        },
        averageResponseDays: 15,
        medianResponseDays: 12,
        completedWithinDeadline: 58,
        completedAfterDeadline: 2,
        denied: 8,
        denialReasons: {
          'Unable to verify identity': 5,
          'No data found': 3,
        },
      };

      const mockOptOutMetrics: OptOutMetrics = {
        totalOptOuts: 500,
        byCategory: {
          sale: 450,
          sharing: 400,
          targeted_advertising: 350,
          profiling: 200,
        },
        gpcSignalOptOuts: 300,
        manualOptOuts: 200,
        optIns: 25,
      };

      const mockBreachMetrics: BreachMetrics = {
        totalIncidents: 1,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
        affectedCaliforniaResidents: 50,
        averageNotificationDays: 1.5,
        notifiedWithin72Hours: 1,
      };

      const customDataSource: ReportDataSource = {
        getPrivacyRequests: async () => mockRequestMetrics,
        getOptOutMetrics: async () => mockOptOutMetrics,
        getBreachMetrics: async () => mockBreachMetrics,
      };

      const customService = createCAAgReportingService({
        organizationName: 'Custom Org',
        dataSource: customDataSource,
      });

      const report = await customService.generateAnnualReport(2024, 'Test User');

      expect(report.requestMetrics.total).toBe(100);
      expect(report.optOutMetrics.totalOptOuts).toBe(500);
      expect(report.breachMetrics.totalIncidents).toBe(1);
    });
  });

  describe('Multiple Years Support', () => {
    it('should generate reports for different years', async () => {
      const report2023 = await reportingService.generateAnnualReport(2023, 'John Doe');
      const report2024 = await reportingService.generateAnnualReport(2024, 'John Doe');

      expect(report2023.reportPeriod.reportYear).toBe(2023);
      expect(report2024.reportPeriod.reportYear).toBe(2024);
      expect(report2023.reportId).not.toBe(report2024.reportId);
    });

    it('should generate unique report IDs', async () => {
      const reports = await Promise.all([
        reportingService.generateAnnualReport(2024, 'User 1'),
        reportingService.generateAnnualReport(2024, 'User 2'),
        reportingService.generateAnnualReport(2024, 'User 3'),
      ]);

      const reportIds = reports.map(r => r.reportId);
      const uniqueIds = new Set(reportIds);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('Factory Function', () => {
    it('should create service with default config', () => {
      const service = createCAAgReportingService();

      expect(service).toBeInstanceOf(CAAgReportingService);
    });

    it('should create service with partial config', () => {
      const service = createCAAgReportingService({
        organizationName: 'Partial Config Org',
      });

      expect(service).toBeInstanceOf(CAAgReportingService);
    });
  });
});
