/**
 * Task Management Workflow & UI
 * Main task management page with filtering, search, and real-time updates
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Row, Text, Button, Card, H1, Input } from '@unicornlove/beyond-ui';
import { Search } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, User } from '../../../types';
import { TaskList } from '../../../components/tasks/TaskList';
import { taskService, TaskFilters } from '../../../lib/api/taskService';

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

  // Real-time polling (30s interval as per requirements)
  useEffect(() => {
    loadTasks();

    const interval = setInterval(() => {
      loadTasks();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [loadTasks]);

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
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-2)' }}>
      <Stack style={{ maxWidth: 1120, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        {/* Header */}
        <Stack style={{ marginBottom: 'var(--space-8)' }}>
          <H1>Tasks</H1>
          <Text style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
            Manage compliance remediation tasks and workflows
          </Text>
        </Stack>

        {/* Search and Filters */}
        <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            {/* Search Bar */}
            <Row style={{ position: 'relative' }}>
              <Row
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                <Search size={20} color="var(--color-gray-10)" />
              </Row>
              <Input
                type="text"
                placeholder="Search tasks by title, description, project..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  paddingLeft: 'var(--space-10)',
                  flex: 1,
                  borderWidth: 1,
                  borderColor: 'var(--color-gray-6)',
                  borderRadius: 'var(--radius-4)',
                }}
              />
            </Row>

            {/* Filter Chips */}
            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {/* Status Filter */}
              <Stack>
                <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-1)', display: 'block' }}>Status</Text>
                <select
                  multiple
                  style={{
                    borderWidth: 1,
                    borderColor: 'var(--color-gray-6)',
                    borderRadius: 'var(--radius-4)',
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: 'var(--font-size-2)',
                  }}
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
              </Stack>

              {/* Priority Filter */}
              <Stack>
                <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-1)', display: 'block' }}>Priority</Text>
                <select
                  multiple
                  style={{
                    borderWidth: 1,
                    borderColor: 'var(--color-gray-6)',
                    borderRadius: 'var(--radius-4)',
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: 'var(--font-size-2)',
                  }}
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
              </Stack>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Stack style={{ justifyContent: 'flex-end' }}>
                  <Button
                    onPress={clearFilters}
                    style={{
                      fontSize: 'var(--font-size-2)',
                      color: 'var(--color-gray-11)',
                      borderWidth: 1,
                      borderColor: 'var(--color-gray-6)',
                      borderRadius: 'var(--radius-4)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Clear Filters
                  </Button>
                </Stack>
              )}
            </Row>
          </Stack>
        </Card>

        {/* Bulk Actions */}
        {selectedTaskIds.length > 0 && (
          <Row style={{ backgroundColor: 'var(--color-blue-2)', borderWidth: 1, borderColor: 'var(--color-blue-6)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-blue-11)' }}>
              {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
            </Text>
            <Row style={{ gap: 'var(--space-2)' }}>
              <Button
                onPress={() => handleBulkAction('complete')}
                style={{
                  backgroundColor: 'var(--color-blue-9)',
                  color: 'white',
                  fontSize: 'var(--font-size-2)',
                  borderRadius: 'var(--radius-4)',
                }}
              >
                Mark Complete
              </Button>
              <Button
                onPress={() => handleBulkAction('export')}
                style={{
                  backgroundColor: 'white',
                  color: 'var(--color-blue-11)',
                  fontSize: 'var(--font-size-2)',
                  borderWidth: 1,
                  borderColor: 'var(--color-blue-9)',
                  borderRadius: 'var(--radius-4)',
                }}
              >
                Export
              </Button>
              <Button
                onPress={() => setSelectedTaskIds([])}
                style={{
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-gray-11)',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </Button>
            </Row>
          </Row>
        )}

        {/* Task Count */}
        <Stack style={{ marginBottom: 'var(--space-4)' }}>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </Text>
        </Stack>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          loading={loading}
          onSelectTask={handleSelectTask}
          selectedTaskIds={selectedTaskIds}
        />
      </Stack>
    </Stack>
  );
}
