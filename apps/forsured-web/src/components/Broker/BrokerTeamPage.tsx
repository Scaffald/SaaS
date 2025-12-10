import React from 'react';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useClients } from '../../hooks/useClients';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerTeamPage() {
  const { users, loading: usersLoading } = useUsers();
  const { clients, loading: clientsLoading } = useClients();

  const brokerUsers = users.filter((u) => u.role === 'broker');
  const adminUsers = brokerUsers.filter((u) => u.broker_role === 'admin');
  const workerUsers = brokerUsers.filter((u) => u.broker_role === 'worker');

  if (usersLoading || clientsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Team Management
          </h1>
          <p className="text-text-secondary">
            Manage your broker team and client assignments
          </p>
        </div>
        <Button
          onClick={() => {
            /* TODO: Implement invite modal */
          }}
          className="flex items-center space-x-2"
        >
          <UserPlus size={18} />
          <span>Invite Team Member</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Team Members</p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {brokerUsers.length}
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
              <p className="text-text-secondary text-sm">Administrators</p>
              <p className="text-3xl font-bold text-secondary-600 mt-1">
                {adminUsers.length}
              </p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Shield className="text-secondary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Workers</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {workerUsers.length}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Users className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Team Members
          </h2>
        </div>

        <div className="divide-y divide-border">
          {brokerUsers.map((user) => (
            <div
              key={user.id}
              className="p-6 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-600">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {user.name}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-text-secondary text-sm">
                        <Mail size={14} className="mr-1" />
                        {user.email}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.broker_role === 'admin'
                            ? 'bg-secondary-100 text-secondary-700 border border-secondary-300'
                            : 'bg-primary-100 text-primary-700 border border-primary-300'
                        }`}
                      >
                        {user.broker_role === 'admin'
                          ? 'Administrator'
                          : 'Worker'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    Edit Access
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Activity
                  </Button>
                </div>
              </div>

              <div className="mt-4 pl-16">
                <div className="bg-bg-secondary rounded-lg p-4">
                  <p className="text-xs font-medium text-text-secondary mb-2">
                    CLIENT ASSIGNMENTS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {clients.slice(0, 3).map((client) => (
                      <span
                        key={client.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface border border-border text-text-primary"
                      >
                        {client.company_name}
                      </span>
                    ))}
                    {clients.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        +{clients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {brokerUsers.length === 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border p-12">
          <div className="text-center">
            <Users className="mx-auto text-text-tertiary mb-4" size={48} />
            <p className="text-text-primary font-medium mb-2">
              No team members yet
            </p>
            <p className="text-text-secondary text-sm mb-4">
              Invite team members to collaborate
            </p>
            <Button>
              <UserPlus size={18} className="mr-2" />
              Invite Team Member
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
