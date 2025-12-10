/**
 * REQ-166: Task Management Workflow & UI
 * Main task management page with filtering, search, and real-time updates
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority, User } from '../../../types';
import { TaskList } from '../../../components/tasks/TaskList';
import { taskService, TaskFilters } from '../../../lib/api/taskService';
import MockDatabase from '../../../utils/mockDataStore';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks(
        { ...filters, search: searchQuery },
        1,
        1000 // Load all for client-side pagination
      );
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const loadUsers = useCallback(async () => {
    await MockDatabase.query<User>('users', {}, { column: 'name', ascending: true });
  }, []);

  // Real-time polling (30s interval as per requirements)
  useEffect(() => {
    loadTasks();
    loadUsers();

    const interval = setInterval(() => {
      loadTasks();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [loadTasks, loadUsers]);

  const handleFilterChange = (key: keyof TaskFilters, value: TaskStatus[] | TaskPriority[] | string[] | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearchChange = (value: string) => {
    // Debounce search (300ms as per requirements)
    const timeoutId = setTimeout(() => {
      setSearchQuery(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSelectTask = (taskId: string, selected: boolean) => {
    setSelectedTaskIds((prev) =>
      selected ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTaskIds.length === 0) return;

    try {
      switch (action) {
        case 'complete': {
          await taskService.bulkUpdateTasks(selectedTaskIds, { status: 'completed' });
          break;
        }
        case 'assign': {
          // Show assignment modal
          break;
        }
        case 'export': {
          const csv = await taskService.exportTasks(filters);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tasks-${new Date().toISOString()}.csv`;
          a.click();
          break;
        }
        default:
          break;
      }
      setSelectedTaskIds([]);
      loadTasks();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage compliance remediation tasks and workflows
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks by title, description, project..."
              defaultValue={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                multiple
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value as TaskStatus);
                  handleFilterChange('status', selected.length > 0 ? selected : undefined);
                }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                multiple
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value as TaskPriority);
                  handleFilterChange('priority', selected.length > 0 ? selected : undefined);
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTaskIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('complete')}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Mark Complete
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-4 py-2 bg-white text-blue-600 text-sm border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Export
              </button>
              <button
                onClick={() => setSelectedTaskIds([])}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task Count */}
        <div className="mb-4">
          <span className="text-sm text-gray-600">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          loading={loading}
          onSelectTask={handleSelectTask}
          selectedTaskIds={selectedTaskIds}
        />
      </div>
    </div>
  );
}
