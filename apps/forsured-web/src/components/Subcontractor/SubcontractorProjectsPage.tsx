import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Briefcase, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Card, H1 } from '@unicornlove/beyond-ui';
import ProjectCard from '../Shared/ProjectCard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, getUserOrganizationId } from '../../lib/supabase';
import type { ComplianceStatus } from '../../types';

interface SubcontractorProject {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  status: 'active' | 'completed' | 'pending' | 'on_hold';
  start_date?: string;
  end_date?: string;
  location?: string;
  contract_value?: string;
  project_manager?: string;
  compliance_status?: ComplianceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const getFilterButtonStyle = (isActive: boolean): React.CSSProperties => {
  return {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? 'var(--color-blue9)' : 'var(--color-gray3)',
    color: isActive ? 'white' : 'var(--color-11)',
  };
};

export default function SubcontractorProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [projects, setProjects] = useState<SubcontractorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => user?.id ?? null, [user?.id]);

  // Fetch projects for the current subcontractor
  useEffect(() => {
    async function fetchProjects() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's organization ID
        const orgId = await getUserOrganizationId(userId);
        if (!orgId) {
          setError('No organization found for user');
          setLoading(false);
          return;
        }

        // Find the subcontractor record for this organization
        const { data: subcontractor, error: subError } = await supabase
          .schema('forsured')
          .from('subcontractors')
          .select('id')
          .eq('organization_id', orgId)
          .single();

        if (subError || !subcontractor) {
          console.log('[SubcontractorProjectsPage] No subcontractor record found:', subError);
          setProjects([]);
          setLoading(false);
          return;
        }

        // Get projects via project_subcontractors junction table
        const { data: projectLinks, error: linkError } = await supabase
          .schema('forsured')
          .from('project_subcontractors')
          .select('project_id, status')
          .eq('subcontractor_id', subcontractor.id);

        if (linkError) {
          throw linkError;
        }

        if (!projectLinks || projectLinks.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        // Fetch the actual projects
        const projectIds = projectLinks.map((link) => link.project_id);
        const { data: projectsData, error: projectsError } = await supabase
          .schema('forsured')
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (projectsError) {
          throw projectsError;
        }

        // Map to our expected format
        const mappedProjects: SubcontractorProject[] = (projectsData || []).map((p) => {
          // Find the link status
          const link = projectLinks.find((l) => l.project_id === p.id);
          const isActive = link?.status === 'active';

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            organization_id: p.organization_id,
            status: isActive ? 'active' : 'completed',
            start_date: p.start_date,
            end_date: p.end_date,
            location: p.location,
            contract_value: p.contract_value?.toString(),
            project_manager: p.project_manager,
            compliance_status: p.compliance_status || 'compliant',
            notes: p.notes,
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        });

        setProjects(mappedProjects);
      } catch (err) {
        console.error('[SubcontractorProjectsPage] Error fetching projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [userId]);

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'active';
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    totalValue: projects
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

  // Loading state
  if (loading) {
    return (
      <Stack
        style={{
          gap: 24,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <Loader2 size={32} color="var(--color-blue10)" className="animate-spin" />
        <Text style={{ color: 'var(--color-11)' }}>Loading projects...</Text>
      </Stack>
    );
  }

  // Error state
  if (error) {
    return (
      <Stack
        style={{
          gap: 24,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-red3)',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <AlertCircle color="var(--color-red10)" size={48} />
        </div>
        <Text style={{ color: 'var(--color-12)', fontWeight: 500 }}>{error}</Text>
        <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>Please try again later</Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H1>My Projects</H1>
        <Text style={{ color: 'var(--color-11)' }}>
          Track your active and completed projects
        </Text>
      </Stack>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Card
          variant="outlined"
          style={{
            padding: 24,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            flex: 1,
            minWidth: 200,
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>Total Projects</Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--color-12)', marginTop: 4 }}>
                {stats.total}
              </Text>
            </Stack>
            <div
              style={{
                backgroundColor: 'var(--color-blue3)',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Building color="var(--color-blue10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card
          variant="outlined"
          style={{
            padding: 24,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            flex: 1,
            minWidth: 200,
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>Active Projects</Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--color-blue10)', marginTop: 4 }}>
                {stats.active}
              </Text>
            </Stack>
            <div
              style={{
                backgroundColor: 'var(--color-blue3)',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Clock color="var(--color-blue10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card
          variant="outlined"
          style={{
            padding: 24,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            flex: 1,
            minWidth: 200,
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>Completed</Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--color-green10)', marginTop: 4 }}>
                {stats.completed}
              </Text>
            </Stack>
            <div
              style={{
                backgroundColor: 'var(--color-green3)',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <CheckCircle color="var(--color-green10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card
          variant="outlined"
          style={{
            padding: 24,
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            flex: 1,
            minWidth: 200,
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>Active Value</Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-12)', marginTop: 4 }}>
                {formatCurrency(stats.totalValue)}
              </Text>
            </Stack>
            <div
              style={{
                backgroundColor: 'var(--color-gray3)',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Briefcase color="var(--color-gray10)" size={24} />
            </div>
          </Row>
        </Card>
      </Row>

      <Card
        variant="outlined"
        style={{
          borderWidth: 1,
          borderColor: 'var(--color-border)',
          padding: 24,
        }}
      >
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setFilter('all')}
            style={getFilterButtonStyle(filter === 'all')}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            style={getFilterButtonStyle(filter === 'active')}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={getFilterButtonStyle(filter === 'completed')}
          >
            Completed ({stats.completed})
          </button>
        </Row>
      </Card>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        {filteredProjects.map((project) => (
          <Stack key={project.id} style={{ flex: 1, minWidth: 300 }}>
            <ProjectCard
              project={project}
              userRole="subcontractor"
              showActions={false}
              onClick={() => navigate(`/subcontractor/projects/${project.id}`)}
            />
          </Stack>
        ))}
      </Row>

      {filteredProjects.length === 0 && (
        <Card
          variant="outlined"
          style={{
            borderWidth: 1,
            borderColor: 'var(--color-border)',
            padding: 48,
          }}
        >
          <Stack style={{ alignItems: 'center' }}>
            <Building color="var(--color-10)" size={48} style={{ marginBottom: 16 }} />
            <Text style={{ color: 'var(--color-12)', fontWeight: 500, marginBottom: 8 }}>
              No projects found
            </Text>
            <Text style={{ color: 'var(--color-11)', fontSize: 14 }}>
              Adjust your filters or wait for project invitations
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
