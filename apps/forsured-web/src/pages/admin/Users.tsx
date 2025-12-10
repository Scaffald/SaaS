// src/pages/admin/Users.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCcw, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={handleRefresh} className="mt-2 text-blue-500 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="roleFilter" className="sr-only">
              Filter by Role
            </label>
            <select
              id="roleFilter"
              className="p-2 border rounded-md"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserType | 'all')}
            >
              <option value="all">All Roles</option>
              <option value="gc">GC</option>
              <option value="contractor">Contractor</option>
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="sr-only">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              className="p-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No users match the current filters'
              : 'No users found'}
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
                <th className="py-2 px-4 border-b text-left">Company</th>
                <th className="py-2 px-4 border-b text-left">Onboarding</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 px-4 border-b">{u.name}</td>
                  <td className="py-2 px-4 border-b">{u.email}</td>
                  <td className="py-2 px-4 border-b">
                    <select
                      value={u.user_type}
                      onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserType)}
                      disabled={updatingUserId === u.id}
                      className="p-1 border rounded-md text-sm disabled:opacity-50"
                    >
                      <option value="gc">GC</option>
                      <option value="contractor">Contractor</option>
                      <option value="broker">Broker</option>
                      <option value="admin">Admin</option>
                    </select>
                    {updatingUserId === u.id && (
                      <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{u.company || '—'}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        u.onboarding_completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {u.onboarding_completed ? 'Complete' : 'In Progress'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleViewActivity(u.id)}
                      className="text-blue-500 hover:underline"
                    >
                      View Activity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showActivityLog && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Activity Log for {users.find((u) => u.id === showActivityLog)?.name}
              </h3>
              <button
                onClick={() => setShowActivityLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            {activityLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
              </div>
            ) : userActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity recorded</p>
            ) : (
              <ul className="space-y-2">
                {userActivity.map((activity) => (
                  <li key={activity.id} className="text-sm text-gray-700">
                    <span className="text-gray-400">
                      [{new Date(activity.created_at).toLocaleString()}]
                    </span>{' '}
                    {activity.action}
                    {activity.target_type && (
                      <span className="text-gray-500"> on {activity.target_type}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
