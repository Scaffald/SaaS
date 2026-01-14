/**
 * ContractorDashboard - Contractor dashboard page using Beyond UI
 */
import React from 'react';
import { Stack, Row, Text, Card, Chip } from '@unicornlove/beyond-ui';
import { LayoutDashboard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';
import PageTransition from '../../components/Common/PageTransition';
import AnimatedList from '../../components/Common/AnimatedList';

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

  const getPriorityType = (priority: string): 'error' | 'warning' | 'default' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'default';
  };

  return (
    <PageTransition>
      <Stack style={{ gap: 'var(--space-6)' }}>
        <Text
          style={{
            fontSize: 'var(--font-size-8)',
            fontWeight: 700,
            marginBottom: 'var(--space-6)',
          }}
        >
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
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-5)',
                fontWeight: 600,
              }}
            >
              Pending Tasks
            </Text>
            <AnimatedList
              items={mockTasks}
              keyExtractor={(task) => task.id}
              gap={16}
            >
              {(task) => (
                <Card
                  data-testid="task-card"
                  style={{
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                  }}
                >
                  <Row
                    style={{
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack style={{ flex: 1, gap: 'var(--space-1)' }}>
                      <Row
                        style={{
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        {getStatusIcon(task.status)}
                        <Text style={{ fontWeight: 500 }}>{task.title}</Text>
                      </Row>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          color: 'var(--color-10)',
                        }}
                      >
                        Project: {task.project}
                      </Text>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          color: 'var(--color-9)',
                        }}
                      >
                        Due: {task.dueDate}
                      </Text>
                    </Stack>
                    <Chip type={getPriorityType(task.priority)} size="sm">
                      {task.priority}
                    </Chip>
                  </Row>
                </Card>
              )}
            </AnimatedList>
          </Stack>
        )}
      </Stack>
    </PageTransition>
  );
}

export default ContractorDashboard;
