import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Reporter, Vitest } from 'vitest';

interface FileCoverage {
  file: string;
  lines: { total: number; covered: number; percentage: number };
  statements: { total: number; covered: number; percentage: number };
  branches: { total: number; covered: number; percentage: number };
  functions: { total: number; covered: number; percentage: number };
}

interface CoverageReport {
  timestamp: string;
  files: FileCoverage[];
  summary: {
    lines: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
  };
}

export default class CoverageReporter implements Reporter {
  private ctx!: Vitest;
  private coverageData: FileCoverage[] = [];

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
  }

  onRunComplete(): void {
    // Get coverage data from Vitest context if available
    // This is a placeholder implementation that will be enhanced when coverage is collected
    if (this.ctx.coverage) {
      this.processCoverageData();
    }

    const report: CoverageReport = {
      timestamp: new Date().toISOString(),
      files: this.coverageData,
      summary: this.calculateSummary(),
    };

    const reportPath = `${this.ctx.config.root}/coverage/coverage-report.json`;
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    if (this.coverageData.length > 0) {
      console.log(`📊 Coverage report written to: ${reportPath}`);
      console.log(
        `Coverage Summary: ${report.summary.lines.percentage.toFixed(2)}% lines covered`,
      );
    }
  }

  private processCoverageData(): void {
    // Process coverage data from context
    // This will be implemented when we integrate with the coverage provider
  }

  private calculateSummary() {
    const summary = {
      lines: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
    };

    if (this.coverageData.length === 0) {
      return summary;
    }

    for (const file of this.coverageData) {
      summary.lines.total += file.lines.total;
      summary.lines.covered += file.lines.covered;
      summary.statements.total += file.statements.total;
      summary.statements.covered += file.statements.covered;
      summary.branches.total += file.branches.total;
      summary.branches.covered += file.branches.covered;
      summary.functions.total += file.functions.total;
      summary.functions.covered += file.functions.covered;
    }

    // Calculate percentages
    summary.lines.percentage = this.calculatePercentage(
      summary.lines.covered,
      summary.lines.total,
    );
    summary.statements.percentage = this.calculatePercentage(
      summary.statements.covered,
      summary.statements.total,
    );
    summary.branches.percentage = this.calculatePercentage(
      summary.branches.covered,
      summary.branches.total,
    );
    summary.functions.percentage = this.calculatePercentage(
      summary.functions.covered,
      summary.functions.total,
    );

    return summary;
  }

  private calculatePercentage(covered: number, total: number): number {
    if (total === 0) return 100;
    return (covered / total) * 100;
  }
}
