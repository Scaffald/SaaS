import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { File, Reporter, Vitest } from 'vitest';

interface JUnitTestCase {
  name: string;
  file: string;
  duration: number;
  error?: { message: string; type: string };
  skipped?: boolean;
}

export default class JUnitReporter implements Reporter {
  private ctx!: Vitest;
  private testCases: JUnitTestCase[] = [];
  private startTime: number = Date.now();
  private passed = 0;
  private failed = 0;
  private skipped = 0;

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
    this.startTime = Date.now();
  }

  onTestEnd(file: File): void {
    if (!file.tasks) return;

    file.tasks.forEach((task) => {
      if (task.type === 'test') {
        const testCase: JUnitTestCase = {
          name: task.name,
          file: file.filepath || 'unknown',
          duration: (task.result?.duration || 0) / 1000, // Convert to seconds
        };

        if (task.result?.state === 'pass') {
          this.passed++;
        } else if (task.result?.state === 'skip') {
          testCase.skipped = true;
          this.skipped++;
        } else {
          this.failed++;
          testCase.error = {
            message: task.result?.errors?.[0]?.message || 'Test failed',
            type: 'AssertionError',
          };
        }

        this.testCases.push(testCase);
      }
    });
  }

  onRunComplete(): void {
    const duration = (Date.now() - this.startTime) / 1000;

    // Group by file
    const testSuites = new Map<string, JUnitTestCase[]>();
    this.testCases.forEach((tc) => {
      if (!testSuites.has(tc.file)) {
        testSuites.set(tc.file, []);
      }
      testSuites.get(tc.file)!.push(tc);
    });

    // Build JUnit XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="vitest" tests="${this.testCases.length}" failures="${this.failed}" skipped="${this.skipped}" time="${duration}">\n`;

    testSuites.forEach((cases, file) => {
      const suitePassed = cases.filter((c) => !c.error && !c.skipped).length;
      const suiteFailed = cases.filter((c) => c.error).length;
      const suiteSkipped = cases.filter((c) => c.skipped).length;
      const suiteDuration = cases.reduce((sum, c) => sum + c.duration, 0);

      xml += `  <testsuite name="${escapeXml(file)}" tests="${cases.length}" failures="${suiteFailed}" skipped="${suiteSkipped}" time="${suiteDuration}">\n`;

      cases.forEach((tc) => {
        xml += `    <testcase name="${escapeXml(tc.name)}" classname="${escapeXml(file)}" time="${tc.duration}"`;

        if (tc.skipped) {
          xml += '>\n      <skipped />\n    </testcase>\n';
        } else if (tc.error) {
          xml += `>\n      <failure message="${escapeXml(tc.error.message)}" type="${tc.error.type}">${escapeXml(tc.error.message)}</failure>\n    </testcase>\n`;
        } else {
          xml += ' />\n';
        }
      });

      xml += '  </testsuite>\n';
    });

    xml += '</testsuites>\n';

    const reportPath = `${this.ctx.config.root}/coverage/junit.xml`;
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, xml);

    console.log(`📋 JUnit report written to: ${reportPath}`);
  }

  private escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
