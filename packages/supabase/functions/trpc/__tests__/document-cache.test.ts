/**
 * Document Cache Unit Tests
 *
 * Tests for the DocumentCache LRU cache implementation.
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/document-cache.test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  createDocumentCache,
  DocumentCache,
  DocumentMetadataCache,
  getDocumentCache,
  resetDocumentCache,
} from '../routers/utils/document-cache.ts';

// Helper to create test document metadata
function createTestDocument(id: string) {
  return {
    id,
    name: `Document ${id}`,
    organizationId: "org-123",
    mimeType: "application/pdf",
    fileSize: 1024,
    storagePath: `org/123/docs/${id}.pdf`,
    storageBackend: "supabase",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

Deno.test({
  name: "DocumentCache - should create cache with default options",
  fn() {
    const cache = new DocumentCache();
    assertExists(cache);
    assertEquals(cache.size, 0);
  },
});

Deno.test({
  name: "DocumentCache - should set and get values",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");
    assertEquals(cache.get("key1"), "value1");
    assertEquals(cache.size, 1);
  },
});

Deno.test({
  name: "DocumentCache - should return undefined for missing keys",
  fn() {
    const cache = new DocumentCache<string>();

    assertEquals(cache.get("nonexistent"), undefined);

    const metrics = cache.getMetrics();
    assertEquals(metrics.misses, 1);
  },
});

Deno.test({
  name: "DocumentCache - should track hits and misses",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");

    cache.get("key1"); // hit
    cache.get("key1"); // hit
    cache.get("key2"); // miss

    const metrics = cache.getMetrics();
    assertEquals(metrics.hits, 2);
    assertEquals(metrics.misses, 1);
    assertEquals(metrics.hitRate, 2 / 3);
  },
});

Deno.test({
  name: "DocumentCache - should evict LRU entries when at capacity",
  fn() {
    const cache = new DocumentCache<string>({ maxSize: 3 });

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");

    // Access key1 to make it recently used
    cache.get("key1");

    // Add key4, should evict key2 (LRU)
    cache.set("key4", "value4");

    assertEquals(cache.has("key1"), true);
    assertEquals(cache.has("key2"), false); // Evicted
    assertEquals(cache.has("key3"), true);
    assertEquals(cache.has("key4"), true);

    const metrics = cache.getMetrics();
    assertEquals(metrics.evictions, 1);
  },
});

Deno.test({
  name: "DocumentCache - should expire entries after TTL",
  async fn() {
    const cache = new DocumentCache<string>({ ttlMs: 50 });

    cache.set("key1", "value1");
    assertEquals(cache.get("key1"), "value1");

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    assertEquals(cache.get("key1"), undefined);
    assertEquals(cache.has("key1"), false);
  },
});

Deno.test({
  name: "DocumentCache - should delete entries",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");
    assertEquals(cache.has("key1"), true);

    const deleted = cache.delete("key1");
    assertEquals(deleted, true);
    assertEquals(cache.has("key1"), false);

    const metrics = cache.getMetrics();
    assertEquals(metrics.invalidations, 1);
  },
});

Deno.test({
  name: "DocumentCache - should invalidate by pattern (string prefix)",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("doc:1", "value1");
    cache.set("doc:2", "value2");
    cache.set("org:1", "value3");

    const count = cache.invalidate("doc:");

    assertEquals(count, 2);
    assertEquals(cache.has("doc:1"), false);
    assertEquals(cache.has("doc:2"), false);
    assertEquals(cache.has("org:1"), true);
  },
});

Deno.test({
  name: "DocumentCache - should invalidate by pattern (RegExp)",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("doc:123", "value1");
    cache.set("doc:456", "value2");
    cache.set("doc:abc", "value3");

    // Invalidate only numeric doc IDs
    const count = cache.invalidate(/^doc:\d+$/);

    assertEquals(count, 2);
    assertEquals(cache.has("doc:123"), false);
    assertEquals(cache.has("doc:456"), false);
    assertEquals(cache.has("doc:abc"), true);
  },
});

Deno.test({
  name: "DocumentCache - should clear all entries",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");
    cache.set("key2", "value2");

    cache.clear();

    assertEquals(cache.size, 0);
    assertEquals(cache.has("key1"), false);
  },
});

Deno.test({
  name: "DocumentCache - should use getOrSet with factory function",
  async fn() {
    const cache = new DocumentCache<string>();
    let factoryCalls = 0;

    const factory = async () => {
      factoryCalls++;
      return 'generated-value';
    };

    // First call - factory should be invoked
    const result1 = await cache.getOrSet("key1", factory);
    assertEquals(result1, "generated-value");
    assertEquals(factoryCalls, 1);

    // Second call - should use cached value
    const result2 = await cache.getOrSet("key1", factory);
    assertEquals(result2, "generated-value");
    assertEquals(factoryCalls, 1); // Factory not called again
  },
});

Deno.test({
  name: "DocumentCache - should iterate over entries",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");
    cache.set("key2", "value2");

    const entries = Array.from(cache.entries());

    assertEquals(entries.length, 2);
    assertEquals(
      entries.some(([k, v]) => k === "key1" && v === "value1"),
      true,
    );
    assertEquals(
      entries.some(([k, v]) => k === "key2" && v === "value2"),
      true,
    );
  },
});

Deno.test({
  name: "DocumentCache - should prune expired entries",
  async fn() {
    const cache = new DocumentCache<string>({ ttlMs: 30 });

    cache.set("key1", "value1");
    cache.set("key2", "value2");

    await new Promise((resolve) => setTimeout(resolve, 50));

    cache.set("key3", "value3"); // Fresh entry

    const pruned = cache.prune();

    assertEquals(pruned, 2);
    assertEquals(cache.size, 1);
    assertEquals(cache.has("key3"), true);
  },
});

Deno.test({
  name: "DocumentCache - should reset metrics",
  fn() {
    const cache = new DocumentCache<string>();

    cache.set("key1", "value1");
    cache.get("key1"); // hit
    cache.get("key2"); // miss

    cache.resetMetrics();

    const metrics = cache.getMetrics();
    assertEquals(metrics.hits, 0);
    assertEquals(metrics.misses, 0);
  },
});

Deno.test({
  name: "DocumentCache - should call onEvict callback",
  fn() {
    const evictedKeys: string[] = [];

    const cache = new DocumentCache<string>({
      maxSize: 2,
      onEvict: (key) => {
        evictedKeys.push(key);
      },
    });

    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3"); // Triggers eviction

    assertEquals(evictedKeys.length, 1);
    assertEquals(evictedKeys[0], "key1");
  },
});

Deno.test({
  name: "DocumentCache - should update existing key without eviction",
  fn() {
    const cache = new DocumentCache<string>({ maxSize: 2 });

    cache.set("key1", "value1");
    cache.set("key2", "value2");

    // Update key1 - should not trigger eviction
    cache.set("key1", "updated-value1");

    assertEquals(cache.size, 2);
    assertEquals(cache.get("key1"), "updated-value1");

    const metrics = cache.getMetrics();
    assertEquals(metrics.evictions, 0);
  },
});

// DocumentMetadataCache specific tests
Deno.test({
  name: "DocumentMetadataCache - should generate correct cache keys",
  fn() {
    const key = DocumentMetadataCache.keyById("doc-123");
    assertEquals(key, "doc:id:doc-123");

    const prefix = DocumentMetadataCache.keyPrefixByOrg("org-456");
    assertEquals(prefix, "doc:org:org-456:");
  },
});

Deno.test({
  name: "DocumentMetadataCache - should invalidate by organization",
  fn() {
    const cache = createDocumentCache();

    // Add documents from different orgs
    const key1 = `${DocumentMetadataCache.keyPrefixByOrg("org-1")}doc-1`;
    const key2 = `${DocumentMetadataCache.keyPrefixByOrg("org-1")}doc-2`;
    const key3 = `${DocumentMetadataCache.keyPrefixByOrg("org-2")}doc-3`;

    cache.set(key1, createTestDocument("1"));
    cache.set(key2, createTestDocument("2"));
    cache.set(key3, createTestDocument("3"));

    // Invalidate org-1 documents
    const count = cache.invalidateOrganization("org-1");

    assertEquals(count, 2);
    assertEquals(cache.has(key1), false);
    assertEquals(cache.has(key2), false);
    assertEquals(cache.has(key3), true);
  },
});

// Singleton tests
Deno.test({
  name: "getDocumentCache - should return singleton instance",
  fn() {
    resetDocumentCache();

    const cache1 = getDocumentCache();
    const cache2 = getDocumentCache();

    assertEquals(cache1 === cache2, true);

    resetDocumentCache();
  },
});

Deno.test({
  name: "resetDocumentCache - should create new instance",
  fn() {
    const cache1 = getDocumentCache();
    cache1.set(
      DocumentMetadataCache.keyById("test"),
      createTestDocument("test"),
    );

    resetDocumentCache();

    const cache2 = getDocumentCache();
    assertEquals(cache2.size, 0); // New empty cache

    resetDocumentCache();
  },
});
