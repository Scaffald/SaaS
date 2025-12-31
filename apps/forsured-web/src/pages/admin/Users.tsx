// src/pages/admin/Users.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCcw, Users as UsersIcon } from 'lucide-react';
import { YStack, XStack, Text, Button, H1, H2, H3, Card, Input, Spinner } from '@unicornlove/ui';
import { EmptyState } from '@unicornlove/ui';
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
      <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <XStack alignItems="center" gap="$2">
          <Spinner size="large" color="$blue10" />
          <Text>Loading users...</Text>
        </XStack>
      </YStack>
    );
  }

  if (error) {
    return (
      <Card padding="$6" borderRadius="$4" backgroundColor="$red4">
        <Text color="$red11">Error: {error}</Text>
        <Button onPress={handleRefresh} marginTop="$2" backgroundColor="transparent" padding={0}>
          <Text color="$blue10" textDecorationLine="underline">Try again</Text>
        </Button>
      </Card>
    );
  }

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="700">User Management</H1>
        <XStack gap="$3">
          <Button
            onPress={handleRefresh}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : <RefreshCcw size={16} />}
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderRadius="$4"
            hoverStyle={{ backgroundColor: "$backgroundHover" }}
            opacity={isLoading ? 0.5 : 1}
          >
            Refresh
          </Button>
        </XStack>
      </XStack>

      <Card padding="$6" borderRadius="$4" elevation={1} backgroundColor="$background" marginBottom="$6">
        <XStack alignItems="center" gap="$4" marginBottom="$4">
          <XStack position="relative" flex={1}>
            <Search
              size={18}
              color="$color10"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
            />
            <Input
              type="text"
              placeholder="Search by name, email, or company"
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderRadius="$4"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </XStack>
          <select
            id="roleFilter"
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--borderColor)',
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
              borderColor: 'var(--borderColor)',
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
        </XStack>

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
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Onboarding</th>
                <th style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{u.name}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{u.email}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <XStack alignItems="center" gap="$2">
                      <select
                        value={u.user_type}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserType)}
                        disabled={updatingUserId === u.id}
                        style={{
                          padding: '4px',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: 'var(--borderColor)',
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
                        <Spinner size="small" color="$blue10" />
                      )}
                    </XStack>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Text>{u.company || '—'}</Text>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={u.onboarding_completed ? '$green4' : '$yellow4'}
                    >
                      <Text fontSize="$1" color={u.onboarding_completed ? '$green11' : '$yellow11'}>
                        {u.onboarding_completed ? 'Complete' : 'In Progress'}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '8px 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--borderColor)' }}>
                    <Button
                      onPress={() => handleViewActivity(u.id)}
                      backgroundColor="transparent"
                      padding={0}
                    >
                      <Text color="$blue10" textDecorationLine="underline">View Activity</Text>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showActivityLog && (
          <Card marginTop="$6" padding="$4" borderWidth={1} borderRadius="$4" backgroundColor="$backgroundHover">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <H3 fontSize="$6" fontWeight="600">
                Activity Log for {users.find((u) => u.id === showActivityLog)?.name}
              </H3>
              <Button
                onPress={() => setShowActivityLog(null)}
                backgroundColor="transparent"
                padding="$1"
                hoverStyle={{ backgroundColor: "$background" }}
              >
                <Text color="$color11">Close</Text>
              </Button>
            </XStack>
            {activityLoading ? (
              <YStack alignItems="center" justifyContent="center" paddingVertical="$4">
                <Spinner size="small" color="$blue10" />
              </YStack>
            ) : userActivity.length === 0 ? (
              <Text color="$color11" fontSize="$3">No activity recorded</Text>
            ) : (
              <YStack gap="$2">
                {userActivity.map((activity) => (
                  <XStack key={activity.id} gap="$2">
                    <Text fontSize="$3" color="$color10">
                      [{new Date(activity.created_at).toLocaleString()}]
                    </Text>
                    <Text fontSize="$3" color="$color12">
                      {activity.action}
                      {activity.target_type && (
                        <Text fontSize="$3" color="$color11"> on {activity.target_type}</Text>
                      )}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}
          </Card>
        )}
      </Card>
    </YStack>
  );
}

export default AdminUsers;
