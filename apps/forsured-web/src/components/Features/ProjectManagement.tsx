import { useState } from 'react';
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
  Info,
} from 'lucide-react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
import StatusBadge from '../Common/StatusBadge';
import IconButton from '../Common/IconButton';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { mockProjects, mockSubcontractors } from '../../utils/mockData';
import { Project } from '../../types';

export default function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
      useDefaultInsurance: false,
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
          ...(prev.insuranceRequirements as Record<string, { required: boolean; minimumCoverage: number }>)[type],
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
      <Stack style={{ gap: 24 }}>
        {/* Header with Back Button */}
        <Row style={{ alignItems: 'center', gap: 16 }}>
          <Button
            onClick={() => setSelectedProjectId(null)}
            variant="ghost"
          >
            ← Back to Projects
          </Button>
        </Row>

        {/* Project Header */}
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24 }}>
          <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <Stack>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)', marginBottom: 8 }}>
                {selectedProject.name}
              </Text>
              {selectedProject.description && (
                <Text style={{ color: 'var(--color-11)', marginBottom: 16 }}>
                  {selectedProject.description}
                </Text>
              )}
              <Row style={{ alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Building color="var(--color-10)" size={16} />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                    {selectedProject.location || 'Location not specified'}
                  </Text>
                </Row>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Calendar color="var(--color-10)" size={16} />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                    {selectedProject.startDate.toLocaleDateString()} -{' '}
                    {selectedProject.endDate?.toLocaleDateString() || 'Ongoing'}
                  </Text>
                </Row>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Users color="var(--color-10)" size={16} />
                  <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                    {projectSubcontractors.length} subcontractors
                  </Text>
                </Row>
              </Row>
            </Stack>
            <Row style={{ alignItems: 'center', gap: 16 }}>
              <StatusBadge status={selectedProject.status} size="lg" />
              <Button
                variant="primary"
              >
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Edit size={16} />
                  <Text style={{ color: 'white' }}>Edit Project</Text>
                </Row>
              </Button>
            </Row>
          </Row>
        </div>

        {/* Project Stats */}
        <Row style={{ flexWrap: 'wrap', gap: 24 }}>
          <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Budget</Text>
                <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                  {selectedProject.budget
                    ? `$${(selectedProject.budget / 1000000).toFixed(1)}M`
                    : 'N/A'}
                </Text>
              </Stack>
              <div style={{ backgroundColor: 'var(--color-green-2)', padding: 12, borderRadius: 9999 }}>
                <DollarSign color="var(--color-green-10)" size={20} />
              </div>
            </Row>
          </div>

          <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Subcontractors</Text>
                <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                  {projectSubcontractors.length}
                </Text>
              </Stack>
              <div style={{ backgroundColor: 'var(--color-blue-2)', padding: 12, borderRadius: 9999 }}>
                <Users color="var(--color-blue-10)" size={20} />
              </div>
            </Row>
          </div>

          <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Phase</Text>
                <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                  {selectedProject.phase || 'N/A'}
                </Text>
              </Stack>
              <div style={{ backgroundColor: 'var(--color-gray-2)', padding: 12, borderRadius: 9999 }}>
                <Building color="var(--color-gray-10)" size={20} />
              </div>
            </Row>
          </div>

          <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Compliance</Text>
                <StatusBadge
                  status={selectedProject.complianceStatus}
                  showIcon={false}
                />
              </Stack>
              <div style={{ backgroundColor: 'var(--color-gray-2)', padding: 12, borderRadius: 9999 }}>
                <AlertTriangle color="var(--color-gray-10)" size={20} />
              </div>
            </Row>
          </div>
        </Row>

        {/* Subcontractors Section */}
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)' }}>
          <Stack style={{ padding: 24, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                Project Subcontractors
              </Text>
              <Button variant="primary">
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Plus size={16} />
                  <Text style={{ color: 'white' }}>Add Subcontractor</Text>
                </Row>
              </Button>
            </Row>
          </Stack>
          <Stack style={{ padding: 24 }}>
            {projectSubcontractors.length > 0 ? (
              <Stack style={{ gap: 12 }}>
                {projectSubcontractors.map((subcontractor) => (
                  <div
                    key={subcontractor?.id}
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Row style={{ alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-background-hover)', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                          {subcontractor?.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                          </Text>
                        </div>
                        <Stack>
                          <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                          {subcontractor?.name}
                          </Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          {subcontractor?.company}
                          </Text>
                        </Stack>
                      </Row>
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={subcontractor?.status || 'pending'} size="sm" />
                      <IconButton
                        icon={Eye}
                        size="sm"
                        variant="ghost"
                        tooltip="View subcontractor"
                      />
                      </Row>
                    </Row>
                  </div>
                ))}
              </Stack>
            ) : (
              <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, gap: 12 }}>
                <Users size={48} color="var(--color-8)" />
                <Text style={{ color: 'var(--color-11)' }}>No subcontractors assigned</Text>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Add subcontractors to this project</Text>
              </Stack>
            )}
          </Stack>
        </div>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Stack>
          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
            Project Management
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>
            Manage construction projects and track compliance
          </Text>
        </Stack>
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <Button variant="ghost">
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Plus size={16} />
              <Text>Import</Text>
            </Row>
          </Button>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            variant="primary"
          >
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Plus size={16} />
              <Text style={{ color: 'white' }}>New Project</Text>
            </Row>
          </Button>
        </Row>
      </Row>

      {/* Stats Cards */}
      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Total Projects</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                {totalProjects}
              </Text>
            </Stack>
            <div style={{ backgroundColor: 'var(--color-blue-2)', padding: 12, borderRadius: 9999 }}>
              <Building color="var(--color-blue-10)" size={24} />
            </div>
          </Row>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Active</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-green-10)' }}>
                {activeProjects}
              </Text>
            </Stack>
            <div style={{ backgroundColor: 'var(--color-green-2)', padding: 12, borderRadius: 9999 }}>
              <CheckCircle color="var(--color-green-10)" size={24} />
            </div>
          </Row>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Completed</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-blue-10)' }}>
                {completedProjects}
              </Text>
            </Stack>
            <div style={{ backgroundColor: 'var(--color-blue-2)', padding: 12, borderRadius: 9999 }}>
              <TrendingUp color="var(--color-blue-10)" size={24} />
            </div>
          </Row>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '22%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                Total Subcontractors
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                {totalSubcontractors}
              </Text>
            </Stack>
            <div style={{ backgroundColor: 'var(--color-gray-2)', padding: 12, borderRadius: 9999 }}>
              <Users color="var(--color-gray-10)" size={24} />
            </div>
          </Row>
        </div>
      </Row>

      {/* Search and Filters */}
      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 16 }}>
        <Row style={{ gap: 16, flexWrap: 'wrap' }}>
          <Row style={{ flex: 1, position: 'relative' }}>
            <Search
              size={20}
              color="var(--color-10)"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            />
            <input
              type="text"
              placeholder="Search projects..."
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Row>
          <Row style={{ gap: 8 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
                backgroundColor: 'var(--color-background)',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="outline">
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Filter size={16} />
                <Text>More Filters</Text>
              </Row>
            </Button>
          </Row>
        </Row>
      </div>

      {/* Projects List */}
      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)' }}>
        <Stack style={{ padding: 24, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
          <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
            Projects ({filteredProjects.length})
          </Text>
        </Stack>
        <Stack>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              style={{
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
                borderBottomColor: 'var(--color-border)',
                padding: 16,
              }}
            >
              <Row style={{ alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Stack style={{ flex: 1, minWidth: 200 }}>
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                    {project.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                    {project.location || 'Location not specified'}
                  </Text>
                </Stack>
                <Row style={{ alignItems: 'center', gap: 8, minWidth: 100 }}>
                  <StatusBadge status={project.status} />
                </Row>
                <Row style={{ alignItems: 'center', gap: 8, minWidth: 100 }}>
                  <StatusBadge status={project.complianceStatus} />
                </Row>
                <Stack style={{ minWidth: 150 }}>
                  <Text style={{ fontSize: 14, color: 'var(--color-12)' }}>
                    GL: $2,000,000
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                    WC: $1,000,000
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                    Auto: $1,000,000
                  </Text>
                </Stack>
                <Row style={{ alignItems: 'center', gap: 8 }}>
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
                </Row>
              </Row>
            </div>
          ))}
        </Stack>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Building size={48} color="var(--color-8)" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
            No projects found
          </Text>
          <Text style={{ color: 'var(--color-11)', marginBottom: 16 }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by creating your first project'}
          </Text>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="primary"
              onClick={() => setShowNewProjectModal(true)}
            >
              Create First Project
            </Button>
          )}
        </div>
      )}

      {/* New/Edit Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => {
          setShowNewProjectModal(false);
          resetForm();
        }}
        title={isEditing ? 'Edit Project' : 'Create New Project'}
        size="large"
      >
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
        >
          <Stack style={{ gap: 24 }}>
            {/* Project Name */}
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                Project Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <input
                type="text"
                required
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
                placeholder="Enter project name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Stack>

            {/* Project Description */}
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                Description
              </Text>
              <textarea
                rows={3}
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
                placeholder="Describe the project scope and requirements"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Stack>

            {/* Location and Budget */}
            <Row style={{ flexWrap: 'wrap', gap: 16 }}>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  Location <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                </Text>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                  placeholder="City, State"
                  value={newProject.location}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </Stack>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  Budget ($)
                </Text>
                <input
                  type="number"
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                  placeholder="Project budget"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      budget: e.target.value,
                    }))
                  }
                />
              </Stack>
            </Row>

            {/* Start and End Dates */}
            <Row style={{ flexWrap: 'wrap', gap: 16 }}>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  Start Date <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                </Text>
                <input
                  type="date"
                  required
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                  value={newProject.startDate}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </Stack>
              <Stack style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  End Date
                </Text>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                  value={newProject.endDate}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </Stack>
            </Row>

            {/* Project Manager */}
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                Project Manager
              </Text>
              <input
                type="text"
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
                placeholder="Project manager name"
                value={newProject.projectManager}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    projectManager: e.target.value,
                  }))
                }
              />
            </Stack>

            {/* Insurance Requirements */}
            <Stack>
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                  Insurance Requirements
                </Text>
                <Row style={{ alignItems: 'center', gap: 16 }}>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
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
                    />
                    <Text style={{ fontSize: 14, color: 'var(--color-12)' }}>
                      Use Default Settings
                    </Text>
                  </Row>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
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
                    />
                    <Text style={{ fontSize: 14, color: 'var(--color-12)' }}>
                      Custom Settings
                    </Text>
                  </Row>
                </Row>
              </Row>

              {newProject.useDefaultInsurance ? (
                <div style={{ backgroundColor: 'var(--color-blue-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-blue-6)', borderRadius: 8, padding: 16 }}>
                  <Row style={{ alignItems: 'flex-start', gap: 8 }}>
                    <Info color="var(--color-blue-10)" size={20} style={{ marginTop: 2 }} />
                    <Stack>
                      <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>
                        Using Company Default Insurance Settings
                      </Text>
                      <Text style={{ fontSize: 14, color: 'var(--color-blue-10)', marginTop: 4 }}>
                        This project will use your company's default insurance
                        requirements. You can change this later if needed.
                      </Text>
                      <Stack style={{ marginTop: 12, gap: 8 }}>
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>* General Liability:</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>
                            $2,000,000 (Required)
                          </Text>
                        </Row>
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>* Workers Compensation:</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>
                            $1,000,000 (Required)
                          </Text>
                        </Row>
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>* Professional Liability:</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>Optional</Text>
                        </Row>
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>* Commercial Auto:</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>Optional</Text>
                        </Row>
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>* Umbrella Policy:</Text>
                          <Text style={{ fontSize: 14, color: 'var(--color-blue-11)', fontWeight: 500 }}>Optional</Text>
                        </Row>
                      </Stack>
                    </Stack>
                  </Row>
                </div>
              ) : (
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                  Custom insurance settings form would go here...
                </Text>
              )}
            </Stack>

            {/* Form Actions */}
            <Row style={{ justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}>
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
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </Row>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
