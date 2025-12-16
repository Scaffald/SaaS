import { useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card, Circle } from '@unicornlove/ui';
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

  const getPriorityBadgeProps = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { backgroundColor: '$red2', color: '$red10' };
      case 'high':
        return { backgroundColor: '$orange2', color: '$orange10' };
      default:
        return { backgroundColor: '$blue2', color: '$blue10' };
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
    <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" elevation={1}>
      <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
          Task Management
        </H2>

        <XStack gap="$2">
          <XStack
            onPress={() => setActiveView('action_required')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={activeView === 'action_required' ? '$blue10' : 'transparent'}
            color={activeView === 'action_required' ? 'white' : '$color11'}
            hoverStyle={{ backgroundColor: activeView === 'action_required' ? '$blue11' : '$backgroundHover' }}
            cursor="pointer"
          >
            <Text fontSize="$3" fontWeight="500" color={activeView === 'action_required' ? 'white' : '$color11'}>
              Action Required ({actionRequiredTasks.length})
            </Text>
          </XStack>
          <XStack
            onPress={() => setActiveView('delegated')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={activeView === 'delegated' ? '$blue10' : 'transparent'}
            color={activeView === 'delegated' ? 'white' : '$color11'}
            hoverStyle={{ backgroundColor: activeView === 'delegated' ? '$blue11' : '$backgroundHover' }}
            cursor="pointer"
          >
            <Text fontSize="$3" fontWeight="500" color={activeView === 'delegated' ? 'white' : '$color11'}>
              Delegated ({delegatedTasks.length})
            </Text>
          </XStack>
          <XStack
            onPress={() => setActiveView('completed')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={activeView === 'completed' ? '$blue10' : 'transparent'}
            color={activeView === 'completed' ? 'white' : '$color11'}
            hoverStyle={{ backgroundColor: activeView === 'completed' ? '$blue11' : '$backgroundHover' }}
            cursor="pointer"
          >
            <Text fontSize="$3" fontWeight="500" color={activeView === 'completed' ? 'white' : '$color11'}>
              Completed ({completedTasks.length})
            </Text>
          </XStack>
        </XStack>
      </YStack>

      <YStack overflowX="auto">
        {displayTasks.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--background-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-11)',
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
                  color: 'var(--color-11)',
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
                  color: 'var(--color-11)',
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
                  color: 'var(--color-11)',
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
                  color: 'var(--color-11)',
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
                  color: 'var(--color-11)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
              {displayTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }}
                >
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <YStack>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text fontSize="$1" color="$color11" numberOfLines={1} marginTop="$0.5">
                          {task.description}
                        </Text>
                      )}
                    </YStack>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <Text
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      fontSize="$1"
                      fontWeight="500"
                      {...getPriorityBadgeProps(task.priority)}
                    >
                      {task.priority}
                    </Text>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <Text fontSize="$3" color="$color12" textTransform="capitalize">
                      {task.task_type || 'General'}
                    </Text>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <XStack alignItems="center" gap="$2">
                      <Circle
                        size={28}
                        backgroundColor="$blue10"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="$1" fontWeight="600" color="white">
                          {task.assigned_to
                            ? task.assigned_to.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                            : 'UN'}
                        </Text>
                      </Circle>
                      <Text fontSize="$3" color="$color12">
                        {task.assigned_to
                          ? task.assigned_to.name
                          : 'Unassigned'}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    {task.due_date && (
                      <XStack
                        alignItems="center"
                        fontSize="$3"
                        color={isOverdue(task.due_date) ? '$red10' : '$color12'}
                        fontWeight={isOverdue(task.due_date) ? '500' : 'normal'}
                      >
                        <Clock size={14} marginRight="$1.5" />
                        <Text fontSize="$3" color={isOverdue(task.due_date) ? '$red10' : '$color12'} fontWeight={isOverdue(task.due_date) ? '500' : 'normal'}>
                          {formatDate(task.due_date)}
                        </Text>
                      </XStack>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <Text
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      fontSize="$1"
                      fontWeight="500"
                      backgroundColor={
                        task.status === 'completed'
                          ? '$green2'
                          : task.status === 'in_progress'
                            ? '$blue2'
                            : '$gray2'
                      }
                      color={
                        task.status === 'completed'
                          ? '$green10'
                          : task.status === 'in_progress'
                            ? '$blue10'
                            : '$gray10'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <YStack alignItems="center" paddingVertical="$12">
            <CheckCircle
              color="$color10"
              size={48}
              marginBottom="$3"
            />
            <Text color="$color11">
              No {activeView.replace('_', ' ')} tasks
            </Text>
          </YStack>
        )}
      </YStack>

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
