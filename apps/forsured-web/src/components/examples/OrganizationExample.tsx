/**
 * Organization Example Component
 * REQ-286: tRPC Client Setup - Example Usage
 *
 * Demonstrates how to use tRPC hooks in React components.
 * This is an example component showing the tRPC integration patterns.
 */

import { trpc } from '../../lib/trpc';

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
    return <div>Loading organization...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{organization.name}</h2>
        <p className="text-sm text-gray-600">ID: {organization.id}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <div className="text-2xl font-bold">{stats.projectCount}</div>
            <div className="text-sm text-gray-600">Projects</div>
          </div>
          <div className="border rounded p-4">
            <div className="text-2xl font-bold">{stats.taskCount}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
        </div>
      )}

      {projects && (
        <div>
          <h3 className="font-semibold mb-2">Projects ({projects.total})</h3>
          <ul className="space-y-2">
            {projects.projects.map((project) => (
              <li key={project.id} className="border rounded p-2">
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-gray-600">{project.status}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
