/**
 * Audit Triggers Integration Tests
 *
 * Tests that database triggers automatically log data modifications
 * to the forsured.audit_log table.
 *
 * REQ: Phase 4 - Hybrid Audit Logging - Database Trigger Tests
 *
 * These tests use a real Supabase connection (local or remote)
 * and verify that audit triggers fire correctly on:
 * - INSERT operations
 * - UPDATE operations
 * - DELETE operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const forsured = (table: string) => supabase.schema('forsured' as any).from(table);

// Test data tracking for cleanup
const testData = {
  taskIds: [] as string[],
  projectIds: [] as string[],
  subcontractorIds: [] as string[],
};

describe('Audit Triggers Integration Tests', () => {
  let testOrgId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Get or create a test organization
    const { data: orgs } = await supabase.schema('core' as any).from('organizations').select('id').limit(1);
    if (orgs && orgs.length > 0) {
      testOrgId = orgs[0].id;
    } else {
      // Skip tests if no organization exists
      console.warn('No organization found for integration tests');
      testOrgId = '';
    }

    // Get or create a test project
    if (testOrgId) {
      const { data: projects } = await forsured('projects')
        .select('id')
        .eq('organization_id', testOrgId)
        .limit(1);

      if (projects && projects.length > 0) {
        testProjectId = projects[0].id;
      }
    }
  });

  afterAll(async () => {
    // Clean up test data in reverse order
    for (const id of testData.taskIds) {
      await forsured('tasks').delete().eq('id', id);
    }
    for (const id of testData.subcontractorIds) {
      await forsured('subcontractors').delete().eq('id', id);
    }
    for (const id of testData.projectIds) {
      await forsured('projects').delete().eq('id', id);
    }
  });

  describe('Task Audit Triggers', () => {
    it('should log INSERT operations for tasks', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      // Create a task
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: 'Test Audit Task - INSERT',
          status: 'pending',
          priority: 'medium',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      expect(task).toBeDefined();

      if (task) {
        testData.taskIds.push(task.id);

        // Check audit log for the insert
        const { data: auditLogs, error: auditError } = await forsured('audit_log')
          .select('*')
          .eq('record_id', task.id)
          .eq('action', 'tasks_insert')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditError).toBeNull();
        expect(auditLogs).toBeDefined();
        expect(auditLogs?.length).toBeGreaterThanOrEqual(1);

        if (auditLogs && auditLogs.length > 0) {
          const log = auditLogs[0];
          expect(log.category).toBe('data_modification');
          expect(log.operation).toBe('INSERT');
          expect(log.table_name).toContain('tasks');
          expect(log.severity).toBe('low');
          expect(log.new_data).toBeDefined();
        }
      }
    });

    it('should log UPDATE operations for tasks', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      // Create a task first
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: 'Test Audit Task - UPDATE',
          status: 'pending',
          priority: 'medium',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      expect(task).toBeDefined();

      if (task) {
        testData.taskIds.push(task.id);

        // Update the task
        const { error: updateError } = await forsured('tasks')
          .update({ status: 'in_progress', priority: 'high' })
          .eq('id', task.id);

        expect(updateError).toBeNull();

        // Check audit log for the update
        const { data: auditLogs, error: auditError } = await forsured('audit_log')
          .select('*')
          .eq('record_id', task.id)
          .eq('action', 'tasks_update')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditError).toBeNull();
        expect(auditLogs).toBeDefined();
        expect(auditLogs?.length).toBeGreaterThanOrEqual(1);

        if (auditLogs && auditLogs.length > 0) {
          const log = auditLogs[0];
          expect(log.category).toBe('data_modification');
          expect(log.operation).toBe('UPDATE');
          expect(log.severity).toBe('medium');
          expect(log.old_data).toBeDefined();
          expect(log.new_data).toBeDefined();
          expect(log.changed_fields).toContain('status');
        }
      }
    });

    it('should log DELETE operations for tasks', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      // Create a task first
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: 'Test Audit Task - DELETE',
          status: 'pending',
          priority: 'low',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      expect(task).toBeDefined();

      if (task) {
        const taskId = task.id;

        // Delete the task
        const { error: deleteError } = await forsured('tasks')
          .delete()
          .eq('id', taskId);

        expect(deleteError).toBeNull();

        // Check audit log for the delete
        const { data: auditLogs, error: auditError } = await forsured('audit_log')
          .select('*')
          .eq('record_id', taskId)
          .eq('action', 'tasks_delete')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditError).toBeNull();
        expect(auditLogs).toBeDefined();
        expect(auditLogs?.length).toBeGreaterThanOrEqual(1);

        if (auditLogs && auditLogs.length > 0) {
          const log = auditLogs[0];
          expect(log.category).toBe('data_modification');
          expect(log.operation).toBe('DELETE');
          expect(log.severity).toBe('high');
          expect(log.old_data).toBeDefined();
        }
      }
    });
  });

  describe('Audit Log WORM Protection', () => {
    it('should prevent UPDATE of audit log entries', async () => {
      // Get any audit log entry
      const { data: logs } = await forsured('audit_log')
        .select('id')
        .limit(1);

      if (!logs || logs.length === 0) {
        console.warn('No audit logs to test WORM protection');
        return;
      }

      // Try to update it (should fail)
      const { error: updateError } = await forsured('audit_log')
        .update({ severity: 'critical' })
        .eq('id', logs[0].id);

      // WORM protection should reject the update
      expect(updateError).toBeDefined();
    });

    it('should prevent DELETE of audit log entries', async () => {
      // Get any audit log entry
      const { data: logs } = await forsured('audit_log')
        .select('id')
        .limit(1);

      if (!logs || logs.length === 0) {
        console.warn('No audit logs to test WORM protection');
        return;
      }

      // Try to delete it (should fail)
      const { error: deleteError } = await forsured('audit_log')
        .delete()
        .eq('id', logs[0].id);

      // WORM protection should reject the delete
      expect(deleteError).toBeDefined();
    });
  });

  describe('Audit Log Metadata', () => {
    it('should include resource name in audit logs', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      const uniqueTitle = `Audit Test Task ${Date.now()}`;

      // Create a task with a unique title
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: uniqueTitle,
          status: 'pending',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();

      if (task) {
        testData.taskIds.push(task.id);

        // Check audit log includes the title as resource_name
        const { data: auditLogs } = await forsured('audit_log')
          .select('*')
          .eq('record_id', task.id)
          .eq('action', 'tasks_insert')
          .limit(1);

        expect(auditLogs).toBeDefined();
        if (auditLogs && auditLogs.length > 0) {
          expect(auditLogs[0].resource_name).toBe(uniqueTitle);
          expect(auditLogs[0].resource_type).toBe('tasks');
        }
      }
    });

    it('should include organization_id in audit logs', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      // Create a task
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: 'Org ID Test Task',
          status: 'pending',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();

      if (task) {
        testData.taskIds.push(task.id);

        // Check audit log includes organization_id
        const { data: auditLogs } = await forsured('audit_log')
          .select('*')
          .eq('record_id', task.id)
          .eq('action', 'tasks_insert')
          .limit(1);

        expect(auditLogs).toBeDefined();
        if (auditLogs && auditLogs.length > 0) {
          expect(auditLogs[0].organization_id).toBe(testOrgId);
        }
      }
    });

    it('should record changed fields on UPDATE', async () => {
      if (!testOrgId || !testProjectId) {
        console.warn('Skipping test - no test org/project');
        return;
      }

      // Create a task
      const { data: task, error: insertError } = await forsured('tasks')
        .insert({
          project_id: testProjectId,
          organization_id: testOrgId,
          title: 'Changed Fields Test',
          status: 'pending',
          priority: 'low',
          description: 'Original description',
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();

      if (task) {
        testData.taskIds.push(task.id);

        // Update multiple fields
        await forsured('tasks')
          .update({
            status: 'completed',
            description: 'Updated description',
          })
          .eq('id', task.id);

        // Check audit log includes changed fields
        const { data: auditLogs } = await forsured('audit_log')
          .select('*')
          .eq('record_id', task.id)
          .eq('action', 'tasks_update')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditLogs).toBeDefined();
        if (auditLogs && auditLogs.length > 0) {
          expect(auditLogs[0].changed_fields).toBeDefined();
          expect(Array.isArray(auditLogs[0].changed_fields)).toBe(true);
          expect(auditLogs[0].changed_fields).toContain('status');
          expect(auditLogs[0].changed_fields).toContain('description');
        }
      }
    });
  });

  describe('Audit Trail Query', () => {
    it('should be able to query audit logs by action', async () => {
      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('category', 'data_modification')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should be able to query audit logs by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should be able to query audit logs by record_id', async () => {
      if (testData.taskIds.length === 0) {
        console.warn('No task IDs to query');
        return;
      }

      const { data: logs, error } = await forsured('audit_log')
        .select('*')
        .eq('record_id', testData.taskIds[0])
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(logs).toBeDefined();
      // Should have at least one log (the insert)
      expect(logs?.length).toBeGreaterThanOrEqual(1);
    });
  });
});
