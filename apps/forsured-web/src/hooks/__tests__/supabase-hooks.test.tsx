/**
 * Integration Tests for Supabase-converted Hooks
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * These tests validate that hooks correctly query forsured.* schema tables
 * using the service role client for RLS bypass during testing.
 *
 * NOTE: These are integration tests requiring a real Supabase connection.
 * Run `supabase start` before running these tests.
 * They are skipped by default unless VITE_RUN_INTEGRATION_TESTS=true is set.
 *
 * To run: VITE_RUN_INTEGRATION_TESTS=true npm test -- src/hooks/__tests__/supabase-hooks.test.tsx
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { ReactNode } from 'react';
import { useTasks } from '../useTasks';
import { useProjects } from '../useProjects';
import { usePolicies } from '../usePolicies';
import { useCompliance } from '../useCompliance';
import { useUsers } from '../useUsers';
import { useClients } from '../useClients';
import { DatabaseProvider } from '../../contexts/DatabaseContext';
import { UserProvider } from '../../contexts/UserContext';
import { supabaseServiceRole, forsured as forsuredQuery, core as coreQuery } from '../../lib/supabase';

// Skip integration tests unless explicitly enabled
// These tests require:
// 1. Running local Supabase instance (supabase start)
// 2. VITE_RUN_INTEGRATION_TESTS=true environment variable
// The jsdom environment doesn't support real network fetch, so these tests
// are skipped by default and only run when explicitly requested.
const SKIP_INTEGRATION = import.meta.env.VITE_RUN_INTEGRATION_TESTS !== 'true';

// Wrapper for hooks that need UserContext and DatabaseContext
const wrapper = ({ children }: { children: ReactNode }) => (
  <UserProvider>
    <DatabaseProvider>{children}</DatabaseProvider>
  </UserProvider>
);

// Test data
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000100';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000010';

describe.skipIf(SKIP_INTEGRATION)('Supabase Hooks Integration Tests', () => {
  beforeAll(async () => {
    // Verify service role client is available
    if (!supabaseServiceRole) {
      throw new Error(
        'Service role client not configured. Set VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local'
      );
    }

    // Verify test organization exists
    const { data: org } = await coreQuery('organizations', supabaseServiceRole)
      .select('id')
      .eq('id', TEST_ORG_ID)
      .single();

    if (!org) {
      // Create test organization if it doesn't exist
      await coreQuery('organizations', supabaseServiceRole).insert({
        id: TEST_ORG_ID,
        name: 'Test Organization',
      });
    }

    // Verify test project exists
    const { data: project } = await forsuredQuery('projects', supabaseServiceRole)
      .select('id')
      .eq('id', TEST_PROJECT_ID)
      .single();

    if (!project) {
      // Create test project if it doesn't exist
      await forsuredQuery('projects', supabaseServiceRole).insert({
        id: TEST_PROJECT_ID,
        name: 'Test Project',
        organization_id: TEST_ORG_ID,
      });
    }
  });

  afterEach(async () => {
    if (!supabaseServiceRole) return;

    // Clean up test data after each test, but preserve base test org and project
    await forsuredQuery('tasks', supabaseServiceRole)
      .delete()
      .ilike('title', '%test%');

    await forsuredQuery('policies', supabaseServiceRole)
      .delete()
      .ilike('policy_number', '%test%');

    await forsuredQuery('compliance_scores', supabaseServiceRole)
      .delete()
      .eq('organization_id', 'test-org');

    // Clean up test organizations/clients but not the base test org
    await coreQuery('organizations', supabaseServiceRole)
      .delete()
      .ilike('name', '%test%')
      .neq('id', TEST_ORG_ID);

    // Clean up test projects but not the base test project
    await forsuredQuery('projects', supabaseServiceRole)
      .delete()
      .ilike('name', '%test%')
      .neq('id', TEST_PROJECT_ID);
  });

  describe('useTasks', () => {
    it('should fetch tasks from forsured.tasks table', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.tasks)).toBe(true);
    });

    it('should create a new task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const newTask = await result.current.createTask({
        title: 'Integration Test Task',
        description: 'Created by Vitest',
        status: 'pending',
        project_id: TEST_PROJECT_ID,
        organization_id: TEST_ORG_ID,
        assigned_to_user_id: TEST_USER_ID,
      });

      expect(newTask).toBeDefined();
      expect(newTask?.id).toBeDefined();
      expect(newTask?.title).toBe('Integration Test Task');
    });

    it('should update a task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Create a task first
      const task = await result.current.createTask({
        title: 'Task to Update',
        status: 'pending',
        project_id: TEST_PROJECT_ID,
        organization_id: TEST_ORG_ID,
      });

      // Update it
      const updated = await result.current.updateTask(task!.id, {
        status: 'in_progress',
        description: 'Updated description',
      });

      expect(updated?.status).toBe('in_progress');
      expect(updated?.description).toBe('Updated description');
    });

    it('should delete a task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Create a task
      const task = await result.current.createTask({
        title: 'Task to Delete',
        status: 'pending',
        project_id: TEST_PROJECT_ID,
        organization_id: TEST_ORG_ID,
      });

      const taskId = task!.id;

      // Delete it
      await result.current.deleteTask(taskId);

      // Verify it's gone
      await waitFor(() => {
        const exists = result.current.tasks.some((t) => t.id === taskId);
        expect(exists).toBe(false);
      });
    });
  });

  describe('useProjects', () => {
    it('should fetch projects from forsured.projects table', async () => {
      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.projects)).toBe(true);
    });

    it('should filter projects by organization', async () => {
      const { result } = renderHook(() => useProjects(TEST_ORG_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // All returned projects should belong to the test org
      result.current.projects.forEach((project) => {
        expect(project.organization_id).toBe(TEST_ORG_ID);
      });
    });

    it('should create a new project', async () => {
      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const newProject = await result.current.createProject({
        name: 'Test Project for Integration',
        organization_id: TEST_ORG_ID,
      });

      expect(newProject).toBeDefined();
      expect(newProject?.name).toBe('Test Project for Integration');
    });
  });

  describe('usePolicies', () => {
    it('should fetch policies from forsured.policies table', async () => {
      const { result } = renderHook(() => usePolicies(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.policies)).toBe(true);
    });

    it('should order policies by end date', async () => {
      const { result } = renderHook(() => usePolicies(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const policies = result.current.policies;
      if (policies.length > 1) {
        // Verify ascending order by end_date
        for (let i = 0; i < policies.length - 1; i++) {
          const current = new Date(policies[i].end_date || 0);
          const next = new Date(policies[i + 1].end_date || 0);
          expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe('useCompliance', () => {
    it('should fetch compliance record for an organization', async () => {
      const { result } = renderHook(() => useCompliance(TEST_ORG_ID), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      // May be null if no compliance record exists yet
      expect(
        result.current.compliance === null ||
          typeof result.current.compliance === 'object'
      ).toBe(true);
    });

    it('should handle no compliance record gracefully', async () => {
      // Use valid UUID format for non-existent org
      const { result } = renderHook(
        () => useCompliance('99999999-9999-9999-9999-999999999999'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should not error, just return null
      expect(result.current.error).toBeNull();
      expect(result.current.compliance).toBeNull();
    });
  });

  describe('useUsers', () => {
    it('should fetch users from core.users table', async () => {
      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.users)).toBe(true);
    });

    it('should fetch users ordered by name', async () => {
      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const users = result.current.users;
      if (users.length > 1) {
        // Verify users are ordered by name
        for (let i = 0; i < users.length - 1; i++) {
          const currentName = users[i].name || '';
          const nextName = users[i + 1].name || '';
          expect(currentName.localeCompare(nextName)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('useClients', () => {
    it('should fetch clients from core.organizations table', async () => {
      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Array.isArray(result.current.clients)).toBe(true);
    });

    it('should create a new client', async () => {
      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const newClient = await result.current.addClient({
        name: 'Test Client Organization',
      });

      expect(newClient).toBeDefined();
      expect(newClient?.name).toBe('Test Client Organization');
    });

    it('should update a client', async () => {
      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Create a client first
      const client = await result.current.addClient({
        name: 'Client to Update',
      });

      // Update it
      const updated = await result.current.updateClient(client!.id, {
        name: 'Updated Client Name',
      });

      expect(updated?.name).toBe('Updated Client Name');
    });
  });

  describe('Schema Access', () => {
    it('should successfully query forsured schema', async () => {
      if (!supabaseServiceRole) {
        throw new Error('Service role client required');
      }

      const { error } = await forsuredQuery('tasks', supabaseServiceRole)
        .select('id', { count: 'exact', head: true });

      expect(error).toBeNull();
    });

    it('should successfully query core schema', async () => {
      if (!supabaseServiceRole) {
        throw new Error('Service role client required');
      }

      const { error } = await supabaseServiceRole
        .schema('core')
        .from('users')
        .select('id', { count: 'exact', head: true });

      expect(error).toBeNull();
    });
  });
});
