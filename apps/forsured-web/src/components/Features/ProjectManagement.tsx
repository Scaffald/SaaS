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
import { YStack, XStack, Text, H1, H2, H3, Button, Card, Input, TextArea, Select, Spinner, Checkbox } from '@unicornlove/ui';
import StatusBadge from '../Common/StatusBadge';
import IconButton from '../Common/IconButton';
import Modal from '../Common/Modal';
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
      <YStack gap="$6">
        {/* Header with Back Button */}
        <XStack alignItems="center" gap="$4">
          <Button
            onClick={() => setSelectedProjectId(null)}
            variant="ghost"
            color="$color11"
            hoverStyle={{ color: "$color12" }}
          >
            ← Back to Projects
          </Button>
        </XStack>

        {/* Project Header */}
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
          <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$4">
            <YStack>
              <H1 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
                {selectedProject.name}
              </H1>
              {selectedProject.description && (
                <Text color="$color11" marginBottom="$4">
                  {selectedProject.description}
                </Text>
              )}
              <XStack alignItems="center" gap="$6" $gtMd={{ gap: "$6" }}>
                <XStack alignItems="center" gap="$2">
                  <Building color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">
                    {selectedProject.location || 'Location not specified'}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Calendar color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">
                    {selectedProject.startDate.toLocaleDateString()} -{' '}
                    {selectedProject.endDate?.toLocaleDateString() || 'Ongoing'}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Users color="$color10" size={16} />
                  <Text fontSize="$3" color="$color11">
                    {projectSubcontractors.length} subcontractors
                  </Text>
                </XStack>
              </XStack>
            </YStack>
            <XStack alignItems="center" gap="$4">
              <StatusBadge status={selectedProject.status} size="lg" />
              <Button
                variant="primary"
                backgroundColor="$blue10"
                hoverStyle={{ backgroundColor: "$blue11" }}
                icon={Edit}
                iconSize={16}
              >
                Edit Project
              </Button>
            </XStack>
          </XStack>
        </Card>

        {/* Project Stats */}
        <XStack flexWrap="wrap" gap="$6">
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text fontSize="$3" color="$color11">Budget</Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {selectedProject.budget
                    ? `$${(selectedProject.budget / 1000000).toFixed(1)}M`
                    : 'N/A'}
                </Text>
              </YStack>
              <YStack backgroundColor="$green2" padding="$3" borderRadius={9999}>
                <DollarSign color="$green10" size={20} />
              </YStack>
            </XStack>
          </Card>

          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text fontSize="$3" color="$color11">Subcontractors</Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {projectSubcontractors.length}
                </Text>
              </YStack>
              <YStack backgroundColor="$blue2" padding="$3" borderRadius={9999}>
                <Users color="$blue10" size={20} />
              </YStack>
            </XStack>
          </Card>

          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text fontSize="$3" color="$color11">Phase</Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {selectedProject.phase || 'N/A'}
                </Text>
              </YStack>
              <YStack backgroundColor="$gray2" padding="$3" borderRadius={9999}>
                <Building color="$gray10" size={20} />
              </YStack>
            </XStack>
          </Card>

          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <Text fontSize="$3" color="$color11">Compliance</Text>
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  <StatusBadge
                    status={selectedProject.complianceStatus}
                    showIcon={false}
                  />
                </Text>
              </YStack>
              <YStack backgroundColor="$gray2" padding="$3" borderRadius={9999}>
                <AlertTriangle color="$gray10" size={20} />
              </YStack>
            </XStack>
          </Card>
        </XStack>

        {/* Subcontractors Section */}
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor">
          <YStack padding="$6" borderBottomWidth={1} borderBottomColor="$borderColor">
            <XStack alignItems="center" justifyContent="space-between">
              <H2 fontSize="$6" fontWeight="600" color="$color12">
                Project Subcontractors
              </H2>
              <Button
                variant="primary"
                backgroundColor="$blue10"
                hoverStyle={{ backgroundColor: "$blue11" }}
                icon={Plus}
                iconSize={16}
              >
                Add Subcontractor
              </Button>
            </XStack>
          </YStack>
          <YStack padding="$6">
            {projectSubcontractors.length > 0 ? (
              <YStack gap="$3">
                {projectSubcontractors.map((subcontractor) => (
                  <Card
                    key={subcontractor.id}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3">
                        <YStack width={40} height={40} backgroundColor="$backgroundHover" borderRadius={9999} alignItems="center" justifyContent="center">
                          <Text fontSize="$3" fontWeight="500" color="$color11">
                          {subcontractor.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                          </Text>
                        </YStack>
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                          {subcontractor.name}
                          </Text>
                          <Text fontSize="$3" color="$color11">
                          {subcontractor.company}
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack alignItems="center" gap="$2">
                      <StatusBadge status={subcontractor.status} size="sm" />
                      <IconButton
                        icon={Eye}
                        size="sm"
                        variant="ghost"
                        tooltip="View subcontractor"
                      />
                      </XStack>
                    </XStack>
                  </Card>
                ))}
              </YStack>
            ) : (
              <YStack alignItems="center" paddingVertical="$8" gap="$3">
                <Users size={48} color="$color8" />
                <Text color="$color11">No subcontractors assigned</Text>
                <Text fontSize="$3" color="$color11">Add subcontractors to this project</Text>
              </YStack>
            )}
          </YStack>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$4">
        <YStack>
          <H1 fontSize="$8" fontWeight="700" color="$color12">
            Project Management
          </H1>
          <Text color="$color11">
            Manage construction projects and track compliance
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="ghost" icon={Plus} iconSize={16}>
            Import
          </Button>
          <Button
            onClick={() => setShowNewProjectModal(true)}
            variant="primary"
            backgroundColor="$blue10"
            hoverStyle={{ backgroundColor: "$blue11" }}
            icon={Plus}
            iconSize={16}
          >
            New Project
          </Button>
        </XStack>
      </XStack>

      {/* Stats Cards */}
      <XStack flexWrap="wrap" gap="$6">
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Total Projects</Text>
              <Text fontSize="$9" fontWeight="700" color="$color12">
                {totalProjects}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue2" padding="$3" borderRadius={9999}>
              <Building color="$blue10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Active</Text>
              <Text fontSize="$9" fontWeight="700" color="$green10">
                {activeProjects}
              </Text>
            </YStack>
            <YStack backgroundColor="$green2" padding="$3" borderRadius={9999}>
              <CheckCircle color="$green10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Completed</Text>
              <Text fontSize="$9" fontWeight="700" color="$blue10">
                {completedProjects}
              </Text>
            </YStack>
            <YStack backgroundColor="$blue2" padding="$3" borderRadius={9999}>
              <TrendingUp color="$blue10" size={24} />
            </YStack>
          </XStack>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" width="100%" $gtMd={{ width: '25%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">
                Total Subcontractors
              </Text>
              <Text fontSize="$9" fontWeight="700" color="$color12">
                {totalSubcontractors}
              </Text>
            </YStack>
            <YStack backgroundColor="$gray2" padding="$3" borderRadius={9999}>
              <Users color="$gray10" size={24} />
            </YStack>
          </XStack>
        </Card>
      </XStack>

      {/* Search and Filters */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$4">
        <XStack flexDirection="column" $gtSm={{ flexDirection: 'row' }} gap="$4">
          <XStack flex={1} position="relative">
            <Search
              position="absolute"
              left="$3"
              top="50%"
              transform="translateY(-50%)"
              color="$color10"
              size={20}
              zIndex={1}
            />
            <Input
              type="text"
              placeholder="Search projects..."
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </XStack>
          <XStack gap="$2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <Button variant="outline" icon={Filter} iconSize={16}>
              More Filters
            </Button>
          </XStack>
        </XStack>
      </Card>

      {/* Projects List */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor">
        <YStack padding="$6" borderBottomWidth={1} borderBottomColor="$borderColor">
          <H2 fontSize="$6" fontWeight="600" color="$color12">
            Projects ({filteredProjects.length})
          </H2>
        </YStack>
        <YStack gap={0}>
              {filteredProjects.map((project) => (
            <Card
              key={project.id}
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              padding="$4"
              hoverStyle={{ backgroundColor: "$backgroundHover" }}
            >
              <XStack alignItems="center" gap="$4" flexWrap="wrap">
                <YStack flex={1} minWidth={200}>
                  <Text fontSize="$3" fontWeight="500" color="$color12" numberOfLines={1}>
                        {project.name}
                  </Text>
                  <Text fontSize="$2" color="$color11" numberOfLines={1}>
                        {project.location || 'Location not specified'}
                  </Text>
                </YStack>
                <XStack alignItems="center" gap="$2" $gtMd={{ minWidth: 100 }}>
                    <StatusBadge status={project.status} />
                </XStack>
                <XStack alignItems="center" gap="$2" $gtMd={{ minWidth: 100 }}>
                    <StatusBadge status={project.complianceStatus} />
                </XStack>
                <YStack $gtMd={{ minWidth: 150 }}>
                  <Text fontSize="$3" color="$color12">
                        GL: $2,000,000
                  </Text>
                  <Text fontSize="$2" color="$color11">
                        WC: $1,000,000
                  </Text>
                  <Text fontSize="$2" color="$color11">
                        Auto: $1,000,000
                  </Text>
                </YStack>
                <XStack alignItems="center" gap="$2">
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
                </XStack>
              </XStack>
            </Card>
          ))}
        </YStack>
        </Card>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$12" alignItems="center">
          <Building size={48} color="$color8" marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="500" color="$color12" marginBottom="$2">
            No projects found
          </H3>
          <Text color="$color11" marginBottom="$4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by creating your first project'}
          </Text>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="primary"
              backgroundColor="$blue10"
              hoverStyle={{ backgroundColor: "$blue11" }}
              onClick={() => setShowNewProjectModal(true)}
            >
              Create First Project
            </Button>
          )}
        </Card>
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
        <YStack
          component="form"
              onSubmit={(e) => {
                e.preventDefault();
                console.log(
                  isEditing ? 'Updating project:' : 'Creating project:',
                  newProject
                );
                setShowNewProjectModal(false);
                resetForm();
              }}
          gap="$6"
            >
              {/* Project Name */}
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
              Project Name <Text color="$red10">*</Text>
            </Text>
            <Input
                  type="text"
                  required
              width="100%"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              paddingHorizontal="$3"
              paddingVertical="$2"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
          </YStack>

              {/* Project Description */}
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                  Description
            </Text>
            <TextArea
                  rows={3}
              width="100%"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              paddingHorizontal="$3"
              paddingVertical="$2"
                  placeholder="Describe the project scope and requirements"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
          </YStack>

              {/* Location and Budget */}
          <XStack flexWrap="wrap" gap="$4">
            <YStack flex={1} minWidth={200}>
              <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                Location <Text color="$red10">*</Text>
              </Text>
              <Input
                    type="text"
                    required
                width="100%"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2"
                    placeholder="City, State"
                    value={newProject.location}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
            </YStack>
            <YStack flex={1} minWidth={200}>
              <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                    Budget ($)
              </Text>
              <Input
                    type="number"
                width="100%"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2"
                    placeholder="Project budget"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        budget: e.target.value,
                      }))
                    }
                  />
            </YStack>
          </XStack>

              {/* Start and End Dates */}
          <XStack flexWrap="wrap" gap="$4">
            <YStack flex={1} minWidth={200}>
              <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                Start Date <Text color="$red10">*</Text>
              </Text>
              <Input
                    type="date"
                    required
                width="100%"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2"
                    value={newProject.startDate}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
            </YStack>
            <YStack flex={1} minWidth={200}>
              <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                    End Date
              </Text>
              <Input
                    type="date"
                width="100%"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
            </YStack>
          </XStack>

              {/* Project Manager */}
          <YStack>
            <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                  Project Manager
            </Text>
            <Input
                  type="text"
              width="100%"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              paddingHorizontal="$3"
              paddingVertical="$2"
                  placeholder="Project manager name"
                  value={newProject.projectManager}
                  onChange={(e) =>
                    setNewProject((prev) => ({
                      ...prev,
                      projectManager: e.target.value,
                    }))
                  }
                />
          </YStack>

              {/* Insurance Requirements */}
          <YStack>
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <H3 fontSize="$6" fontWeight="600" color="$color12">
                    Insurance Requirements
              </H3>
              <XStack alignItems="center" gap="$4">
                <XStack alignItems="center" gap="$2">
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
                  <Text fontSize="$3" color="$color12">
                        Use Default Settings
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
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
                  <Text fontSize="$3" color="$color12">
                        Custom Settings
                  </Text>
                </XStack>
              </XStack>
            </XStack>

                {newProject.useDefaultInsurance ? (
                  <Card backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4">
                    <XStack alignItems="flex-start" gap="$2">
                      <Info color="$blue10" size={20} marginTop={2} />
                      <YStack>
                        <Text fontSize="$3" color="$blue11" fontWeight="500">
                          Using Company Default Insurance Settings
                        </Text>
                        <Text fontSize="$3" color="$blue10" marginTop="$1">
                          This project will use your company's default insurance
                          requirements. You can change this later if needed.
                        </Text>
                        <YStack marginTop="$3" gap="$2">
                          <XStack alignItems="center" justifyContent="space-between">
                            <Text fontSize="$3" color="$blue11">• General Liability:</Text>
                            <Text fontSize="$3" color="$blue11" fontWeight="500">
                              $2,000,000 (Required)
                            </Text>
                          </XStack>
                          <XStack alignItems="center" justifyContent="space-between">
                            <Text fontSize="$3" color="$blue11">• Workers Compensation:</Text>
                            <Text fontSize="$3" color="$blue11" fontWeight="500">
                              $1,000,000 (Required)
                            </Text>
                          </XStack>
                          <XStack alignItems="center" justifyContent="space-between">
                            <Text fontSize="$3" color="$blue11">• Professional Liability:</Text>
                            <Text fontSize="$3" color="$blue11" fontWeight="500">Optional</Text>
                          </XStack>
                          <XStack alignItems="center" justifyContent="space-between">
                            <Text fontSize="$3" color="$blue11">• Commercial Auto:</Text>
                            <Text fontSize="$3" color="$blue11" fontWeight="500">Optional</Text>
                          </XStack>
                          <XStack alignItems="center" justifyContent="space-between">
                            <Text fontSize="$3" color="$blue11">• Umbrella Policy:</Text>
                            <Text fontSize="$3" color="$blue11" fontWeight="500">Optional</Text>
                          </XStack>
                        </YStack>
                      </YStack>
                    </XStack>
                  </Card>
                ) : (
                  <YStack gap="$4">
                    {/* General Liability */}
                    <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                            General Liability
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            Bodily injury and property damage coverage
                          </Text>
                        </YStack>
                        <XStack alignItems="center" gap="$2">
                          <Checkbox
                            checked={newProject.insuranceRequirements.generalLiability.required}
                            onCheckedChange={(checked) =>
                              updateInsuranceRequirement(
                                'generalLiability',
                                'required',
                                checked === true
                              )
                            }
                          />
                          <Text fontSize="$3" color="$color12">
                            Required
                          </Text>
                        </XStack>
                      </XStack>
                      {newProject.insuranceRequirements.generalLiability.required && (
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                            Minimum Coverage
                          </Text>
                          <Select
                            value={newProject.insuranceRequirements.generalLiability.minimumCoverage.toString()}
                            onValueChange={(value) =>
                              updateInsuranceRequirement(
                                'generalLiability',
                                'minimumCoverage',
                                parseInt(value)
                              )
                            }
                            options={[
                              { value: '1000000', label: '$1,000,000' },
                              { value: '2000000', label: '$2,000,000' },
                              { value: '3000000', label: '$3,000,000' },
                              { value: '5000000', label: '$5,000,000' },
                            ]}
                          />
                        </YStack>
                      )}
                    </Card>

                    {/* Workers Compensation */}
                    <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                            Workers Compensation
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            Employee injury and illness coverage
                          </Text>
                        </YStack>
                        <XStack alignItems="center" gap="$2">
                          <Checkbox
                            checked={newProject.insuranceRequirements.workersCompensation.required}
                            onCheckedChange={(checked) =>
                              updateInsuranceRequirement(
                                'workersCompensation',
                                'required',
                                checked === true
                              )
                            }
                          />
                          <Text fontSize="$3" color="$color12">
                            Required
                          </Text>
                        </XStack>
                      </XStack>
                      {newProject.insuranceRequirements.workersCompensation.required && (
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                            Minimum Coverage
                          </Text>
                          <Select
                            value={newProject.insuranceRequirements.workersCompensation.minimumCoverage.toString()}
                            onValueChange={(value) =>
                              updateInsuranceRequirement(
                                'workersCompensation',
                                'minimumCoverage',
                                parseInt(value)
                              )
                            }
                            options={[
                              { value: '500000', label: '$500,000' },
                              { value: '1000000', label: '$1,000,000' },
                              { value: '1500000', label: '$1,500,000' },
                              { value: '2000000', label: '$2,000,000' },
                            ]}
                          />
                        </YStack>
                      )}
                    </Card>

                    {/* Professional Liability */}
                    <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                            Professional Liability
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            Errors and omissions coverage
                          </Text>
                        </YStack>
                        <XStack alignItems="center" gap="$2">
                          <Checkbox
                            checked={newProject.insuranceRequirements.professionalLiability.required}
                            onCheckedChange={(checked) =>
                              updateInsuranceRequirement(
                                'professionalLiability',
                                'required',
                                checked === true
                              )
                            }
                          />
                          <Text fontSize="$3" color="$color12">
                            Required
                          </Text>
                        </XStack>
                      </XStack>
                      {newProject.insuranceRequirements.professionalLiability.required && (
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                            Minimum Coverage
                          </Text>
                          <Select
                            value={newProject.insuranceRequirements.professionalLiability.minimumCoverage.toString()}
                            onValueChange={(value) =>
                              updateInsuranceRequirement(
                                'professionalLiability',
                                'minimumCoverage',
                                parseInt(value)
                              )
                            }
                            options={[
                              { value: '500000', label: '$500,000' },
                              { value: '1000000', label: '$1,000,000' },
                              { value: '2000000', label: '$2,000,000' },
                              { value: '5000000', label: '$5,000,000' },
                            ]}
                          />
                        </YStack>
                      )}
                    </Card>

                    {/* Commercial Auto */}
                    <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                            Commercial Auto
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            Business vehicle coverage
                          </Text>
                        </YStack>
                        <XStack alignItems="center" gap="$2">
                          <Checkbox
                            checked={newProject.insuranceRequirements.commercialAuto.required}
                            onCheckedChange={(checked) =>
                              updateInsuranceRequirement(
                                'commercialAuto',
                                'required',
                                checked === true
                              )
                            }
                          />
                          <Text fontSize="$3" color="$color12">
                            Required
                          </Text>
                        </XStack>
                      </XStack>
                      {newProject.insuranceRequirements.commercialAuto.required && (
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                            Minimum Coverage
                          </Text>
                          <Select
                            value={newProject.insuranceRequirements.commercialAuto.minimumCoverage.toString()}
                            onValueChange={(value) =>
                              updateInsuranceRequirement(
                                'commercialAuto',
                                'minimumCoverage',
                                parseInt(value)
                              )
                            }
                            options={[
                              { value: '500000', label: '$500,000' },
                              { value: '1000000', label: '$1,000,000' },
                              { value: '1500000', label: '$1,500,000' },
                              { value: '2000000', label: '$2,000,000' },
                            ]}
                          />
                        </YStack>
                      )}
                    </Card>

                    {/* Umbrella Policy */}
                    <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                        <YStack>
                          <Text fontWeight="500" color="$color12">
                            Umbrella Policy
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            Additional liability protection
                          </Text>
                        </YStack>
                        <XStack alignItems="center" gap="$2">
                          <Checkbox
                            checked={newProject.insuranceRequirements.umbrella.required}
                            onCheckedChange={(checked) =>
                              updateInsuranceRequirement(
                                'umbrella',
                                'required',
                                checked === true
                              )
                            }
                          />
                          <Text fontSize="$3" color="$color12">
                            Required
                          </Text>
                        </XStack>
                      </XStack>
                      {newProject.insuranceRequirements.umbrella.required && (
                        <YStack>
                          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
                            Minimum Coverage
                          </Text>
                          <Select
                            value={newProject.insuranceRequirements.umbrella.minimumCoverage.toString()}
                            onValueChange={(value) =>
                              updateInsuranceRequirement(
                                'umbrella',
                                'minimumCoverage',
                                parseInt(value)
                              )
                            }
                            options={[
                              { value: '1000000', label: '$1,000,000' },
                              { value: '5000000', label: '$5,000,000' },
                              { value: '10000000', label: '$10,000,000' },
                              { value: '25000000', label: '$25,000,000' },
                            ]}
                          />
                        </YStack>
                      )}
                    </Card>
                  </YStack>
                )}
              </YStack>

              {/* Form Actions */}
          <XStack justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
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
              backgroundColor="$blue10"
              hoverStyle={{ backgroundColor: "$blue11" }}
                  size="lg"
                >
                  {isEditing ? 'Update Project' : 'Create Project'}
                </Button>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
