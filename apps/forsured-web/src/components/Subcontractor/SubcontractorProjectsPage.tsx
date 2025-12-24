import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { YStack, XStack, Text, Card, Button, H1, Spinner } from '@unicornlove/ui';
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
      <YStack gap="$6" flex={1} alignItems="center" justifyContent="center" padding="$10">
        <Spinner size="large" color="$blue10" />
        <Text color="$color11">Loading projects...</Text>
      </YStack>
    );
  }

  // Error state
  if (error) {
    return (
      <YStack gap="$6" flex={1} alignItems="center" justifyContent="center" padding="$10">
        <Card backgroundColor="$red3" padding="$3" borderRadius="$4">
          <AlertCircle color="$red10" size={48} />
        </Card>
        <Text color="$color12" fontWeight="500">{error}</Text>
        <Text color="$color11" fontSize="$2">Please try again later</Text>
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <YStack>
        <H1>My Projects</H1>
        <Text color="$color11">
          Track your active and completed projects
        </Text>
      </YStack>

      <XStack
        flexWrap="wrap"
        gap="$6"
        $gtMd={{
          flexWrap: 'nowrap',
        }}
      >
        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Total Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" mt="$1">
                {stats.total}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Building color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Active Projects</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" mt="$1">
                {stats.active}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Clock color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Completed</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" mt="$1">
                {stats.completed}
              </Text>
            </YStack>
            <Card backgroundColor="$green3" padding="$3" borderRadius="$4">
              <CheckCircle color="$green10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Active Value</Text>
              <Text fontSize="$8" fontWeight="bold" color="$color12" mt="$1">
                {formatCurrency(stats.totalValue)}
              </Text>
            </YStack>
            <Card backgroundColor="$gray3" padding="$3" borderRadius="$4">
              <Briefcase color="$gray10" size={24} />
            </Card>
          </XStack>
        </Card>
      </XStack>

      <Card elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
        <XStack alignItems="center" gap="$2">
          <Button
            onPress={() => setFilter('all')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'all' ? '$blue9' : '$gray3'}
            color={filter === 'all' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'all' ? '$blue9' : '$gray4',
            }}
          >
            All ({projects.length})
          </Button>
          <Button
            onPress={() => setFilter('active')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'active' ? '$blue9' : '$gray3'}
            color={filter === 'active' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'active' ? '$blue9' : '$gray4',
            }}
          >
            Active ({stats.active})
          </Button>
          <Button
            onPress={() => setFilter('completed')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'completed' ? '$blue9' : '$gray3'}
            color={filter === 'completed' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'completed' ? '$blue9' : '$gray4',
            }}
          >
            Completed ({stats.completed})
          </Button>
        </XStack>
      </Card>

      <XStack
        flexWrap="wrap"
        gap="$6"
        $gtLg={{
          flexWrap: 'nowrap',
        }}
      >
        {filteredProjects.map((project) => (
          <YStack key={project.id} flex={1} minWidth="300px">
            <ProjectCard
              project={project}
              userRole="subcontractor"
              showActions={false}
              onClick={() => navigate(`/subcontractor/projects/${project.id}`)}
            />
          </YStack>
        ))}
      </XStack>

      {filteredProjects.length === 0 && (
        <Card elevation={1} borderWidth={1} borderColor="$borderColor" padding="$12">
          <YStack alignItems="center">
            <Building color="$color10" size={48} mb="$4" />
            <Text color="$color12" fontWeight="500" mb="$2">
              No projects found
            </Text>
            <Text color="$color11" fontSize="$2">
              Adjust your filters or wait for project invitations
            </Text>
          </YStack>
        </Card>
      )}
    </YStack>
  );
}
