import { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';
import { YStack, XStack, Text, Button, Card, H1, H2, SizableText, Input } from '@unicornlove/ui';
import { useUsers } from '../../hooks/useUsers';
import { useUserInvitations } from '../../hooks/useUserInvitations';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { UserRoleRBAC, UserInvitation } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import UserInvitationModal from './UserInvitationModal';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function UserManagementPage() {
  const { users, loading: usersLoading } = useUsers();
  const {
    invitations,
    loading: invitationsLoading,
    updateInvitation,
    deleteInvitation,
  } = useUserInvitations();
  const { projects } = useProjects();
  const { clients } = useClients();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.status === 'active') ||
      (statusFilter === 'inactive' && user.status === 'inactive');
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending'
  );

  const getRoleBadgeColor = (role: string): { bg: string; text: string } => {
    switch (role) {
      case 'admin':
        return { bg: '$red2', text: '$red11' };
      case 'manager':
        return { bg: '$blue2', text: '$blue11' };
      case 'user':
        return { bg: '$green2', text: '$green11' };
      default:
        return { bg: '$color2', text: '$color11' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="var(--green10)" size={16} />;
      case 'inactive':
        return <XCircle color="var(--red10)" size={16} />;
      default:
        return <Clock color="var(--yellow10)" size={16} />;
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await updateInvitation(invitationId, {
        invited_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await deleteInvitation(invitationId);
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
      }
    }
  };

  if (usersLoading || invitationsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$9" fontWeight="700" color="$color12">
            User Management
          </H1>
          <SizableText fontSize="$4" color="$color11">
            Manage users, roles, and permissions
          </SizableText>
        </YStack>
        <Button onPress={() => setShowInviteModal(true)}>
          <XStack alignItems="center" gap="$2">
            <UserPlus size={16} />
            <Text>Invite User</Text>
          </XStack>
        </Button>
      </XStack>

      {/* Stats */}
      <XStack flexWrap="wrap" gap="$6">
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
          flex={1}
          minWidth={200}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <SizableText fontSize="$3" color="$color11">
                Total Users
              </SizableText>
              <Text fontSize="$10" fontWeight="700" color="$color12">
                {users.length}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue2" padding="$3" borderRadius="$4">
              <Users size={24} color="var(--blue10)" />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
          flex={1}
          minWidth={200}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <SizableText fontSize="$3" color="$color11">
                Active Users
              </SizableText>
              <Text fontSize="$10" fontWeight="700" color="$green10">
                {users.filter((u) => u.status === 'active').length}
              </Text>
            </YStack>
            <YStack backgroundColor="$green2" padding="$3" borderRadius="$4">
              <CheckCircle size={24} color="var(--green10)" />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
          flex={1}
          minWidth={200}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <SizableText fontSize="$3" color="$color11">
                Pending Invites
              </SizableText>
              <Text fontSize="$10" fontWeight="700" color="$yellow10">
                {pendingInvitations.length}
              </Text>
            </YStack>
            <YStack backgroundColor="$yellow2" padding="$3" borderRadius="$4">
              <Clock size={24} color="var(--yellow10)" />
            </YStack>
          </XStack>
        </Card>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$6"
          flex={1}
          minWidth={200}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <SizableText fontSize="$3" color="$color11">
                Admins
              </SizableText>
              <Text fontSize="$10" fontWeight="700" color="$red10">
                {users.filter((u) => u.role === 'admin').length}
              </Text>
            </YStack>
            <YStack backgroundColor="$red2" padding="$3" borderRadius="$4">
              <Shield size={24} color="var(--red10)" />
            </YStack>
          </XStack>
        </Card>
      </XStack>

      {/* Filters */}
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
      >
        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          gap="$4"
        >
          <XStack flex={1} position="relative" alignItems="center">
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, zIndex: 1 }}
              color="var(--color10)"
            />
            <Input
              type="text"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              width="100%"
              paddingLeft="$10"
            />
          </XStack>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--borderColor)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </XStack>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Pending Invitations
            </H2>
          </YStack>
          <YStack>
            {pendingInvitations.map((invitation, index) => (
              <YStack
                key={invitation.id}
                padding="$6"
                borderTopWidth={index > 0 ? 1 : 0}
                borderColor="$borderColor"
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap="$4">
                    <YStack
                      width={40}
                      height={40}
                      backgroundColor="$blue2"
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Mail size={20} color="var(--blue10)" />
                    </YStack>
                    <YStack>
                      <SizableText fontSize="$4" fontWeight="500" color="$color12">
                        {invitation.name}
                      </SizableText>
                      <SizableText fontSize="$3" color="$color11">
                        {invitation.email}
                      </SizableText>
                      <SizableText fontSize="$1" color="$color10" mt="$1">
                        Invited {formatDate(invitation.invited_at)} • Role:{' '}
                        {invitation.role}
                      </SizableText>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap="$2">
                    <Button
                      variant="outlined"
                      size="$2"
                      onPress={() => handleResendInvitation(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outlined"
                      size="$2"
                      backgroundColor="$red10"
                      color="white"
                      onPress={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </XStack>
                </XStack>
              </YStack>
            ))}
          </YStack>
        </Card>
      )}

      {/* Users Table */}
      <Card
        backgroundColor="$background"
        borderRadius="$4"
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color3)' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  User
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Last Active
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: 'var(--color11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const roleColors = getRoleBadgeColor(user.role);
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderTop: index > 0 ? '1px solid var(--borderColor)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--background)';
                    }}
                  >
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <XStack alignItems="center">
                        <YStack
                          width={40}
                          height={40}
                          backgroundColor="$blue2"
                          borderRadius={9999}
                          alignItems="center"
                          justifyContent="center"
                          mr="$3"
                        >
                          <SizableText fontSize="$3" fontWeight="500" color="$blue10">
                            {user.name.charAt(0).toUpperCase()}
                          </SizableText>
                        </YStack>
                        <YStack>
                          <SizableText fontSize="$3" fontWeight="500" color="$color12">
                            {user.name}
                          </SizableText>
                          <SizableText fontSize="$3" color="$color11">
                            {user.email}
                          </SizableText>
                        </YStack>
                      </XStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <YStack
                        alignItems="center"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={roleColors.bg as any}
                        alignSelf="flex-start"
                      >
                        <SizableText fontSize="$1" fontWeight="500" color={roleColors.text as any}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </SizableText>
                      </YStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <XStack alignItems="center" gap="$2">
                        {getStatusIcon(user.status)}
                        <SizableText fontSize="$3" color="$color12" textTransform="capitalize">
                          {user.status}
                        </SizableText>
                      </XStack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <SizableText fontSize="$3" color="$color11">
                        {user.last_active ? formatDate(user.last_active) : 'Never'}
                      </SizableText>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <XStack alignItems="center" justifyContent="flex-end" gap="$2">
                        <Button
                          variant="outlined"
                          size="$2"
                          onPress={() =>
                            setSelectedUser({
                              id: user.id,
                              name: user.name,
                              email: user.email || '',
                            })
                          }
                        >
                          <Edit size={14} />
                        </Button>
                        <Button variant="outlined" size="$2">
                          <Trash2 size={14} />
                        </Button>
                      </XStack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <YStack alignItems="center" paddingVertical="$12">
            <Users size={48} color="var(--color10)" />
            <Text fontSize="$4" fontWeight="500" color="$color12" mt="$4" mb="$2">
              No users found
            </Text>
            <SizableText fontSize="$3" color="$color11">
              Try adjusting your filters
            </SizableText>
          </YStack>
        )}
      </Card>

      {/* User Invitation Modal */}
      <UserInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // Refresh would happen automatically via hooks
        }}
      />
    </YStack>
  );
}
