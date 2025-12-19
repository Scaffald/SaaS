import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H3, Card } from '@unicornlove/ui';
import { usePolicies } from '../../hooks/usePolicies';
import { useClients } from '../../hooks/useClients';
import { Button } from '../Common/Button';
import { TabsCustom, TabsList, TabsTrigger, TabsContent } from '@unicornlove/ui';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerInsurancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { policies, loading: policiesLoading } = usePolicies();
  const { clients, loading: clientsLoading } = useClients();

  const validTabs = ['overview', 'policies', 'coverage-requests'];
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

  const isLoading = policiesLoading || clientsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const activePolicies = policies.filter((p) => p.status === 'active');
  const expiringPolicies = policies.filter((p) => p.status === 'expiring');
  const _expiredPolicies = policies.filter((p) => p.status === 'expired');

  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage_limit || 0), 0);
  const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '$green2', color: '$green11' };
      case 'expiring':
        return { backgroundColor: '$yellow2', color: '$yellow11' };
      case 'expired':
        return { backgroundColor: '$red2', color: '$red11' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11' };
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Unknown Client';
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Shield,
      content: (
        <YStack gap="$6">
          <XStack
            flexDirection="column"
            $gtMd={{ flexDirection: 'row' }}
            $gtLg={{ flexDirection: 'row' }}
            gap="$4"
            flexWrap="wrap"
          >
            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="20%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <YStack padding="$2" backgroundColor="$green2" borderRadius="$4">
                  <CheckCircle color="$green10" size={24} />
                </YStack>
                <Text fontSize="$1" color="$green10" fontWeight="500">Active</Text>
              </XStack>
              <Text fontSize="$9" fontWeight="bold" color="$color12">{activePolicies.length}</Text>
              <Text fontSize="$3" color="$color11" marginTop="$1">Active Policies</Text>
            </Card>

            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="20%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <YStack padding="$2" backgroundColor="$yellow2" borderRadius="$4">
                  <Clock color="$yellow10" size={24} />
                </YStack>
                <Text fontSize="$1" color="$yellow10" fontWeight="500">Attention</Text>
              </XStack>
              <Text fontSize="$9" fontWeight="bold" color="$color12">{expiringPolicies.length}</Text>
              <Text fontSize="$3" color="$color11" marginTop="$1">Expiring Soon</Text>
            </Card>

            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="20%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <YStack padding="$2" backgroundColor="$blue2" borderRadius="$4">
                  <DollarSign color="$blue10" size={24} />
                </YStack>
              </XStack>
              <Text fontSize="$9" fontWeight="bold" color="$color12">
                ${(totalCoverage / 1000000).toFixed(1)}M
              </Text>
              <Text fontSize="$3" color="$color11" marginTop="$1">Total Coverage</Text>
            </Card>

            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="20%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <YStack padding="$2" backgroundColor="$purple2" borderRadius="$4">
                  <TrendingUp color="$purple10" size={24} />
                </YStack>
              </XStack>
              <Text fontSize="$9" fontWeight="bold" color="$color12">
                ${totalPremium.toLocaleString()}
              </Text>
              <Text fontSize="$3" color="$color11" marginTop="$1">Annual Premium</Text>
            </Card>
          </XStack>

          {expiringPolicies.length > 0 && (
            <Card
              backgroundColor="$yellow2"
              borderWidth={1}
              borderColor="$yellow6"
              borderRadius="$4"
              padding="$6"
            >
              <XStack alignItems="center" gap="$3" marginBottom="$4">
                <AlertTriangle color="$yellow10" size={24} />
                <H3 fontSize="$6" fontWeight="600" color="$yellow12">
                  Policies Requiring Attention
                </H3>
              </XStack>
              <YStack gap="$3">
                {expiringPolicies.slice(0, 3).map((policy) => (
                  <Card
                    key={policy.id}
                    backgroundColor="white"
                    borderRadius="$4"
                    padding="$4"
                    borderWidth={1}
                    borderColor="$yellow6"
                    cursor="pointer"
                    hoverStyle={{ borderColor: '$yellow8' }}
                    onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <YStack>
                        <Text fontWeight="500" color="$color12">{policy.policy_type}</Text>
                        <Text fontSize="$3" color="$color11">
                          {getClientName(policy.client_id)} - Expires{' '}
                          {new Date(policy.end_date).toLocaleDateString()}
                        </Text>
                      </YStack>
                      <ChevronRight color="$yellow10" size={20} />
                    </XStack>
                  </Card>
                ))}
              </YStack>
            </Card>
          )}

          <XStack
            flexDirection="column"
            $gtLg={{ flexDirection: 'row' }}
            gap="$6"
            flexWrap="wrap"
          >
            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="45%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <H3 fontSize="$6" fontWeight="600" color="$color12">Recent Policies</H3>
                <Button
                  variant="ghost"
                  onClick={() => handleTabChange('policies')}
                >
                  <Button.Text>View All</Button.Text>
                </Button>
              </XStack>
              <YStack gap="$3">
                {policies.slice(0, 5).map((policy) => {
                  const statusColors = getStatusColor(policy.status);
                  return (
                    <Card
                      key={policy.id}
                      backgroundColor="$gray2"
                      borderRadius="$4"
                      padding="$3"
                      cursor="pointer"
                      hoverStyle={{ backgroundColor: '$gray3' }}
                      onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <YStack>
                          <Text fontWeight="500" color="$color12">{policy.policy_type}</Text>
                          <Text fontSize="$3" color="$color11">{policy.carrier}</Text>
                        </YStack>
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          fontSize="$1"
                          fontWeight="500"
                          borderRadius="$2"
                          {...statusColors}
                        >
                          <Text fontSize="$1" fontWeight="500" color={statusColors.color}>
                            {policy.status}
                          </Text>
                        </XStack>
                      </XStack>
                    </Card>
                  );
                })}
              </YStack>
            </Card>

            <Card
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              flex={1}
              minWidth="45%"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
                <H3 fontSize="$6" fontWeight="600" color="$color12">Coverage by Type</H3>
              </XStack>
              <YStack gap="$4">
                {['General Liability', 'Workers Compensation', 'Commercial Auto', 'Professional Liability'].map((type) => {
                  const count = policies.filter((p) => p.policy_type === type).length;
                  const percentage = policies.length > 0 ? (count / policies.length) * 100 : 0;
                  return (
                    <YStack key={type}>
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$1">
                        <Text fontSize="$3" color="$color12">{type}</Text>
                        <Text fontSize="$3" fontWeight="500" color="$color12">{count}</Text>
                      </XStack>
                      <YStack width="100%" backgroundColor="$gray6" borderRadius={9999} height={8}>
                        <YStack
                          backgroundColor="$blue9"
                          height={8}
                          borderRadius={9999}
                          width={`${percentage}%`}
                        />
                      </YStack>
                    </YStack>
                  );
                })}
              </YStack>
            </Card>
          </XStack>
        </YStack>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: policies.length,
      content: (
        <YStack gap="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$color11">
              Showing {policies.length} policies
            </Text>
            <Button variant="primary">
              <Button.Icon><Plus size={16} /></Button.Icon>
              <Button.Text>Add Policy</Button.Text>
            </Button>
          </XStack>
          {policies.length > 0 ? (
            <YStack gap="$4">
              {policies.map((policy) => {
                const statusColors = getStatusColor(policy.status);
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
                    onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                  >
                    <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$4">
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
                      <YStack flex={1} minWidth="18%">
                        <Text color="$color11">Client</Text>
                        <Text fontWeight="500" color="$color12">{getClientName(policy.client_id)}</Text>
                      </YStack>
                      <YStack flex={1} minWidth="18%">
                        <Text color="$color11">Policy Number</Text>
                        <Text fontWeight="500" color="$color12">{policy.policy_number}</Text>
                      </YStack>
                      <YStack flex={1} minWidth="18%">
                        <Text color="$color11">Coverage</Text>
                        <Text fontWeight="500" color="$color12">
                          ${(policy.coverage_limit / 1000000).toFixed(1)}M
                        </Text>
                      </YStack>
                      <YStack flex={1} minWidth="18%">
                        <Text color="$color11">Start Date</Text>
                        <Text fontWeight="500" color="$color12">
                          {new Date(policy.start_date).toLocaleDateString()}
                        </Text>
                      </YStack>
                      <YStack flex={1} minWidth="18%">
                        <Text color="$color11">End Date</Text>
                        <Text fontWeight="500" color="$color12">
                          {new Date(policy.end_date).toLocaleDateString()}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                );
              })}
            </YStack>
          ) : (
            <Card
              alignItems="center"
              paddingVertical="$12"
              backgroundColor="$background"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <FileText color="$color10" size={48} marginBottom="$4" />
              <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">No Policies Found</H3>
              <Text color="$color11">No policies have been added yet.</Text>
            </Card>
          )}
        </YStack>
      ),
    },
    {
      id: 'coverage-requests',
      label: 'Coverage Requests',
      icon: Shield,
      content: (
        <YStack gap="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$color11">Pending coverage requests</Text>
            <Button variant="primary">
              <Button.Icon><Plus size={16} /></Button.Icon>
              <Button.Text>New Request</Button.Text>
            </Button>
          </XStack>
          <Card
            alignItems="center"
            paddingVertical="$12"
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Shield color="$color10" size={48} marginBottom="$4" />
            <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$2">
              Coverage Requests Coming Soon
            </H3>
            <Text color="$color11">
              Coverage request management will be available in a future update.
            </Text>
          </Card>
        </YStack>
      ),
    },
  ];

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">Insurance Management</H1>
          <Text color="$color11">
            Manage policies, coverage requirements, and renewals
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="outlined">
            <Button.Text>Export Report</Button.Text>
          </Button>
          <Button variant="primary">
            <Button.Icon><Plus size={16} /></Button.Icon>
            <Button.Text>Add Policy</Button.Text>
          </Button>
        </XStack>
      </XStack>

      <Tabs tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </YStack>
  );
}
