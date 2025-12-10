import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Eye,
  UserPlus,
  Filter,
  Shield,
  AlertCircle,
  CheckCircle,
  FolderPlus,
} from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { useProjects } from '../../hooks/useProjects';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import Button from '../Common/Button';
import { Project } from '../../types';

export default function ManagerProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((project) => {
    if (
      complianceFilter !== 'all' &&
      project.compliance_status !== complianceFilter
    )
      return false;
    return true;
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="text-success-600" size={18} />;
      case 'warning':
        return <AlertCircle className="text-warning-600" size={18} />;
      case 'critical':
        return <AlertCircle className="text-error-600" size={18} />;
      default:
        return <Shield className="text-neutral-400" size={18} />;
    }
  };

  const getComplianceBadge = (status: string) => {
    const baseClasses =
      'inline-flex items-center px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'compliant':
        return `${baseClasses} bg-success-100 text-success-700 border border-success-300`;
      case 'warning':
        return `${baseClasses} bg-warning-100 text-warning-700 border border-warning-300`;
      case 'critical':
        return `${baseClasses} bg-error-100 text-error-700 border border-error-300`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-700 border border-neutral-300`;
    }
  };
  const handleInviteUser = (project: Project) => {
    console.log('Invite user to project:', project.id);
  };

  const getProjectStats = () => {
    return {
      total: projects.length,
      compliant: projects.filter((p) => p.compliance_status === 'compliant')
        .length,
      warning: projects.filter((p) => p.compliance_status === 'warning').length,
      critical: projects.filter((p) => p.compliance_status === 'critical')
        .length,
    };
  };

  const stats = getProjectStats();

  if (projectsLoading) {
    return <DashboardSkeleton />;
  }

  // Show empty state when no projects exist
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary">
            Manage projects and insurance requirements
          </p>
        </div>
        <EmptyState
          icon={FolderPlus}
          title="No Projects Yet"
          description="Create your first project to start managing subcontractor compliance and insurance requirements."
          action={{
            label: 'Create Project',
            onClick: () => navigate('/manager/projects/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <p className="text-text-secondary">
          Manage projects and insurance requirements
        </p>
      </div>

      <div className="flex items-center space-x-6 text-sm">
        <div>
          <span className="font-semibold text-text-primary">{stats.total}</span>
          <span className="text-text-secondary ml-1">Projects</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div>
          <span className="font-semibold text-success-600">
            {stats.compliant}
          </span>
          <span className="text-text-secondary ml-1">Compliant</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div>
          <span className="font-semibold text-warning-600">
            {stats.warning}
          </span>
          <span className="text-text-secondary ml-1">Warning</span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <div>
          <span className="font-semibold text-error-600">{stats.critical}</span>
          <span className="text-text-secondary ml-1">Critical</span>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">
              Filter Projects
            </h2>
          </div>
          <button
            onClick={() => setComplianceFilter('all')}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Compliance Status
            </label>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface text-text-primary"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-bg-secondary">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Project
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  GL
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  WC
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Auto
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Umbrella
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Prof
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-bg-secondary transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="text-primary-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">
                          {project.name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {project.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getComplianceIcon(project.compliance_status)}
                      <span
                        className={getComplianceBadge(
                          project.compliance_status
                        )}
                      >
                        {project.compliance_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatShortCurrency(project.general_liability_required)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatShortCurrency(project.workers_comp_required)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatShortCurrency(project.auto_liability_required)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatShortCurrency(project.umbrella_required)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {formatShortCurrency(
                      project.professional_liability_required
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/manager/projects/${project.id}`)
                        }
                        className="flex items-center space-x-1"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInviteUser(project)}
                        className="flex items-center space-x-1"
                      >
                        <UserPlus size={14} />
                        <span>Invite</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="p-12">
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

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">
                  {selectedProject.name}
                </h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-2">
                  Description
                </h3>
                <p className="text-text-primary">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">
                    Location
                  </h3>
                  <p className="text-text-primary">
                    {selectedProject.location}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">
                    Project Manager
                  </h3>
                  <p className="text-text-primary">
                    {selectedProject.project_manager}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-3">
                  Insurance Requirements
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedProject.general_liability_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">
                        General Liability
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          selectedProject.general_liability_required
                        )}
                      </p>
                    </div>
                  )}
                  {selectedProject.workers_comp_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">
                        Workers Comp
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(selectedProject.workers_comp_required)}
                      </p>
                    </div>
                  )}
                  {selectedProject.auto_liability_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">
                        Auto Liability
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          selectedProject.auto_liability_required
                        )}
                      </p>
                    </div>
                  )}
                  {selectedProject.umbrella_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">Umbrella</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(selectedProject.umbrella_required)}
                      </p>
                    </div>
                  )}
                  {selectedProject.professional_liability_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">
                        Professional Liability
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          selectedProject.professional_liability_required
                        )}
                      </p>
                    </div>
                  )}
                  {selectedProject.pollution_liability_required && (
                    <div className="p-3 bg-bg-secondary rounded-lg">
                      <p className="text-xs text-text-secondary">
                        Pollution Liability
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(
                          selectedProject.pollution_liability_required
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedProject.additional_insureds &&
                selectedProject.additional_insureds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-2">
                      Additional Insureds
                    </h3>
                    <div className="space-y-1">
                      {selectedProject.additional_insureds.map(
                        (insured, index) => (
                          <p key={index} className="text-sm text-text-primary">
                            • {insured}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedProject.special_provisions && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-2">
                    Special Provisions
                  </h3>
                  <p className="text-sm text-text-primary">
                    {selectedProject.special_provisions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
