import { useState } from 'react';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import { Stack, Row, Text, H1, H2, Card } from '@unicornlove/beyond-ui';
import { useUsers } from '../../hooks/useUsers';
import { useClients } from '../../hooks/useClients';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import InviteTeamMemberModal from './InviteTeamMemberModal';

export default function BrokerTeamPage() {
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { clients, loading: clientsLoading } = useClients();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const brokerUsers = users.filter((u) => u.role === 'broker');
  const adminUsers = brokerUsers.filter((u) => u.broker_role === 'admin');
  const workerUsers = brokerUsers.filter((u) => u.broker_role === 'worker');

  if (usersLoading || clientsLoading) {
    return <DashboardSkeleton />;
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    padding: 24,
    border: '1px solid var(--color-border)',
    flex: 1,
    minWidth: '30%',
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-3)`,
    padding: 12,
    borderRadius: 8,
  });

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)' }}>
            Team Management
          </H1>
          <Text muted>
            Manage your broker team and client assignments
          </Text>
        </Stack>
        <Button color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
          Invite Team Member
        </Button>
      </Row>

      <Row gap={24} style={{ flexWrap: 'wrap' }}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>Total Team Members</Text>
              <Text size="2xl" weight="bold" style={{ marginTop: 4 }}>
                {brokerUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Users size={24} style={{ color: 'var(--color-blue-10)' }} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>Administrators</Text>
              <Text size="2xl" weight="bold" style={{ color: 'var(--color-purple-10)', marginTop: 4 }}>
                {adminUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('purple')}>
              <Shield size={24} style={{ color: 'var(--color-purple-10)' }} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>Workers</Text>
              <Text size="2xl" weight="bold" style={{ color: 'var(--color-blue-10)', marginTop: 4 }}>
                {workerUsers.length}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Users size={24} style={{ color: 'var(--color-blue-10)' }} />
            </div>
          </Row>
        </Card>
      </Row>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
        }}
      >
        <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
          <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
            Team Members
          </H2>
        </Stack>

        <Stack>
          {brokerUsers.map((user, index) => (
            <Stack
              key={user.id}
              padding={24}
              style={{
                borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <Row alignItems="center" justifyContent="space-between">
                <Row alignItems="center" gap={16}>
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: 'var(--color-blue-3)',
                      borderRadius: 9999,
                    }}
                  >
                    <Text size="lg" weight="semibold" style={{ color: 'var(--color-blue-10)' }}>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </Stack>
                  <Stack>
                    <Text size="md" weight="semibold">
                      {user.name}
                    </Text>
                    <Row alignItems="center" gap={16} style={{ marginTop: 4 }}>
                      <Row alignItems="center" gap={4}>
                        <Mail size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <Text size="sm" muted>{user.email}</Text>
                      </Row>
                      <Text
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 2,
                          paddingBottom: 2,
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          border: '1px solid',
                          backgroundColor: user.broker_role === 'admin' ? 'var(--color-purple-2)' : 'var(--color-blue-2)',
                          color: user.broker_role === 'admin' ? 'var(--color-purple-11)' : 'var(--color-blue-11)',
                          borderColor: user.broker_role === 'admin' ? 'var(--color-purple-6)' : 'var(--color-blue-6)',
                        }}
                      >
                        {user.broker_role === 'admin' ? 'Administrator' : 'Worker'}
                      </Text>
                    </Row>
                  </Stack>
                </Row>

                <Row alignItems="center" gap={8}>
                  <Button variant="ghost" color="gray" size="sm">
                    Edit Access
                  </Button>
                  <Button variant="ghost" color="gray" size="sm">
                    View Activity
                  </Button>
                </Row>
              </Row>

              <Stack style={{ marginTop: 16, paddingLeft: 64 }}>
                <Stack
                  style={{
                    backgroundColor: 'var(--color-gray-2)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Text size="xs" weight="medium" muted style={{ marginBottom: 8 }}>
                    CLIENT ASSIGNMENTS
                  </Text>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {clients.slice(0, 3).map((client) => (
                      <Text
                        key={client.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {client.company_name}
                      </Text>
                    ))}
                    {clients.length > 3 && (
                      <Text
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--color-blue-2)',
                          color: 'var(--color-blue-11)',
                        }}
                      >
                        +{clients.length - 3} more
                      </Text>
                    )}
                  </Row>
                </Stack>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card>

      {brokerUsers.length === 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 48,
          }}
        >
          <Stack alignItems="center">
            <Users size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
            <Text weight="medium" style={{ marginBottom: 8 }}>
              No team members yet
            </Text>
            <Text size="sm" muted style={{ marginBottom: 16 }}>
              Invite team members to collaborate
            </Text>
            <Button color="primary" iconStart={UserPlus} onPress={() => setIsInviteModalOpen(true)}>
              Invite Team Member
            </Button>
          </Stack>
        </Card>
      )}

      {/* Invite Team Member Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
        }}
      />
    </Stack>
  );
}
