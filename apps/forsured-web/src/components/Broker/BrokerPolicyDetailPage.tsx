import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Building,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  Paperclip,
  Edit,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card } from '@unicornlove/ui';
import { usePolicies } from '../../hooks/usePolicies';
import { useClients } from '../../hooks/useClients';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerPolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const navigate = useNavigate();
  const { policies, loading: policiesLoading } = usePolicies();
  const { clients, loading: clientsLoading } = useClients();

  const policy = policies.find((p) => p.id === policyId);
  const client = clients.find((c) => c.id === policy?.client_id);

  const isLoading = policiesLoading || clientsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!policy) {
    return (
      <YStack gap="$6">
        <XStack
          alignItems="center"
          gap="$2"
          cursor="pointer"
          onClick={() => navigate(-1)}
          hoverStyle={{ opacity: 0.7 }}
        >
          <ArrowLeft size={20} color="$gray11" />
          <Text color="$gray11">Back</Text>
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
          <AlertTriangle color="$red10" size={64} mb="$4" />
          <H3 color="$color12" mb="$2" fontWeight="600">
            Policy Not Found
          </H3>
          <Text color="$color11">
            The policy you're looking for doesn't exist or has been deleted.
          </Text>
        </Card>
      </YStack>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '$green2', color: '$green11', borderColor: '$green6' };
      case 'expiring':
        return { backgroundColor: '$yellow2', color: '$yellow11', borderColor: '$yellow6' };
      case 'expired':
        return { backgroundColor: '$red2', color: '$red11', borderColor: '$red6' };
      default:
        return { backgroundColor: '$gray2', color: '$gray11', borderColor: '$gray6' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="$green10" size={20} />;
      case 'expiring':
        return <Clock color="$yellow10" size={20} />;
      case 'expired':
        return <AlertTriangle color="$red10" size={20} />;
      default:
        return <Shield color="$gray10" size={20} />;
    }
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(policy.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const statusColors = getStatusColor(policy.status);

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$4">
          <Button
            variant="ghost"
            onClick={() => navigate('/broker/insurance?tab=policies')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Policies
          </Button>
          <YStack>
            <XStack alignItems="center" gap="$3">
              <H1 fontSize="$8" fontWeight="bold" color="$color12">
                {policy.policy_type}
              </H1>
              <XStack
                alignItems="center"
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius={9999}
                borderWidth={1}
                {...statusColors}
              >
                {getStatusIcon(policy.status)}
                <Text ml="$2" fontSize="$3" fontWeight="500">
                  {policy.status}
                </Text>
              </XStack>
            </XStack>
            <Text color="$color11" mt="$1">
              {policy.policy_number} - {policy.carrier}
            </Text>
          </YStack>
        </XStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="outline" size="sm" leftIcon={Paperclip}>
            Documents
          </Button>
          <Button variant="primary" size="sm" leftIcon={Edit}>
            Edit Policy
          </Button>
        </XStack>
      </XStack>

      {policy.status === 'expiring' && (
        <XStack
          backgroundColor="$yellow2"
          borderWidth={1}
          borderColor="$yellow6"
          borderRadius="$4"
          padding="$4"
          alignItems="center"
          gap="$3"
        >
          <AlertTriangle color="$yellow10" size={24} />
          <YStack flex={1}>
            <Text fontWeight="500" color="$yellow12">
              Policy expires in {daysUntilExpiry} days
            </Text>
            <Text fontSize="$3" color="$yellow11">
              Consider initiating renewal process soon.
            </Text>
          </YStack>
          <XStack ml="auto">
            <Button variant="primary" size="sm">
              Start Renewal
            </Button>
          </XStack>
        </XStack>
      )}

      <XStack
        flexDirection="column"
        $gtLg={{ flexDirection: 'row' }}
        gap="$6"
      >
        <YStack flex={1} $gtLg={{ flex: 2 }} gap="$6">
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Policy Details
            </H2>
            <XStack flexWrap="wrap" gap="$6">
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <FileText color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Policy Number</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">{policy.policy_number}</Text>
              </YStack>
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <Building color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Carrier</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">{policy.carrier}</Text>
              </YStack>
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <Shield color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Policy Type</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">{policy.policy_type}</Text>
              </YStack>
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <DollarSign color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Coverage Limit</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">
                  ${(policy.coverage_limit / 1000000).toFixed(1)}M
                </Text>
              </YStack>
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <Calendar color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Effective Date</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">
                  {new Date(policy.start_date).toLocaleDateString()}
                </Text>
              </YStack>
              <YStack flex={1} minWidth="40%">
                <XStack alignItems="center" gap="$2" mb="$1">
                  <Calendar color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">Expiration Date</Text>
                </XStack>
                <Text fontWeight="500" color="$color12">
                  {new Date(policy.end_date).toLocaleDateString()}
                </Text>
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
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Coverage & Provisions
            </H2>
            <YStack gap="$4">
              <YStack padding="$4" backgroundColor="$gray2" borderRadius="$4">
                <XStack alignItems="center" justifyContent="space-between" mb="$2">
                  <Text fontWeight="500" color="$color12">Per Occurrence Limit</Text>
                  <Text fontWeight="600" color="$color12">
                    ${(policy.coverage_limit / 1000000).toFixed(1)}M
                  </Text>
                </XStack>
                <YStack width="100%" backgroundColor="$gray6" borderRadius={9999} height={8}>
                  <YStack backgroundColor="$blue9" height={8} borderRadius={9999} width="100%" />
                </YStack>
              </YStack>
              <YStack padding="$4" backgroundColor="$gray2" borderRadius="$4">
                <XStack alignItems="center" justifyContent="space-between" mb="$2">
                  <Text fontWeight="500" color="$color12">Aggregate Limit</Text>
                  <Text fontWeight="600" color="$color12">
                    ${((policy.coverage_limit * 2) / 1000000).toFixed(1)}M
                  </Text>
                </XStack>
                <YStack width="100%" backgroundColor="$gray6" borderRadius={9999} height={8}>
                  <YStack backgroundColor="$blue9" height={8} borderRadius={9999} width="100%" />
                </YStack>
              </YStack>
              {policy.premium && (
                <YStack padding="$4" backgroundColor="$gray2" borderRadius="$4">
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text fontWeight="500" color="$color12">Annual Premium</Text>
                    <Text fontWeight="600" color="$color12">
                      ${policy.premium.toLocaleString()}
                    </Text>
                  </XStack>
                </YStack>
              )}
            </YStack>
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Endorsements & Conditions
            </H2>
            <YStack gap="$3">
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                backgroundColor="$green2"
                borderWidth={1}
                borderColor="$green6"
                borderRadius="$4"
              >
                <CheckCircle color="$green10" size={20} />
                <Text color="$green12">Additional Insured Endorsement</Text>
              </XStack>
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                backgroundColor="$green2"
                borderWidth={1}
                borderColor="$green6"
                borderRadius="$4"
              >
                <CheckCircle color="$green10" size={20} />
                <Text color="$green12">Waiver of Subrogation</Text>
              </XStack>
              <XStack
                alignItems="center"
                gap="$3"
                padding="$3"
                backgroundColor="$green2"
                borderWidth={1}
                borderColor="$green6"
                borderRadius="$4"
              >
                <CheckCircle color="$green10" size={20} />
                <Text color="$green12">Primary & Non-Contributory</Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        <YStack gap="$6" flex={1}>
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Policyholder
            </H2>
            {client ? (
              <YStack
                cursor="pointer"
                padding="$3"
                margin={-$3}
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$gray2' }}
                onClick={() => navigate(`/broker/clients/${client.id}`)}
              >
                <XStack alignItems="center" gap="$3" mb="$3">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="$blue3"
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$6" fontWeight="600" color="$blue10">
                      {client.company_name.substring(0, 2).toUpperCase()}
                    </Text>
                  </YStack>
                  <YStack>
                    <Text fontWeight="500" color="$color12">{client.company_name}</Text>
                    <Text fontSize="$3" color="$color11">
                      {client.client_type === 'subcontractor' ? 'Subcontractor' : 'General Contractor'}
                    </Text>
                  </YStack>
                </XStack>
                {client.primary_contact && (
                  <XStack alignItems="center" gap="$2">
                    <User size={14} color="$color11" />
                    <Text fontSize="$3" color="$color11">{client.primary_contact}</Text>
                  </XStack>
                )}
              </YStack>
            ) : (
              <Text color="$color11">Client information not available</Text>
            )}
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Policy Timeline
            </H2>
            <YStack gap="$4">
              <XStack alignItems="flex-start" gap="$3">
                <YStack
                  width={32}
                  height={32}
                  backgroundColor="$green3"
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <CheckCircle color="$green10" size={16} />
                </YStack>
                <YStack>
                  <Text fontWeight="500" color="$color12">Policy Issued</Text>
                  <Text fontSize="$3" color="$color11">
                    {new Date(policy.start_date).toLocaleDateString()}
                  </Text>
                </YStack>
              </XStack>
              {policy.status === 'expiring' && (
                <XStack alignItems="flex-start" gap="$3">
                  <YStack
                    width={32}
                    height={32}
                    backgroundColor="$yellow3"
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Clock color="$yellow10" size={16} />
                  </YStack>
                  <YStack>
                    <Text fontWeight="500" color="$color12">Renewal Due</Text>
                    <Text fontSize="$3" color="$color11">
                      {new Date(policy.end_date).toLocaleDateString()}
                    </Text>
                  </YStack>
                </XStack>
              )}
              <XStack alignItems="flex-start" gap="$3">
                <YStack
                  width={32}
                  height={32}
                  backgroundColor={policy.status === 'expired' ? '$red3' : '$gray3'}
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Calendar
                    color={policy.status === 'expired' ? '$red10' : '$gray10'}
                    size={16}
                  />
                </YStack>
                <YStack>
                  <Text fontWeight="500" color="$color12">Expiration</Text>
                  <Text fontSize="$3" color="$color11">
                    {new Date(policy.end_date).toLocaleDateString()}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>

          <Card
            backgroundColor="$background"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <H2 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Quick Actions
            </H2>
            <YStack gap="$2">
              <Button variant="outline" width="100%" justifyContent="flex-start">
                <FileText size={16} mr="$2" />
                View Certificate
              </Button>
              <Button variant="outline" width="100%" justifyContent="flex-start">
                <Paperclip size={16} mr="$2" />
                Download Policy
              </Button>
              <Button variant="outline" width="100%" justifyContent="flex-start">
                <Clock size={16} mr="$2" />
                Request Endorsement
              </Button>
            </YStack>
          </Card>
        </YStack>
      </XStack>
    </YStack>
  );
}
