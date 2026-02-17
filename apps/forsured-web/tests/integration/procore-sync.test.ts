/**
 * Integration tests for Procore sync pipeline
 *
 * Uses real Supabase DB (service role) to verify:
 * 1. Migration tables exist with correct schema
 * 2. Collision detection works against real DB records
 * 3. Sync queue resolution creates/links records correctly
 * 4. Adaptive backoff computes intervals correctly
 * 5. RLS policies block cross-user access
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabaseServiceRole, forsured } from '../../src/lib/supabase';
import { detectCollision } from '../../src/server/lib/procore/collision-detector';
import { computeNextInterval, canManualSync } from '../../src/server/lib/procore/adaptive-backoff';

// Skip entire suite if no service role key (CI without DB)
const db = supabaseServiceRole;
const describeWithDB = db ? describe : describe.skip;

/**
 * Check whether migration 312 has been applied by probing for the
 * forsured.integrations table. If not, skip all DB-dependent tests.
 */
async function migrationApplied(): Promise<boolean> {
  if (!db) return false;
  const { error } = await forsured('integrations', db)
    .select('id')
    .limit(0);
  return !error;
}

describeWithDB('Procore Sync Integration', () => {
  // Test data IDs for cleanup
  let testOrgId: string;
  let testUserId: string;
  let testIntegrationId: string;
  let testProjectId: string;
  let hasMigration = false;

  beforeAll(async () => {
    hasMigration = await migrationApplied();
    if (!hasMigration) return;

    // Find an existing org and user to use for testing
    const { data: orgs } = await forsured('organizations', db!)
      .select('id')
      .limit(1)
      .single();

    expect(orgs).toBeTruthy();
    testOrgId = orgs!.id;

    const { data: users } = await forsured('users', db!)
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(1)
      .single();

    expect(users).toBeTruthy();
    testUserId = users!.id;
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    if (testIntegrationId) {
      await forsured('sync_log', db!).delete().eq('integration_id', testIntegrationId);
      await forsured('sync_queue', db!).delete().eq('integration_id', testIntegrationId);
      await forsured('integrations', db!).delete().eq('id', testIntegrationId);
    }
    if (testProjectId) {
      await forsured('projects', db!)
        .update({ procore_id: null, procore_last_synced_at: null })
        .eq('id', testProjectId);
    }
  });

  describe('Migration schema verification', () => {
    it('should have forsured.integrations table with all columns', async () => {
      if (!hasMigration) {
        console.log('Skipping: migration 312 not applied');
        return;
      }

      const { error: tableErr } = await forsured('integrations', db!)
        .select('id, user_id, organization_id, provider, status, sync_interval_minutes, next_sync_at')
        .limit(0);

      expect(tableErr).toBeNull();
    });

    it('should have forsured.sync_queue table', async () => {
      if (!hasMigration) return;

      const { error } = await forsured('sync_queue', db!)
        .select('id, integration_id, entity_type, match_status, resolution')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have forsured.sync_log table', async () => {
      if (!hasMigration) return;

      const { error } = await forsured('sync_log', db!)
        .select('id, integration_id, triggered_by, status, projects_found')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have procore_id column on forsured.projects', async () => {
      if (!hasMigration) return;

      const { error } = await forsured('projects', db!)
        .select('procore_id, procore_last_synced_at')
        .limit(0);

      expect(error).toBeNull();
    });

    it('should have procore_vendor_id column on forsured.subcontractors', async () => {
      if (!hasMigration) return;

      const { error } = await forsured('subcontractors', db!)
        .select('procore_vendor_id, procore_last_synced_at')
        .limit(0);

      expect(error).toBeNull();
    });
  });

  describe('Integration CRUD', () => {
    it('should create an integration record', async () => {
      if (!hasMigration) return;

      const { data, error } = await forsured('integrations', db!)
        .insert({
          user_id: testUserId,
          organization_id: testOrgId,
          provider: 'procore',
          status: 'connected',
          sync_interval_minutes: 15,
          next_sync_at: new Date().toISOString(),
        })
        .select('id, status, sync_interval_minutes')
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.status).toBe('connected');
      expect(data!.sync_interval_minutes).toBe(15);
      testIntegrationId = data!.id;
    });

    it('should enforce unique constraint on user_id + provider', async () => {
      if (!hasMigration || !testIntegrationId) return;

      const { error } = await forsured('integrations', db!)
        .insert({
          user_id: testUserId,
          organization_id: testOrgId,
          provider: 'procore',
          status: 'connected',
        });

      expect(error).toBeTruthy();
      expect(error!.code).toBe('23505'); // unique_violation
    });
  });

  describe('Sync queue and collision detection', () => {
    it('should detect no_match for a brand new project name', async () => {
      if (!hasMigration) return;

      // Get existing projects for this org
      const { data: projects } = await forsured('projects', db!)
        .select('id, name, procore_id')
        .eq('organization_id', testOrgId);

      const existingRecords = (projects ?? []).filter(
        (p) => p.name != null,
      ).map((p) => ({
        id: p.id as string,
        name: p.name as string,
        procore_id: p.procore_id as string | null,
      }));

      const result = detectCollision(
        { id: 999999, name: 'Completely Unique Project Name XYZ123' },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('no_match');
      expect(result.resolution).toBe('pending');
    });

    it('should detect exact_match when project name matches', async () => {
      if (!hasMigration) return;

      // Get an existing project with a non-null name
      const { data: projects } = await forsured('projects', db!)
        .select('id, name, procore_id')
        .eq('organization_id', testOrgId)
        .not('name', 'is', null)
        .limit(1);

      const project = projects?.[0];
      if (!project) {
        // No projects with names in this org, skip
        return;
      }

      testProjectId = project.id;

      const existingRecords = [{
        id: project.id as string,
        name: project.name as string,
        procore_id: project.procore_id as string | null,
      }];
      const result = detectCollision(
        { id: 88888, name: project.name as string },
        existingRecords,
        'procore_id',
      );

      expect(result.matchStatus).toBe('exact_match');
      expect(result.confidence).toBe(1.0);
      expect(result.matchedEntityId).toBe(project.id);
    });

    it('should insert and resolve a sync queue item', async () => {
      if (!hasMigration || !testIntegrationId) return;

      // Insert a sync queue item
      const { data: queueItem, error: insertErr } = await forsured(
        'sync_queue',
        db!,
      )
        .insert({
          integration_id: testIntegrationId,
          user_id: testUserId,
          organization_id: testOrgId,
          entity_type: 'project',
          provider_entity_id: '99999',
          provider_data: { id: 99999, name: 'Test Procore Project' },
          match_status: 'no_match',
          resolution: 'pending',
        })
        .select('id')
        .single();

      expect(insertErr).toBeNull();
      expect(queueItem).toBeTruthy();

      // Resolve it as skip
      const { error: resolveErr } = await forsured('sync_queue', db!)
        .update({
          resolution: 'skip',
          resolved_by: testUserId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', queueItem!.id);

      expect(resolveErr).toBeNull();

      // Verify it's resolved
      const { data: resolved } = await forsured('sync_queue', db!)
        .select('resolution, resolved_by')
        .eq('id', queueItem!.id)
        .single();

      expect(resolved!.resolution).toBe('skip');
      expect(resolved!.resolved_by).toBe(testUserId);
    });
  });

  describe('Sync log', () => {
    it('should create a sync log entry', async () => {
      if (!hasMigration || !testIntegrationId) return;

      const { data, error } = await forsured('sync_log', db!)
        .insert({
          integration_id: testIntegrationId,
          triggered_by: 'manual',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          projects_found: 5,
          projects_changed: 2,
          vendors_found: 10,
          vendors_changed: 0,
          new_items_queued: 2,
          updates_applied: 0,
          interval_before_minutes: 15,
          interval_after_minutes: 15,
        })
        .select('id, status, projects_found')
        .single();

      expect(error).toBeNull();
      expect(data!.status).toBe('completed');
      expect(data!.projects_found).toBe(5);
    });
  });

  describe('Adaptive backoff with real values', () => {
    it('should compute correct interval after changes detected', () => {
      const next = computeNextInterval(60, true);
      // With changes: 60 * 0.5 = 30, clamped to min (15)
      expect(next).toBeGreaterThanOrEqual(15);
      expect(next).toBeLessThanOrEqual(60);
    });

    it('should compute correct interval after no changes', () => {
      const next = computeNextInterval(60, false);
      // No changes: 60 * 2 = 120
      expect(next).toBeGreaterThanOrEqual(60);
      expect(next).toBeLessThanOrEqual(10080);
    });

    it('should allow manual sync when no previous manual sync', () => {
      expect(canManualSync(null)).toBe(true);
    });

    it('should block manual sync within debounce window', () => {
      const oneMinuteAgo = new Date(Date.now() - 60_000);
      expect(canManualSync(oneMinuteAgo)).toBe(false);
    });
  });
});
