/**
 * REQ-166: Task Management Workflow & UI
 * TaskList component with sorting, pagination, and filtering
 */

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, SizableText, Spinner } from '@unicornlove/ui';
import { Task } from '../../types';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onSelectTask?: (taskId: string, selected: boolean) => void;
  selectedTaskIds?: string[];
  loading?: boolean;
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'created_at';
type SortOrder = 'asc' | 'desc';

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskClick,
  onSelectTask,
  selectedTaskIds = [],
  loading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined values
      if (!aVal) return 1;
      if (!bVal) return -1;

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortOrder]);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, page]);

  const totalPages = Math.ceil(sortedTasks.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && sortedTasks.find(t => t.due_date === dueDate)?.status !== 'completed';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp size={16} style={{ marginLeft: 4, display: 'inline-block' }} />
    ) : (
      <ChevronDown size={16} style={{ marginLeft: 4, display: 'inline-block' }} />
    );
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '$red2', text: '$red11' };
      case 'high':
        return { bg: '$orange2', text: '$orange11' };
      case 'medium':
        return { bg: '$yellow2', text: '$yellow11' };
      default:
        return { bg: '$color2', text: '$color11' };
    }
  };

  if (loading) {
    return (
      <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  if (tasks.length === 0) {
    return (
      <YStack alignItems="center" paddingVertical="$12">
        <FileText size={48} color="var(--color10)" />
        <Text fontSize="$3" fontWeight="500" color="$color12" mt="$2">
          No tasks found
        </Text>
        <SizableText fontSize="$3" color="$color10" mt="$1">
          Try adjusting your filters or search query.
        </SizableText>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        overflow="hidden"
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color2)' }}>
              <tr>
                {onSelectTask && (
                  <th style={{ padding: '12px 24px', textAlign: 'left' }}>
                    <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid var(--borderColor)' }} />
                  </th>
                )}
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('title')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color2)')}
                >
                  <XStack alignItems="center" gap="$1">
                    <Text>Title</Text>
                    <SortIcon field="title" />
                  </XStack>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('status')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color2)')}
                >
                  <XStack alignItems="center" gap="$1">
                    <Text>Status</Text>
                    <SortIcon field="status" />
                  </XStack>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('priority')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color2)')}
                >
                  <XStack alignItems="center" gap="$1">
                    <Text>Priority</Text>
                    <SortIcon field="priority" />
                  </XStack>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Assignee
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('due_date')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color2)')}
                >
                  <XStack alignItems="center" gap="$1">
                    <Text>Due Date</Text>
                    <SortIcon field="due_date" />
                  </XStack>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task, index) => {
                const overdue = isOverdue(task.due_date);
                const priorityColors = getPriorityBadgeColor(task.priority);
                return (
                  <tr
                    key={task.id}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: overdue ? 'var(--red2)' : 'var(--background)',
                      borderTop: index > 0 ? '1px solid var(--borderColor)' : 'none',
                    }}
                    onClick={() => onTaskClick?.(task)}
                    onMouseEnter={(e) => {
                      if (!overdue) {
                        e.currentTarget.style.backgroundColor = 'var(--color2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!overdue) {
                        e.currentTarget.style.backgroundColor = 'var(--background)';
                      }
                    }}
                  >
                    {onSelectTask && (
                      <td style={{ padding: '16px 24px' }}>
                        <input
                          type="checkbox"
                          style={{ borderRadius: '4px', border: '1px solid var(--borderColor)' }}
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectTask(task.id, e.target.checked);
                          }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '16px 24px' }}>
                      <YStack gap="$1">
                        <SizableText fontSize="$3" fontWeight="500" color="$color12">
                          {task.title}
                        </SizableText>
                        {task.description && (
                          <SizableText fontSize="$3" color="$color10" numberOfLines={1} maxWidth={384}>
                            {task.description}
                          </SizableText>
                        )}
                      </YStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <TaskStatusBadge status={task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'} size="sm" />
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <YStack
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius={9999}
                        backgroundColor={priorityColors.bg as any}
                        alignSelf="flex-start"
                      >
                        <SizableText fontSize="$1" fontWeight="500" color={priorityColors.text as any}>
                          {task.priority}
                        </SizableText>
                      </YStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <SizableText fontSize="$3" color="$color10">
                        {task.assigned_to_user_id || 'Unassigned'}
                      </SizableText>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <SizableText fontSize="$3" color="$color10">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      </SizableText>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          paddingHorizontal="$4"
          paddingVertical="$3"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <SizableText fontSize="$3" color="$color11">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedTasks.length)} of {sortedTasks.length} tasks
            </SizableText>
            <XStack gap="$2" alignItems="center">
              <Button
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outlined"
                size="$2"
                opacity={page === 1 ? 0.5 : 1}
              >
                Previous
              </Button>
              <SizableText fontSize="$3" paddingHorizontal="$3" paddingVertical="$1">
                Page {page} of {totalPages}
              </SizableText>
              <Button
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outlined"
                size="$2"
                opacity={page === totalPages ? 0.5 : 1}
              >
                Next
              </Button>
            </XStack>
          </XStack>
        </Card>
      )}
    </YStack>
  );
};
