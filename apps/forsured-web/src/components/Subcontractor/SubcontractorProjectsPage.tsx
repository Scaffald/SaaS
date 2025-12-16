import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { YStack, XStack, Text, Card, Button } from '@unicornlove/ui';
import ProjectCard from '../Shared/ProjectCard';

export default function SubcontractorProjectsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const mockProjects = [
    {
      id: '1',
      name: 'Downtown Office Complex',
      description: 'Electrical work for 12-story office building',
      client_id: '1',
      status: 'active' as const,
      start_date: '2024-01-15T00:00:00.000Z',
      end_date: '2024-12-31T00:00:00.000Z',
      location: 'Downtown Seattle, WA',
      contract_value: '450000',
      project_manager: 'Sarah Johnson',
      compliance_status: 'compliant' as const,
      notes: 'Assigned to Phase 2 electrical installation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Harbor View Medical Center',
      description: 'HVAC systems installation for new medical facility',
      client_id: '2',
      status: 'active' as const,
      start_date: '2024-02-01T00:00:00.000Z',
      end_date: '2025-06-30T00:00:00.000Z',
      location: 'Tacoma, WA',
      contract_value: '680000',
      project_manager: 'Lisa Chen',
      compliance_status: 'warning' as const,
      notes: 'Insurance renewal required by next month',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Residential Development Phase 1',
      description: 'Plumbing work for 150-unit residential development',
      client_id: '1',
      status: 'active' as const,
      start_date: '2024-03-01T00:00:00.000Z',
      end_date: '2024-08-31T00:00:00.000Z',
      location: 'Bellevue, WA',
      contract_value: '320000',
      project_manager: 'Robert Kim',
      compliance_status: 'compliant' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Green Valley Elementary School',
      description: 'Electrical systems for new elementary school',
      client_id: '3',
      status: 'completed' as const,
      start_date: '2023-03-01T00:00:00.000Z',
      end_date: '2023-12-15T00:00:00.000Z',
      location: 'Olympia, WA',
      contract_value: '285000',
      project_manager: 'Amanda Rodriguez',
      compliance_status: 'compliant' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const filteredProjects = mockProjects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'active';
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter((p) => p.status === 'active').length,
    completed: mockProjects.filter((p) => p.status === 'completed').length,
    totalValue: mockProjects
      .filter((p) => p.status === 'active')
      .reduce((acc, p) => acc + parseInt(p.contract_value || '0'), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <YStack gap="$6">
      <YStack>
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          My Projects
        </Text>
        <Text color="$color11">
          Track your active and completed projects
        </Text>
      </YStack>

      <XStack
        flexWrap="wrap"
        gap="$6"
        $gtMd={{
          flexWrap: 'nowrap',
        }}
      >
        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Total Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" marginTop="$1">
                {stats.total}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Building color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Active Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" marginTop="$1">
                {stats.active}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Clock color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Completed</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" marginTop="$1">
                {stats.completed}
              </Text>
            </YStack>
            <Card backgroundColor="$green3" padding="$3" borderRadius="$4">
              <CheckCircle color="$green10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Active Value</Text>
              <Text fontSize="$8" fontWeight="bold" color="$color12" marginTop="$1">
                {formatCurrency(stats.totalValue)}
              </Text>
            </YStack>
            <Card backgroundColor="$gray3" padding="$3" borderRadius="$4">
              <Briefcase color="$gray10" size={24} />
            </Card>
          </XStack>
        </Card>
      </XStack>

      <Card elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
        <XStack alignItems="center" gap="$2">
          <Button
            onPress={() => setFilter('all')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'all' ? '$blue9' : '$gray3'}
            color={filter === 'all' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'all' ? '$blue9' : '$gray4',
            }}
          >
            All ({mockProjects.length})
          </Button>
          <Button
            onPress={() => setFilter('active')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'active' ? '$blue9' : '$gray3'}
            color={filter === 'active' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'active' ? '$blue9' : '$gray4',
            }}
          >
            Active ({stats.active})
          </Button>
          <Button
            onPress={() => setFilter('completed')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'completed' ? '$blue9' : '$gray3'}
            color={filter === 'completed' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'completed' ? '$blue9' : '$gray4',
            }}
          >
            Completed ({stats.completed})
          </Button>
        </XStack>
      </Card>

      <XStack
        flexWrap="wrap"
        gap="$6"
        $gtLg={{
          flexWrap: 'nowrap',
        }}
      >
        {filteredProjects.map((project) => (
          <YStack key={project.id} flex={1} minWidth="300px">
            <ProjectCard
              project={project}
              userRole="subcontractor"
              showActions={false}
              onClick={() => navigate(`/subcontractor/projects/${project.id}`)}
            />
          </YStack>
        ))}
      </XStack>

      {filteredProjects.length === 0 && (
        <Card elevation={1} borderWidth={1} borderColor="$borderColor" padding="$12">
          <YStack alignItems="center">
            <Building color="$color10" size={48} marginBottom="$4" />
            <Text color="$color12" fontWeight="500" marginBottom="$2">
              No projects found
            </Text>
            <Text color="$color11" fontSize="$2">
              Adjust your filters or wait for project invitations
            </Text>
          </YStack>
        </Card>
      )}
    </YStack>
  );
}
