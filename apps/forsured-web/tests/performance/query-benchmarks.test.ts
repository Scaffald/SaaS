/**
 * Migrated from FRS-Prototype/tests/performance/query-benchmarks.test.ts
 *
 * Performance Benchmark Tests
 * REQ-214: Migration Testing & Validation
 *
 * Tests query performance against MockDatabase to establish baselines
 * and detect performance regressions. These are soft targets for
 * development iteration, not production SLAs.
 *
 * Run with: pnpm test tests/performance/query-benchmarks.test.ts
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MockDatabase } from '@/lib/database/mockDatabase';
import type { DBProject, DBTask, DBDocument, DBSubcontractor } from '@/types/database.types';

/**
 * Performance measurement helper
 */
function measureDuration(startTime: [number, number]): number {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  return seconds * 1000 + nanoseconds / 1_000_000; // Convert to milliseconds
}

/**
 * Utility to time an async operation
 */
async function timedOperation<T>(operation: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const startTime = process.hrtime();
  const result = await operation();
  const durationMs = measureDuration(startTime);
  return { result, durationMs };
}

/**
 * Log performance metric for baseline tracking
 */
function logPerformanceMetric(testName: string, durationMs: number, targetMs?: number): void {
  const status = targetMs ? (durationMs <= targetMs ? 'PASS' : 'SOFT_FAIL') : 'MEASURED';
  console.log(
    `[PERF] ${testName}: ${durationMs.toFixed(2)}ms ${
      targetMs ? `(target: ${targetMs}ms) [${status}]` : ''
    }`
  );
}

describe('Performance Benchmark Tests', () => {
  let db: MockDatabase;

  // Seed data references
  const seedCount = {
    projects: 10,
    subcontractors: 20,
    tasks: 50,
    documents: 30,
  };

  beforeAll(async () => {
    // Create database with seed data
    db = new MockDatabase();
    db.seed();

    // Add additional data for performance testing
    await seedAdditionalData(db);
  });

  /**
   * Seed additional test data for performance measurements
   */
  async function seedAdditionalData(database: MockDatabase): Promise<void> {
    const orgsResult = await database.from('organizations').select();
    const usersResult = await database.from('users').select();

    const org = orgsResult.data?.[0];
    const user = usersResult.data?.[0];

    if (!org || !user) {
      throw new Error('Seed data missing');
    }

    // Create additional projects
    for (let i = 0; i < seedCount.projects; i++) {
      await database.from('projects').insert({
        name: `Performance Test Project ${i}`,
        manager_id: user.id,
        organization_id: org.id,
      });
    }

    // Get all projects for task assignment
    const projectsResult = await database.from('projects').select();
    const projects = projectsResult.data || [];

    // Create subcontractors
    const subcontractors: DBSubcontractor[] = [];
    for (let i = 0; i < seedCount.subcontractors; i++) {
      const result = await database.from('subcontractors').insert({
        name: `Performance Sub ${i}`,
        company: `Performance Company ${i}`,
        contact_info: {
          email: `perf${i}@test.com`,
          phone: '555-0000',
        },
      });
      if (result.data?.[0]) {
        subcontractors.push(result.data[0]);
      }
    }

    // Create tasks across projects
    for (let i = 0; i < seedCount.tasks; i++) {
      const project = projects[i % projects.length];
      const sub = subcontractors[i % subcontractors.length];
      await database.from('tasks').insert({
        project_id: project.id,
        subcontractor_id: sub.id,
        title: `Performance Task ${i}`,
        description: `Performance test task description ${i}`,
        status: ['pending', 'in_progress', 'completed'][i % 3] as 'pending' | 'in_progress' | 'completed',
      });
    }

    // Create documents
    for (let i = 0; i < seedCount.documents; i++) {
      const project = projects[i % projects.length];
      const sub = subcontractors[i % subcontractors.length];
      await database.from('documents').insert({
        project_id: project.id,
        subcontractor_id: sub.id,
        file_url: `https://storage.example.com/docs/perf-${i}.pdf`,
        upload_date: new Date().toISOString(),
        status: ['pending', 'approved', 'rejected'][i % 3] as 'pending' | 'approved' | 'rejected',
        uploaded_by_scaffald_user_id: user.id,
      });
    }
  }

  describe('Simple Query Performance', () => {
    const TARGET_MS = 50; // Soft target for simple queries

    it('should execute simple SELECT in reasonable time', async () => {
      const { result, durationMs } = await timedOperation(() => db.from('projects').select());

      logPerformanceMetric('Simple SELECT (projects)', durationMs, TARGET_MS);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data!.length).toBeGreaterThan(0);

      // Soft assertion - log but don't fail
      if (durationMs > TARGET_MS) {
        console.warn(`[PERF WARNING] Simple SELECT exceeded target: ${durationMs.toFixed(2)}ms > ${TARGET_MS}ms`);
      }
    });

    it('should execute filtered SELECT efficiently', async () => {
      const { result, durationMs } = await timedOperation(() =>
        db.from('tasks').select().eq('status', 'pending')
      );

      logPerformanceMetric('Filtered SELECT (tasks.status)', durationMs, TARGET_MS);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('should execute single row lookup quickly', async () => {
      const projectsResult = await db.from('projects').select();
      const projectId = projectsResult.data![0].id;

      const { result, durationMs } = await timedOperation(() =>
        db.from('projects').select().eq('id', projectId)
      );

      logPerformanceMetric('Single row lookup', durationMs, TARGET_MS);

      expect(result.error).toBeNull();
      expect(result.data!.length).toBe(1);
    });
  });

  describe('Cross-Schema Join Performance', () => {
    const TARGET_MS = 100; // Soft target for join queries

    it('should perform cross-schema data enrichment efficiently', async () => {
      // Simulate cross-schema join: projects with organization data
      const { result, durationMs } = await timedOperation(async () => {
        const projectsResult = await db.from('projects').select();
        const projects = projectsResult.data || [];

        // Enrich with organization data
        const enrichedProjects = await Promise.all(
          projects.slice(0, 5).map(async (project) => {
            if (project.organization_id) {
              const orgResult = await db
                .from('organizations')
                .select()
                .eq('id', project.organization_id);
              return { ...project, organization: orgResult.data?.[0] };
            }
            return project;
          })
        );

        return { data: enrichedProjects, error: null };
      });

      logPerformanceMetric('Cross-schema enrichment (5 projects)', durationMs, TARGET_MS);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('should perform multi-table join simulation efficiently', async () => {
      // Simulate: tasks -> projects -> organizations
      const { result, durationMs } = await timedOperation(async () => {
        const tasksResult = await db.from('tasks').select();
        const tasks = tasksResult.data?.slice(0, 10) || [];

        const enrichedTasks = await Promise.all(
          tasks.map(async (task) => {
            const projectResult = await db.from('projects').select().eq('id', task.project_id);
            const project = projectResult.data?.[0];

            if (project?.organization_id) {
              const orgResult = await db
                .from('organizations')
                .select()
                .eq('id', project.organization_id);
              return {
                ...task,
                project: { ...project, organization: orgResult.data?.[0] },
              };
            }
            return { ...task, project };
          })
        );

        return { data: enrichedTasks, error: null };
      });

      logPerformanceMetric('Multi-table join (10 tasks)', durationMs, TARGET_MS * 2);

      expect(result.error).toBeNull();
    });
  });

  describe('Aggregate Query Performance', () => {
    const TARGET_MS = 150; // Soft target for aggregates

    it('should count records efficiently', async () => {
      const { durationMs } = await timedOperation(async () => {
        const results = await Promise.all([
          db.from('projects').select(),
          db.from('tasks').select(),
          db.from('documents').select(),
          db.from('subcontractors').select(),
        ]);

        return {
          projects: results[0].data?.length || 0,
          tasks: results[1].data?.length || 0,
          documents: results[2].data?.length || 0,
          subcontractors: results[3].data?.length || 0,
        };
      });

      logPerformanceMetric('Count across 4 tables', durationMs, TARGET_MS);
    });

    it('should calculate task status distribution efficiently', async () => {
      const { result, durationMs } = await timedOperation(async () => {
        const tasksResult = await db.from('tasks').select();
        const tasks = tasksResult.data || [];

        const statusCounts = tasks.reduce(
          (acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return statusCounts;
      });

      logPerformanceMetric('Task status distribution', durationMs, TARGET_MS);

      expect(result).toHaveProperty('pending');
    });
  });

  describe('Bulk Operation Performance', () => {
    const BULK_COUNT = 50;

    it('should handle bulk inserts efficiently', async () => {
      const { durationMs } = await timedOperation(async () => {
        const projectsResult = await db.from('projects').select();
        const project = projectsResult.data![0];
        const subsResult = await db.from('subcontractors').select();
        const sub = subsResult.data![0];

        const insertPromises = [];
        for (let i = 0; i < BULK_COUNT; i++) {
          insertPromises.push(
            db.from('tasks').insert({
              project_id: project.id,
              subcontractor_id: sub.id,
              title: `Bulk Task ${i}`,
              description: `Bulk insert test ${i}`,
              status: 'pending',
            })
          );
        }

        await Promise.all(insertPromises);
        return { count: BULK_COUNT };
      });

      const throughput = (BULK_COUNT / durationMs) * 1000;
      logPerformanceMetric(`Bulk insert (${BULK_COUNT} records)`, durationMs);
      console.log(`[PERF] Throughput: ${throughput.toFixed(0)} records/second`);

      expect(durationMs).toBeLessThan(5000); // Generous upper bound
    });

    it('should handle bulk reads efficiently', async () => {
      const { result, durationMs } = await timedOperation(async () => {
        const results = [];
        for (let i = 0; i < 10; i++) {
          const tasksResult = await db.from('tasks').select().eq('status', 'pending');
          results.push(tasksResult);
        }
        return results;
      });

      logPerformanceMetric('Bulk reads (10 queries)', durationMs);

      expect(result.length).toBe(10);
      expect(result[0].error).toBeNull();
    });
  });

  describe('Dashboard Query Simulation', () => {
    const TARGET_MS = 300; // Soft target for dashboard-like queries

    it('should load dashboard overview data efficiently', async () => {
      const { result, durationMs } = await timedOperation(async () => {
        // Simulate dashboard overview query
        const [projectsResult, tasksResult, documentsResult, complianceResult] = await Promise.all([
          db.from('projects').select(),
          db.from('tasks').select(),
          db.from('documents').select(),
          db.from('compliance_scores').select(),
        ]);

        const projects = projectsResult.data || [];
        const tasks = tasksResult.data || [];
        const documents = documentsResult.data || [];

        return {
          overview: {
            totalProjects: projects.length,
            totalTasks: tasks.length,
            totalDocuments: documents.length,
            tasksByStatus: {
              pending: tasks.filter((t) => t.status === 'pending').length,
              in_progress: tasks.filter((t) => t.status === 'in_progress').length,
              completed: tasks.filter((t) => t.status === 'completed').length,
            },
            documentsByStatus: {
              pending: documents.filter((d) => d.status === 'pending').length,
              approved: documents.filter((d) => d.status === 'approved').length,
              rejected: documents.filter((d) => d.status === 'rejected').length,
            },
          },
        };
      });

      logPerformanceMetric('Dashboard overview query', durationMs, TARGET_MS);

      expect(result.overview).toBeDefined();
      expect(result.overview.totalProjects).toBeGreaterThan(0);
    });

    it('should filter tasks by project efficiently', async () => {
      const projectsResult = await db.from('projects').select();
      const projectId = projectsResult.data![0].id;

      const { result, durationMs } = await timedOperation(() =>
        db.from('tasks').select().eq('project_id', projectId)
      );

      logPerformanceMetric('Tasks by project filter', durationMs, TARGET_MS);

      expect(result.error).toBeNull();
    });
  });

  describe('Performance Baseline Summary', () => {
    it('should generate performance baseline report', async () => {
      console.log('\n========================================');
      console.log('PERFORMANCE BASELINE SUMMARY');
      console.log('========================================');

      const metrics: Array<{ name: string; duration: number }> = [];

      // Run all baseline measurements
      const simpleSelect = await timedOperation(() => db.from('projects').select());
      metrics.push({ name: 'Simple SELECT', duration: simpleSelect.durationMs });

      const filteredSelect = await timedOperation(() =>
        db.from('tasks').select().eq('status', 'pending')
      );
      metrics.push({ name: 'Filtered SELECT', duration: filteredSelect.durationMs });

      const multiTableQuery = await timedOperation(async () => {
        await Promise.all([
          db.from('projects').select(),
          db.from('tasks').select(),
          db.from('documents').select(),
        ]);
      });
      metrics.push({ name: 'Multi-table parallel query', duration: multiTableQuery.durationMs });

      console.log('\nBaseline Metrics:');
      console.log('-----------------');
      metrics.forEach(({ name, duration }) => {
        console.log(`  ${name}: ${duration.toFixed(2)}ms`);
      });

      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      console.log(`\nAverage query time: ${avgDuration.toFixed(2)}ms`);
      console.log('========================================\n');

      // Test passes as long as we can generate the report
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});
