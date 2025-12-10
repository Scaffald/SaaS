import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, AlertTriangle, Shield, Users } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import { useCompliance } from '../../hooks/useCompliance';
import ClientsTable from './ClientsTable';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import { BrokerClient } from '../../types';

export default function BrokerClientsPage() {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();
  const { complianceData, loading: complianceLoading } = useCompliance();

  const getClientStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const highRiskClients = clients.filter(
      (c) => c.risk_level === 'high'
    ).length;
    const avgComplianceScore =
      clients.reduce((acc, c) => acc + c.compliance_score, 0) /
      (totalClients || 1);

    return {
      total: totalClients,
      active: activeClients,
      highRisk: highRiskClients,
      avgCompliance: Math.round(avgComplianceScore),
    };
  };

  const stats = getClientStats();

  if (clientsLoading || policiesLoading || projectsLoading || complianceLoading) {
    return <DashboardSkeleton />;
  }

  // Show empty state when no clients exist
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-text-secondary">
            Manage your client portfolio and monitor compliance
          </p>
        </div>
        <EmptyState
          icon={Users}
          title="No Clients Yet"
          description="Start building your client portfolio by adding your first client. You'll be able to manage their policies, track compliance, and monitor risk."
          action={{
            label: 'Add Client',
            onClick: () => navigate('/broker/clients/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
        <p className="text-text-secondary">
          Manage your client portfolio and monitor compliance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Clients</p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Briefcase className="text-primary-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            {stats.active} active accounts
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Avg Compliance</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats.avgCompliance}%
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <Shield className="text-success-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-success-600">
            <TrendingUp size={14} className="inline mr-1" />
            Above target
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">High Risk</p>
              <p className="text-3xl font-bold text-error-600 mt-1">
                {stats.highRisk}
              </p>
            </div>
            <div className="bg-error-100 p-3 rounded-lg">
              <AlertTriangle className="text-error-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            Require attention
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Projects</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {projects.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Briefcase className="text-primary-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            Across all clients
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Client Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-secondary mb-2">By Type</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">
                  General Contractors
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {
                    clients.filter(
                      (c) => c.client_type === 'general_contractor'
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">
                  Subcontractors
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {
                    clients.filter((c) => c.client_type === 'subcontractor')
                      .length
                  }
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-2">By Risk Level</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success-600">Low Risk</span>
                <span className="text-sm font-semibold text-text-primary">
                  {clients.filter((c) => c.risk_level === 'low').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-warning-600">Medium Risk</span>
                <span className="text-sm font-semibold text-text-primary">
                  {clients.filter((c) => c.risk_level === 'medium').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-error-600">High Risk</span>
                <span className="text-sm font-semibold text-text-primary">
                  {clients.filter((c) => c.risk_level === 'high').length}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-2">Active Policies</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Total Active</span>
                <span className="text-sm font-semibold text-text-primary">
                  {policies.filter((p) => p.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-warning-600">Expiring Soon</span>
                <span className="text-sm font-semibold text-text-primary">
                  {policies.filter((p) => p.status === 'expiring').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientsTable
        clients={clients}
        policies={policies}
        gcOnly={true}
        complianceData={complianceData}
        projects={projects}
        onClientClick={(client: BrokerClient) => {
          // Navigate to GC profile for general contractors, client profile for others
          if (client.client_type === 'general_contractor') {
            navigate(`/broker/gcs/${client.id}`);
          } else {
            navigate(`/broker/clients/${client.id}`);
          }
        }}
      />
    </div>
  );
}
