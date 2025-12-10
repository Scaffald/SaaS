import React, { useState } from 'react';
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
  Filter,
} from 'lucide-react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-700';
      case 'manager':
        return 'bg-primary-100 text-primary-700';
      case 'user':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-success-600" size={16} />;
      case 'inactive':
        return <XCircle className="text-error-600" size={16} />;
      default:
        return <Clock className="text-warning-600" size={16} />;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            User Management
          </h1>
          <p className="text-text-secondary">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} leftIcon={UserPlus}>
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Users</p>
              <p className="text-3xl font-bold text-text-primary">
                {users.length}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Users</p>
              <p className="text-3xl font-bold text-success-600">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <CheckCircle className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Pending Invites</p>
              <p className="text-3xl font-bold text-warning-600">
                {pendingInvitations.length}
              </p>
            </div>
            <div className="bg-warning-100 p-3 rounded-lg">
              <Clock className="text-warning-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Admins</p>
              <p className="text-3xl font-bold text-error-600">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-error-100 p-3 rounded-lg">
              <Shield className="text-error-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
              fullWidth
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'user', label: 'User' },
            ]}
            fullWidth
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            fullWidth
          />
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Pending Invitations
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Mail className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {invitation.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        Invited {formatDate(invitation.invited_at)} • Role:{' '}
                        {invitation.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-primary-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {user.name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user.status)}
                      <span className="text-sm text-text-primary capitalize">
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {user.last_active ? formatDate(user.last_active) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedUser({
                            id: user.id,
                            name: user.name,
                            email: user.email || '',
                          })
                        }
                      >
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-text-tertiary mb-4" size={48} />
            <p className="text-text-primary font-medium mb-2">No users found</p>
            <p className="text-text-secondary text-sm">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>

      {/* User Invitation Modal */}
      <UserInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // Refresh would happen automatically via hooks
        }}
      />
    </div>
  );
}
