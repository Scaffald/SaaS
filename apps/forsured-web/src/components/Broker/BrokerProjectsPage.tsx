import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Filter, Eye, Shield, Calendar } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import ProjectCard from '../Shared/ProjectCard';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');

  const filteredProjects = projects.filter((project) => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;
    if (clientFilter !== 'all' && project.client_id !== clientFilter)
      return false;
    if (
      complianceFilter !== 'all' &&
      project.compliance_status !== complianceFilter
    )
      return false;
    return true;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Client';
  };

  const getProjectStats = () => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      compliant: projects.filter((p) => p.compliance_status === 'compliant')
        .length,
      needsAttention: projects.filter(
        (p) =>
          p.compliance_status === 'critical' ||
          p.compliance_status === 'warning'
      ).length,
    };
  };

  const stats = getProjectStats();

  if (projectsLoading || clientsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <p className="text-text-secondary">
          Manage all client projects and monitor compliance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Building className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Projects</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {stats.active}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Eye className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Compliant</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats.compliant}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <Shield className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Needs Attention</p>
              <p className="text-3xl font-bold text-warning-600 mt-1">
                {stats.needsAttention}
              </p>
            </div>
            <div className="bg-warning-100 p-3 rounded-lg">
              <Calendar className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">
              Filter Projects
            </h2>
          </div>
          <button
            onClick={() => {
              setStatusFilter('all');
              setClientFilter('all');
              setComplianceFilter('all');
            }}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Compliance
            </label>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Compliance Levels</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="relative">
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-surface px-3 py-1 rounded-full border border-border shadow-sm">
                <p className="text-xs font-medium text-text-secondary">
                  {getClientName(project.client_id)}
                </p>
              </div>
            </div>
            <div className="pt-8">
              <ProjectCard
                project={project}
                userRole="broker"
                showActions={false}
                onClick={() => navigate(`/broker/projects/${project.id}`)}
              />
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border p-12">
          <div className="text-center">
            <Building className="mx-auto text-text-tertiary mb-4" size={48} />
            <p className="text-text-primary font-medium mb-2">
              No projects found
            </p>
            <p className="text-text-secondary text-sm">
              Try adjusting your filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
