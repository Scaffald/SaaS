import { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
  FileText,
  Building2,
  Plus,
} from 'lucide-react';
import { Stack, Row, Text, H2, Card, Button } from '@unicornlove/beyond-ui';
import { Task } from '../../types';
import { formatDate, getDaysUntil, isOverdue } from '../../utils/dateHelpers';
import TaskStatusBadge from '../Common/TaskStatusBadge';
import { TaskViewToggle } from '../tasks/TaskViewToggle';
import { useTaskViewFilter } from '../../hooks/useTaskViewFilter';

interface TasksInboxProps {
  tasks: Task[];
  /** All tasks for counting (before role filtering) - needed for "Assigned by Me" count */
  allTasks?: Task[];
  /** Current user ID for filtering */
  currentUserId?: string;
  onTaskClick?: (task: Task) => void;
  onCreateTask?: () => void;
  onUpdateTaskStatus?: (taskId: string, status: string) => void;
}

export default function TasksInbox({
  tasks,
  allTasks,
  currentUserId,
  onTaskClick,
  onCreateTask,
  onUpdateTaskStatus,
}: TasksInboxProps) {
  const [activeTab, setActiveTab] = useState<'urgent' | 'upcoming'>('urgent');
  const { currentView, setView } = useTaskViewFilter();

  // REQ-268: Calculate counts for view toggle
  // Use allTasks if provided (for accurate counts across both views)
  // Otherwise fall back to tasks array
  const tasksForCounting = allTasks || tasks;

  const { inboxCount, assignedByMeCount } = useMemo(() => {
    if (!currentUserId) {
      return { inboxCount: tasks.length, assignedByMeCount: 0 };
    }

    const inbox = tasksForCounting.filter(
      (t) =>
        t.assigned_to_user_id === currentUserId &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );
    const assignedByMe = tasksForCounting.filter(
      (t) =>
        t.created_by_user_id === currentUserId &&
        t.assigned_to_user_id !== currentUserId && // Exclude self-assigned
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );

    return {
      inboxCount: inbox.length,
      assignedByMeCount: assignedByMe.length,
    };
  }, [tasksForCounting, currentUserId, tasks.length]);

  // REQ-268: Get header text based on current view
  const getHeaderText = () => {
    if (currentView === 'assigned-by-me') {
      return {
        title: 'Tasks Assigned by You',
        subtitle: 'Track tasks you delegated to others',
      };
    }
    return {
      title: 'Your Tasks Inbox',
      subtitle: 'View, resolve, or delegate issues',
    };
  };

  const headerText = getHeaderText();

  const urgentTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      (t.priority === 'urgent' ||
        t.priority === 'high' ||
        (t.due_date && isOverdue(t.due_date)))
  );

  const upcomingTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.priority !== 'urgent' &&
      t.priority !== 'high' &&
      (!t.due_date || !isOverdue(t.due_date))
  );

  const displayedTasks = activeTab === 'urgent' ? urgentTasks : upcomingTasks;

  const getPriorityStyle = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'urgent':
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)', borderColor: 'var(--color-red-6)' };
      case 'high':
        return { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)', borderColor: 'var(--color-yellow-6)' };
      case 'normal':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-11)', borderColor: 'var(--color-blue-6)' };
      default:
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)', borderColor: 'var(--color-gray-6)' };
    }
  };

  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;

    const daysLeft = getDaysUntil(dueDate);
    if (isOverdue(dueDate)) {
      return (
        <Text size="xs" weight="medium" style={{ color: 'var(--color-red-10)' }}>Overdue</Text>
      );
    } else if (daysLeft === 0) {
      return (
        <Row
          alignItems="center"
          style={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 4,
            backgroundColor: 'var(--color-red-2)',
            border: '1px solid var(--color-red-6)',
          }}
        >
          <Text size="xs" weight="medium" style={{ color: 'var(--color-red-11)' }}>Due Today</Text>
        </Row>
      );
    } else if (daysLeft <= 3) {
      return (
        <Row
          alignItems="center"
          style={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 4,
            backgroundColor: 'var(--color-yellow-2)',
            border: '1px solid var(--color-yellow-6)',
          }}
        >
          <Text size="xs" weight="medium" style={{ color: 'var(--color-yellow-11)' }}>Due in {daysLeft}d</Text>
        </Row>
      );
    }
    return (
      <Text size="xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(dueDate)}</Text>
    );
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    backgroundColor: isActive ? 'var(--color-blue-9)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-text-muted)',
    border: 'none',
    cursor: 'pointer',
  });

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Stack>
            <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
              {headerText.title}
            </H2>
            <Text size="sm" muted>
              {headerText.subtitle}
            </Text>
          </Stack>
          <Button color="primary" iconStart={Plus} onPress={onCreateTask}>
            New Task
          </Button>
        </Row>

        {/* REQ-268: View Toggle - My Inbox vs Assigned by Me */}
        <Stack style={{ marginBottom: 16 }}>
          <TaskViewToggle
            currentView={currentView}
            onViewChange={setView}
            inboxCount={inboxCount}
            assignedByMeCount={assignedByMeCount}
          />
        </Stack>

        <Row gap={16}>
          <button
            onClick={() => setActiveTab('urgent')}
            style={tabButtonStyle(activeTab === 'urgent')}
          >
            Urgent ({urgentTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={tabButtonStyle(activeTab === 'upcoming')}
          >
            Upcoming ({upcomingTasks.length})
          </button>
        </Row>
      </Stack>

      <Stack padding={24} id="task-list" role="tabpanel">
        <Stack gap={16}>
          {displayedTasks.map((task) => {
            const priorityStyle = getPriorityStyle(task.priority);
            return (
              <Card
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                }}
              >
                <Row alignItems="flex-start" justifyContent="space-between">
                  <Stack style={{ flex: 1 }}>
                    <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          border: '1px solid',
                          ...priorityStyle,
                        }}
                      >
                        {task.priority}
                      </span>
                      {task.due_date && getDueDateBadge(task.due_date)}
                    </Row>

                    <Text size="sm" weight="medium" style={{ marginBottom: 4 }}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text size="sm" muted style={{ marginBottom: 8 }}>
                        {task.description}
                      </Text>
                    )}

                    <Row
                      alignItems="center"
                      style={{
                        flexWrap: 'wrap',
                        gap: '4px 16px',
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {task.assigned_to && (
                        <Row alignItems="center" gap={4}>
                          <User size={12} />
                          <Text size="xs" muted>{task.assigned_to.name}</Text>
                        </Row>
                      )}
                      {task.client && (
                        <Row alignItems="center" gap={4}>
                          <FileText size={12} />
                          <Text size="xs" muted>{task.client.company_name}</Text>
                        </Row>
                      )}
                      {/* REQ-282 TASK-4: Display sub company context */}
                      {task.sub_company_name && (
                        <Row alignItems="center" gap={4}>
                          <Building2 size={12} style={{ color: 'var(--color-blue-10)' }} />
                          <Text size="xs" style={{ color: 'var(--color-blue-10)' }}>{task.sub_company_name}</Text>
                        </Row>
                      )}
                      {task.due_date && (
                        <Row alignItems="center" gap={4}>
                          <Calendar size={12} />
                          <Text size="xs" muted>Due: {formatDate(task.due_date)}</Text>
                        </Row>
                      )}
                    </Row>

                    {task.document_link && (
                      <Stack style={{ marginTop: 8 }}>
                        <a
                          href={task.document_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: 'var(--color-blue-10)',
                            textDecoration: 'none',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText size={12} />
                          <span>View Document</span>
                        </a>
                      </Stack>
                    )}
                  </Stack>

                  <Stack alignItems="flex-end" gap={8} style={{ marginLeft: 16 }}>
                    {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                    <TaskStatusBadge
                      status={task.status}
                      rejectionReason={task.rejection_reason}
                      size="sm"
                    />

                    <Stack style={{ position: 'relative' }}>
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateTaskStatus?.(task.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: 12,
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-background)',
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="needs_info">Needs Info</option>
                        <option value="awaiting_response">
                          Awaiting Response
                        </option>
                        <option value="completed">Completed</option>
                        <option value="escalated">Escalated</option>
                      </select>
                    </Stack>
                  </Stack>
                </Row>
              </Card>
            );
          })}
        </Stack>

        {displayedTasks.length === 0 && (
          <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <Clock size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
            <Text muted>No {activeTab} tasks</Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
