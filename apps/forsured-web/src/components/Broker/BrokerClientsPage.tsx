import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, AlertTriangle, Shield, Users } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, Card } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import { useCompliance } from '../../hooks/useCompliance';
import ClientsTable from './ClientsTable';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { BrokerClient } from '../../types';

export default function BrokerClientsPage() {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();
  const { complianceData, loading: complianceLoading } = useCompliance();

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const highRiskClients = clients.filter(
      (c) => c.risk_level === 'high'
    ).length;
    const avgComplianceScore =
      clients.reduce((acc, c) => acc + c.compliance_score, 0) /
      (totalClients || 1);

    return {
      total: totalClients,
      active: activeClients,
      highRisk: highRiskClients,
      avgCompliance: Math.round(avgComplianceScore),
    };
  };

  const stats = getClientStats();

  if (clientsLoading || policiesLoading || projectsLoading || complianceLoading) {
    return <DashboardSkeleton />;
  }

  // Show empty state when no clients exist
  if (clients.length === 0) {
    return (
      <YStack gap="$6">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">Clients</H1>
          <Text color="$color11">
            Manage your client portfolio and monitor compliance
          </Text>
        </YStack>
        <EmptyState
          icon={Users}
          title="No Clients Yet"
          description="Start building your client portfolio by adding your first client. You'll be able to manage their policies, track compliance, and monitor risk."
          action={{
            label: 'Add Client',
            onClick: () => navigate('/broker/clients/new'),
          }}
        />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <YStack>
        <H1 fontSize="$8" fontWeight="bold" color="$color12">Clients</H1>
        <Text color="$color11">
          Manage your client portfolio and monitor compliance
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
              <Text color="$color11" fontSize="$3">Total Clients</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" marginTop="$1">
                {stats.total}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Briefcase color="$blue10" size={24} />
            </YStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$color11">
            {stats.active} active accounts
          </Text>
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
              <Text color="$color11" fontSize="$3">Avg Compliance</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" marginTop="$1">
                {stats.avgCompliance}%
              </Text>
            </YStack>
            <YStack backgroundColor="$green3" padding="$3" borderRadius="$4">
              <Shield color="$green10" size={24} />
            </YStack>
          </XStack>
          <XStack marginTop="$3" fontSize="$3" color="$green10" alignItems="center">
            <TrendingUp size={14} marginRight="$1" color="$green10" />
            <Text fontSize="$3" color="$green10">Above target</Text>
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
              <Text color="$color11" fontSize="$3">High Risk</Text>
              <Text fontSize="$9" fontWeight="bold" color="$red10" marginTop="$1">
                {stats.highRisk}
              </Text>
            </YStack>
            <YStack backgroundColor="$red3" padding="$3" borderRadius="$4">
              <AlertTriangle color="$red10" size={24} />
            </YStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$color11">
            Require attention
          </Text>
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
              <Text fontSize="$9" fontWeight="bold" color="$blue10" marginTop="$1">
                {projects.filter((p) => p.status === 'active').length}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Briefcase color="$blue10" size={24} />
            </YStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$color11">
            Across all clients
          </Text>
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
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
          Client Overview
        </H2>
        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          gap="$6"
          flexWrap="wrap"
        >
          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" marginBottom="$2">By Type</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">
                  General Contractors
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {
                    clients.filter(
                      (c) => c.client_type === 'general_contractor'
                    ).length
                  }
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">
                  Subcontractors
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {
                    clients.filter((c) => c.client_type === 'subcontractor')
                      .length
                  }
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" marginBottom="$2">By Risk Level</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$green10">Low Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'low').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$yellow10">Medium Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'medium').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$red10">High Risk</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {clients.filter((c) => c.risk_level === 'high').length}
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <YStack flex={1} minWidth="30%">
            <Text fontSize="$3" color="$color11" marginBottom="$2">Active Policies</Text>
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$color12">Total Active</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {policies.filter((p) => p.status === 'active').length}
                </Text>
              </XStack>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize="$3" color="$yellow10">Expiring Soon</Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {policies.filter((p) => p.status === 'expiring').length}
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </XStack>
      </Card>

      <ClientsTable
        clients={clients}
        policies={policies}
        gcOnly={true}
        complianceData={complianceData}
        projects={projects}
        onClientClick={(client: BrokerClient) => {
          // Navigate to GC profile for general contractors, client profile for others
          if (client.client_type === 'general_contractor') {
            navigate(`/broker/gcs/${client.id}`);
          } else {
            navigate(`/broker/clients/${client.id}`);
          }
        }}
      />
    </YStack>
  );
}
