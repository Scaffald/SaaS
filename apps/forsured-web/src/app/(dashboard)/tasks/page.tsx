/**
 * REQ-166: Task Management Workflow & UI
 * Main task management page with filtering, search, and real-time updates
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Card, H1, H2, H3, Input } from '@unicornlove/ui';
import { Search } from 'lucide-react';
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
    <YStack minHeight="100vh" backgroundColor="$gray2">
      <YStack maxWidth={1120} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$8" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {/* Header */}
        <YStack marginBottom="$8">
          <H1>Tasks</H1>
          <Text marginTop="$2" fontSize="$2" color="$gray11">
            Manage compliance remediation tasks and workflows
          </Text>
        </YStack>

        {/* Search and Filters */}
        <Card padding="$6" marginBottom="$6">
          <YStack gap="$4">
            {/* Search Bar */}
            <XStack position="relative">
              <XStack
                position="absolute"
                left="$3"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
              >
                <Search size={20} color="$gray10" />
              </XStack>
              <Input
                type="text"
                placeholder="Search tasks by title, description, project..."
                value={searchQuery}
                onChange={(value) => handleSearchChange(value)}
                paddingLeft="$10"
                flex={1}
                borderWidth={1}
                borderColor="$gray6"
                borderRadius="$4"
              />
            </XStack>

            {/* Filter Chips */}
            <XStack flexWrap="wrap" gap="$4">
              {/* Status Filter */}
              <YStack>
                <Text fontSize="$2" fontWeight="500" color="$gray12" marginBottom="$1" display="block">Status</Text>
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
              </YStack>

              {/* Priority Filter */}
              <YStack>
                <Text fontSize="$2" fontWeight="500" color="$gray12" marginBottom="$1" display="block">Priority</Text>
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
              </YStack>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <YStack justifyContent="flex-end">
                  <Button
                    onPress={clearFilters}
                    fontSize="$2"
                    color="$gray11"
                    borderWidth={1}
                    borderColor="$gray6"
                    borderRadius="$4"
                    backgroundColor="transparent"
                    hoverStyle={{ backgroundColor: '$gray3', color: '$gray12' }}
                  >
                    Clear Filters
                  </Button>
                </YStack>
              )}
            </XStack>
          </YStack>
        </Card>

        {/* Bulk Actions */}
        {selectedTaskIds.length > 0 && (
          <YStack backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4" marginBottom="$6" flexDirection="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$4">
            <Text fontSize="$2" fontWeight="500" color="$blue11">
              {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
            </Text>
            <XStack gap="$2">
              <Button
                onPress={() => handleBulkAction('complete')}
                backgroundColor="$blue9"
                color="white"
                fontSize="$2"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue10' }}
              >
                Mark Complete
              </Button>
              <Button
                onPress={() => handleBulkAction('export')}
                backgroundColor="white"
                color="$blue11"
                fontSize="$2"
                borderWidth={1}
                borderColor="$blue9"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue3' }}
              >
                Export
              </Button>
              <Button
                onPress={() => setSelectedTaskIds([])}
                fontSize="$2"
                color="$gray11"
                backgroundColor="transparent"
                hoverStyle={{ color: '$gray12' }}
              >
                Cancel
              </Button>
            </XStack>
          </YStack>
        )}

        {/* Task Count */}
        <YStack marginBottom="$4">
          <Text fontSize="$2" color="$gray11">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </Text>
        </YStack>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          loading={loading}
          onSelectTask={handleSelectTask}
          selectedTaskIds={selectedTaskIds}
        />
      </YStack>
    </YStack>
  );
}
