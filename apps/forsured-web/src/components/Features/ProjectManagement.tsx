import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import { mockProjects, mockSubcontractors } from '../../utils/mockData';
import { Project } from '../../types';

export default function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    budget: '',
    startDate: '',
    endDate: '',
    projectManager: '',
    useDefaultInsurance: true,
    insuranceRequirements: {
      generalLiability: { required: true, minimumCoverage: 2000000 },
      workersCompensation: { required: true, minimumCoverage: 1000000 },
      professionalLiability: { required: false, minimumCoverage: 1000000 },
      commercialAuto: { required: false, minimumCoverage: 1000000 },
      umbrella: { required: false, minimumCoverage: 5000000 },
    },
  });
  const [isEditing, setIsEditing] = useState(false);

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedProject = selectedProjectId
    ? mockProjects.find((p) => p.id === selectedProjectId)
    : null;
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description || '',
      location: project.location || '',
      budget: project.budget?.toString() || '',
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate?.toISOString().split('T')[0] || '',
      projectManager: project.projectManager || '',
      useDefaultInsurance: false, // Assume existing projects have custom settings
      insuranceRequirements: {
        generalLiability: { required: true, minimumCoverage: 2000000 },
        workersCompensation: { required: true, minimumCoverage: 1000000 },
        professionalLiability: { required: false, minimumCoverage: 1000000 },
        commercialAuto: { required: false, minimumCoverage: 1000000 },
        umbrella: { required: false, minimumCoverage: 5000000 },
      },
    });
    setIsEditing(true);
    setShowNewProjectModal(true);
  };

  const resetForm = () => {
    setNewProject({
      name: '',
      description: '',
      location: '',
      budget: '',
      startDate: '',
      endDate: '',
      projectManager: '',
      useDefaultInsurance: true,
      insuranceRequirements: {
        generalLiability: { required: true, minimumCoverage: 2000000 },
        workersCompensation: { required: true, minimumCoverage: 1000000 },
        professionalLiability: { required: false, minimumCoverage: 1000000 },
        commercialAuto: { required: false, minimumCoverage: 1000000 },
        umbrella: { required: false, minimumCoverage: 5000000 },
      },
    });
    setEditingProject(null);
    setIsEditing(false);
  };

  const updateInsuranceRequirement = (
    type: string,
    field: string,
    value: unknown
  ) => {
    setNewProject((prev) => ({
      ...prev,
      insuranceRequirements: {
        ...prev.insuranceRequirements,
        [type]: {
          ...prev.insuranceRequirements[type],
          [field]: value,
        },
      },
    }));
  };

  // Calculate stats with safe array access
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(
    (p) => p.status === 'active'
  ).length;
  const completedProjects = mockProjects.filter(
    (p) => p.status === 'completed'
  ).length;
  const totalSubcontractors = mockProjects.reduce((acc, project) => {
    return acc + (project.subcontractors?.length || 0);
  }, 0);

  // If viewing project details, show detail view
  if (selectedProject) {
    const projectSubcontractors =
      selectedProject.subcontractors
        ?.map((id) => mockSubcontractors.find((s) => s.id === id))
        .filter(Boolean) || [];

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setSelectedProjectId(null)}
            variant="ghost"
            className="text-text-secondary hover:text-text-primary"
          >
            ← Back to Projects
          </Button>
        </div>

        {/* Project Header */}
        <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {selectedProject.name}
              </h1>
              {selectedProject.description && (
                <p className="text-text-secondary mb-4">
                  {selectedProject.description}
                </p>
              )}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Building className="text-text-tertiary" size={16} />
                  <span className="text-text-secondary">
                    {selectedProject.location || 'Location not specified'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="text-text-tertiary" size={16} />
                  <span className="text-text-secondary">
                    {selectedProject.startDate.toLocaleDateString()} -{' '}
                    {selectedProject.endDate?.toLocaleDateString() || 'Ongoing'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="text-text-tertiary" size={16} />
                  <span className="text-text-secondary">
                    {projectSubcontractors.length} subcontractors
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <StatusBadge status={selectedProject.status} size="lg" />
              <Button
                variant="primary"
                leftIcon={Edit}
                iconSize={16}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit Project
              </Button>
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Budget</p>
                <p className="text-2xl font-bold text-text-primary">
                  {selectedProject.budget
                    ? `$${(selectedProject.budget / 1000000).toFixed(1)}M`
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-success-100 p-3 rounded-full">
                <DollarSign className="text-success-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Subcontractors</p>
                <p className="text-2xl font-bold text-text-primary">
                  {projectSubcontractors.length}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <Users className="text-primary-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Phase</p>
                <p className="text-2xl font-bold text-text-primary">
                  {selectedProject.phase || 'N/A'}
                </p>
              </div>
              <div className="bg-secondary-100 p-3 rounded-full">
                <Building className="text-secondary-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Compliance</p>
                <p className="text-2xl font-bold text-text-primary">
                  <StatusBadge
                    status={selectedProject.complianceStatus}
                    showIcon={false}
                  />
                </p>
              </div>
              <div className="bg-secondary-100 p-3 rounded-full">
                <AlertTriangle className="text-secondary-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Subcontractors Section */}
        <div className="bg-surface rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Project Subcontractors
              </h2>
              <Button
                variant="primary"
                leftIcon={Plus}
                iconSize={16}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Subcontractor
              </Button>
            </div>
          </div>
          <div className="p-6">
            {projectSubcontractors.length > 0 ? (
              <div className="space-y-3">
                {projectSubcontractors.map((subcontractor) => (
                  <div
                    key={subcontractor.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-bg-tertiary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-text-secondary">
                          {subcontractor.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {subcontractor.name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {subcontractor.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={subcontractor.status} size="sm" />
                      <IconButton
                        icon={Eye}
                        size="sm"
                        variant="ghost"
                        tooltip="View subcontractor"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No subcontractors assigned</p>
                <p className="text-sm">Add subcontractors to this project</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Project Management
          </h1>
          <p className="text-text-secondary">
            Manage construction projects and track compliance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={Plus} iconSize={16}>
            Import
          </Button>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            variant="primary"
            leftIcon={Plus}
            iconSize={16}
            className="bg-blue-600 hover:bg-blue-700"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-text-primary">
                {totalProjects}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Building className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active</p>
              <p className="text-3xl font-bold text-success-600">
                {activeProjects}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-full">
              <CheckCircle className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Completed</p>
              <p className="text-3xl font-bold text-primary-600">
                {completedProjects}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">
                Total Subcontractors
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {totalSubcontractors}
              </p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <Users className="text-secondary-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="outline" leftIcon={Filter} iconSize={16}>
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Projects ({filteredProjects.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Insurance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-bg-secondary">
                  <td className="px-4 py-3 w-1/4">
                    <div>
                      <div className="text-sm font-medium text-text-primary truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {project.location || 'Location not specified'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/6">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/6">
                    <StatusBadge status={project.complianceStatus} />
                  </td>
                  <td className="px-4 py-3 w-1/4">
                    <div>
                      <div className="text-sm text-text-primary">
                        GL: $2,000,000
                      </div>
                      <div className="text-xs text-text-secondary">
                        WC: $1,000,000
                      </div>
                      <div className="text-xs text-text-secondary">
                        Auto: $1,000,000
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium w-1/6">
                    <div className="flex items-center space-x-2">
                      <IconButton
                        onClick={() => setSelectedProjectId(project.id)}
                        icon={Eye}
                        size="sm"
                        variant="primary"
                        tooltip="View project"
                      />
                      <IconButton
                        onClick={() => handleEditProject(project)}
                        icon={Edit}
                        size="sm"
                        variant="ghost"
                        tooltip="Edit project"
                      />
                      <IconButton
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        tooltip="Delete project"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border p-12 text-center">
          <Building size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No projects found
          </h3>
          <p className="text-text-secondary mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
              Create First Project
            </Button>
          )}
        </div>
      )}

      {/* New/Edit Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h3>
              <IconButton
                onClick={() => {
                  setShowNewProjectModal(false);
                  resetForm();
                }}
                icon={X}
                size="md"
                variant="ghost"
                tooltip="Close"
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log(
                  isEditing ? 'Updating project:' : 'Creating project:',
                  newProject
                );
                setShowNewProjectModal(false);
                resetForm();
              }}
              className="space-y-6"
            >
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the project scope and requirements"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Location and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, State"
                    value={newProject.location}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project budget"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        budget: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Start and End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newProject.startDate}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Project Manager */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Manager
                </label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Project manager name"
                  value={newProject.projectManager}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      projectManager: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Insurance Requirements */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-text-primary">
                    Insurance Requirements
                  </h4>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="insuranceSettings"
                        checked={newProject.useDefaultInsurance}
                        onChange={() =>
                          setNewProject((prev) => ({
                            ...prev,
                            useDefaultInsurance: true,
                          }))
                        }
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Use Default Settings
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="insuranceSettings"
                        checked={!newProject.useDefaultInsurance}
                        onChange={() =>
                          setNewProject((prev) => ({
                            ...prev,
                            useDefaultInsurance: false,
                          }))
                        }
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Custom Settings
                      </span>
                    </label>
                  </div>
                </div>

                {newProject.useDefaultInsurance ? (
                  <div className="bg-primary-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <div className="text-primary-600 mt-0.5">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-900 font-medium">
                          Using Company Default Insurance Settings
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          This project will use your company's default insurance
                          requirements. You can change this later if needed.
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-blue-800">
                          <div className="flex items-center justify-between">
                            <span>• General Liability:</span>
                            <span className="font-medium">
                              $2,000,000 (Required)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>• Workers Compensation:</span>
                            <span className="font-medium">
                              $1,000,000 (Required)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>• Professional Liability:</span>
                            <span className="font-medium">Optional</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>• Commercial Auto:</span>
                            <span className="font-medium">Optional</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>• Umbrella Policy:</span>
                            <span className="font-medium">Optional</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* General Liability */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-text-primary">
                            General Liability
                          </h5>
                          <p className="text-sm text-text-secondary">
                            Bodily injury and property damage coverage
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              newProject.insuranceRequirements.generalLiability
                                .required
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'generalLiability',
                                'required',
                                e.target.checked
                              )
                            }
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Required
                          </span>
                        </label>
                      </div>
                      {newProject.insuranceRequirements.generalLiability
                        .required && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Minimum Coverage
                          </label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={
                              newProject.insuranceRequirements.generalLiability
                                .minimumCoverage
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'generalLiability',
                                'minimumCoverage',
                                parseInt(e.target.value)
                              )
                            }
                          >
                            <option value={1000000}>$1,000,000</option>
                            <option value={2000000}>$2,000,000</option>
                            <option value={3000000}>$3,000,000</option>
                            <option value={5000000}>$5,000,000</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Workers Compensation */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-text-primary">
                            Workers Compensation
                          </h5>
                          <p className="text-sm text-text-secondary">
                            Employee injury and illness coverage
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              newProject.insuranceRequirements
                                .workersCompensation.required
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'workersCompensation',
                                'required',
                                e.target.checked
                              )
                            }
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Required
                          </span>
                        </label>
                      </div>
                      {newProject.insuranceRequirements.workersCompensation
                        .required && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Minimum Coverage
                          </label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={
                              newProject.insuranceRequirements
                                .workersCompensation.minimumCoverage
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'workersCompensation',
                                'minimumCoverage',
                                parseInt(e.target.value)
                              )
                            }
                          >
                            <option value={500000}>$500,000</option>
                            <option value={1000000}>$1,000,000</option>
                            <option value={1500000}>$1,500,000</option>
                            <option value={2000000}>$2,000,000</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Professional Liability */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-text-primary">
                            Professional Liability
                          </h5>
                          <p className="text-sm text-text-secondary">
                            Errors and omissions coverage
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              newProject.insuranceRequirements
                                .professionalLiability.required
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'professionalLiability',
                                'required',
                                e.target.checked
                              )
                            }
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Required
                          </span>
                        </label>
                      </div>
                      {newProject.insuranceRequirements.professionalLiability
                        .required && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Minimum Coverage
                          </label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={
                              newProject.insuranceRequirements
                                .professionalLiability.minimumCoverage
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'professionalLiability',
                                'minimumCoverage',
                                parseInt(e.target.value)
                              )
                            }
                          >
                            <option value={500000}>$500,000</option>
                            <option value={1000000}>$1,000,000</option>
                            <option value={2000000}>$2,000,000</option>
                            <option value={5000000}>$5,000,000</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Commercial Auto */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-text-primary">
                            Commercial Auto
                          </h5>
                          <p className="text-sm text-text-secondary">
                            Business vehicle coverage
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              newProject.insuranceRequirements.commercialAuto
                                .required
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'commercialAuto',
                                'required',
                                e.target.checked
                              )
                            }
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Required
                          </span>
                        </label>
                      </div>
                      {newProject.insuranceRequirements.commercialAuto
                        .required && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Minimum Coverage
                          </label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={
                              newProject.insuranceRequirements.commercialAuto
                                .minimumCoverage
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'commercialAuto',
                                'minimumCoverage',
                                parseInt(e.target.value)
                              )
                            }
                          >
                            <option value={500000}>$500,000</option>
                            <option value={1000000}>$1,000,000</option>
                            <option value={1500000}>$1,500,000</option>
                            <option value={2000000}>$2,000,000</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Umbrella Policy */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-text-primary">
                            Umbrella Policy
                          </h5>
                          <p className="text-sm text-text-secondary">
                            Additional liability protection
                          </p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              newProject.insuranceRequirements.umbrella.required
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'umbrella',
                                'required',
                                e.target.checked
                              )
                            }
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Required
                          </span>
                        </label>
                      </div>
                      {newProject.insuranceRequirements.umbrella.required && (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Minimum Coverage
                          </label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={
                              newProject.insuranceRequirements.umbrella
                                .minimumCoverage
                            }
                            onChange={(e) =>
                              updateInsuranceRequirement(
                                'umbrella',
                                'minimumCoverage',
                                parseInt(e.target.value)
                              )
                            }
                          >
                            <option value={1000000}>$1,000,000</option>
                            <option value={5000000}>$5,000,000</option>
                            <option value={10000000}>$10,000,000</option>
                            <option value={25000000}>$25,000,000</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  onClick={() => {
                    setShowNewProjectModal(false);
                    resetForm();
                  }}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
