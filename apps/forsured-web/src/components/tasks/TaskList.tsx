/**
 * Task Management Workflow & UI
 * TaskList component with sorting, pagination, and filtering
 */

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@scaffald/ui';
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

const getPriorityBadgeColor = (priority: string): React.CSSProperties => {
  switch (priority) {
    case 'urgent':
      return { backgroundColor: 'var(--color-red2)', color: 'var(--color-red11)' };
    case 'high':
      return { backgroundColor: 'var(--color-orange2)', color: 'var(--color-orange11)' };
    case 'medium':
      return { backgroundColor: 'var(--color-yellow2)', color: 'var(--color-yellow11)' };
    default:
      return { backgroundColor: 'var(--color-color2)', color: 'var(--color-color11)' };
  }
};

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

  if (loading) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-blue10)' }} />
      </Stack>
    );
  }

  if (tasks.length === 0) {
    return (
      <Stack style={{ alignItems: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
        <FileText size={48} color="var(--color-color10)" />
        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)', marginTop: '8px' }}>
          No tasks found
        </Text>
        <Text style={{ fontSize: '14px', color: 'var(--color-color10)', marginTop: '4px' }}>
          Try adjusting your filters or search query.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: '16px' }}>
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-color2)' }}>
              <tr>
                {onSelectTask && (
                  <th style={{ padding: '12px 24px', textAlign: 'left' }}>
                    <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                  </th>
                )}
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('title')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color2)')}
                >
                  <Row style={{ alignItems: 'center', gap: '4px' }}>
                    <Text>Title</Text>
                    <SortIcon field="title" />
                  </Row>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('status')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color2)')}
                >
                  <Row style={{ alignItems: 'center', gap: '4px' }}>
                    <Text>Status</Text>
                    <SortIcon field="status" />
                  </Row>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('priority')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color2)')}
                >
                  <Row style={{ alignItems: 'center', gap: '4px' }}>
                    <Text>Priority</Text>
                    <SortIcon field="priority" />
                  </Row>
                </th>
                <th
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-color10)',
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
                    color: 'var(--color-color10)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('due_date')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-color2)')}
                >
                  <Row style={{ alignItems: 'center', gap: '4px' }}>
                    <Text>Due Date</Text>
                    <SortIcon field="due_date" />
                  </Row>
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
                      backgroundColor: overdue ? 'var(--color-red2)' : 'var(--color-background)',
                      borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
                    }}
                    onPress={() => onTaskClick?.(task)}
                    onMouseEnter={(e) => {
                      if (!overdue) {
                        e.currentTarget.style.backgroundColor = 'var(--color-color2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!overdue) {
                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                      }
                    }}
                  >
                    {onSelectTask && (
                      <td style={{ padding: '16px 24px' }}>
                        <input
                          type="checkbox"
                          style={{ borderRadius: '4px', border: '1px solid var(--color-border)' }}
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectTask(task.id, e.target.checked);
                          }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '16px 24px' }}>
                      <Stack style={{ gap: '4px' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color12)' }}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text
                            style={{
                              fontSize: '14px',
                              color: 'var(--color-color10)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '384px',
                            }}
                          >
                            {task.description}
                          </Text>
                        )}
                      </Stack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <TaskStatusBadge status={task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'} size="sm" />
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Stack
                        style={{
                          alignItems: 'center',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          borderRadius: '9999px',
                          alignSelf: 'flex-start',
                          ...priorityColors,
                        }}
                      >
                        <Text style={{ fontSize: '12px', fontWeight: 500 }}>
                          {task.priority}
                        </Text>
                      </Stack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                        {task.assigned_to_user_id || 'Unassigned'}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-color10)' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      </Text>
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
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '12px',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '14px', color: 'var(--color-color11)' }}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedTasks.length)} of {sortedTasks.length} tasks
            </Text>
            <Row style={{ gap: '8px', alignItems: 'center' }}>
              <Button
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                style={{ opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </Button>
              <Text style={{ fontSize: '14px', paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                Page {page} of {totalPages}
              </Text>
              <Button
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                style={{ opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next
              </Button>
            </Row>
          </Row>
        </Card>
      )}
    </Stack>
  );
};
