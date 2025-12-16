// src/pages/broker/BrokerClients.tsx
import { Briefcase, Building2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H1 } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';

// Mock clients for testing
const mockClients = [
  {
    id: 'client-1',
    companyName: 'ABC Electrical Services',
    contactName: 'John Smith',
    email: 'john@abcelectrical.com',
    status: 'active',
    policiesCount: 3,
    complianceStatus: 'compliant',
  },
  {
    id: 'client-2',
    companyName: 'XYZ Plumbing Co',
    contactName: 'Jane Doe',
    email: 'jane@xyzplumbing.com',
    status: 'active',
    policiesCount: 2,
    complianceStatus: 'expiring_soon',
  },
  {
    id: 'client-3',
    companyName: 'Pro Construction LLC',
    contactName: 'Bob Wilson',
    email: 'bob@proconstruction.com',
    status: 'pending',
    policiesCount: 0,
    complianceStatus: 'needs_attention',
  },
];

function BrokerClients() {
  const handleAddClient = () => {
    console.log('Navigate to add client flow');
  };

  const hasClients = mockClients.length > 0;

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle color="$green10" size={16} />;
      case 'expiring_soon':
        return <AlertCircle color="$yellow10" size={16} />;
      default:
        return <AlertCircle color="$red10" size={16} />;
    }
  };

  return (
    <YStack gap="$6">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
        <H1>My Clients</H1>
        <Button
          data-testid="invite-client-button"
          onPress={handleAddClient}
          variant="primary"
          icon={<UserPlus size={18} />}
        >
          Add Client
        </Button>
      </XStack>
      {!hasClients ? (
        <EmptyState
          icon={<Briefcase size={48} />}
          title="No Clients Yet"
          description="Add your contractor clients to start managing their insurance and compliance."
          primaryAction={{ label: 'Add Client', onClick: handleAddClient }}
          helpLinks={[
            { label: 'How to Add Clients', href: '#' },
          ]}
        />
      ) : (
        <Card padding={0} overflow="hidden" data-testid="client-table">
          <YStack gap="$2">
            {/* Table Header */}
            <XStack paddingHorizontal="$6" paddingVertical="$3" backgroundColor="$color2">
              <Text flex={1} fontSize="$2" fontWeight="500" color="$color10" textTransform="uppercase" letterSpacing={0.5}>
                Company
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$color10" textTransform="uppercase" letterSpacing={0.5}>
                Contact
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$color10" textTransform="uppercase" letterSpacing={0.5}>
                Status
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$color10" textTransform="uppercase" letterSpacing={0.5}>
                Policies
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$color10" textTransform="uppercase" letterSpacing={0.5}>
                Compliance
              </Text>
            </XStack>
            {/* Table Rows */}
            {mockClients.map((client) => (
              <XStack
                key={client.id}
                paddingHorizontal="$6"
                paddingVertical="$4"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                hoverStyle={{ backgroundColor: '$color2' }}
                cursor="pointer"
              >
                <XStack flex={1} alignItems="center" gap="$3">
                  <XStack padding="$2" backgroundColor="$color2" borderRadius="$4">
                    <Building2 color="$color10" size={20} />
                  </XStack>
                  <Text fontWeight="500" fontSize="$4">{client.companyName}</Text>
                </XStack>
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="500" color="$color12">{client.contactName}</Text>
                  <Text fontSize="$3" color="$color10">{client.email}</Text>
                </YStack>
                <XStack flex={1}>
                  <Text
                    fontSize="$2"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius={9999}
                    backgroundColor={client.status === 'active' ? '$green2' : '$yellow2'}
                    color={client.status === 'active' ? '$green11' : '$yellow11'}
                  >
                    {client.status}
                  </Text>
                </XStack>
                <Text flex={1} fontSize="$3" color="$color12">
                  {client.policiesCount} policies
                </Text>
                <XStack flex={1} alignItems="center" gap="$2">
                  {getComplianceIcon(client.complianceStatus)}
                  <Text fontSize="$3" textTransform="capitalize">
                    {client.complianceStatus.replace('_', ' ')}
                  </Text>
                </XStack>
              </XStack>
            ))}
          </YStack>
        </Card>
      )}
    </YStack>
  );
}

export default BrokerClients;
