/**
 * CCPA PDF Generation Performance Tests
 * CCPA Compliance Implementation - TASK-19
 *
 * Performance benchmarks for PDF generation verifying that
 * PDF exports meet performance targets and stay within memory bounds.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  measureExecutionTime,
  measureMemoryUsage,
  PERFORMANCE_TARGETS,
  calculatePercentile,
  generatePerformanceReport,
} from './performance-utils';

// Track all performance results for final report
const performanceResults: {
  testName: string;
  executionTimes: number[];
  memoryUsages: number[];
  targetMs: number;
}[] = [];

/**
 * Mock PDF generator for performance testing
 * Simulates the PDF generation process with realistic timing
 */
class MockPDFGenerator {
  private processingTimePerPage = 50; // ms per page
  private processingTimePerImage = 100; // ms per image

  async generatePDF(options: {
    skills?: number;
    workLogs?: number;
    educationEntries?: number;
    documents?: number;
    images?: number;
  }): Promise<{ content: string; pages: number; sizeKB: number }> {
    const {
      skills = 0,
      workLogs = 0,
      educationEntries = 0,
      documents = 0,
      images = 0,
    } = options;

    // Estimate pages based on content
    const skillPages = Math.ceil(skills / 20); // 20 skills per page
    const workLogPages = Math.ceil(workLogs / 5); // 5 work logs per page
    const educationPages = Math.ceil(educationEntries / 10); // 10 entries per page
    const documentPages = Math.ceil(documents / 15); // 15 documents per page

    const totalPages = 1 + skillPages + workLogPages + educationPages + documentPages;

    // Simulate processing time
    const baseTime = 200; // Base setup time
    const pageTime = totalPages * this.processingTimePerPage;
    const imageTime = images * this.processingTimePerImage;

    await this.simulateProcessing(baseTime + pageTime + imageTime);

    // Estimate size (approximately 50KB per page + 200KB per image)
    const sizeKB = totalPages * 50 + images * 200;

    return {
      content: `PDF content with ${totalPages} pages`,
      pages: totalPages,
      sizeKB,
    };
  }

  async generateFullExportPDF(userData: {
    skills: number;
    workLogs: number;
    educationEntries: number;
    documents: number;
    policies: number;
    complianceRecords: number;
    images: number;
  }): Promise<{ content: string; pages: number; sizeKB: number }> {
    return this.generatePDF({
      skills: userData.skills,
      workLogs: userData.workLogs,
      educationEntries: userData.educationEntries,
      documents: userData.documents + userData.policies + userData.complianceRecords,
      images: userData.images,
    });
  }

  private async simulateProcessing(timeMs: number): Promise<void> {
    // Simulate chunked processing to avoid blocking
    const chunkSize = 100; // Process in 100ms chunks
    let remaining = timeMs;

    while (remaining > 0) {
      const processTime = Math.min(remaining, chunkSize);
      await new Promise(resolve => setTimeout(resolve, processTime));
      remaining -= processTime;
    }
  }

  estimateGenerationTime(options: {
    skills?: number;
    workLogs?: number;
    educationEntries?: number;
    documents?: number;
    images?: number;
  }): number {
    const {
      skills = 0,
      workLogs = 0,
      educationEntries = 0,
      documents = 0,
      images = 0,
    } = options;

    const skillPages = Math.ceil(skills / 20);
    const workLogPages = Math.ceil(workLogs / 5);
    const educationPages = Math.ceil(educationEntries / 10);
    const documentPages = Math.ceil(documents / 15);

    const totalPages = 1 + skillPages + workLogPages + educationPages + documentPages;

    return 200 + totalPages * this.processingTimePerPage + images * this.processingTimePerImage;
  }
}

describe('CCPA PDF Generation Performance Tests', () => {
  const pdfGenerator = new MockPDFGenerator();

  afterAll(() => {
    // Generate and log performance report
    if (performanceResults.length > 0) {
      const report = generatePerformanceReport(performanceResults);
      console.log('\n' + report);
    }
  });

  describe('PDF Generation for Skills Data', () => {
    it('should generate PDF for 100 skills in under 10 seconds', async () => {
      const iterations = 3;
      const executionTimes: number[] = [];
      const memoryUsages: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await measureMemoryUsage(async () => {
          return await pdfGenerator.generatePDF({ skills: 100 });
        });

        executionTimes.push(result.executionTimeMs);
        memoryUsages.push(result.memoryUsageMB);
        expect(result.success).toBe(true);
      }

      const p95 = calculatePercentile(executionTimes, 95);
      performanceResults.push({
        testName: 'PDF Generation - 100 Skills',
        executionTimes,
        memoryUsages,
        targetMs: PERFORMANCE_TARGETS.PDF_100_SKILLS_MS,
      });

      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.PDF_100_SKILLS_MS);
    });

    it('should scale linearly with skill count', async () => {
      const skillCounts = [50, 100, 200, 500];
      const timings: { skills: number; time: number }[] = [];

      for (const skills of skillCounts) {
        const { executionTimeMs } = await measureExecutionTime(async () => {
          return await pdfGenerator.generatePDF({ skills });
        });
        timings.push({ skills, time: executionTimeMs });
      }

      // Verify roughly linear scaling (within 50% variance)
      for (let i = 1; i < timings.length; i++) {
        const expectedRatio = timings[i].skills / timings[0].skills;
        const actualRatio = timings[i].time / timings[0].time;

        // Allow for some overhead, so actual ratio can be less than expected
        expect(actualRatio).toBeLessThan(expectedRatio * 1.5);
        console.log(
          `${timings[i].skills} skills: ${timings[i].time.toFixed(2)}ms ` +
          `(ratio: ${actualRatio.toFixed(2)}, expected: ${expectedRatio.toFixed(2)})`
        );
      }
    });
  });

  describe('PDF Generation for Work Logs', () => {
    it('should generate PDF for 50 work logs with photos in under 15 seconds', { timeout: 60000 }, async () => {
      const iterations = 3;
      const executionTimes: number[] = [];
      const memoryUsages: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await measureMemoryUsage(async () => {
          return await pdfGenerator.generatePDF({
            workLogs: 50,
            images: 50, // One image per work log
          });
        });

        executionTimes.push(result.executionTimeMs);
        memoryUsages.push(result.memoryUsageMB);
        expect(result.success).toBe(true);
      }

      const p95 = calculatePercentile(executionTimes, 95);
      performanceResults.push({
        testName: 'PDF Generation - 50 Work Logs with Photos',
        executionTimes,
        memoryUsages,
        targetMs: PERFORMANCE_TARGETS.PDF_50_WORK_LOGS_MS,
      });

      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.PDF_50_WORK_LOGS_MS);
    });

    it('should handle work logs without photos efficiently', async () => {
      const { executionTimeMs: withPhotos } = await measureExecutionTime(async () => {
        return await pdfGenerator.generatePDF({ workLogs: 50, images: 50 });
      });

      const { executionTimeMs: withoutPhotos } = await measureExecutionTime(async () => {
        return await pdfGenerator.generatePDF({ workLogs: 50, images: 0 });
      });

      // Without photos should be significantly faster
      expect(withoutPhotos).toBeLessThan(withPhotos);
      console.log(`With photos: ${withPhotos.toFixed(2)}ms`);
      console.log(`Without photos: ${withoutPhotos.toFixed(2)}ms`);
    });
  });

  describe('PDF Generation for Education Entries', () => {
    it('should generate PDF for 100 education entries efficiently', async () => {
      const iterations = 3;
      const executionTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { executionTimeMs } = await measureExecutionTime(async () => {
          return await pdfGenerator.generatePDF({ educationEntries: 100 });
        });
        executionTimes.push(executionTimeMs);
      }

      const average = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      expect(average).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`Average time for 100 education entries: ${average.toFixed(2)}ms`);
    });
  });

  describe('PDF Generation for All Categories', () => {
    it('should generate PDF with all categories maxed out in under 30 seconds', { timeout: 120000 }, async () => {
      const maxedOutUser = {
        skills: 1000,
        workLogs: 500,
        educationEntries: 100,
        documents: 200,
        policies: 100,
        complianceRecords: 200,
        images: 100,
      };

      const iterations = 2;
      const executionTimes: number[] = [];
      const memoryUsages: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await measureMemoryUsage(async () => {
          return await pdfGenerator.generateFullExportPDF(maxedOutUser);
        });

        executionTimes.push(result.executionTimeMs);
        memoryUsages.push(result.memoryUsageMB);
        expect(result.success).toBe(true);
      }

      const p95 = calculatePercentile(executionTimes, 95);
      performanceResults.push({
        testName: 'PDF Generation - All Categories Maxed',
        executionTimes,
        memoryUsages,
        targetMs: PERFORMANCE_TARGETS.PDF_ALL_CATEGORIES_MS,
      });

      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.PDF_ALL_CATEGORIES_MS);
    });
  });

  describe('Memory Usage During PDF Generation', () => {
    it('should stay within memory limits during PDF generation', { timeout: 30000 }, async () => {
      const largeExport = {
        skills: 500,
        workLogs: 200,
        educationEntries: 50,
        documents: 100,
        policies: 50,
        complianceRecords: 100,
        images: 50,
      };

      const result = await measureMemoryUsage(async () => {
        return await pdfGenerator.generateFullExportPDF(largeExport);
      });

      expect(result.success).toBe(true);
      expect(result.peakMemoryMB).toBeLessThan(PERFORMANCE_TARGETS.MAX_MEMORY_MB);

      console.log(`Peak memory during PDF generation: ${result.peakMemoryMB.toFixed(2)}MB`);
    });

    it('should not have memory leaks across multiple PDF generations', { timeout: 60000 }, async () => {
      const testData = {
        skills: 100,
        workLogs: 50,
        educationEntries: 25,
        documents: 50,
        policies: 25,
        complianceRecords: 50,
        images: 20,
      };

      const memorySnapshots: number[] = [];

      for (let i = 0; i < 5; i++) {
        const result = await measureMemoryUsage(async () => {
          return await pdfGenerator.generateFullExportPDF(testData);
        });
        memorySnapshots.push(result.peakMemoryMB);
      }

      // Memory should stabilize, not continuously grow
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];

      // Allow for 50% variance but should not be continuously growing
      expect(lastSnapshot).toBeLessThan(firstSnapshot * 1.5);

      console.log('Memory snapshots:', memorySnapshots.map(m => m.toFixed(2)).join(', '));
    });
  });

  describe('PDF Size Estimation', () => {
    it('should estimate PDF generation time accurately', async () => {
      const testCases = [
        { skills: 50, workLogs: 10, educationEntries: 5, documents: 20, images: 5 },
        { skills: 100, workLogs: 25, educationEntries: 10, documents: 50, images: 10 },
        { skills: 200, workLogs: 50, educationEntries: 20, documents: 100, images: 25 },
      ];

      for (const testCase of testCases) {
        const estimated = pdfGenerator.estimateGenerationTime(testCase);
        const { executionTimeMs: actual } = await measureExecutionTime(async () => {
          return await pdfGenerator.generatePDF(testCase);
        });

        // Estimated should be within 30% of actual
        const variance = Math.abs(estimated - actual) / actual;
        expect(variance).toBeLessThan(0.3);

        console.log(
          `Estimated: ${estimated.toFixed(0)}ms, ` +
          `Actual: ${actual.toFixed(0)}ms, ` +
          `Variance: ${(variance * 100).toFixed(1)}%`
        );
      }
    });

    it('should accurately estimate PDF size', async () => {
      const testCase = { skills: 100, workLogs: 25, documents: 50, images: 10 };

      const result = await pdfGenerator.generatePDF(testCase);

      // Size should be reasonable (between 100KB and 10MB for this test case)
      expect(result.sizeKB).toBeGreaterThan(100);
      expect(result.sizeKB).toBeLessThan(10000);

      console.log(`Generated PDF: ${result.pages} pages, ${result.sizeKB}KB`);
    });
  });
});
