import { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Calendar,
  User,
  FileText,
  Building2,
  Plus,
} from 'lucide-react';
import { Stack, Row, Text, H2, Card, Button, useAnnouncer, ButtonGroup, SearchSelect, Chip } from '@unicornlove/beyond-ui'
import type { SearchSelectOption } from '@unicornlove/beyond-ui';
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

// Map status values to human-readable labels for announcements
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_info: 'Needs Info',
  awaiting_response: 'Awaiting Response',
  completed: 'Completed',
  escalated: 'Escalated',
  cancelled: 'Cancelled',
};

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

  // Screen reader announcements for dynamic content
  const { announce } = useAnnouncer();

  // Wrap status update to announce changes to screen readers
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: string, taskTitle: string) => {
      onUpdateTaskStatus?.(taskId, newStatus);
      // Announce the status change to screen readers
      const statusLabel = STATUS_LABELS[newStatus] || newStatus;
      announce(`Task "${taskTitle}" status changed to ${statusLabel}`);
    },
    [onUpdateTaskStatus, announce]
  );

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

  // Tab items for ButtonGroup
  const tabItems = [
    { id: 'urgent', label: `Urgent (${urgentTasks.length})` },
    { id: 'upcoming', label: `Upcoming (${upcomingTasks.length})` },
  ];

  // Status options for SearchSelect
  const statusOptions: SearchSelectOption[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'needs_info', label: 'Needs Info' },
    { value: 'awaiting_response', label: 'Awaiting Response' },
    { value: 'completed', label: 'Completed' },
    { value: 'escalated', label: 'Escalated' },
  ];

  const getPriorityChipProps = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { type: 'default' as const, style: { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)', borderColor: 'var(--color-red-6)' } };
      case 'high':
        return { type: 'default' as const, style: { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)', borderColor: 'var(--color-yellow-6)' } };
      case 'normal':
        return { type: 'default' as const, style: { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-11)', borderColor: 'var(--color-blue-6)' } };
      default:
        return { type: 'default' as const, style: { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)', borderColor: 'var(--color-gray-6)' } };
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


  return (
    <Card padding="xl">
      <Stack style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 24, marginBottom: 0 }}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Stack>
            <H2>{headerText.title}</H2>
            <Text size="sm" muted>
              {headerText.subtitle}
            </Text>
          </Stack>
          <Button color="primary" iconStart={Plus} onPress={onCreateTask} style={{ marginLeft: 'auto' }}>
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

        <ButtonGroup
          items={tabItems}
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'urgent' | 'upcoming')}
          size="sm"
          style={{ alignSelf: 'flex-start' }}
        />
      </Stack>

      <Stack id="task-list" role="tabpanel" style={{ paddingTop: 24, marginTop: 0 }}>
        <Stack gap={16}>
          {displayedTasks.map((task) => {
            return (
              <Card
                key={task.id}
                padding="md"
                style={{
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                <div
                  onClick={() => onTaskClick?.(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTaskClick?.(task);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                <Row alignItems="flex-start" justifyContent="space-between">
                  <Stack style={{ flex: 1 }}>
                    <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                      <Chip {...getPriorityChipProps(task.priority)}>
                        {task.priority}
                      </Chip>
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
                      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 8 }}>
                        <Button
                          variant="text"
                          size="sm"
                          onPress={() => {
                            window.open(task.document_link, '_blank', 'noopener,noreferrer')
                          }}
                          iconStart={FileText}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </Stack>

                  <Stack alignItems="flex-end" gap={8} style={{ marginLeft: 16 }}>
                    {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                    <TaskStatusBadge
                      status={task.status}
                      rejectionReason={task.rejection_reason}
                      size="sm"
                    />

                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                      <SearchSelect
                        options={statusOptions}
                        value={task.status}
                        onChange={(value) => {
                          handleStatusChange(task.id, value as string, task.title);
                        }}
                        size="sm"
                        searchable={false}
                        placeholder="Status"
                        style={{ minWidth: 120 }}
                      />
                    </div>
                  </Stack>
                </Row>
                </div>
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
