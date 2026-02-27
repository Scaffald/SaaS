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
import { Stack, Row, Text, Button, Card, Input } from '@scaffald/ui';
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
        return { bg: 'var(--color-red-2)', text: 'var(--color-red-11)' };
      case 'manager':
        return { bg: 'var(--color-blue-2)', text: 'var(--color-blue-11)' };
      case 'user':
        return { bg: 'var(--color-green-2)', text: 'var(--color-green-11)' };
      default:
        return { bg: 'var(--color-2)', text: 'var(--color-11)' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="var(--color-green-10)" size={16} />;
      case 'inactive':
        return <XCircle color="var(--color-red-10)" size={16} />;
      default:
        return <Clock color="var(--color-yellow-10)" size={16} />;
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
    <Stack style={{ gap: '24px' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)', margin: 0 }}>
            User Management
          </h1>
          <Text style={{ fontSize: '16px', color: 'var(--color-11)' }}>
            Manage users, roles, and permissions
          </Text>
        </Stack>
        <Button onPress={() => setShowInviteModal(true)}>
          <Row style={{ alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} />
            <Text>Invite User</Text>
          </Row>
        </Button>
      </Row>

      {/* Stats */}
      <Row style={{ flexWrap: 'wrap', gap: '24px' }}>
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            flex: 1,
            minWidth: '200px',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                Total Users
              </Text>
              <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-12)' }}>
                {users.length}
              </Text>
            </Stack>
            <Stack style={{ backgroundColor: 'var(--color-blue-2)', padding: '12px', borderRadius: '8px' }}>
              <Users size={24} color="var(--color-blue-10)" />
            </Stack>
          </Row>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            flex: 1,
            minWidth: '200px',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                Active Users
              </Text>
              <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-green-10)' }}>
                {users.filter((u) => u.status === 'active').length}
              </Text>
            </Stack>
            <Stack style={{ backgroundColor: 'var(--color-green-2)', padding: '12px', borderRadius: '8px' }}>
              <CheckCircle size={24} color="var(--color-green-10)" />
            </Stack>
          </Row>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            flex: 1,
            minWidth: '200px',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                Pending Invites
              </Text>
              <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-yellow-10)' }}>
                {pendingInvitations.length}
              </Text>
            </Stack>
            <Stack style={{ backgroundColor: 'var(--color-yellow-2)', padding: '12px', borderRadius: '8px' }}>
              <Clock size={24} color="var(--color-yellow-10)" />
            </Stack>
          </Row>
        </Card>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            padding: '24px',
            flex: 1,
            minWidth: '200px',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                Admins
              </Text>
              <Text style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-red-10)' }}>
                {users.filter((u) => u.role === 'admin').length}
              </Text>
            </Stack>
            <Stack style={{ backgroundColor: 'var(--color-red-2)', padding: '12px', borderRadius: '8px' }}>
              <Shield size={24} color="var(--color-red-10)" />
            </Stack>
          </Row>
        </Card>
      </Row>

      {/* Filters */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: '16px',
        }}
      >
        <Row style={{ flexDirection: 'column', gap: '16px' }}>
          <Row style={{ flex: 1, position: 'relative', alignItems: 'center' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, zIndex: 1 }}
              color="var(--color-10)"
            />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              style={{ width: '100%', paddingLeft: '40px' }}
            />
          </Row>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
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
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Row>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}
        >
          <Stack style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-12)', margin: 0 }}>
              Pending Invitations
            </h2>
          </Stack>
          <Stack>
            {pendingInvitations.map((invitation, index) => (
              <Stack
                key={invitation.id}
                style={{
                  padding: '24px',
                  borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Row style={{ alignItems: 'center', gap: '16px' }}>
                    <Stack
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-blue-2)',
                        borderRadius: '9999px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        display: 'flex',
                      }}
                    >
                      <Mail size={20} color="var(--color-blue-10)" />
                    </Stack>
                    <Stack>
                      <Text style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-12)' }}>
                        {invitation.name}
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        {invitation.email}
                      </Text>
                      <Text style={{ fontSize: '12px', color: 'var(--color-10)', marginTop: '4px' }}>
                        Invited {formatDate(invitation.invited_at)} - Role:{' '}
                        {invitation.role}
                      </Text>
                    </Stack>
                  </Row>
                  <Row style={{ alignItems: 'center', gap: '8px' }}>
                    <Button
                      variant="outlined"
                      size="sm"
                      onPress={() => handleResendInvitation(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      color="error"
                      onPress={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </Row>
                </Row>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Users Table */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-3)' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  User
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Last Active
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    }}
                  >
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Row style={{ alignItems: 'center' }}>
                        <Stack
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'var(--color-blue-2)',
                            borderRadius: '9999px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            display: 'flex',
                          }}
                        >
                          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-blue-10)' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        </Stack>
                        <Stack>
                          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)' }}>
                            {user.name}
                          </Text>
                          <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                            {user.email}
                          </Text>
                        </Stack>
                      </Row>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Stack
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          borderRadius: '4px',
                          backgroundColor: roleColors.bg,
                        }}
                      >
                        <Text style={{ fontSize: '12px', fontWeight: 500, color: roleColors.text }}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Text>
                      </Stack>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Row style={{ alignItems: 'center', gap: '8px' }}>
                        {getStatusIcon(user.status)}
                        <Text style={{ fontSize: '14px', color: 'var(--color-12)', textTransform: 'capitalize' }}>
                          {user.status}
                        </Text>
                      </Row>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        {user.last_active ? formatDate(user.last_active) : 'Never'}
                      </Text>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <Row style={{ alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button
                          variant="outlined"
                          size="sm"
                          iconStart={Edit}
                          iconOnly
                          onPress={() =>
                            setSelectedUser({
                              id: user.id,
                              name: user.name,
                              email: user.email || '',
                            })
                          }
                        />
                        <Button variant="outlined" size="sm" iconStart={Trash2} iconOnly />
                      </Row>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <Stack style={{ alignItems: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <Users size={48} color="var(--color-10)" />
            <Text style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-12)', marginTop: '16px', marginBottom: '8px' }}>
              No users found
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
              Try adjusting your filters
            </Text>
          </Stack>
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
    </Stack>
  );
}
