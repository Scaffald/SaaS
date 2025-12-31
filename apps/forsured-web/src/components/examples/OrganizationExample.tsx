/**
 * Organization Example Component
 * REQ-286: tRPC Client Setup - Example Usage
 *
 * Demonstrates how to use tRPC hooks in React components.
 * This is an example component showing the tRPC integration patterns.
 */

import { trpc } from '../../lib/trpc';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';

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
    <YStack gap="$4">
      <YStack>
        <Text fontSize="$6" fontWeight="bold">{organization.name}</Text>
        <Text fontSize="$2" color="$color10">ID: {organization.id}</Text>
      </YStack>

      {stats && (
        <XStack gap="$4" flexWrap="wrap">
          <Card padding="$4" borderWidth={1} borderRadius="$4" flex={1} minWidth="45%">
            <Text fontSize="$8" fontWeight="bold">{stats.projectCount}</Text>
            <Text fontSize="$2" color="$color10">Projects</Text>
          </Card>
          <Card padding="$4" borderWidth={1} borderRadius="$4" flex={1} minWidth="45%">
            <Text fontSize="$8" fontWeight="bold">{stats.taskCount}</Text>
            <Text fontSize="$2" color="$color10">Tasks</Text>
          </Card>
        </XStack>
      )}

      {projects && (
        <YStack>
          <Text fontSize="$5" fontWeight="600" mb="$2">Projects ({projects.total})</Text>
          <YStack gap="$2">
            {projects.projects.map((project) => (
              <Card key={project.id} padding="$2" borderWidth={1} borderRadius="$4">
                <Text fontWeight="500">{project.name}</Text>
                <Text fontSize="$2" color="$color10">{project.status}</Text>
              </Card>
            ))}
          </YStack>
        </YStack>
      )}
    </YStack>
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
