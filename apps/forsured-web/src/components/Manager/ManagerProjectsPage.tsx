import { useState, useEffect, useCallback } from 'react';
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
  X,
  Plus,
  Users,
  Loader2,
} from 'lucide-react';
import { EmptyState, YStack, XStack, Text, H1, H2, H3, Card, Input } from '@unicornlove/ui';
import { useProjects } from '../../hooks/useProjects';
import { DashboardSkeleton } from '../Common/SkeletonLoader';
import Button from '../Common/Button';
import { Project } from '../../types';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrganizationId } from '../../lib/supabase';
import { toast } from 'sonner';

interface Subcontractor {
  id: string;
  organization_id: string;
  name: string;
  company: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  trade_type?: string;
  status?: string;
  created_at: string;
}

interface ProjectSubcontractor {
  id: string;
  project_id: string;
  subcontractor_id: string;
  status: string;
  invited_at: string;
}

export default function ManagerProjectsPage() {
  const navigate = useNavigate();
  const { forsured } = useDatabase();
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Invite modal state
  const [inviteModalProject, setInviteModalProject] = useState<Project | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [existingInvites, setExistingInvites] = useState<ProjectSubcontractor[]>([]);
  const [loadingSubcontractors, setLoadingSubcontractors] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [inviteTab, setInviteTab] = useState<'select' | 'create'>('select');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
  });

  // Fetch organization ID
  useEffect(() => {
    async function fetchOrg() {
      if (user?.id) {
        const orgId = await getUserOrganizationId(user.id);
        setOrganizationId(orgId);
      }
    }
    fetchOrg();
  }, [user?.id]);

  // Fetch subcontractors when invite modal opens
  const fetchSubcontractors = useCallback(async () => {
    if (!inviteModalProject) return;

    setLoadingSubcontractors(true);
    try {
      // Fetch all subcontractors
      const { data: subs, error: subsError } = await forsured('subcontractors')
        .select('*')
        .order('company', { ascending: true });

      if (subsError) throw subsError;
      setSubcontractors(subs || []);

      // Fetch existing invites for this project
      const { data: invites, error: invitesError } = await forsured('project_subcontractors')
        .select('*')
        .eq('project_id', inviteModalProject.id);

      if (invitesError) throw invitesError;
      setExistingInvites(invites || []);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to load subcontractors');
    } finally {
      setLoadingSubcontractors(false);
    }
  }, [forsured, inviteModalProject]);

  useEffect(() => {
    if (inviteModalProject) {
      fetchSubcontractors();
    }
  }, [inviteModalProject, fetchSubcontractors]);

  // Handle inviting an existing subcontractor
  const handleInviteExisting = async () => {
    if (!selectedSubcontractorId || !inviteModalProject || !user?.id) return;

    setInviting(true);
    try {
      const { error } = await forsured('project_subcontractors')
        .insert({
          project_id: inviteModalProject.id,
          subcontractor_id: selectedSubcontractorId,
          invited_by: user.id,
          status: 'invited',
        });

      if (error) throw error;

      toast.success('Subcontractor invited to project');
      setInviteModalProject(null);
      setSelectedSubcontractorId(null);
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('This subcontractor is already invited to this project');
      } else {
        toast.error(error.message || 'Failed to invite subcontractor');
      }
    } finally {
      setInviting(false);
    }
  };

  // Handle creating and inviting a new subcontractor
  const handleCreateAndInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !inviteModalProject || !user?.id) return;

    if (!newSubForm.company.trim() || !newSubForm.name.trim()) {
      toast.error('Company name and contact name are required');
      return;
    }

    setInviting(true);
    try {
      // Create the subcontractor first
      const { data: newSub, error: createError } = await forsured('subcontractors')
        .insert({
          organization_id: organizationId,
          company: newSubForm.company.trim(),
          name: newSubForm.name.trim(),
          contact_info: {
            email: newSubForm.email.trim(),
            phone: newSubForm.phone.trim(),
          },
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Then invite them to the project
      const { error: inviteError } = await forsured('project_subcontractors')
        .insert({
          project_id: inviteModalProject.id,
          subcontractor_id: newSub.id,
          invited_by: user.id,
          status: 'invited',
        });

      if (inviteError) throw inviteError;

      toast.success('Subcontractor created and invited to project');
      setInviteModalProject(null);
      setNewSubForm({ company: '', name: '', email: '', phone: '' });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to create subcontractor');
    } finally {
      setInviting(false);
    }
  };

  // Close invite modal and reset state
  const closeInviteModal = () => {
    setInviteModalProject(null);
    setSelectedSubcontractorId(null);
    setInviteTab('select');
    setNewSubForm({ company: '', name: '', email: '', phone: '' });
  };

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
        return <CheckCircle color="$green10" size={18} />;
      case 'warning':
        return <AlertCircle color="$orange10" size={18} />;
      case 'critical':
        return <AlertCircle color="$red10" size={18} />;
      default:
        return <Shield color="$gray10" size={18} />;
    }
  };

  const getComplianceBadgeProps = (status: string) => {
    switch (status) {
      case 'compliant':
        return {
          backgroundColor: '$green2',
          color: '$green10',
          borderColor: '$green8',
        };
      case 'warning':
        return {
          backgroundColor: '$orange2',
          color: '$orange10',
          borderColor: '$orange8',
        };
      case 'critical':
        return {
          backgroundColor: '$red2',
          color: '$red10',
          borderColor: '$red8',
        };
      default:
        return {
          backgroundColor: '$gray2',
          color: '$gray10',
          borderColor: '$gray8',
        };
    }
  };
  const handleInviteUser = (project: Project) => {
    setInviteModalProject(project);
  };

  // Check if a subcontractor is already invited
  const isAlreadyInvited = (subId: string) => {
    return existingInvites.some((inv) => inv.subcontractor_id === subId);
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
      <YStack gap="$6">
        <YStack>
          <H1 fontSize="$9" fontWeight="700" color="$color12">Projects</H1>
          <Text color="$color11" fontSize="$4">
            Manage projects and insurance requirements
          </Text>
        </YStack>
        <EmptyState
          icon={FolderPlus}
          title="No Projects Yet"
          description="Create your first project to start managing subcontractor compliance and insurance requirements."
          action={{
            label: 'Create Project',
            onClick: () => navigate('/manager/projects/new'),
          }}
        />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
        <YStack flex={1}>
          <H1 fontSize="$9" fontWeight="700" color="$color12">Projects</H1>
          <Text color="$color11" fontSize="$4">
            Manage projects and insurance requirements
          </Text>
        </YStack>
        <Button
          variant="primary"
          size="$4"
          onPress={() => navigate('/manager/projects/new')}
        >
          <XStack alignItems="center" gap="$2">
            <FolderPlus size={18} />
            <Text>Add Project</Text>
          </XStack>
        </Button>
      </XStack>

      <XStack alignItems="center" gap="$6" fontSize="$3">
        <XStack alignItems="center">
          <Text fontWeight="600" color="$color12">{stats.total}</Text>
          <Text color="$color11" ml="$1">Projects</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center">
          <Text fontWeight="600" color="$green10">
            {stats.compliant}
          </Text>
          <Text color="$color11" ml="$1">Compliant</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center">
          <Text fontWeight="600" color="$orange10">
            {stats.warning}
          </Text>
          <Text color="$color11" ml="$1">Warning</Text>
        </XStack>
        <YStack height={16} width={1} backgroundColor="$borderColor" />
        <XStack alignItems="center">
          <Text fontWeight="600" color="$red10">{stats.critical}</Text>
          <Text color="$color11" ml="$1">Critical</Text>
        </XStack>
      </XStack>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6" elevation={1}>
        <XStack alignItems="center" justifyContent="space-between" mb="$4">
          <XStack alignItems="center" gap="$2">
            <Filter size={20} color="$color11" />
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Filter Projects
            </H2>
          </XStack>
          <XStack
            onPress={() => setComplianceFilter('all')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$3"
            fontWeight="500"
            color="$color11"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            hoverStyle={{ color: '$color12' }}
            cursor="pointer"
          >
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Clear Filters
            </Text>
          </XStack>
        </XStack>

        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
          <YStack flex={1} minWidth="calc(25% - 12px)" $gtMd={{ minWidth: 'calc(25% - 12px)' }}>
            <Text
              as="label"
              display="block"
              fontSize="$3"
              fontWeight="500"
              color="$color11"
              mb="$2"
            >
              Compliance Status
            </Text>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--background)',
                color: 'var(--color-12)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </YStack>
        </XStack>
      </Card>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" elevation={1} overflow="hidden">
        <YStack overflowX="auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--background-hover)' }}>
              <tr>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Project
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Status
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  GL
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  WC
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Auto
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Umbrella
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Prof
                </th>
                <th
                  scope="col"
                  style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--background)' }}>
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }}
                >
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack alignItems="center">
                      <YStack
                        width={40}
                        height={40}
                        backgroundColor="$blue2"
                        borderRadius="$4"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Building color="$blue10" size={20} />
                      </YStack>
                      <YStack ml="$4">
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {project.name}
                        </Text>
                        <Text fontSize="$3" color="$color11">
                          {project.location}
                        </Text>
                      </YStack>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <XStack alignItems="center" gap="$2">
                      {getComplianceIcon(project.compliance_status)}
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        fontSize="$1"
                        fontWeight="500"
                        borderRadius="$2"
                        borderWidth={1}
                        {...getComplianceBadgeProps(project.compliance_status)}
                      >
                        {project.compliance_status}
                      </Text>
                    </XStack>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color-12)', fontWeight: 500 }}>
                    {formatShortCurrency(project.general_liability_required)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color-12)', fontWeight: 500 }}>
                    {formatShortCurrency(project.workers_comp_required)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color-12)', fontWeight: 500 }}>
                    {formatShortCurrency(project.auto_liability_required)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color-12)', fontWeight: 500 }}>
                    {formatShortCurrency(project.umbrella_required)}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: 'var(--color-12)', fontWeight: 500 }}>
                    {formatShortCurrency(
                      project.professional_liability_required
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 500 }}>
                    <XStack alignItems="center" gap="$2">
                      <Button
                        variant="ghost"
                        size="$2"
                        onClick={() =>
                          navigate(`/manager/projects/${project.id}`)
                        }
                      >
                        <XStack alignItems="center" gap="$1">
                          <Eye size={14} />
                          <Text>View</Text>
                        </XStack>
                      </Button>
                      <Button
                        variant="ghost"
                        size="$2"
                        onClick={() => handleInviteUser(project)}
                      >
                        <XStack alignItems="center" gap="$1">
                          <UserPlus size={14} />
                          <Text>Invite</Text>
                        </XStack>
                      </Button>
                    </XStack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </YStack>

        {filteredProjects.length === 0 && (
          <YStack padding="$12" alignItems="center">
            <Building color="$color10" size={48} mb="$4" />
            <Text color="$color12" fontWeight="500" mb="$2">
              No projects found
            </Text>
            <Text color="$color11" fontSize="$3">
              Try adjusting your filters
            </Text>
          </YStack>
        )}
      </Card>

      {selectedProject && (
        <YStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          padding="$4"
        >
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            maxWidth={896}
            width="100%"
            maxHeight="90vh"
            overflowY="auto"
            elevation={10}
          >
            <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
              <XStack alignItems="center" justifyContent="space-between">
                <H2 fontSize="$8" fontWeight="700" color="$color12">
                  {selectedProject.name}
                </H2>
                <XStack
                  onPress={() => setSelectedProject(null)}
                  cursor="pointer"
                  hoverStyle={{ opacity: 0.8 }}
                >
                  <X size={24} color="$color11" />
                </XStack>
              </XStack>
            </YStack>

            <YStack padding="$6" gap="$6">
              <YStack>
                <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$2">
                  Description
                </H3>
                <Text color="$color12">
                  {selectedProject.description}
                </Text>
              </YStack>

              <XStack flexWrap="wrap" gap="$4">
                <YStack flex={1} minWidth="calc(50% - 8px)">
                  <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$2">
                    Location
                  </H3>
                  <Text color="$color12">
                    {selectedProject.location}
                  </Text>
                </YStack>
                <YStack flex={1} minWidth="calc(50% - 8px)">
                  <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$2">
                    Project Manager
                  </H3>
                  <Text color="$color12">
                    {selectedProject.project_manager}
                  </Text>
                </YStack>
              </XStack>

              <YStack>
                <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$3">
                  Insurance Requirements
                </H3>
                <XStack flexWrap="wrap" gap="$4">
                  {selectedProject.general_liability_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">
                        General Liability
                      </Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(
                          selectedProject.general_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.workers_comp_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">
                        Workers Comp
                      </Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(selectedProject.workers_comp_required)}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.auto_liability_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">
                        Auto Liability
                      </Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(
                          selectedProject.auto_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.umbrella_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">Umbrella</Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(selectedProject.umbrella_required)}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.professional_liability_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">
                        Professional Liability
                      </Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(
                          selectedProject.professional_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.pollution_liability_required && (
                    <Card padding="$3" backgroundColor="$backgroundHover" borderRadius="$4" flex={1} minWidth="calc(50% - 8px)">
                      <Text fontSize="$1" color="$color11">
                        Pollution Liability
                      </Text>
                      <Text fontSize="$7" fontWeight="600" color="$color12">
                        {formatCurrency(
                          selectedProject.pollution_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                </XStack>
              </YStack>

              {selectedProject.additional_insureds &&
                selectedProject.additional_insureds.length > 0 && (
                  <YStack>
                    <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$2">
                      Additional Insureds
                    </H3>
                    <YStack gap="$1">
                      {selectedProject.additional_insureds.map(
                        (insured, index) => (
                          <Text key={index} fontSize="$3" color="$color12">
                            • {insured}
                          </Text>
                        )
                      )}
                    </YStack>
                  </YStack>
                )}

              {selectedProject.special_provisions && (
                <YStack>
                  <H3 fontSize="$3" fontWeight="500" color="$color11" mb="$2">
                    Special Provisions
                  </H3>
                  <Text fontSize="$3" color="$color12">
                    {selectedProject.special_provisions}
                  </Text>
                </YStack>
              )}
            </YStack>
          </Card>
        </YStack>
      )}

      {/* Invite Subcontractor Modal */}
      {inviteModalProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeInviteModal}
        >
          <Card
            backgroundColor="$background"
            padding="$6"
            borderRadius="$4"
            width={560}
            maxWidth="95vw"
            maxHeight="85vh"
            overflow="scroll"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" mb="$4">
              <YStack>
                <H2 fontSize="$6" fontWeight="600" color="$color12">
                  Invite Subcontractor
                </H2>
                <Text fontSize="$3" color="$color11">
                  {inviteModalProject.name}
                </Text>
              </YStack>
              <XStack
                onPress={closeInviteModal}
                cursor="pointer"
                padding="$2"
                hoverStyle={{ backgroundColor: '$gray4' }}
                borderRadius="$2"
              >
                <X size={20} color="$color11" />
              </XStack>
            </XStack>

            {/* Tabs */}
            <XStack gap="$2" mb="$4">
              <Button
                variant={inviteTab === 'select' ? 'primary' : 'ghost'}
                size="$3"
                onPress={() => setInviteTab('select')}
              >
                <XStack alignItems="center" gap="$2">
                  <Users size={16} />
                  <Text>Select Existing</Text>
                </XStack>
              </Button>
              <Button
                variant={inviteTab === 'create' ? 'primary' : 'ghost'}
                size="$3"
                onPress={() => setInviteTab('create')}
              >
                <XStack alignItems="center" gap="$2">
                  <Plus size={16} />
                  <Text>Add New</Text>
                </XStack>
              </Button>
            </XStack>

            {/* Content */}
            {inviteTab === 'select' && (
              <YStack gap="$4">
                {loadingSubcontractors ? (
                  <XStack justifyContent="center" padding="$6">
                    <Loader2 size={24} className="animate-spin" />
                  </XStack>
                ) : subcontractors.length === 0 ? (
                  <YStack alignItems="center" padding="$6" gap="$2">
                    <Users size={32} color="$color10" />
                    <Text color="$color11">No subcontractors found</Text>
                    <Button
                      variant="ghost"
                      size="$2"
                      onPress={() => setInviteTab('create')}
                    >
                      <Text color="$teal10">Add your first subcontractor</Text>
                    </Button>
                  </YStack>
                ) : (
                  <>
                    <YStack gap="$2" maxHeight={300} overflow="scroll">
                      {subcontractors.map((sub) => {
                        const alreadyInvited = isAlreadyInvited(sub.id);
                        const isSelected = selectedSubcontractorId === sub.id;

                        return (
                          <XStack
                            key={sub.id}
                            alignItems="center"
                            padding="$3"
                            borderRadius="$3"
                            borderWidth={1}
                            borderColor={isSelected ? '$teal8' : '$borderColor'}
                            backgroundColor={isSelected ? '$teal2' : alreadyInvited ? '$gray3' : '$background'}
                            opacity={alreadyInvited ? 0.6 : 1}
                            cursor={alreadyInvited ? 'not-allowed' : 'pointer'}
                            hoverStyle={alreadyInvited ? {} : { backgroundColor: '$gray3' }}
                            onPress={() => {
                              if (!alreadyInvited) {
                                setSelectedSubcontractorId(isSelected ? null : sub.id);
                              }
                            }}
                            gap="$3"
                          >
                            <YStack
                              width={40}
                              height={40}
                              backgroundColor="$blue2"
                              borderRadius="$3"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Building size={20} color="$blue10" />
                            </YStack>
                            <YStack flex={1}>
                              <Text fontSize="$3" fontWeight="500" color="$color12">
                                {sub.company}
                              </Text>
                              <Text fontSize="$2" color="$color11">
                                {sub.name}
                                {sub.trade_type && ` • ${sub.trade_type}`}
                              </Text>
                            </YStack>
                            {alreadyInvited && (
                              <Text fontSize="$2" color="$green10" fontWeight="500">
                                Already invited
                              </Text>
                            )}
                            {isSelected && !alreadyInvited && (
                              <CheckCircle size={20} color="$teal10" />
                            )}
                          </XStack>
                        );
                      })}
                    </YStack>

                    <XStack gap="$3" justifyContent="flex-end">
                      <Button
                        variant="ghost"
                        size="$3"
                        onPress={closeInviteModal}
                      >
                        <Text>Cancel</Text>
                      </Button>
                      <Button
                        variant="primary"
                        size="$3"
                        disabled={!selectedSubcontractorId || inviting}
                        onPress={handleInviteExisting}
                      >
                        <XStack alignItems="center" gap="$2">
                          {inviting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserPlus size={16} />
                          )}
                          <Text>{inviting ? 'Inviting...' : 'Invite'}</Text>
                        </XStack>
                      </Button>
                    </XStack>
                  </>
                )}
              </YStack>
            )}

            {inviteTab === 'create' && (
              <form onSubmit={handleCreateAndInvite}>
                <YStack gap="$4">
                  <YStack gap="$2">
                    <Text as="label" fontSize="$3" fontWeight="500" color="$color11">
                      Company Name *
                    </Text>
                    <Input
                      placeholder="Enter company name"
                      value={newSubForm.company}
                      onChangeText={(text: string) =>
                        setNewSubForm((prev) => ({ ...prev, company: text }))
                      }
                    />
                  </YStack>

                  <YStack gap="$2">
                    <Text as="label" fontSize="$3" fontWeight="500" color="$color11">
                      Contact Name *
                    </Text>
                    <Input
                      placeholder="Enter contact name"
                      value={newSubForm.name}
                      onChangeText={(text: string) =>
                        setNewSubForm((prev) => ({ ...prev, name: text }))
                      }
                    />
                  </YStack>

                  <XStack gap="$4">
                    <YStack flex={1} gap="$2">
                      <Text as="label" fontSize="$3" fontWeight="500" color="$color11">
                        Email
                      </Text>
                      <Input
                        placeholder="email@company.com"
                        value={newSubForm.email}
                        onChangeText={(text: string) =>
                          setNewSubForm((prev) => ({ ...prev, email: text }))
                        }
                      />
                    </YStack>
                    <YStack flex={1} gap="$2">
                      <Text as="label" fontSize="$3" fontWeight="500" color="$color11">
                        Phone
                      </Text>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newSubForm.phone}
                        onChangeText={(text: string) =>
                          setNewSubForm((prev) => ({ ...prev, phone: text }))
                        }
                      />
                    </YStack>
                  </XStack>

                  <XStack gap="$3" justifyContent="flex-end" mt="$2">
                    <Button
                      variant="ghost"
                      size="$3"
                      onPress={closeInviteModal}
                      type="button"
                    >
                      <Text>Cancel</Text>
                    </Button>
                    <Button
                      variant="primary"
                      size="$3"
                      disabled={inviting || !newSubForm.company.trim() || !newSubForm.name.trim()}
                      type="submit"
                    >
                      <XStack alignItems="center" gap="$2">
                        {inviting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        <Text>{inviting ? 'Creating...' : 'Create & Invite'}</Text>
                      </XStack>
                    </Button>
                  </XStack>
                </YStack>
              </form>
            )}
          </Card>
        </div>
      )}
    </YStack>
  );
}
