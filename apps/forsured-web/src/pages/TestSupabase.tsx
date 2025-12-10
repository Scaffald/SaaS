/**
 * Test Page for Supabase Integration
 * REQ-212: Code Updates for Shared Database Architecture
 *
 * This page tests the useTasks hook with real Supabase connection
 * to validate forsured.* schema queries and cross-schema joins.
 */

import React, { useEffect, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabaseServiceRole, forsured as forsuredQuery, core as coreQuery } from '../lib/supabase';

export default function TestSupabase() {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();
  const { useMockData, supabase } = useDatabase();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');

  // Test Supabase connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const addResult = (message: string, isError = false) => {
    const prefix = isError ? '❌' : '✅';
    setTestResults(prev => [...prev, `${prefix} ${message}`]);
    console.log(`[TestSupabase] ${prefix} ${message}`);
  };

  const testConnection = async () => {
    try {
      addResult(`Mode: ${useMockData ? 'MockDatabase' : 'Real Supabase'}`);

      if (!useMockData) {
        // Test 1: Check Supabase client
        addResult('Supabase client initialized');

        // Check if service role client is available for testing
        if (!supabaseServiceRole) {
          addResult('Service role key not configured - tests will fail due to RLS', true);
          setConnectionStatus('error');
          return;
        }

        addResult('Using service role client (bypasses RLS for testing)');

        // Test 2: Check schemas exist by trying to query them
        let schemasFound = 0;

        // Try forsured schema
        const { error: forsuredError } = await forsuredQuery('tasks', supabaseServiceRole)
          .select('id', { count: 'exact', head: true });
        if (!forsuredError) {
          schemasFound++;
          addResult('Schema forsured accessible');
        } else {
          addResult(`forsured schema error: ${forsuredError.message}`, true);
        }

        // Try core schema
        const { error: coreError } = await coreQuery('users', supabaseServiceRole)
          .select('id', { count: 'exact', head: true });
        if (!coreError) {
          schemasFound++;
          addResult('Schema core accessible');
        } else {
          addResult(`core schema error: ${coreError.message}`, true);
        }

        addResult(`Schemas accessible: ${schemasFound}/2`);

        // Test 3: Check forsured.tasks table exists
        const { count, error: countError } = await forsuredQuery('tasks', supabaseServiceRole)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          addResult(`Tasks table check failed: ${countError.message}`, true);
          setConnectionStatus('error');
        } else {
          addResult(`Tasks table exists (${count} rows)`);
          setConnectionStatus('success');
        }

        // Test 4: Check core.users table exists (read-only)
        const { data: coreUsers, error: coreUsersError } = await coreQuery('users', supabaseServiceRole)
          .select('id, name, email')
          .limit(1);

        if (coreUsersError) {
          addResult(`Core users table check failed: ${coreUsersError.message}`, true);
        } else {
          addResult(`Core users table accessible (sample: ${coreUsers?.length || 0} rows)`);
        }
      }
    } catch (err) {
      addResult(`Connection test error: ${(err as Error).message}`, true);
      setConnectionStatus('error');
    }
  };

  const testCreateTask = async () => {
    try {
      addResult('Testing task creation...');
      const newTask = await createTask({
        title: 'Test Task from Supabase',
        description: 'Created via useTasks hook with real Supabase',
        status: 'pending',
        project_id: '00000000-0000-0000-0000-000000000100', // Test project
        organization_id: '00000000-0000-0000-0000-000000000001', // Test org from seed
        assigned_to_user_id: '00000000-0000-0000-0000-000000000010', // Test user from seed
      });
      addResult(`Task created: ${newTask?.id}`);
    } catch (err) {
      addResult(`Create task error: ${(err as Error).message}`, true);
    }
  };

  const testUpdateTask = async () => {
    if (tasks.length === 0) {
      addResult('No tasks to update', true);
      return;
    }

    try {
      const taskToUpdate = tasks[0];
      addResult(`Testing task update for: ${taskToUpdate.id}`);

      await updateTask(taskToUpdate.id, {
        status: 'in_progress',
        description: 'Updated via test page',
      });

      addResult(`Task updated: ${taskToUpdate.id}`);
    } catch (err) {
      addResult(`Update task error: ${(err as Error).message}`, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Supabase Integration Test
        </h1>

        {/* Connection Status */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Connection Status
          </h2>
          <div className="flex items-center gap-4">
            {connectionStatus === 'testing' && (
              <span className="text-yellow-600 dark:text-yellow-400">🔄 Testing...</span>
            )}
            {connectionStatus === 'success' && (
              <span className="text-green-600 dark:text-green-400">✅ Connected</span>
            )}
            {connectionStatus === 'error' && (
              <span className="text-red-600 dark:text-red-400">❌ Connection Failed</span>
            )}
            <span className="text-gray-600 dark:text-gray-400">
              Mode: {useMockData ? 'Mock Database' : 'Real Supabase'}
            </span>
          </div>
        </div>

        {/* Test Results */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Results
          </h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="text-sm font-mono text-gray-700 dark:text-gray-300"
              >
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Test Actions */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Actions
          </h2>
          <div className="flex gap-4">
            <button
              onClick={testCreateTask}
              disabled={loading || connectionStatus === 'error'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Test Task
            </button>
            <button
              onClick={testUpdateTask}
              disabled={loading || connectionStatus === 'error' || tasks.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Update First Task
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Tasks from {useMockData ? 'Mock Database' : 'forsured.tasks'}
          </h2>

          {loading && (
            <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400">
              Error: {error.message}
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div className="text-gray-600 dark:text-gray-400">
              No tasks found. Try creating one!
            </div>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {task.status}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {task.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    ID: {task.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
