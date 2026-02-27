// src/pages/admin/Users.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCcw, Users as UsersIcon } from 'lucide-react';
import { Stack, Row, Text, Button, H1, H3, Card, Input, Spinner } from '@scaffald/ui';
import { EmptyState } from '../../ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUsers,
  updateUserType,
  getUserActivity,
  AdminUser,
  UserActivity,
} from '../../services/adminUserService';

type UserType = 'gc' | 'contractor' | 'broker' | 'admin';
type UserStatus = 'active' | 'inactive';

function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [showActivityLog, setShowActivityLog] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: { user_type?: UserType; search?: string } = {};
      if (roleFilter !== 'all') {
        filters.user_type = roleFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      const data = await getUsers(filters);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesStatus;
  });

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleChangeUserRole = async (userId: string, newRole: UserType) => {
    if (!user?.id) return;

    setUpdatingUserId(userId);
    try {
      const updated = await updateUserType(user.id, userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, user_type: updated.user_type } : u))
      );
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleViewActivity = async (userId: string) => {
    setActivityLoading(true);
    setShowActivityLog(userId);
    try {
      const activity = await getUserActivity(userId, 20);
      setUserActivity(activity);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
      setUserActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
          <Spinner size="large" />
          <Text>Loading users...</Text>
        </Row>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-4)', backgroundColor: 'var(--color-red-4)' }}>
        <Text style={{ color: 'var(--color-red-11)' }}>Error: {error}</Text>
        <Button onPress={handleRefresh} variant="ghost" style={{ marginTop: 'var(--space-2)', padding: 0 }}>
          <Text style={{ color: 'var(--color-blue-10)', textDecoration: 'underline' }}>Try again</Text>
        </Button>
      </Card>
    );
  }

  return (
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 700 }}>User Management</H1>
        <Row style={{ gap: 'var(--space-3)' }}>
          <Button
            onPress={handleRefresh}
            disabled={isLoading}
            variant="outline"
            style={{ paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', borderRadius: 'var(--radius-4)', opacity: isLoading ? 0.5 : 1 }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
              {isLoading ? <Spinner size="small" /> : <RefreshCcw size={16} />}
              <span>Refresh</span>
            </Row>
          </Button>
        </Row>
      </Row>

      <Card style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-4)', backgroundColor: 'var(--color-background)', marginBottom: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <Row style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: 'var(--color-10)' }}
            />
            <Input
              type="text"
              placeholder="Search by name, email, or company"
              style={{ width: '100%', paddingLeft: 'var(--space-10)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', borderWidth: 1, borderRadius: 'var(--radius-4)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Row>
          <select
            id="roleFilter"
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              borderRadius: '12px',
              fontSize: 14,
            }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserType | 'all')}
          >
            <option value="all">All Roles</option>
            <option value="gc">GC</option>
            <option value="contractor">Contractor</option>
            <option value="broker">Broker</option>
            <option value="admin">Admin</option>
          </select>
          <select
            id="statusFilter"
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              borderRadius: '12px',
              fontSize: 14,
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Row>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No users match your filters'
              : 'No users found'}
            description={searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter criteria to find users.'
              : 'Users will appear here once they sign up or are added to the system.'}
          />
        ) : (
          <table style={{ width: '100%', minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Onboarding</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{u.name}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{u.email}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                      <select
                        value={u.user_type}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserType)}
                        disabled={updatingUserId === u.id}
                        style={{
                          padding: '4px',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: 'var(--color-border)',
                          borderRadius: '12px',
                          fontSize: 14,
                          opacity: updatingUserId === u.id ? 0.5 : 1,
                        }}
                      >
                        <option value="gc">GC</option>
                        <option value="contractor">Contractor</option>
                        <option value="broker">Broker</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingUserId === u.id && (
                        <Spinner size="small" />
                      )}
                    </Row>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Text>{u.company || '—'}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Row
                      style={{
                        paddingLeft: 'var(--space-2)',
                        paddingRight: 'var(--space-2)',
                        paddingTop: 'var(--space-1)',
                        paddingBottom: 'var(--space-1)',
                        borderRadius: 'var(--radius-2)',
                        backgroundColor: u.onboarding_completed ? 'var(--color-green-4)' : 'var(--color-yellow-4)',
                        display: 'inline-flex'
                      }}
                    >
                      <Text style={{ fontSize: 'var(--font-size-1)', color: u.onboarding_completed ? 'var(--color-green-11)' : 'var(--color-yellow-11)' }}>
                        {u.onboarding_completed ? 'Complete' : 'In Progress'}
                      </Text>
                    </Row>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                    <Button
                      onPress={() => handleViewActivity(u.id)}
                      variant="ghost"
                      style={{ padding: 0 }}
                    >
                      <Text style={{ color: 'var(--color-blue-10)', textDecoration: 'underline' }}>View Activity</Text>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showActivityLog && (
          <Card style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', borderWidth: 1, borderRadius: 'var(--radius-4)', backgroundColor: 'var(--color-background-hover)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <H3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600 }}>
                Activity Log for {users.find((u) => u.id === showActivityLog)?.name}
              </H3>
              <Button
                onPress={() => setShowActivityLog(null)}
                variant="ghost"
                style={{ padding: 'var(--space-1)' }}
              >
                <Text style={{ color: 'var(--color-11)' }}>Close</Text>
              </Button>
            </Row>
            {activityLoading ? (
              <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
                <Spinner size="small" />
              </Stack>
            ) : userActivity.length === 0 ? (
              <Text style={{ color: 'var(--color-11)', fontSize: 'var(--font-size-3)' }}>No activity recorded</Text>
            ) : (
              <Stack style={{ gap: 'var(--space-2)' }}>
                {userActivity.map((activity) => (
                  <Row key={activity.id} style={{ gap: 'var(--space-2)' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                      [{new Date(activity.created_at).toLocaleString()}]
                    </Text>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>
                      {activity.action}
                      {activity.target_type && (
                        <span style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}> on {activity.target_type}</span>
                      )}
                    </Text>
                  </Row>
                ))}
              </Stack>
            )}
          </Card>
        )}
      </Card>
    </Stack>
  );
}

export default AdminUsers;
