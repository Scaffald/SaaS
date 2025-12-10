import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Briefcase, CheckCircle, Clock } from 'lucide-react';
import ProjectCard from '../Shared/ProjectCard';

export default function SubcontractorProjectsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const mockProjects = [
    {
      id: '1',
      name: 'Downtown Office Complex',
      description: 'Electrical work for 12-story office building',
      client_id: '1',
      status: 'active' as const,
      start_date: '2024-01-15T00:00:00.000Z',
      end_date: '2024-12-31T00:00:00.000Z',
      location: 'Downtown Seattle, WA',
      contract_value: '450000',
      project_manager: 'Sarah Johnson',
      compliance_status: 'compliant' as const,
      notes: 'Assigned to Phase 2 electrical installation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Harbor View Medical Center',
      description: 'HVAC systems installation for new medical facility',
      client_id: '2',
      status: 'active' as const,
      start_date: '2024-02-01T00:00:00.000Z',
      end_date: '2025-06-30T00:00:00.000Z',
      location: 'Tacoma, WA',
      contract_value: '680000',
      project_manager: 'Lisa Chen',
      compliance_status: 'warning' as const,
      notes: 'Insurance renewal required by next month',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Residential Development Phase 1',
      description: 'Plumbing work for 150-unit residential development',
      client_id: '1',
      status: 'active' as const,
      start_date: '2024-03-01T00:00:00.000Z',
      end_date: '2024-08-31T00:00:00.000Z',
      location: 'Bellevue, WA',
      contract_value: '320000',
      project_manager: 'Robert Kim',
      compliance_status: 'compliant' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Green Valley Elementary School',
      description: 'Electrical systems for new elementary school',
      client_id: '3',
      status: 'completed' as const,
      start_date: '2023-03-01T00:00:00.000Z',
      end_date: '2023-12-15T00:00:00.000Z',
      location: 'Olympia, WA',
      contract_value: '285000',
      project_manager: 'Amanda Rodriguez',
      compliance_status: 'compliant' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const filteredProjects = mockProjects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'active';
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter((p) => p.status === 'active').length,
    completed: mockProjects.filter((p) => p.status === 'completed').length,
    totalValue: mockProjects
      .filter((p) => p.status === 'active')
      .reduce((acc, p) => acc + parseInt(p.contract_value || '0'), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Projects</h1>
        <p className="text-text-secondary">
          Track your active and completed projects
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
              <Clock className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Completed</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats.completed}
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
              <p className="text-text-secondary text-sm">Active Value</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-lg">
              <Briefcase className="text-secondary-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            All ({mockProjects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'active'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'completed'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            userRole="subcontractor"
            showActions={false}
            onClick={() => navigate(`/subcontractor/projects/${project.id}`)}
          />
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
              Adjust your filters or wait for project invitations
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
