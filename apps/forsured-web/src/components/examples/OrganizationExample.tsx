/**
 * Organization Example Component
 * tRPC Client Setup - Example Usage
 *
 * Demonstrates how to use tRPC hooks in React components.
 * This is an example component showing the tRPC integration patterns.
 */

import { trpc } from '../../lib/trpc';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';

interface OrganizationExampleProps {
  organizationId: string;
}

/**
 * Example component using tRPC hooks
 *
 * Demonstrates:
 * - Type-safe query hooks with useQuery
 * - Loading and error states
 * - Automatic refetching and caching
 * - Type inference from server router
 */
export function OrganizationExample({ organizationId }: OrganizationExampleProps) {
  // Type-safe query - autocomplete works for all procedures and inputs!
  const { data: organization, isLoading, error } = trpc.organization.get.useQuery({
    organizationId,
  });

  // Get organization stats
  const { data: stats } = trpc.organization.getStats.useQuery({
    organizationId,
  });

  // List projects with pagination
  const { data: projects } = trpc.organization.listProjects.useQuery({
    organizationId,
    limit: 10,
    offset: 0,
  });

  if (isLoading) {
    return <Text>Loading organization...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!organization) {
    return <Text>Organization not found</Text>;
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <Stack>
        <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 'bold' }}>{organization.name}</Text>
        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>ID: {organization.id}</Text>
      </Stack>

      {stats && (
        <Row style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Card style={{ padding: 'var(--space-4)', borderWidth: 1, borderRadius: 'var(--radius-4)', flex: 1, minWidth: '45%' }}>
            <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>{stats.projectCount}</Text>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>Projects</Text>
          </Card>
          <Card style={{ padding: 'var(--space-4)', borderWidth: 1, borderRadius: 'var(--radius-4)', flex: 1, minWidth: '45%' }}>
            <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>{stats.taskCount}</Text>
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>Tasks</Text>
          </Card>
        </Row>
      )}

      {projects && (
        <Stack>
          <Text style={{ fontSize: 'var(--font-size-5)', fontWeight: '600', marginBottom: 'var(--space-2)' }}>Projects ({projects.total})</Text>
          <Stack style={{ gap: 'var(--space-2)' }}>
            {projects.projects.map((project) => (
              <Card key={project.id} style={{ padding: 'var(--space-2)', borderWidth: 1, borderRadius: 'var(--radius-4)' }}>
                <Text style={{ fontWeight: '500' }}>{project.name}</Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-text-secondary)' }}>{project.status}</Text>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Example of using mutations (for future routers)
 *
 * @example
 * ```tsx
 * const createProject = trpc.project.create.useMutation({
 *   onSuccess: () => {
 *     // Invalidate projects list to refetch
 *     utils.organization.listProjects.invalidate();
 *   },
 * });
 *
 * <button onClick={() => createProject.mutate({ name: 'New Project' })}>
 *   Create Project
 * </button>
 * ```
 */
