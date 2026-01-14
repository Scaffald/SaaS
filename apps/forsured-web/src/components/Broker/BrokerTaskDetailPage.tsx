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
import { Stack, Row, Text, H1, H2, H3, Card } from '@unicornlove/beyond-ui';
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
      <Stack gap={24}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <Card
          style={{
            padding: '48px 24px',
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <Stack alignItems="center">
            <AlertCircle color="var(--color-red-10)" size={64} style={{ marginBottom: 16 }} />
            <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Task Not Found
            </H3>
            <Text muted>
              The task you're looking for doesn't exist or has been deleted.
            </Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  const getPriorityStyle = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'critical':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-6)' };
      case 'high':
        return { color: 'var(--color-yellow-10)', backgroundColor: 'var(--color-yellow-2)', borderColor: 'var(--color-yellow-6)' };
      case 'medium':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-6)' };
      case 'low':
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-6)' };
      default:
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-6)' };
    }
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'pending':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' };
      case 'in_progress':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)' };
      case 'overdue':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)' };
      case 'completed':
        return { color: 'var(--color-green-10)', backgroundColor: 'var(--color-green-2)' };
      default:
        return { color: 'var(--color-text)', backgroundColor: 'var(--color-gray-2)' };
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

  const priorityStyle = getPriorityStyle(task.priority);
  const statusStyle = getStatusStyle(task.status);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 24,
  };

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          <ArrowLeft size={20} />
          <span>Back to Tasks</span>
        </button>
        <Row alignItems="center" gap={12}>
          <Button variant="outlined" size="sm">
            <Row alignItems="center" gap={8}>
              <Paperclip size={16} />
              <span>Attachments</span>
            </Row>
          </Button>
          <Button variant="outlined" size="sm">
            <Row alignItems="center" gap={8}>
              <MessageSquare size={16} />
              <span>Comments</span>
            </Row>
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        </Row>
      </Row>

      <Row gap={24} style={{ flexWrap: 'wrap' }}>
        <Stack style={{ flex: 2, minWidth: '60%' }} gap={24}>
          <Card style={cardStyle}>
            <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 16 }}>
              <Stack style={{ flex: 1 }}>
                <Row alignItems="center" gap={12} style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 14,
                      fontWeight: 500,
                      borderRadius: 4,
                      border: `1px solid ${priorityStyle.borderColor}`,
                      backgroundColor: priorityStyle.backgroundColor,
                      color: priorityStyle.color,
                    }}
                  >
                    {task.priority?.toUpperCase()}
                  </span>
                  <span
                    style={{
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 14,
                      fontWeight: 500,
                      borderRadius: 4,
                      backgroundColor: statusStyle.backgroundColor,
                      color: statusStyle.color,
                    }}
                  >
                    {task.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </Row>
                <H1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  {task.title}
                </H1>
              </Stack>
            </Row>

            <Text size="sm" muted>
              {task.description || 'No description provided.'}
            </Text>
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Activity
            </H2>
            <Stack alignItems="center" style={{ padding: '32px 0' }}>
              <Clock size={32} color="var(--color-text-muted)" style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text muted>No activity recorded yet</Text>
            </Stack>
          </Card>
        </Stack>

        <Stack gap={24} style={{ flex: 1, minWidth: '30%' }}>
          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Details
            </H2>
            <Stack gap={16}>
              <Stack>
                <Text size="xs" weight="medium" muted style={{ textTransform: 'uppercase', marginBottom: 4 }}>
                  Project
                </Text>
                <Row alignItems="center" gap={8}>
                  <Building size={16} color="var(--color-text-muted)" />
                  <Text>{project?.name ?? 'Not assigned'}</Text>
                </Row>
              </Stack>

              <Stack>
                <Text size="xs" weight="medium" muted style={{ textTransform: 'uppercase', marginBottom: 4 }}>
                  Assigned To
                </Text>
                <Row alignItems="center" gap={8}>
                  <User size={16} color="var(--color-text-muted)" />
                  <Text>{assignee?.name ?? 'Unassigned'}</Text>
                </Row>
              </Stack>

              <Stack>
                <Text size="xs" weight="medium" muted style={{ textTransform: 'uppercase', marginBottom: 4 }}>
                  Due Date
                </Text>
                <Row alignItems="center" gap={8}>
                  <Calendar size={16} color="var(--color-text-muted)" />
                  <Text>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : 'No due date'}
                  </Text>
                </Row>
              </Stack>

              <Stack>
                <Text size="xs" weight="medium" muted style={{ textTransform: 'uppercase', marginBottom: 4 }}>
                  Created
                </Text>
                <Text>
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </Stack>
            </Stack>
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Actions
            </H2>
            <Stack gap={8}>
              {task.status !== 'completed' && (
                <Button
                  variant="primary"
                  onPress={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                  style={{ width: '100%' }}
                >
                  <Row alignItems="center" gap={8}>
                    <CheckCircle size={16} />
                    <span>Mark Complete</span>
                  </Row>
                </Button>
              )}
              {task.status === 'pending' && (
                <Button
                  variant="outlined"
                  onPress={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                  style={{ width: '100%' }}
                >
                  <Row alignItems="center" gap={8}>
                    <Clock size={16} />
                    <span>Start Task</span>
                  </Row>
                </Button>
              )}
              {task.status === 'completed' && (
                <Button
                  variant="outlined"
                  onPress={() => handleStatusChange('pending')}
                  disabled={isUpdating}
                  style={{ width: '100%' }}
                >
                  Reopen Task
                </Button>
              )}
            </Stack>
          </Card>
        </Stack>
      </Row>
    </Stack>
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
