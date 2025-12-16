import { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  User,
  FileText,
  Building2,
  Plus,
} from 'lucide-react';
import { YStack, XStack, Text, H2, Card, Button as TamaguiButton } from '@unicornlove/ui';
import { Task } from '../../types';
import { formatDate, getDaysUntil, isOverdue } from '../../utils/dateHelpers';
import Button from '../Common/Button';
import TaskStatusBadge from '../Common/TaskStatusBadge';
import { TaskViewToggle } from '../tasks/TaskViewToggle';
import { useTaskViewFilter, TaskViewType } from '../../hooks/useTaskViewFilter';

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' };
      case 'high':
        return { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' };
      case 'normal':
        return { backgroundColor: '$blue2', color: '$blue11', borderColor: '$blue6' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11', borderColor: '$gray6' };
    }
  };


  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;

    const daysLeft = getDaysUntil(dueDate);
    if (isOverdue(dueDate)) {
      return (
        <Text fontSize="$1" fontWeight="500" color="$red10">Overdue</Text>
      );
    } else if (daysLeft === 0) {
      return (
        <XStack
          alignItems="center"
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$2"
          fontSize="$1"
          fontWeight="500"
          backgroundColor="$red2"
          color="$red11"
          borderWidth={1}
          borderColor="$red6"
        >
          <Text fontSize="$1" fontWeight="500" color="$red11">Due Today</Text>
        </XStack>
      );
    } else if (daysLeft <= 3) {
      return (
        <XStack
          alignItems="center"
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$2"
          fontSize="$1"
          fontWeight="500"
          backgroundColor="$yellow2"
          color="$yellow11"
          borderWidth={1}
          borderColor="$yellow6"
        >
          <Text fontSize="$1" fontWeight="500" color="$yellow11">Due in {daysLeft}d</Text>
        </XStack>
      );
    }
    return (
      <Text fontSize="$1" color="$color11">{formatDate(dueDate)}</Text>
    );
  };

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <YStack>
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              {headerText.title}
            </H2>
            <Text fontSize="$3" color="$color11">
              {headerText.subtitle}
            </Text>
          </YStack>
          <Button
            onClick={onCreateTask}
          >
            <Plus size={18} />
            <Text marginLeft="$2">New Task</Text>
          </Button>
        </XStack>

        {/* REQ-268: View Toggle - My Inbox vs Assigned by Me */}
        <YStack marginBottom="$4">
          <TaskViewToggle
            currentView={currentView}
            onViewChange={setView}
            inboxCount={inboxCount}
            assignedByMeCount={assignedByMeCount}
          />
        </YStack>

        <XStack gap="$4">
          <TamaguiButton
            onPress={() => setActiveTab('urgent')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={activeTab === 'urgent' ? '$blue9' : 'transparent'}
            color={activeTab === 'urgent' ? 'white' : '$color11'}
            hoverStyle={{
              color: activeTab === 'urgent' ? 'white' : '$color12',
              backgroundColor: activeTab === 'urgent' ? '$blue9' : '$gray2',
            }}
          >
            Urgent ({urgentTasks.length})
          </TamaguiButton>
          <TamaguiButton
            onPress={() => setActiveTab('upcoming')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={activeTab === 'upcoming' ? '$blue9' : 'transparent'}
            color={activeTab === 'upcoming' ? 'white' : '$color11'}
            hoverStyle={{
              color: activeTab === 'upcoming' ? 'white' : '$color12',
              backgroundColor: activeTab === 'upcoming' ? '$blue9' : '$gray2',
            }}
          >
            Upcoming ({upcomingTasks.length})
          </TamaguiButton>
        </XStack>
      </YStack>

      <YStack padding="$6" id="task-list" role="tabpanel">
        <YStack gap="$4">
          {displayedTasks.map((task) => {
            const priorityColors = getPriorityColor(task.priority);
            return (
              <Card
                key={task.id}
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                padding="$4"
                hoverStyle={{ borderColor: '$blue9' }}
                cursor="pointer"
                onClick={() => onTaskClick?.(task)}
              >
                <XStack alignItems="flex-start" justifyContent="space-between">
                  <YStack flex={1}>
                    <XStack alignItems="center" gap="$2" marginBottom="$2">
                      <XStack
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        fontSize="$1"
                        fontWeight="500"
                        borderWidth={1}
                        {...priorityColors}
                      >
                        <Text fontSize="$1" fontWeight="500" color={priorityColors.color}>
                          {task.priority}
                        </Text>
                      </XStack>
                      {task.due_date && getDueDateBadge(task.due_date)}
                    </XStack>

                    <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$1">
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text fontSize="$3" color="$color11" marginBottom="$2">
                        {task.description}
                      </Text>
                    )}

                    <XStack
                      alignItems="center"
                      flexWrap="wrap"
                      gapHorizontal="$4"
                      gapVertical="$1"
                      fontSize="$1"
                      color="$color11"
                    >
                      {task.assigned_to && (
                        <XStack alignItems="center">
                          <User size={12} marginRight="$1" color="$color11" />
                          <Text fontSize="$1" color="$color11">{task.assigned_to.name}</Text>
                        </XStack>
                      )}
                      {task.client && (
                        <XStack alignItems="center">
                          <FileText size={12} marginRight="$1" color="$color11" />
                          <Text fontSize="$1" color="$color11">{task.client.company_name}</Text>
                        </XStack>
                      )}
                      {/* REQ-282 TASK-4: Display sub company context */}
                      {task.sub_company_name && (
                        <XStack alignItems="center">
                          <Building2 size={12} marginRight="$1" color="$blue10" />
                          <Text fontSize="$1" color="$blue10">{task.sub_company_name}</Text>
                        </XStack>
                      )}
                      {task.due_date && (
                        <XStack alignItems="center">
                          <Calendar size={12} marginRight="$1" color="$color11" />
                          <Text fontSize="$1" color="$color11">Due: {formatDate(task.due_date)}</Text>
                        </XStack>
                      )}
                    </XStack>

                    {task.document_link && (
                      <YStack marginTop="$2">
                        <XStack
                          as="a"
                          href={task.document_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          fontSize="$1"
                          color="$blue10"
                          hoverStyle={{ color: '$blue11' }}
                          alignItems="center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText size={12} marginRight="$1" color="$blue10" />
                          <Text fontSize="$1" color="$blue10">View Document</Text>
                        </XStack>
                      </YStack>
                    )}
                  </YStack>

                  <YStack alignItems="flex-end" gap="$2" marginLeft="$4">
                    {/* REQ-282: Use TaskStatusBadge with tooltip and rejection reason */}
                    <TaskStatusBadge
                      status={task.status}
                      rejectionReason={task.rejection_reason}
                      size="sm"
                    />

                    <YStack position="relative">
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateTaskStatus?.(task.id, e.target.value);
                        }}
                        style={{
                          fontSize: '12px',
                          border: '1px solid var(--borderColor)',
                          borderRadius: '4px',
                          padding: '4px 8px',
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
                    </YStack>
                  </YStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>

        {displayedTasks.length === 0 && (
          <YStack alignItems="center" paddingVertical="$12">
            <Clock color="$color10" size={48} marginBottom="$3" />
            <Text color="$color11">No {activeTab} tasks</Text>
          </YStack>
        )}
      </YStack>
    </Card>
  );
}
