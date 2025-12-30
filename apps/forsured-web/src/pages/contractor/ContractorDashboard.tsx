/**
 * ContractorDashboard - Contractor dashboard page using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { LayoutDashboard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { EmptyState } from '@unicornlove/ui';

// Mock tasks for testing
const mockTasks = [
  {
    id: 'task-1',
    title: 'Upload COI for Downtown Tower Project',
    project: 'Downtown Tower',
    dueDate: '2024-02-15',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Submit W-9 Form',
    project: 'Harbor View Complex',
    dueDate: '2024-02-20',
    status: 'in_progress',
    priority: 'medium',
  },
];

function ContractorDashboard() {
  const handleViewProjects = () => {
    console.log('Navigate to projects page');
  };

  // Active contractor test user has tasks
  const hasActiveProjects = mockTasks.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="currentColor" />;
      case 'in_progress':
        return <Clock size={16} color="currentColor" />;
      default:
        return <AlertCircle size={16} color="currentColor" />;
    }
  };

  const getPriorityVariant = (priority: string): 'error' | 'warning' | 'default' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'default';
  };

  return (
    <YStack gap="$6">
      <Text fontSize="$8" fontWeight="700" marginBottom="$6">
        Contractor Dashboard
      </Text>
      {!hasActiveProjects ? (
        <EmptyState
          icon={<LayoutDashboard size={48} />}
          title="No Active Projects"
          description="You are not currently assigned to any active projects. New projects will appear here."
          primaryAction={{ label: 'View All Projects', onClick: handleViewProjects }}
          helpLinks={[
            { label: 'How to Get Project Invites', href: '#' },
          ]}
        />
      ) : (
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="600">
            Pending Tasks
          </Text>
          <YStack gap="$4">
            {mockTasks.map((task) => (
              <Card
                key={task.id}
                data-testid="task-card"
                padding="$4"
                hoverStyle={{ shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
              >
                <XStack alignItems="flex-start" justifyContent="space-between">
                  <YStack flex={1} gap="$1">
                    <XStack alignItems="center" gap="$2" marginBottom="$1">
                      {getStatusIcon(task.status)}
                      <Text fontWeight="500">{task.title}</Text>
                    </XStack>
                    <Text fontSize="$2" color="$color10">
                      Project: {task.project}
                    </Text>
                    <Text fontSize="$2" color="$color9">
                      Due: {task.dueDate}
                    </Text>
                  </YStack>
                  <Badge variant={getPriorityVariant(task.priority)} size="$2">
                    {task.priority}
                  </Badge>
                </XStack>
              </Card>
            ))}
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}

export default ContractorDashboard;
