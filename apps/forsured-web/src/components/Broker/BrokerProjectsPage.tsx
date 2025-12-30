import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Filter, Eye, Shield, Calendar } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, Card, Label } from '@unicornlove/ui';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import ProjectCard from '../Shared/ProjectCard';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');

  const filteredProjects = projects.filter((project) => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;
    if (clientFilter !== 'all' && project.client_id !== clientFilter)
      return false;
    if (
      complianceFilter !== 'all' &&
      project.compliance_status !== complianceFilter
    )
      return false;
    return true;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Client';
  };

  const getProjectStats = () => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      compliant: projects.filter((p) => p.compliance_status === 'compliant')
        .length,
      needsAttention: projects.filter(
        (p) =>
          p.compliance_status === 'critical' ||
          p.compliance_status === 'warning'
      ).length,
    };
  };

  const stats = getProjectStats();

  if (projectsLoading || clientsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <YStack gap="$6">
      <YStack>
        <H1 fontSize="$8" fontWeight="bold" color="$color12">Projects</H1>
        <Text color="$color11">
          Manage all client projects and monitor compliance
        </Text>
      </YStack>

      <XStack
        flexDirection="column"
        $gtMd={{ flexDirection: 'row' }}
        gap="$6"
        flexWrap="wrap"
      >
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Total Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" mt="$1">
                {stats.total}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Building color="$blue10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Active Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" mt="$1">
                {stats.active}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Eye color="$blue10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Compliant</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" mt="$1">
                {stats.compliant}
              </Text>
            </YStack>
            <YStack backgroundColor="$green3" padding="$3" borderRadius="$4">
              <Shield color="$green10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="20%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Needs Attention</Text>
              <Text fontSize="$9" fontWeight="bold" color="$yellow10" mt="$1">
                {stats.needsAttention}
              </Text>
            </YStack>
            <YStack backgroundColor="$yellow3" padding="$3" borderRadius="$4">
              <Calendar color="$yellow10" size={24} />
            </YStack>
          </XStack>
        </Card>
      </XStack>

      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <XStack alignItems="center" justifyContent="space-between" mb="$6">
          <XStack alignItems="center" gap="$2">
            <Filter size={20} color="$color11" />
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Filter Projects
            </H2>
          </XStack>
          <XStack
            as="button"
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            color="$color11"
            hoverStyle={{ color: '$color12' }}
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            onClick={() => {
              setStatusFilter('all');
              setClientFilter('all');
              setComplianceFilter('all');
            }}
          >
            <Text fontSize="$3" fontWeight="500" color="$color11">Clear Filters</Text>
          </XStack>
        </XStack>

        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          gap="$4"
          flexWrap="wrap"
        >
          <YStack flex={1} minWidth="30%">
            <Label fontSize="$3" fontWeight="500" color="$color11" mb="$2">
              Status
            </Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Label fontSize="$3" fontWeight="500" color="$color11" mb="$2">
              Client
            </Label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Label fontSize="$3" fontWeight="500" color="$color11" mb="$2">
              Compliance
            </Label>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--borderColor)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Compliance Levels</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </YStack>
        </XStack>
      </Card>

      <XStack
        flexDirection="column"
        $gtLg={{ flexDirection: 'row' }}
        gap="$6"
        flexWrap="wrap"
      >
        {filteredProjects.map((project) => (
          <YStack key={project.id} position="relative" flex={1} minWidth="45%">
            <YStack
              position="absolute"
              top="$4"
              left="$4"
              zIndex={10}
            >
              <YStack
                backgroundColor="$background"
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius={9999}
                borderWidth={1}
                borderColor="$borderColor"
                elevation={1}
              >
                <Text fontSize="$1" fontWeight="500" color="$color11">
                  {getClientName(project.client_id)}
                </Text>
              </YStack>
            </YStack>
            <YStack paddingTop="$8">
              <ProjectCard
                project={project}
                userRole="broker"
                showActions={false}
                onClick={() => navigate(`/broker/projects/${project.id}`)}
              />
            </YStack>
          </YStack>
        ))}
      </XStack>

      {filteredProjects.length === 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$12"
        >
          <YStack alignItems="center">
            <Building color="$color10" size={48} mb="$4" />
            <Text color="$color12" fontWeight="500" mb="$2">
              No projects found
            </Text>
            <Text fontSize="$3" color="$color11">
              Try adjusting your filters
            </Text>
          </YStack>
        </Card>
      )}
    </YStack>
  );
}
