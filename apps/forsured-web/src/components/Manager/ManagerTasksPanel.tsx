import { useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
import { Task } from '../../types';
import { formatDate, isOverdue } from '../../utils/dateHelpers';
import TaskDetailModal from './TaskDetailModal';

interface ManagerTasksPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export default function ManagerTasksPanel({
  tasks,
  onUpdateTask,
}: ManagerTasksPanelProps) {
  const [activeView, setActiveView] = useState<
    'action_required' | 'delegated' | 'completed'
  >('action_required');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actionRequiredTasks = tasks.filter(
    (t) =>
      (t.status === 'pending' || t.status === 'in_progress') &&
      t.target_role === 'manager'
  );

  const delegatedTasks = tasks.filter(
    (t) =>
      t.origin_role === 'manager' &&
      t.target_role !== 'manager' &&
      t.status !== 'completed' &&
      t.status !== 'cancelled'
  );

  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const getDisplayTasks = () => {
    switch (activeView) {
      case 'action_required':
        return actionRequiredTasks;
      case 'delegated':
        return delegatedTasks;
      case 'completed':
        return completedTasks;
    }
  };

  const getPriorityBadgeProps = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'urgent':
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-10)' };
      case 'high':
        return { backgroundColor: 'var(--color-orange-2)', color: 'var(--color-orange-10)' };
      default:
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
    }
  };

  const displayTasks = getDisplayTasks();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    onUpdateTask?.(taskId, updates);
  };

  return (
    <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <Stack style={{ padding: 24, borderBottom: '1px solid var(--color-border)' }}>
        <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Task Management
        </H2>

        <Row gap={8}>
          <div
            onClick={() => setActiveView('action_required')}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 12,
              backgroundColor: activeView === 'action_required' ? 'var(--color-blue-10)' : 'transparent',
              color: activeView === 'action_required' ? 'white' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Action Required ({actionRequiredTasks.length})
          </div>
          <div
            onClick={() => setActiveView('delegated')}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 12,
              backgroundColor: activeView === 'delegated' ? 'var(--color-blue-10)' : 'transparent',
              color: activeView === 'delegated' ? 'white' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Delegated ({delegatedTasks.length})
          </div>
          <div
            onClick={() => setActiveView('completed')}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 12,
              backgroundColor: activeView === 'completed' ? 'var(--color-blue-10)' : 'transparent',
              color: activeView === 'completed' ? 'white' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Completed ({completedTasks.length})
          </div>
        </Row>
      </Stack>

      <Stack style={{ overflowX: 'auto' }}>
        {displayTasks.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-gray-2)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Task
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Priority
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Type
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Assigned To
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Due Date
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--color-border)' }}>
              {displayTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                >
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <Stack>
                      <Text size="sm" weight="medium">
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text size="xs" muted style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </Text>
                      )}
                    </Stack>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <span
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        ...getPriorityBadgeProps(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <Text size="sm" style={{ textTransform: 'capitalize' }}>
                      {task.task_type || 'General'}
                    </Text>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <Row alignItems="center" gap={8}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-blue-10)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
                          {task.assigned_to
                            ? task.assigned_to.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                            : 'UN'}
                        </span>
                      </div>
                      <Text size="sm">
                        {task.assigned_to
                          ? task.assigned_to.name
                          : 'Unassigned'}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    {task.due_date && (
                      <Row alignItems="center" gap={6}>
                        <Clock size={14} color={isOverdue(task.due_date) ? 'var(--color-red-10)' : 'var(--color-text-muted)'} />
                        <Text
                          size="sm"
                          style={{
                            color: isOverdue(task.due_date) ? 'var(--color-red-10)' : undefined,
                            fontWeight: isOverdue(task.due_date) ? 500 : undefined,
                          }}
                        >
                          {formatDate(task.due_date)}
                        </Text>
                      </Row>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <span
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor:
                          task.status === 'completed'
                            ? 'var(--color-green-2)'
                            : task.status === 'in_progress'
                              ? 'var(--color-blue-2)'
                              : 'var(--color-gray-2)',
                        color:
                          task.status === 'completed'
                            ? 'var(--color-green-10)'
                            : task.status === 'in_progress'
                              ? 'var(--color-blue-10)'
                              : 'var(--color-text-muted)',
                      }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Stack alignItems="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <CheckCircle
              color="var(--color-text-muted)"
              size={48}
              style={{ marginBottom: 12 }}
            />
            <Text muted>
              No {activeView.replace('_', ' ')} tasks
            </Text>
          </Stack>
        )}
      </Stack>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateTask={handleUpdateTask}
        availableUsers={[
          { id: 'user-manager-1', name: 'Steve Massei', role: 'Manager' },
          { id: 'user-sub-1', name: 'Chris Cutler', role: 'Subcontractor' },
          { id: 'user-sub-2', name: 'Gale Baldwin', role: 'Subcontractor' },
          { id: 'user-sub-3', name: 'Troy Sprague', role: 'Subcontractor' },
        ]}
      />
    </Card>
  );
}
