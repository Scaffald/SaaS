import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H3, Card } from '@unicornlove/ui';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import { TabsCustom } from '@unicornlove/ui';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();

  const client = clients.find((c) => c.id === clientId);
  const clientPolicies = policies.filter((p) => p.client_id === clientId);
  const clientProjects = projects.filter((p) => p.client_id === clientId);

  const validTabs = ['overview', 'compliance', 'policies', 'projects', 'documents'];
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const isLoading = clientsLoading || policiesLoading || projectsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!client) {
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
          alignItems="center"
          paddingVertical="$12"
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <AlertTriangle color="$red10" size={64} mb="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            Client Not Found
          </H3>
          <Text color="$color11">
            The client you're looking for doesn't exist or has been deleted.
          </Text>
        </Card>
      </YStack>
    );
  }

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: { backgroundColor: '$green2', color: '$green11', borderColor: '$green6' },
      medium: { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' },
      high: { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' },
    };
    return styles[risk as keyof typeof styles] || styles.medium;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return '$green10';
    if (score >= 70) return '$yellow10';
    return '$red10';
  };

  const getComplianceBg = (score: number) => {
    if (score >= 90) return '$green9';
    if (score >= 70) return '$yellow9';
    return '$red9';
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Building,
      content: (
        <YStack gap="$6">
          <XStack
            flexDirection="column"
            $gtMd={{ flexDirection: 'row' }}
            $gtLg={{ flexDirection: 'row' }}
            gap="$4"
            flexWrap="wrap"
          >
            <Card backgroundColor="$gray2" borderRadius="$4" padding="$4" flex={1} minWidth="20%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <Shield color="$color10" size={18} />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Compliance Score
                </Text>
              </XStack>
              <Text fontSize="$8" fontWeight="bold" color={getComplianceColor(client.compliance_score)}>
                {client.compliance_score}%
              </Text>
            </Card>
            <Card backgroundColor="$gray2" borderRadius="$4" padding="$4" flex={1} minWidth="20%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <FileText color="$color10" size={18} />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Active Policies
                </Text>
              </XStack>
              <Text fontSize="$8" fontWeight="bold" color="$color12">
                {clientPolicies.filter((p) => p.status === 'active').length}
              </Text>
            </Card>
            <Card backgroundColor="$gray2" borderRadius="$4" padding="$4" flex={1} minWidth="20%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <Building color="$color10" size={18} />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Active Projects
                </Text>
              </XStack>
              <Text fontSize="$8" fontWeight="bold" color="$color12">
                {clientProjects.filter((p) => p.status === 'active').length}
              </Text>
            </Card>
            <Card backgroundColor="$gray2" borderRadius="$4" padding="$4" flex={1} minWidth="20%">
              <XStack alignItems="center" gap="$2" mb="$2">
                <TrendingUp color="$color10" size={18} />
                <Text fontSize="$3" fontWeight="500" color="$color11">
                  Risk Level
                </Text>
              </XStack>
              <XStack
                alignItems="center"
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius={9999}
                fontSize="$3"
                fontWeight="500"
                borderWidth={1}
                {...getRiskBadge(client.risk_level)}
              >
                <Text fontSize="$3" fontWeight="500" color={getRiskBadge(client.risk_level).color}>
                {client.risk_level.charAt(0).toUpperCase() + client.risk_level.slice(1)}
                </Text>
              </XStack>
            </Card>
          </XStack>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Contact Information
            </H3>
            <XStack
              flexDirection="column"
              $gtMd={{ flexDirection: 'row' }}
              gap="$4"
              flexWrap="wrap"
            >
              {client.primary_contact && (
                <XStack alignItems="center" gap="$3" flex={1} minWidth="45%">
                  <Users color="$color10" size={18} />
                  <YStack>
                    <Text fontSize="$3" color="$color11">Primary Contact</Text>
                    <Text color="$color12" fontWeight="500">{client.primary_contact}</Text>
                  </YStack>
                </XStack>
              )}
              {client.email && (
                <XStack alignItems="center" gap="$3" flex={1} minWidth="45%">
                  <Mail color="$color10" size={18} />
                  <YStack>
                    <Text fontSize="$3" color="$color11">Email</Text>
                    <Text color="$color12" fontWeight="500">{client.email}</Text>
                  </YStack>
                </XStack>
              )}
              {client.phone && (
                <XStack alignItems="center" gap="$3" flex={1} minWidth="45%">
                  <Phone color="$color10" size={18} />
                  <YStack>
                    <Text fontSize="$3" color="$color11">Phone</Text>
                    <Text color="$color12" fontWeight="500">{client.phone}</Text>
                  </YStack>
                </XStack>
              )}
              {client.address && (
                <XStack alignItems="center" gap="$3" flex={1} minWidth="45%">
                  <MapPin color="$color10" size={18} />
                  <YStack>
                    <Text fontSize="$3" color="$color11">Address</Text>
                    <Text color="$color12" fontWeight="500">{client.address}</Text>
                  </YStack>
                </XStack>
              )}
            </XStack>
          </Card>

          {client.notes && (
            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
            >
              <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">Notes</H3>
              <Text color="$color11">{client.notes}</Text>
            </Card>
          )}
        </YStack>
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      content: (
        <YStack gap="$6">
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Compliance Overview
            </H3>
            <XStack alignItems="center" gap="$4" mb="$6">
              <YStack width={128} height={128} position="relative">
                <YStack
                  position="absolute"
                  inset={0}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="$9" fontWeight="bold" color={getComplianceColor(client.compliance_score)}>
                    {client.compliance_score}%
                  </Text>
                </YStack>
                <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={getComplianceBg(client.compliance_score)}
                    strokeWidth="12"
                    strokeDasharray={`${(client.compliance_score / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
              </YStack>
              <YStack flex={1}>
                <Text color="$color11" mb="$2">
                  {client.compliance_score >= 90
                    ? 'Excellent compliance status. All requirements are being met.'
                    : client.compliance_score >= 70
                    ? 'Good compliance status with some areas needing attention.'
                    : 'Compliance issues detected. Immediate action required.'}
                </Text>
                <XStack alignItems="center" gap="$4" fontSize="$3">
                  <XStack alignItems="center" gap="$1">
                    <CheckCircle color="$green10" size={16} />
                    <Text color="$color11">
                      {clientPolicies.filter((p) => p.status === 'active').length} Active Policies
                    </Text>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <AlertTriangle color="$yellow10" size={16} />
                    <Text color="$color11">
                      {clientPolicies.filter((p) => p.status === 'expiring').length} Expiring Soon
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </XStack>
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Coverage Status
            </H3>
            <YStack gap="$4">
              {clientPolicies.length > 0 ? (
                clientPolicies.map((policy) => {
                  const statusColors = policy.status === 'active'
                    ? { backgroundColor: '$green2', color: '$green11' }
                    : policy.status === 'expiring'
                    ? { backgroundColor: '$yellow2', color: '$yellow11' }
                    : { backgroundColor: '$red2', color: '$red11' };
                  return (
                    <Card
                    key={policy.id}
                      backgroundColor="$gray2"
                      borderRadius="$4"
                      padding="$4"
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack>
                          <Text fontWeight="500" color="$color12">{policy.policy_type}</Text>
                          <Text fontSize="$3" color="$color11">
                            {policy.carrier} - {policy.policy_number}
                          </Text>
                        </YStack>
                        <XStack
                          paddingHorizontal="$3"
                          paddingVertical="$1"
                          borderRadius={9999}
                          fontSize="$1"
                          fontWeight="500"
                          {...statusColors}
                        >
                          <Text fontSize="$1" fontWeight="500" color={statusColors.color}>
                      {policy.status}
                          </Text>
                        </XStack>
                      </XStack>
                    </Card>
                  );
                })
              ) : (
                <Text color="$color11" style={{ textAlign: 'center' }} paddingVertical="$4">
                  No policies found for this client.
                </Text>
              )}
            </YStack>
          </Card>
        </YStack>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: clientPolicies.length,
      content: (
        <YStack gap="$4">
          {clientPolicies.length > 0 ? (
            clientPolicies.map((policy) => {
              const statusColors = policy.status === 'active'
                ? { backgroundColor: '$green2', color: '$green11' }
                : policy.status === 'expiring'
                ? { backgroundColor: '$yellow2', color: '$yellow11' }
                : { backgroundColor: '$red2', color: '$red11' };
              return (
                <Card
                key={policy.id}
                  backgroundColor="$background"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  padding="$6"
                  hoverStyle={{ borderColor: '$blue8' }}
                  cursor="pointer"
                >
                  <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
                    <YStack>
                      <Text fontSize="$4" fontWeight="600" color="$color12">{policy.policy_type}</Text>
                      <Text fontSize="$3" color="$color11">{policy.carrier}</Text>
                    </YStack>
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                      borderRadius={9999}
                      fontSize="$1"
                      fontWeight="500"
                      {...statusColors}
                    >
                      <Text fontSize="$1" fontWeight="500" color={statusColors.color}>
                        {policy.status}
                      </Text>
                    </XStack>
                  </XStack>
                  <XStack
                    flexDirection="column"
                    $gtMd={{ flexDirection: 'row' }}
                    gap="$4"
                    flexWrap="wrap"
                    fontSize="$3"
                  >
                    <YStack flex={1} minWidth="20%">
                      <Text color="$color11">Policy Number</Text>
                      <Text fontWeight="500" color="$color12">{policy.policy_number}</Text>
                    </YStack>
                    <YStack flex={1} minWidth="20%">
                      <Text color="$color11">Coverage Limit</Text>
                      <Text fontWeight="500" color="$color12">
                      ${(policy.coverage_limit / 1000000).toFixed(1)}M
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="20%">
                      <Text color="$color11">Start Date</Text>
                      <Text fontWeight="500" color="$color12">
                      {new Date(policy.start_date).toLocaleDateString()}
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="20%">
                      <Text color="$color11">End Date</Text>
                      <Text fontWeight="500" color="$color12">
                      {new Date(policy.end_date).toLocaleDateString()}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              );
            })
          ) : (
            <Card
              alignItems="center"
              paddingVertical="$12"
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <FileText color="$color10" size={48} mb="$4" />
              <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
                No Policies Found
              </H3>
              <Text color="$color11">
                This client doesn't have any policies on record.
              </Text>
            </Card>
          )}
        </YStack>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Building,
      badge: clientProjects.length,
      content: (
        <YStack gap="$4">
          {clientProjects.length > 0 ? (
            clientProjects.map((project) => {
              const statusColors = project.status === 'active'
                ? { backgroundColor: '$green2', color: '$green11' }
                : project.status === 'completed'
                ? { backgroundColor: '$gray2', color: '$gray11' }
                : { backgroundColor: '$yellow2', color: '$yellow11' };
              return (
                <Card
                  key={project.id}
                  backgroundColor="$background"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  padding="$6"
                  hoverStyle={{ borderColor: '$blue8' }}
                  cursor="pointer"
                  onClick={() => navigate(`/broker/projects/${project.id}`)}
                >
                  <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
                    <YStack>
                      <Text fontSize="$4" fontWeight="600" color="$color12">{project.name}</Text>
                      {project.location && (
                        <XStack alignItems="center" gap="$1" fontSize="$3" color="$color11" mt="$1">
                          <MapPin size={14} color="$color11" />
                          <Text fontSize="$3" color="$color11">{project.location}</Text>
                        </XStack>
                      )}
                    </YStack>
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                      borderRadius={9999}
                      fontSize="$1"
                      fontWeight="500"
                      {...statusColors}
                    >
                      <Text fontSize="$1" fontWeight="500" color={statusColors.color}>
                        {project.status}
                      </Text>
                    </XStack>
                  </XStack>
                  <XStack alignItems="center" gap="$6" fontSize="$3" color="$color11">
                    <XStack alignItems="center" gap="$1">
                      <Calendar size={14} color="$color11" />
                      <Text fontSize="$3" color="$color11">
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {new Date(project.end_date).toLocaleDateString()}
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap="$1">
                      <Shield size={14} color="$color11" />
                      <Text fontSize="$3" color="$color11">{project.compliance_status}</Text>
                    </XStack>
                  </XStack>
                </Card>
              );
            })
          ) : (
            <Card
              alignItems="center"
              paddingVertical="$12"
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Building color="$color10" size={48} mb="$4" />
              <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
                No Projects Found
              </H3>
              <Text color="$color11">
                This client doesn't have any projects on record.
              </Text>
            </Card>
          )}
        </YStack>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <Card
          alignItems="center"
          paddingVertical="$12"
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <FileText color="$color10" size={48} mb="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            Documents Coming Soon
          </H3>
          <Text color="$color11">
            Document management for this client will be available in a future update.
          </Text>
        </Card>
      ),
    },
  ];

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$4">
          <Button
            variant="ghost"
            onClick={() => navigate('/broker/clients')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
          <YStack>
            <H1 fontSize="$8" fontWeight="bold" color="$color12">
              {client.company_name}
            </H1>
            <XStack alignItems="center" gap="$3" mt="$1">
              <XStack
                alignItems="center"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius="$2"
                fontSize="$1"
                fontWeight="500"
                backgroundColor={client.client_type === 'subcontractor' ? '$blue2' : '$purple2'}
                color={client.client_type === 'subcontractor' ? '$blue11' : '$purple11'}
              >
                <Text fontSize="$1" fontWeight="500" color={client.client_type === 'subcontractor' ? '$blue11' : '$purple11'}>
                  {client.client_type === 'subcontractor' ? 'Subcontractor' : 'General Contractor'}
                </Text>
              </XStack>
              <XStack
                alignItems="center"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius={9999}
                fontSize="$1"
                fontWeight="500"
                borderWidth={1}
                {...getRiskBadge(client.risk_level)}
              >
                <Text fontSize="$1" fontWeight="500" color={getRiskBadge(client.risk_level).color}>
                  {client.risk_level} risk
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </XStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="outline" size="sm">
            Edit Client
          </Button>
          <Button variant="primary" size="sm">
            Add Policy
          </Button>
        </XStack>
      </XStack>

      <TabsCustom tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </YStack>
  );
}
