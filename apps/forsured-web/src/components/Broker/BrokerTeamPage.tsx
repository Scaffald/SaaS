import { useState } from 'react';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, Card } from '@unicornlove/ui';
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

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">
            Team Management
          </H1>
          <Text color="$color11">
            Manage your broker team and client assignments
          </Text>
        </YStack>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus size={18} />
          <Text ml="$2">Invite Team Member</Text>
        </Button>
      </XStack>

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
          minWidth="30%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Total Team Members</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" mt="$1">
                {brokerUsers.length}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Users color="$blue10" size={24} />
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
          minWidth="30%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Administrators</Text>
              <Text fontSize="$9" fontWeight="bold" color="$purple10" mt="$1">
                {adminUsers.length}
              </Text>
            </YStack>
            <YStack backgroundColor="$purple3" padding="$3" borderRadius="$4">
              <Shield color="$purple10" size={24} />
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
          minWidth="30%"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Workers</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" mt="$1">
                {workerUsers.length}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Users color="$blue10" size={24} />
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
      >
        <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            Team Members
          </H2>
        </YStack>

        <YStack>
          {brokerUsers.map((user, index) => (
            <YStack
              key={user.id}
              padding="$6"
              hoverStyle={{ backgroundColor: '$gray2' }}
              borderTopWidth={index > 0 ? 1 : 0}
              borderColor="$borderColor"
            >
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$4">
                  <YStack
                    width={48}
                    height={48}
                    backgroundColor="$blue3"
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$6" fontWeight="600" color="$blue10">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </YStack>
                  <YStack>
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      {user.name}
                    </Text>
                    <XStack alignItems="center" gap="$4" mt="$1">
                      <XStack alignItems="center" color="$color11" fontSize="$3">
                        <Mail size={14} mr="$1" color="$color11" />
                        <Text fontSize="$3" color="$color11">{user.email}</Text>
                      </XStack>
                      <XStack
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$2"
                        fontSize="$1"
                        fontWeight="500"
                        borderWidth={1}
                        backgroundColor={user.broker_role === 'admin' ? '$purple2' : '$blue2'}
                        color={user.broker_role === 'admin' ? '$purple11' : '$blue11'}
                        borderColor={user.broker_role === 'admin' ? '$purple6' : '$blue6'}
                      >
                        <Text fontSize="$1" fontWeight="500" color={user.broker_role === 'admin' ? '$purple11' : '$blue11'}>
                          {user.broker_role === 'admin'
                            ? 'Administrator'
                            : 'Worker'}
                        </Text>
                      </XStack>
                    </XStack>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$2">
                  <Button variant="ghost" size="sm">
                    Edit Access
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Activity
                  </Button>
                </XStack>
              </XStack>

              <YStack mt="$4" paddingLeft={64}>
                <YStack backgroundColor="$gray2" borderRadius="$4" padding="$4">
                  <Text fontSize="$1" fontWeight="500" color="$color11" mb="$2">
                    CLIENT ASSIGNMENTS
                  </Text>
                  <XStack flexWrap="wrap" gap="$2">
                    {clients.slice(0, 3).map((client) => (
                      <XStack
                        key={client.id}
                        alignItems="center"
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$1"
                        fontWeight="500"
                        backgroundColor="$background"
                        borderWidth={1}
                        borderColor="$borderColor"
                        color="$color12"
                      >
                        <Text fontSize="$1" fontWeight="500" color="$color12">
                          {client.company_name}
                        </Text>
                      </XStack>
                    ))}
                    {clients.length > 3 && (
                      <XStack
                        alignItems="center"
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$1"
                        fontWeight="500"
                        backgroundColor="$blue2"
                        color="$blue11"
                      >
                        <Text fontSize="$1" fontWeight="500" color="$blue11">
                          +{clients.length - 3} more
                        </Text>
                      </XStack>
                    )}
                  </XStack>
                </YStack>
              </YStack>
            </YStack>
          ))}
        </YStack>
      </Card>

      {brokerUsers.length === 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$12"
        >
          <YStack alignItems="center">
            <Users color="$color10" size={48} mb="$4" />
            <Text color="$color12" fontWeight="500" mb="$2">
              No team members yet
            </Text>
            <Text fontSize="$3" color="$color11" mb="$4">
              Invite team members to collaborate
            </Text>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus size={18} mr="$2" />
              Invite Team Member
            </Button>
          </YStack>
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
    </YStack>
  );
}
