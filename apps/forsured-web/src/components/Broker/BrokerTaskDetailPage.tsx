import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card } from '@unicornlove/ui';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { users, loading: usersLoading } = useUsers();
  const [isUpdating, setIsUpdating] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const project = projects.find((p) => p.id === task?.project_id);
  const assignee = users.find((u) => u.id === task?.assigned_to);

  const isLoading = tasksLoading || projectsLoading || usersLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!task) {
    return (
      <YStack gap="$6">
        <XStack
          alignItems="center"
          gap="$2"
          cursor="pointer"
          onClick={() => navigate(-1)}
          hoverStyle={{ opacity: 0.7 }}
        >
          <ArrowLeft size={20} color="$color11" />
          <Text color="$color11">Back</Text>
        </XStack>
        <Card
          paddingVertical="$12"
          paddingHorizontal="$6"
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          alignItems="center"
        >
          <AlertCircle color="$red10" size={64} marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
            Task Not Found
          </H3>
          <Text color="$color11">
            The task you're looking for doesn't exist or has been deleted.
          </Text>
        </Card>
      </YStack>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { color: '$red10', backgroundColor: '$red2', borderColor: '$red6' };
      case 'high':
        return { color: '$yellow10', backgroundColor: '$yellow2', borderColor: '$yellow6' };
      case 'medium':
        return { color: '$blue10', backgroundColor: '$blue2', borderColor: '$blue6' };
      case 'low':
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray6' };
      default:
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray6' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: '$blue10', backgroundColor: '$blue2' };
      case 'in_progress':
        return { color: '$blue10', backgroundColor: '$blue2' };
      case 'overdue':
        return { color: '$red10', backgroundColor: '$red2' };
      case 'completed':
        return { color: '$green10', backgroundColor: '$green2' };
      default:
        return { color: '$color10', backgroundColor: '$gray2' };
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateTask(task.id, { status: newStatus as Task['status'] });
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityColors = getPriorityColor(task.priority);
  const statusColors = getStatusColor(task.status);

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack
          alignItems="center"
          gap="$2"
          cursor="pointer"
          onClick={() => navigate(-1)}
          hoverStyle={{ opacity: 0.7 }}
        >
          <ArrowLeft size={20} color="$color11" />
          <Text color="$color11">Back to Tasks</Text>
        </XStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="outline" size="sm">
            <Paperclip size={16} marginRight="$2" />
            Attachments
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare size={16} marginRight="$2" />
            Comments
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        </XStack>
      </XStack>

      <XStack
        flexDirection="column"
        $gtLg={{ flexDirection: 'row' }}
        gap="$6"
      >
        <YStack flex={1} $gtLg={{ flex: 2 }} gap="$6">
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={1}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$4">
              <YStack flex={1}>
                <XStack alignItems="center" gap="$3" marginBottom="$3">
                  <XStack
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    fontSize="$3"
                    fontWeight="500"
                    borderRadius="$2"
                    borderWidth={1}
                    {...priorityColors}
                  >
                    <Text fontSize="$3" fontWeight="500" color={priorityColors.color}>
                      {task.priority?.toUpperCase()}
                    </Text>
                  </XStack>
                  <XStack
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    fontSize="$3"
                    fontWeight="500"
                    borderRadius="$2"
                    {...statusColors}
                  >
                    <Text fontSize="$3" fontWeight="500" color={statusColors.color}>
                      {task.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </XStack>
                </XStack>
                <H1 fontSize="$8" fontWeight="bold" color="$color12" marginBottom="$2">
                  {task.title}
                </H1>
              </YStack>
            </XStack>

            <Text fontSize="$3" color="$color11" maxWidth="none">
              {task.description || 'No description provided.'}
            </Text>
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={1}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
              Activity
            </H2>
            <YStack alignItems="center" paddingVertical="$8">
              <Clock size={32} color="$color11" marginBottom="$2" opacity={0.5} />
              <Text color="$color11">No activity recorded yet</Text>
            </YStack>
          </Card>
        </YStack>

        <YStack gap="$6" flex={1}>
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={1}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
              Details
            </H2>
            <YStack gap="$4">
              <YStack>
                <Text fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" marginBottom="$1">
                  Project
                </Text>
                <XStack alignItems="center" gap="$2" color="$color12">
                  <Building size={16} color="$color10" />
                  <Text color="$color12">{project?.name ?? 'Not assigned'}</Text>
                </XStack>
              </YStack>

              <YStack>
                <Text fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" marginBottom="$1">
                  Assigned To
                </Text>
                <XStack alignItems="center" gap="$2" color="$color12">
                  <User size={16} color="$color10" />
                  <Text color="$color12">{assignee?.name ?? 'Unassigned'}</Text>
                </XStack>
              </YStack>

              <YStack>
                <Text fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" marginBottom="$1">
                  Due Date
                </Text>
                <XStack alignItems="center" gap="$2" color="$color12">
                  <Calendar size={16} color="$color10" />
                  <Text color="$color12">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : 'No due date'}
                  </Text>
                </XStack>
              </YStack>

              <YStack>
                <Text fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" marginBottom="$1">
                  Created
                </Text>
                <Text color="$color12">
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={1}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
              Actions
            </H2>
            <YStack gap="$2">
              {task.status !== 'completed' && (
                <Button
                  variant="primary"
                  width="100%"
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                >
                  <CheckCircle size={16} marginRight="$2" />
                  Mark Complete
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  variant="outline"
                  width="100%"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                >
                  <Clock size={16} marginRight="$2" />
                  Start Task
                </Button>
              )}
              {task.status === 'completed' && (
                <Button
                  variant="outline"
                  width="100%"
                  onClick={() => handleStatusChange('pending')}
                  disabled={isUpdating}
                >
                  Reopen Task
                </Button>
              )}
            </YStack>
          </Card>
        </YStack>
      </XStack>
    </YStack>
  );
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date?: string;
  created_at?: string;
  project_id?: string;
  assigned_to?: string;
}
