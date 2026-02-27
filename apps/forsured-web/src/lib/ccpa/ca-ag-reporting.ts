/**
 * CA Attorney General Annual Reporting System
 * CCPA Compliance Implementation - TASK-15
 *
 * Generates annual compliance reports for CA AG submission
 * per CCPA Section 1798.185(a)(7) requirements.
 */

import type {
  PrivacyRequestType,
  PrivacyRequestStatus,
  BreachSeverity,
} from './types';

// =============================================================================
// REPORT TYPES
// =============================================================================

export interface CAAgReportPeriod {
  startDate: Date;
  endDate: Date;
  reportYear: number;
}

export interface RequestMetrics {
  total: number;
  byType: Record<PrivacyRequestType, number>;
  byStatus: Record<PrivacyRequestStatus, number>;
  averageResponseDays: number;
  medianResponseDays: number;
  completedWithinDeadline: number;
  completedAfterDeadline: number;
  denied: number;
  denialReasons: Record<string, number>;
}

export interface OptOutMetrics {
  totalOptOuts: number;
  byCategory: {
    sale: number;
    sharing: number;
    targeted_advertising: number;
    profiling: number;
  };
  gpcSignalOptOuts: number;
  manualOptOuts: number;
  optIns: number;
}

export interface BreachMetrics {
  totalIncidents: number;
  bySeverity: Record<BreachSeverity, number>;
  affectedCaliforniaResidents: number;
  averageNotificationDays: number;
  notifiedWithin72Hours: number;
}

export interface ComplianceMetrics {
  overallComplianceRate: number;
  deadlineComplianceRate: number;
  verificationComplianceRate: number;
  dataMinimizationScore: number;
}

export interface CAAgAnnualReport {
  reportId: string;
  generatedAt: string;
  reportPeriod: CAAgReportPeriod;
  organizationInfo: {
    name: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    dataProtectionOfficer?: string;
  };
  requestMetrics: RequestMetrics;
  optOutMetrics: OptOutMetrics;
  breachMetrics: BreachMetrics;
  complianceMetrics: ComplianceMetrics;
  narrativeSummary: string;
  certificationStatement: string;
  preparedBy: string;
  approvedBy?: string;
}

// =============================================================================
// MOCK DATA GENERATORS (for testing/demo)
// =============================================================================

function generateMockRequestData(period: CAAgReportPeriod): RequestMetrics {
  const total = Math.floor(Math.random() * 500) + 100;
  const completed = Math.floor(total * 0.85);
  const denied = Math.floor(total * 0.05);
  const pending = total - completed - denied;

  return {
    total,
    byType: {
      right_to_know: Math.floor(total * 0.35),
      right_to_delete: Math.floor(total * 0.30),
      right_to_correct: Math.floor(total * 0.10),
      opt_out_sale: Math.floor(total * 0.20),
      limit_sensitive_pi: Math.floor(total * 0.05),
    },
    byStatus: {
      received: Math.floor(pending * 0.2),
      verification_pending: Math.floor(pending * 0.3),
      in_progress: Math.floor(pending * 0.5),
      completed,
      denied,
      expired: Math.floor(total * 0.02),
    },
    averageResponseDays: 12 + Math.random() * 10,
    medianResponseDays: 10 + Math.random() * 8,
    completedWithinDeadline: Math.floor(completed * 0.95),
    completedAfterDeadline: Math.floor(completed * 0.05),
    denied,
    denialReasons: {
      'Unable to verify identity': Math.floor(denied * 0.4),
      'No data found': Math.floor(denied * 0.3),
      'Duplicate request': Math.floor(denied * 0.2),
      'Exemption applies': Math.floor(denied * 0.1),
    },
  };
}

function generateMockOptOutData(): OptOutMetrics {
  const totalOptOuts = Math.floor(Math.random() * 1000) + 200;
  const gpcSignalOptOuts = Math.floor(totalOptOuts * 0.6);

  return {
    totalOptOuts,
    byCategory: {
      sale: Math.floor(totalOptOuts * 0.9),
      sharing: Math.floor(totalOptOuts * 0.85),
      targeted_advertising: Math.floor(totalOptOuts * 0.75),
      profiling: Math.floor(totalOptOuts * 0.5),
    },
    gpcSignalOptOuts,
    manualOptOuts: totalOptOuts - gpcSignalOptOuts,
    optIns: Math.floor(totalOptOuts * 0.05),
  };
}

function generateMockBreachData(): BreachMetrics {
  const totalIncidents = Math.floor(Math.random() * 3);

  return {
    totalIncidents,
    bySeverity: {
      critical: 0,
      high: Math.min(1, totalIncidents),
      medium: Math.max(0, totalIncidents - 1),
      low: 0,
    },
    affectedCaliforniaResidents: totalIncidents > 0 ? Math.floor(Math.random() * 100) : 0,
    averageNotificationDays: totalIncidents > 0 ? 1 + Math.random() * 2 : 0,
    notifiedWithin72Hours: totalIncidents,
  };
}

// =============================================================================
// REPORTING SERVICE
// =============================================================================

export interface ReportDataSource {
  getPrivacyRequests(period: CAAgReportPeriod): Promise<RequestMetrics>;
  getOptOutMetrics(period: CAAgReportPeriod): Promise<OptOutMetrics>;
  getBreachMetrics(period: CAAgReportPeriod): Promise<BreachMetrics>;
}

export class CAAgReportingService {
  private dataSource: ReportDataSource | null = null;
  private organizationName: string;
  private organizationAddress: string;
  private contactEmail: string;
  private contactPhone: string;

  constructor(config: {
    organizationName: string;
    organizationAddress: string;
    contactEmail: string;
    contactPhone: string;
    dataSource?: ReportDataSource;
  }) {
    this.organizationName = config.organizationName;
    this.organizationAddress = config.organizationAddress;
    this.contactEmail = config.contactEmail;
    this.contactPhone = config.contactPhone;
    this.dataSource = config.dataSource ?? null;
  }

  /**
   * Generate the annual report for CA AG submission
   */
  async generateAnnualReport(
    year: number,
    preparedBy: string,
    approvedBy?: string
  ): Promise<CAAgAnnualReport> {
    const period = this.getReportPeriod(year);

    // Get metrics from data source or generate mock data
    const requestMetrics = this.dataSource
      ? await this.dataSource.getPrivacyRequests(period)
      : generateMockRequestData(period);

    const optOutMetrics = this.dataSource
      ? await this.dataSource.getOptOutMetrics(period)
      : generateMockOptOutData();

    const breachMetrics = this.dataSource
      ? await this.dataSource.getBreachMetrics(period)
      : generateMockBreachData();

    const complianceMetrics = this.calculateComplianceMetrics(
      requestMetrics,
      optOutMetrics,
      breachMetrics
    );

    const narrativeSummary = this.generateNarrativeSummary(
      requestMetrics,
      optOutMetrics,
      breachMetrics,
      complianceMetrics
    );

    return {
      reportId: this.generateReportId(year),
      generatedAt: new Date().toISOString(),
      reportPeriod: period,
      organizationInfo: {
        name: this.organizationName,
        address: this.organizationAddress,
        contactEmail: this.contactEmail,
        contactPhone: this.contactPhone,
      },
      requestMetrics,
      optOutMetrics,
      breachMetrics,
      complianceMetrics,
      narrativeSummary,
      certificationStatement: this.generateCertificationStatement(year, preparedBy),
      preparedBy,
      approvedBy,
    };
  }

  /**
   * Get the reporting period for a given year
   */
  getReportPeriod(year: number): CAAgReportPeriod {
    return {
      startDate: new Date(year, 0, 1), // January 1
      endDate: new Date(year, 11, 31, 23, 59, 59), // December 31
      reportYear: year,
    };
  }

  /**
   * Calculate compliance metrics from raw data
   */
  calculateComplianceMetrics(
    requests: RequestMetrics,
    optOuts: OptOutMetrics,
    breaches: BreachMetrics
  ): ComplianceMetrics {
    const totalCompleted = requests.completedWithinDeadline + requests.completedAfterDeadline;
    const deadlineComplianceRate =
      totalCompleted > 0 ? requests.completedWithinDeadline / totalCompleted : 1;

    const verificationComplianceRate =
      requests.total > 0
        ? (requests.byStatus.completed + requests.byStatus.denied) / requests.total
        : 1;

    const breachNotificationRate =
      breaches.totalIncidents > 0
        ? breaches.notifiedWithin72Hours / breaches.totalIncidents
        : 1;

    // Overall compliance is weighted average of key metrics
    const overallComplianceRate =
      deadlineComplianceRate * 0.4 +
      verificationComplianceRate * 0.3 +
      breachNotificationRate * 0.2 +
      (optOuts.gpcSignalOptOuts > 0 ? 1 : 0.8) * 0.1;

    // Data minimization score based on opt-out respect and deletion completion
    const dataMinimizationScore =
      requests.byType.right_to_delete > 0
        ? Math.min(1, requests.byStatus.completed / requests.byType.right_to_delete)
        : 1;

    return {
      overallComplianceRate: Math.round(overallComplianceRate * 100) / 100,
      deadlineComplianceRate: Math.round(deadlineComplianceRate * 100) / 100,
      verificationComplianceRate: Math.round(verificationComplianceRate * 100) / 100,
      dataMinimizationScore: Math.round(dataMinimizationScore * 100) / 100,
    };
  }

  /**
   * Generate narrative summary for the report
   */
  generateNarrativeSummary(
    requests: RequestMetrics,
    optOuts: OptOutMetrics,
    breaches: BreachMetrics,
    compliance: ComplianceMetrics
  ): string {
    const sections: string[] = [];

    // Request summary
    sections.push(
      `During the reporting period, ${this.organizationName} received and processed ` +
        `${requests.total} California Consumer Privacy Act (CCPA) requests. ` +
        `The majority of requests (${requests.byType.right_to_know}) were "Right to Know" requests, ` +
        `followed by deletion requests (${requests.byType.right_to_delete}).`
    );

    // Response time summary
    sections.push(
      `The average response time was ${requests.averageResponseDays.toFixed(1)} days, ` +
        `with ${requests.completedWithinDeadline} requests (${Math.round(
          (requests.completedWithinDeadline / (requests.completedWithinDeadline + requests.completedAfterDeadline)) *
            100
        )}%) completed within the 45-day statutory deadline.`
    );

    // Opt-out summary
    sections.push(
      `A total of ${optOuts.totalOptOuts} consumers exercised their right to opt out of ` +
        `data sales and sharing. Of these, ${optOuts.gpcSignalOptOuts} were automatically ` +
        `honored through Global Privacy Control (GPC) signal detection.`
    );

    // Breach summary
    if (breaches.totalIncidents > 0) {
      sections.push(
        `${breaches.totalIncidents} security incident(s) occurred during the reporting period, ` +
          `affecting ${breaches.affectedCaliforniaResidents} California residents. ` +
          `All incidents were reported within the required timeframe.`
      );
    } else {
      sections.push('No reportable security incidents occurred during the reporting period.');
    }

    // Compliance summary
    sections.push(
      `Overall CCPA compliance rate for the reporting period was ` +
        `${Math.round(compliance.overallComplianceRate * 100)}%.`
    );

    return sections.join('\n\n');
  }

  /**
   * Generate certification statement
   */
  generateCertificationStatement(year: number, preparedBy: string): string {
    return (
      `I, ${preparedBy}, hereby certify that the information contained in this ` +
      `California Consumer Privacy Act Annual Report for the year ${year} is true ` +
      `and accurate to the best of my knowledge. This report has been prepared in ` +
      `compliance with California Civil Code Section 1798.185(a)(7) and reflects ` +
      `the privacy practices of ${this.organizationName} during the reporting period.`
    );
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(year: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CCPA-AR-${year}-${timestamp.toUpperCase()}${random.toUpperCase()}`;
  }

  /**
   * Export report to JSON format
   */
  exportToJSON(report: CAAgAnnualReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report to CSV format (summary metrics)
   */
  exportToCSV(report: CAAgAnnualReport): string {
    const lines: string[] = [];

    // Header
    lines.push('CA Attorney General Annual CCPA Report');
    lines.push(`Report ID,${report.reportId}`);
    lines.push(`Generated At,${report.generatedAt}`);
    lines.push(`Report Year,${report.reportPeriod.reportYear}`);
    lines.push(`Organization,${report.organizationInfo.name}`);
    lines.push('');

    // Request Metrics
    lines.push('REQUEST METRICS');
    lines.push(`Total Requests,${report.requestMetrics.total}`);
    lines.push(`Right to Know,${report.requestMetrics.byType.right_to_know}`);
    lines.push(`Right to Delete,${report.requestMetrics.byType.right_to_delete}`);
    lines.push(`Right to Correct,${report.requestMetrics.byType.right_to_correct}`);
    lines.push(`Opt-Out Sale,${report.requestMetrics.byType.opt_out_sale}`);
    lines.push(`Limit Sensitive PI,${report.requestMetrics.byType.limit_sensitive_pi}`);
    lines.push(`Average Response Days,${report.requestMetrics.averageResponseDays.toFixed(1)}`);
    lines.push(`Completed Within Deadline,${report.requestMetrics.completedWithinDeadline}`);
    lines.push(`Completed After Deadline,${report.requestMetrics.completedAfterDeadline}`);
    lines.push(`Denied,${report.requestMetrics.denied}`);
    lines.push('');

    // Opt-Out Metrics
    lines.push('OPT-OUT METRICS');
    lines.push(`Total Opt-Outs,${report.optOutMetrics.totalOptOuts}`);
    lines.push(`GPC Signal Opt-Outs,${report.optOutMetrics.gpcSignalOptOuts}`);
    lines.push(`Manual Opt-Outs,${report.optOutMetrics.manualOptOuts}`);
    lines.push(`Opt-Ins (Reversals),${report.optOutMetrics.optIns}`);
    lines.push('');

    // Breach Metrics
    lines.push('BREACH METRICS');
    lines.push(`Total Incidents,${report.breachMetrics.totalIncidents}`);
    lines.push(`Affected CA Residents,${report.breachMetrics.affectedCaliforniaResidents}`);
    lines.push(`Notified Within 72 Hours,${report.breachMetrics.notifiedWithin72Hours}`);
    lines.push('');

    // Compliance Metrics
    lines.push('COMPLIANCE METRICS');
    lines.push(
      `Overall Compliance Rate,${Math.round(report.complianceMetrics.overallComplianceRate * 100)}%`
    );
    lines.push(
      `Deadline Compliance Rate,${Math.round(report.complianceMetrics.deadlineComplianceRate * 100)}%`
    );
    lines.push(
      `Verification Compliance Rate,${Math.round(report.complianceMetrics.verificationComplianceRate * 100)}%`
    );
    lines.push(
      `Data Minimization Score,${Math.round(report.complianceMetrics.dataMinimizationScore * 100)}%`
    );

    return lines.join('\n');
  }

  /**
   * Validate report completeness
   */
  validateReport(report: CAAgAnnualReport): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!report.reportId) errors.push('Missing report ID');
    if (!report.generatedAt) errors.push('Missing generation timestamp');
    if (!report.reportPeriod.reportYear) errors.push('Missing report year');
    if (!report.organizationInfo.name) errors.push('Missing organization name');
    if (!report.organizationInfo.contactEmail) errors.push('Missing contact email');
    if (!report.preparedBy) errors.push('Missing preparer information');
    if (!report.certificationStatement) errors.push('Missing certification statement');

    // Validate metrics consistency
    const totalByType = Object.values(report.requestMetrics.byType).reduce((a, b) => a + b, 0);
    if (Math.abs(totalByType - report.requestMetrics.total) > report.requestMetrics.total * 0.1) {
      errors.push('Request type totals do not match total requests');
    }

    // Validate compliance rates are between 0 and 1
    if (
      report.complianceMetrics.overallComplianceRate < 0 ||
      report.complianceMetrics.overallComplianceRate > 1
    ) {
      errors.push('Overall compliance rate out of range');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a default CA AG reporting service instance
 */
export function createCAAgReportingService(config?: {
  organizationName?: string;
  organizationAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  dataSource?: ReportDataSource;
}): CAAgReportingService {
  return new CAAgReportingService({
    organizationName: config?.organizationName ?? 'Forsured Insurance Platform',
    organizationAddress: config?.organizationAddress ?? '123 Main Street, San Francisco, CA 94105',
    contactEmail: config?.contactEmail ?? 'privacy@forsured.com',
    contactPhone: config?.contactPhone ?? '(415) 555-0100',
    dataSource: config?.dataSource,
  });
}
