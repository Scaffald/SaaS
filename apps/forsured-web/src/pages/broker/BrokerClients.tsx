// src/pages/broker/BrokerClients.tsx
import { Briefcase, Building2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import { Stack, Row, Text, Button, Card, H1 } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';

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
        return <CheckCircle color="var(--color-green-10)" size={16} />;
      case 'expiring_soon':
        return <AlertCircle color="var(--color-yellow-10)" size={16} />;
      default:
        return <AlertCircle color="var(--color-red-10)" size={16} />;
    }
  };

  const headerRowStyle: React.CSSProperties = {
    paddingLeft: 'var(--space-6)',
    paddingRight: 'var(--space-6)',
    paddingTop: 'var(--space-3)',
    paddingBottom: 'var(--space-3)',
    backgroundColor: 'var(--color-2)',
  };

  const tableRowStyle: React.CSSProperties = {
    paddingLeft: 'var(--space-6)',
    paddingRight: 'var(--space-6)',
    paddingTop: 'var(--space-4)',
    paddingBottom: 'var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
  };

  const headerTextStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 'var(--font-size-2)',
    fontWeight: 500,
    color: 'var(--color-10)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Row
        justifyContent="space-between"
        alignItems="center"
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <H1>My Clients</H1>
        <Button
          data-testid="invite-client-button"
          onClick={handleAddClient}
          color="primary"
          leftIcon={<UserPlus size={18} />}
        >
          Add Client
        </Button>
      </Row>
      {!hasClients ? (
        <EmptyState
          icon={Briefcase}
          title="No Clients Yet"
          description="Add your contractor clients to start managing their insurance and compliance."
          action={{ label: 'Add Client', onClick: handleAddClient }}
        />
      ) : (
        <Card
          style={{ padding: 0, overflow: 'hidden' }}
          data-testid="client-table"
        >
          <Stack style={{ gap: 'var(--space-2)' }}>
            {/* Table Header */}
            <Row style={headerRowStyle}>
              <Text style={headerTextStyle}>Company</Text>
              <Text style={headerTextStyle}>Contact</Text>
              <Text style={headerTextStyle}>Status</Text>
              <Text style={headerTextStyle}>Policies</Text>
              <Text style={headerTextStyle}>Compliance</Text>
            </Row>
            {/* Table Rows */}
            {mockClients.map((client) => (
              <Row
                key={client.id}
                style={tableRowStyle}
              >
                <Row style={{ flex: 1 }} alignItems="center" gap={12}>
                  <Row
                    style={{
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--color-2)',
                      borderRadius: 'var(--radius-4)',
                    }}
                  >
                    <Building2 color="var(--color-10)" size={20} />
                  </Row>
                  <Text weight="medium" size="md">{client.companyName}</Text>
                </Row>
                <Stack style={{ flex: 1 }}>
                  <Text size="sm" weight="medium">{client.contactName}</Text>
                  <Text size="sm" muted>{client.email}</Text>
                </Stack>
                <Row style={{ flex: 1 }}>
                  <Text
                    size="xs"
                    style={{
                      paddingLeft: 'var(--space-2)',
                      paddingRight: 'var(--space-2)',
                      paddingTop: 'var(--space-1)',
                      paddingBottom: 'var(--space-1)',
                      borderRadius: 9999,
                      backgroundColor: client.status === 'active' ? 'var(--color-green-2)' : 'var(--color-yellow-2)',
                      color: client.status === 'active' ? 'var(--color-green-11)' : 'var(--color-yellow-11)',
                    }}
                  >
                    {client.status}
                  </Text>
                </Row>
                <Text style={{ flex: 1 }} size="sm">
                  {client.policiesCount} policies
                </Text>
                <Row style={{ flex: 1 }} alignItems="center" gap={8}>
                  {getComplianceIcon(client.complianceStatus)}
                  <Text size="sm" style={{ textTransform: 'capitalize' }}>
                    {client.complianceStatus.replace('_', ' ')}
                  </Text>
                </Row>
              </Row>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

export default BrokerClients;
