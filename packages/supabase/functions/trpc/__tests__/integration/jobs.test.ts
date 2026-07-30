import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup.ts';
import { seedExternalJob } from './seed-utils.ts';

Deno.test({
  name: "Jobs router - getExternalJobs returns payload",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const seeded = await seedExternalJob();

    try {
      const response = await callTRPCEndpoint("jobs.getExternalJobs");

      assertEquals(Array.isArray(response), true);
      const result = response[0]?.result?.data;
      assertExists(result, "TRPC response should include data");
      assertEquals(Array.isArray(result.jobs), true);
    } finally {
      await seeded.cleanup();
    }
  },
});

Deno.test({
  name: "Jobs router - getPublishedJobs accepts filters",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("jobs.getPublishedJobs", {
      limit: 5,
      offset: 0,
    });

    assertEquals(Array.isArray(response), true);
    const result = response[0]?.result?.data;
    assertExists(result, "Published jobs response should include data");
    assertEquals(Array.isArray(result.jobs), true);
    assertEquals(typeof result.total, "number");
  },
});

Deno.test({
  name: "Jobs router - unknown job id returns not found",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("jobs.getJobDetails", {
      id: "00000000-0000-0000-0000-000000000000",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected TRPC error payload");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
