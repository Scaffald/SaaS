import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { Stack, Row, Text, H1, H2, H3, Card, Input } from '@unicornlove/beyond-ui';
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

const getComplianceBadgeStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'compliant':
      return {
        backgroundColor: 'var(--color-green2)',
        color: 'var(--color-green10)',
        border: '1px solid var(--color-green8)',
      };
    case 'warning':
      return {
        backgroundColor: 'var(--color-orange2)',
        color: 'var(--color-orange10)',
        border: '1px solid var(--color-orange8)',
      };
    case 'critical':
      return {
        backgroundColor: 'var(--color-red2)',
        color: 'var(--color-red10)',
        border: '1px solid var(--color-red8)',
      };
    default:
      return {
        backgroundColor: 'var(--color-gray2)',
        color: 'var(--color-gray10)',
        border: '1px solid var(--color-gray8)',
      };
  }
};

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
        return <CheckCircle color="var(--color-green10)" size={18} />;
      case 'warning':
        return <AlertCircle color="var(--color-orange10)" size={18} />;
      case 'critical':
        return <AlertCircle color="var(--color-red10)" size={18} />;
      default:
        return <Shield color="var(--color-gray10)" size={18} />;
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
      <Stack style={{ gap: 24 }}>
        <Stack>
          <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>Projects</H1>
          <Text style={{ color: 'var(--color-11)', fontSize: 16 }}>
            Manage projects and insurance requirements
          </Text>
        </Stack>
        <Stack
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            backgroundColor: 'var(--background)',
          }}
        >
          <FolderPlus size={48} color="var(--color-10)" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
            No Projects Yet
          </Text>
          <Text style={{ color: 'var(--color-11)', textAlign: 'center', marginBottom: 24 }}>
            Create your first project to start managing subcontractor compliance and insurance requirements.
          </Text>
          <Button
            color="primary"
            iconStart={FolderPlus}
            onPress={() => navigate('/manager/projects/new')}
          >
            Create Project
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <Stack style={{ flex: 1 }}>
          <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>Projects</H1>
          <Text style={{ color: 'var(--color-11)', fontSize: 16 }}>
            Manage projects and insurance requirements
          </Text>
        </Stack>
        <Button
          color="primary"
          iconStart={FolderPlus}
          onPress={() => navigate('/manager/projects/new')}
        >
          Add Project
        </Button>
      </Row>

      <Row style={{ alignItems: 'center', gap: 24, fontSize: 14 }}>
        <Row style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>{stats.total}</Text>
          <Text style={{ color: 'var(--color-11)', marginLeft: 4 }}>Projects</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 600, color: 'var(--color-green10)' }}>
            {stats.compliant}
          </Text>
          <Text style={{ color: 'var(--color-11)', marginLeft: 4 }}>Compliant</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 600, color: 'var(--color-orange10)' }}>
            {stats.warning}
          </Text>
          <Text style={{ color: 'var(--color-11)', marginLeft: 4 }}>Warning</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 600, color: 'var(--color-red10)' }}>{stats.critical}</Text>
          <Text style={{ color: 'var(--color-11)', marginLeft: 4 }}>Critical</Text>
        </Row>
      </Row>

      <Card
        variant="outlined"
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 8,
          padding: 24,
        }}
      >
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Row style={{ alignItems: 'center', gap: 8 }}>
            <Filter size={20} color="var(--color-11)" />
            <H2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
              Filter Projects
            </H2>
          </Row>
          <div
            onClick={() => setComplianceFilter('all')}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-11)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
              Clear Filters
            </Text>
          </div>
        </Row>

        <Row wrap style={{ gap: 16 }}>
          <Stack style={{ flex: 1, minWidth: 'calc(25% - 12px)' }}>
            <Text
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-11)',
                marginBottom: 8,
              }}
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
          </Stack>
        </Row>
      </Card>

      <Card
        variant="outlined"
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
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
                    <Row style={{ alignItems: 'center' }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'var(--color-blue2)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building color="var(--color-blue10)" size={20} />
                      </div>
                      <Stack style={{ marginLeft: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                          {project.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          {project.location}
                        </Text>
                      </Stack>
                    </Row>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      {getComplianceIcon(project.compliance_status)}
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 4,
                          ...getComplianceBadgeStyle(project.compliance_status),
                        }}
                      >
                        {project.compliance_status}
                      </span>
                    </Row>
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
                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      <Button
                        variant="ghost"
                        onPress={() =>
                          navigate(`/manager/projects/${project.id}`)
                        }
                      >
                        <Row style={{ alignItems: 'center', gap: 4 }}>
                          <Eye size={14} />
                          <Text>View</Text>
                        </Row>
                      </Button>
                      <Button
                        variant="ghost"
                        onPress={() => handleInviteUser(project)}
                      >
                        <Row style={{ alignItems: 'center', gap: 4 }}>
                          <UserPlus size={14} />
                          <Text>Invite</Text>
                        </Row>
                      </Button>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <Stack style={{ padding: 48, alignItems: 'center' }}>
            <Building color="var(--color-10)" size={48} style={{ marginBottom: 16 }} />
            <Text style={{ color: 'var(--color-12)', fontWeight: 500, marginBottom: 8 }}>
              No projects found
            </Text>
            <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>
              Try adjusting your filters
            </Text>
          </Stack>
        )}
      </Card>

      {selectedProject && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <Card
            style={{
              backgroundColor: 'var(--background)',
              borderRadius: 8,
              maxWidth: 896,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Stack style={{ padding: 24, borderBottom: '1px solid var(--color-border)' }}>
              <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <H2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-12)' }}>
                  {selectedProject.name}
                </H2>
                <div
                  onClick={() => setSelectedProject(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <X size={24} color="var(--color-11)" />
                </div>
              </Row>
            </Stack>

            <Stack style={{ padding: 24, gap: 24 }}>
              <Stack>
                <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                  Description
                </H3>
                <Text style={{ color: 'var(--color-12)' }}>
                  {selectedProject.description}
                </Text>
              </Stack>

              <Row wrap style={{ gap: 16 }}>
                <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                  <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Location
                  </H3>
                  <Text style={{ color: 'var(--color-12)' }}>
                    {selectedProject.location}
                  </Text>
                </Stack>
                <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                  <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Project Manager
                  </H3>
                  <Text style={{ color: 'var(--color-12)' }}>
                    {selectedProject.project_manager}
                  </Text>
                </Stack>
              </Row>

              <Stack>
                <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 12 }}>
                  Insurance Requirements
                </H3>
                <Row wrap style={{ gap: 16 }}>
                  {selectedProject.general_liability_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                        General Liability
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(
                          selectedProject.general_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.workers_comp_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                        Workers Comp
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(selectedProject.workers_comp_required)}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.auto_liability_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                        Auto Liability
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(
                          selectedProject.auto_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.umbrella_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>Umbrella</Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(selectedProject.umbrella_required)}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.professional_liability_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                        Professional Liability
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(
                          selectedProject.professional_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                  {selectedProject.pollution_liability_required && (
                    <Card style={{ padding: 12, backgroundColor: 'var(--background-hover)', borderRadius: 8, flex: 1, minWidth: 'calc(50% - 8px)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                        Pollution Liability
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)' }}>
                        {formatCurrency(
                          selectedProject.pollution_liability_required
                        )}
                      </Text>
                    </Card>
                  )}
                </Row>
              </Stack>

              {selectedProject.additional_insureds &&
                selectedProject.additional_insureds.length > 0 && (
                  <Stack>
                    <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                      Additional Insureds
                    </H3>
                    <Stack style={{ gap: 4 }}>
                      {selectedProject.additional_insureds.map(
                        (insured, index) => (
                          <Text key={index} style={{ fontSize: 14, color: 'var(--color-12)' }}>
                            - {insured}
                          </Text>
                        )
                      )}
                    </Stack>
                  </Stack>
                )}

              {selectedProject.special_provisions && (
                <Stack>
                  <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)', marginBottom: 8 }}>
                    Special Provisions
                  </H3>
                  <Text style={{ fontSize: 14, color: 'var(--color-12)' }}>
                    {selectedProject.special_provisions}
                  </Text>
                </Stack>
              )}
            </Stack>
          </Card>
        </div>
      )}

      {/* Invite Subcontractor Modal - using React portal */}
      {inviteModalProject && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={closeInviteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: 24,
              borderRadius: 16,
              width: 560,
              maxWidth: '95vw',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Stack>
                <H2 id="invite-modal-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                  Invite Subcontractor
                </H2>
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                  {inviteModalProject.name}
                </Text>
              </Stack>
              <button
                onClick={closeInviteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close modal"
              >
                <X size={20} color="var(--color-11)" />
              </button>
            </Row>

            {/* Tabs */}
            <Row style={{ gap: 8, marginBottom: 16 }}>
              <Button
                variant={inviteTab === 'select' ? 'primary' : 'ghost'}
                onPress={() => setInviteTab('select')}
              >
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Users size={16} />
                  <Text>Select Existing</Text>
                </Row>
              </Button>
              <Button
                variant={inviteTab === 'create' ? 'primary' : 'ghost'}
                onPress={() => setInviteTab('create')}
              >
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Plus size={16} />
                  <Text>Add New</Text>
                </Row>
              </Button>
            </Row>

            {/* Content */}
            {inviteTab === 'select' && (
              <Stack style={{ gap: 16 }}>
                {loadingSubcontractors ? (
                  <Row style={{ justifyContent: 'center', padding: 24 }}>
                    <Loader2 size={24} className="animate-spin" />
                  </Row>
                ) : subcontractors.length === 0 ? (
                  <Stack style={{ alignItems: 'center', padding: 24, gap: 8 }}>
                    <Users size={32} color="var(--color-10)" />
                    <Text style={{ color: 'var(--color-11)' }}>No subcontractors found</Text>
                    <Button
                      variant="ghost"
                      onPress={() => setInviteTab('create')}
                    >
                      <Text style={{ color: 'var(--color-teal10)' }}>Add your first subcontractor</Text>
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <Stack style={{ gap: 8, maxHeight: 300, overflow: 'auto' }}>
                      {subcontractors.map((sub) => {
                        const alreadyInvited = isAlreadyInvited(sub.id);
                        const isSelected = selectedSubcontractorId === sub.id;

                        return (
                          <Row
                            key={sub.id}
                            onPress={() => {
                              if (!alreadyInvited) {
                                setSelectedSubcontractorId(isSelected ? null : sub.id);
                              }
                            }}
                            style={{
                              alignItems: 'center',
                              padding: 12,
                              borderRadius: 6,
                              border: `1px solid ${isSelected ? 'var(--color-teal8)' : 'var(--color-border)'}`,
                              backgroundColor: isSelected ? 'var(--color-teal2)' : alreadyInvited ? 'var(--color-gray3)' : 'var(--background)',
                              opacity: alreadyInvited ? 0.6 : 1,
                              cursor: alreadyInvited ? 'not-allowed' : 'pointer',
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: 'var(--color-blue2)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Building size={20} color="var(--color-blue10)" />
                            </div>
                            <Stack style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)' }}>
                                {sub.company}
                              </Text>
                              <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                                {sub.name}
                                {sub.trade_type && ` - ${sub.trade_type}`}
                              </Text>
                            </Stack>
                            {alreadyInvited && (
                              <Text style={{ fontSize: 12, color: 'var(--color-green10)', fontWeight: 500 }}>
                                Already invited
                              </Text>
                            )}
                            {isSelected && !alreadyInvited && (
                              <CheckCircle size={20} color="var(--color-teal10)" />
                            )}
                          </Row>
                        );
                      })}
                    </Stack>

                    <Row style={{ gap: 12, justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        onPress={closeInviteModal}
                      >
                        <Text>Cancel</Text>
                      </Button>
                      <Button
                        variant="primary"
                        disabled={!selectedSubcontractorId || inviting}
                        onPress={handleInviteExisting}
                      >
                        <Row style={{ alignItems: 'center', gap: 8 }}>
                          {inviting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserPlus size={16} />
                          )}
                          <Text>{inviting ? 'Inviting...' : 'Invite'}</Text>
                        </Row>
                      </Button>
                    </Row>
                  </>
                )}
              </Stack>
            )}

            {inviteTab === 'create' && (
              <form onSubmit={handleCreateAndInvite}>
                <Stack style={{ gap: 16 }}>
                  <Stack style={{ gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                      Company Name *
                    </Text>
                    <Input
                      placeholder="Enter company name"
                      value={newSubForm.company}
                      onChangeText={(text: string) =>
                        setNewSubForm((prev) => ({ ...prev, company: text }))
                      }
                    />
                  </Stack>

                  <Stack style={{ gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                      Contact Name *
                    </Text>
                    <Input
                      placeholder="Enter contact name"
                      value={newSubForm.name}
                      onChangeText={(text: string) =>
                        setNewSubForm((prev) => ({ ...prev, name: text }))
                      }
                    />
                  </Stack>

                  <Row style={{ gap: 16 }}>
                    <Stack style={{ flex: 1, gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                        Email
                      </Text>
                      <Input
                        placeholder="email@company.com"
                        value={newSubForm.email}
                        onChangeText={(text: string) =>
                          setNewSubForm((prev) => ({ ...prev, email: text }))
                        }
                      />
                    </Stack>
                    <Stack style={{ flex: 1, gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                        Phone
                      </Text>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newSubForm.phone}
                        onChangeText={(text: string) =>
                          setNewSubForm((prev) => ({ ...prev, phone: text }))
                        }
                      />
                    </Stack>
                  </Row>

                  <Row style={{ gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Button
                      variant="ghost"
                      onPress={closeInviteModal}
                      type="button"
                    >
                      <Text>Cancel</Text>
                    </Button>
                    <Button
                      variant="primary"
                      disabled={inviting || !newSubForm.company.trim() || !newSubForm.name.trim()}
                      type="submit"
                    >
                      <Row style={{ alignItems: 'center', gap: 8 }}>
                        {inviting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        <Text>{inviting ? 'Creating...' : 'Create & Invite'}</Text>
                      </Row>
                    </Button>
                  </Row>
                </Stack>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </Stack>
  );
}
