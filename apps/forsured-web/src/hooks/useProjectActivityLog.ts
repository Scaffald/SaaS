/**
 * useProjectActivityLog - Hook to fetch audit log entries for a project
 *
 * Fetches activity logs from the forsured.audit_log table filtered by project ID.
 * Supports pagination and includes user information for display.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { forsured, core } from '../lib/supabase';

/**
 * Activity log entry for display
 */
export interface ProjectActivityEntry {
  id: string;
  action: string;
  category: string;
  description: string;
  timestamp: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  resource_type: string | null;
  resource_name: string | null;
  changed_fields: string[] | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  severity: string;
  status: string | null;
}

interface UseProjectActivityLogOptions {
  projectId: string | undefined;
  limit?: number;
}

interface UseProjectActivityLogResult {
  activities: ProjectActivityEntry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Resource name cache for resolving IDs to names
 */
interface ResourceNameCache {
  projects: Map<string, string>;
  documents: Map<string, string>;
  subcontractors: Map<string, string>;
  tasks: Map<string, string>;
  organizations: Map<string, string>;
}

/**
 * Check if a string looks like a UUID
 */
function isUUID(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Extract IDs from metadata, old_data, and new_data that need resolution
 */
function extractResourceIds(entry: {
  resource_name: string | null;
  resource_type: string | null;
  metadata: Record<string, unknown> | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}): {
  projectIds: string[];
  documentIds: string[];
  subcontractorIds: string[];
  taskIds: string[];
  organizationIds: string[];
} {
  const projectIds: string[] = [];
  const documentIds: string[] = [];
  const subcontractorIds: string[] = [];
  const taskIds: string[] = [];
  const organizationIds: string[] = [];

  // Check resource_name if it looks like an ID
  if (entry.resource_name && isUUID(entry.resource_name)) {
    const resourceType = entry.resource_type?.toLowerCase() || '';
    if (resourceType.includes('project')) projectIds.push(entry.resource_name);
    else if (resourceType.includes('document')) documentIds.push(entry.resource_name);
    else if (resourceType.includes('subcontractor')) subcontractorIds.push(entry.resource_name);
    else if (resourceType.includes('task')) taskIds.push(entry.resource_name);
    else if (resourceType.includes('organization')) organizationIds.push(entry.resource_name);
  }

  // Extract from metadata
  if (entry.metadata) {
    if (typeof entry.metadata.project_id === 'string' && isUUID(entry.metadata.project_id)) {
      projectIds.push(entry.metadata.project_id);
    }
    if (typeof entry.metadata.document_id === 'string' && isUUID(entry.metadata.document_id)) {
      documentIds.push(entry.metadata.document_id);
    }
    if (typeof entry.metadata.subcontractor_id === 'string' && isUUID(entry.metadata.subcontractor_id)) {
      subcontractorIds.push(entry.metadata.subcontractor_id);
    }
    if (typeof entry.metadata.task_id === 'string' && isUUID(entry.metadata.task_id)) {
      taskIds.push(entry.metadata.task_id);
    }
    if (typeof entry.metadata.organization_id === 'string' && isUUID(entry.metadata.organization_id)) {
      organizationIds.push(entry.metadata.organization_id);
    }
  }

  // Extract from old_data and new_data
  [entry.old_data, entry.new_data].forEach((data) => {
    if (!data) return;
    if (typeof data.project_id === 'string' && isUUID(data.project_id)) {
      projectIds.push(data.project_id);
    }
    if (typeof data.document_id === 'string' && isUUID(data.document_id)) {
      documentIds.push(data.document_id);
    }
    if (typeof data.subcontractor_id === 'string' && isUUID(data.subcontractor_id)) {
      subcontractorIds.push(data.subcontractor_id);
    }
    if (typeof data.task_id === 'string' && isUUID(data.task_id)) {
      taskIds.push(data.task_id);
    }
    if (typeof data.organization_id === 'string' && isUUID(data.organization_id)) {
      organizationIds.push(data.organization_id);
    }
    if (typeof data.entity_id === 'string' && isUUID(data.entity_id)) {
      const entityType = typeof data.entity_type === 'string' ? data.entity_type.toLowerCase() : '';
      if (entityType.includes('project')) projectIds.push(data.entity_id);
      else if (entityType.includes('document')) documentIds.push(data.entity_id);
      else if (entityType.includes('subcontractor')) subcontractorIds.push(data.entity_id);
      else if (entityType.includes('task')) taskIds.push(data.entity_id);
    }
  });

  return {
    projectIds: [...new Set(projectIds)],
    documentIds: [...new Set(documentIds)],
    subcontractorIds: [...new Set(subcontractorIds)],
    taskIds: [...new Set(taskIds)],
    organizationIds: [...new Set(organizationIds)],
  };
}

/**
 * Fetch resource names for different types
 */
async function fetchResourceNames(
  ids: {
    projectIds: string[];
    documentIds: string[];
    subcontractorIds: string[];
    taskIds: string[];
    organizationIds: string[];
  },
  cache: ResourceNameCache
): Promise<void> {
  // Fetch projects
  const uncachedProjectIds = ids.projectIds.filter((id) => !cache.projects.has(id));
  if (uncachedProjectIds.length > 0) {
    try {
      const { data: projects } = await forsured('projects')
        .select('id, name')
        .in('id', uncachedProjectIds);
      if (projects) {
        projects.forEach((p: { id: string; name: string }) => {
          cache.projects.set(p.id, p.name);
        });
      }
    } catch (err) {
      console.error('[useProjectActivityLog] Error fetching project names:', err);
    }
  }

  // Fetch documents
  const uncachedDocumentIds = ids.documentIds.filter((id) => !cache.documents.has(id));
  if (uncachedDocumentIds.length > 0) {
    try {
      const { data: documents } = await forsured('documents')
        .select('id, filename')
        .in('id', uncachedDocumentIds);
      if (documents) {
        documents.forEach((d: { id: string; filename: string }) => {
          cache.documents.set(d.id, d.filename);
        });
      }
    } catch (err) {
      console.error('[useProjectActivityLog] Error fetching document names:', err);
    }
  }

  // Fetch subcontractors
  const uncachedSubcontractorIds = ids.subcontractorIds.filter((id) => !cache.subcontractors.has(id));
  if (uncachedSubcontractorIds.length > 0) {
    try {
      const { data: subcontractors } = await forsured('subcontractors')
        .select('id, name, company')
        .in('id', uncachedSubcontractorIds);
      if (subcontractors) {
        subcontractors.forEach((s: { id: string; name: string | null; company: string | null }) => {
          const displayName = s.company || s.name || 'Unknown Subcontractor';
          cache.subcontractors.set(s.id, displayName);
        });
      }
    } catch (err) {
      console.error('[useProjectActivityLog] Error fetching subcontractor names:', err);
    }
  }

  // Fetch tasks
  const uncachedTaskIds = ids.taskIds.filter((id) => !cache.tasks.has(id));
  if (uncachedTaskIds.length > 0) {
    try {
      const { data: tasks } = await forsured('tasks')
        .select('id, title')
        .in('id', uncachedTaskIds);
      if (tasks) {
        tasks.forEach((t: { id: string; title: string | null }) => {
          cache.tasks.set(t.id, t.title || 'Untitled Task');
        });
      }
    } catch (err) {
      console.error('[useProjectActivityLog] Error fetching task names:', err);
    }
  }

  // Fetch organizations (in core schema)
  const uncachedOrgIds = ids.organizationIds.filter((id) => !cache.organizations.has(id));
  if (uncachedOrgIds.length > 0) {
    try {
      const { data: organizations } = await core('organizations')
        .select('id, name')
        .in('id', uncachedOrgIds);
      if (organizations) {
        organizations.forEach((o: { id: string; name: string | null }) => {
          cache.organizations.set(o.id, o.name || 'Unknown Organization');
        });
      }
    } catch (err) {
      console.error('[useProjectActivityLog] Error fetching organization names:', err);
    }
  }
}

/**
 * Resolve resource name from ID using cache
 */
function resolveResourceName(
  resourceName: string | null,
  resourceType: string | null,
  metadata: Record<string, unknown> | null,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  cache: ResourceNameCache
): string | null {
  // If resource_name is already a name (not a UUID), return it
  if (resourceName && !isUUID(resourceName)) {
    return resourceName;
  }

  // Try to resolve from resource_name if it's an ID
  if (resourceName && isUUID(resourceName)) {
    const resourceTypeLower = resourceType?.toLowerCase() || '';
    if (resourceTypeLower.includes('project')) {
      return cache.projects.get(resourceName) || null;
    }
    if (resourceTypeLower.includes('document')) {
      return cache.documents.get(resourceName) || null;
    }
    if (resourceTypeLower.includes('subcontractor')) {
      return cache.subcontractors.get(resourceName) || null;
    }
    if (resourceTypeLower.includes('task')) {
      return cache.tasks.get(resourceName) || null;
    }
    if (resourceTypeLower.includes('organization')) {
      return cache.organizations.get(resourceName) || null;
    }
  }

  // Try to resolve from metadata
  if (metadata) {
    if (typeof metadata.project_id === 'string' && isUUID(metadata.project_id)) {
      const name = cache.projects.get(metadata.project_id);
      if (name) return name;
    }
    if (typeof metadata.document_id === 'string' && isUUID(metadata.document_id)) {
      const name = cache.documents.get(metadata.document_id);
      if (name) return name;
    }
    if (typeof metadata.subcontractor_id === 'string' && isUUID(metadata.subcontractor_id)) {
      const name = cache.subcontractors.get(metadata.subcontractor_id);
      if (name) return name;
    }
    if (typeof metadata.task_id === 'string' && isUUID(metadata.task_id)) {
      const name = cache.tasks.get(metadata.task_id);
      if (name) return name;
    }
  }

  // Try to resolve from new_data (for created items)
  if (newData) {
    if (typeof newData.entity_id === 'string' && isUUID(newData.entity_id)) {
      const entityType = typeof newData.entity_type === 'string' ? newData.entity_type.toLowerCase() : '';
      if (entityType.includes('project')) {
        const name = cache.projects.get(newData.entity_id);
        if (name) return name;
      }
      if (entityType.includes('document')) {
        const name = cache.documents.get(newData.entity_id);
        if (name) return name;
      }
      if (entityType.includes('subcontractor')) {
        const name = cache.subcontractors.get(newData.entity_id);
        if (name) return name;
      }
      if (entityType.includes('task')) {
        const name = cache.tasks.get(newData.entity_id);
        if (name) return name;
      }
    }
  }

  return null;
}

/**
 * Generate a human-readable description for an audit log entry
 */
function generateDescription(
  entry: {
    action: string;
    resource_type: string | null;
    resource_name: string | null;
    changed_fields: string[] | null;
    metadata: Record<string, unknown> | null;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
  },
  cache: ResourceNameCache
): string {
  const { action, resource_type, resource_name, changed_fields, metadata, old_data, new_data } = entry;

  // Resolve resource name from IDs
  const resolvedName = resolveResourceName(resource_name, resource_type, metadata, old_data, new_data, cache);
  const displayName = resolvedName || resource_name;

  // Handle specific actions
  switch (action) {
    case 'create':
      return displayName
        ? `Created ${resource_type || 'item'}: ${displayName}`
        : `Created ${resource_type || 'item'}`;
    case 'comments_insert':
      return 'Added a note';
    case 'comments_update':
      return 'Edited a note';
    case 'comments_delete':
      return 'Deleted a note';
    case 'projects_insert':
      return displayName ? `Project created: ${displayName}` : 'Project created';
    case 'projects_update':
      if (changed_fields && changed_fields.length > 0) {
        const fields = changed_fields.slice(0, 3).join(', ');
        const more = changed_fields.length > 3 ? ` (+${changed_fields.length - 3} more)` : '';
        return displayName ? `Updated project ${displayName}: ${fields}${more}` : `Updated project: ${fields}${more}`;
      }
      return displayName ? `Updated project: ${displayName}` : 'Updated project';
    case 'projects_delete':
      return displayName ? `Project deleted: ${displayName}` : 'Project deleted';
    case 'update':
      if (changed_fields && changed_fields.length > 0) {
        const fields = changed_fields.slice(0, 3).join(', ');
        const more = changed_fields.length > 3 ? ` (+${changed_fields.length - 3} more)` : '';
        return displayName ? `Updated ${displayName}: ${fields}${more}` : `Updated ${fields}${more}`;
      }
      return displayName
        ? `Updated ${resource_type || 'item'}: ${displayName}`
        : `Updated ${resource_type || 'item'}`;
    case 'delete':
    case 'soft_delete':
      return displayName
        ? `Deleted ${resource_type || 'item'}: ${displayName}`
        : `Deleted ${resource_type || 'item'}`;
    case 'view_project':
      return displayName ? `Viewed project: ${displayName}` : 'Viewed project';
    case 'export_data':
      return `Exported ${resource_type || 'data'}`;
    case 'document_approved':
      return displayName ? `Approved document: ${displayName}` : 'Approved document';
    case 'document_rejected':
      return displayName ? `Rejected document: ${displayName}` : 'Rejected document';
    case 'compliance_evaluation_run':
      return 'Ran compliance evaluation';
    case 'compliance_score_calculated': {
      const score = metadata?.compliance_score;
      return score !== undefined
        ? `Compliance score calculated: ${score}%`
        : 'Compliance score calculated';
    }
    case 'broker_ack_submitted':
      return 'Submitted broker acknowledgement';
    case 'broker_ack_approved':
      return 'Approved broker acknowledgement';
    default: {
      // Fallback: format action as readable string
      const readableAction = action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return displayName
        ? `${readableAction}: ${displayName}`
        : readableAction;
    }
  }
}

/**
 * Fetch audit log entries for a project
 */
async function fetchAuditLogs(
  projectId: string,
  limit: number,
  currentOffset: number
): Promise<{ data: unknown[]; hasMore: boolean }> {
  // Query 1: Entries where record_id matches the project ID (direct project operations)
  const { data, error: fetchError } = await forsured('audit_log')
    .select('*')
    .eq('record_id', projectId)
    .order('created_at', { ascending: false })
    .range(currentOffset, currentOffset + limit);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Query 2: Entries that reference this project in metadata
  const { data: metadataData } = await forsured('audit_log')
    .select('*')
    .contains('metadata', { project_id: projectId })
    .order('created_at', { ascending: false })
    .range(0, limit);

  // Query 3: Entries for comments/notes on this project (entity_id in new_data)
  // Comments store project ID in new_data->>'entity_id' with entity_type='project'
  const { data: commentData } = await forsured('audit_log')
    .select('*')
    .contains('new_data', { entity_type: 'project', entity_id: projectId })
    .order('created_at', { ascending: false })
    .range(0, limit);

  // Combine and deduplicate results
  const allData = [...(data || []), ...(metadataData || []), ...(commentData || [])];
  const uniqueData = Array.from(new Map(allData.map((item: { id: string }) => [item.id, item])).values());

  // Sort by created_at descending
  uniqueData.sort((a: { created_at: string }, b: { created_at: string }) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Apply limit
  const paginatedData = uniqueData.slice(currentOffset, currentOffset + limit + 1);
  const hasMore = paginatedData.length > limit;
  const displayData = paginatedData.slice(0, limit);

  return { data: displayData, hasMore };
}

/**
 * Fetch user information for display
 */
async function fetchUsersInfo(
  userIds: string[],
  cache: Map<string, { name: string | null; email: string | null }>
): Promise<void> {
  const uncachedIds = userIds.filter((id) => id && !cache.has(id));
  if (uncachedIds.length === 0) return;

  try {
    const { data: users } = await core('users')
      .select('id, name, email')
      .in('id', uncachedIds);

    if (users) {
      users.forEach((user: { id: string; name: string | null; email: string | null }) => {
        cache.set(user.id, { name: user.name, email: user.email });
      });
    }
  } catch (err) {
    console.error('[useProjectActivityLog] Error fetching user info:', err);
  }
}

/**
 * Transform raw audit log data to display format
 */
function transformToEntries(
  data: unknown[],
  userCache: Map<string, { name: string | null; email: string | null }>,
  resourceCache: ResourceNameCache
): ProjectActivityEntry[] {
  return data.map((entry: unknown) => {
    const e = entry as {
      id: string;
      action: string;
      category: string;
      created_at: string;
      user_id: string | null;
      resource_type: string | null;
      resource_name: string | null;
      changed_fields: string[] | null;
      old_data: Record<string, unknown> | null;
      new_data: Record<string, unknown> | null;
      metadata: Record<string, unknown> | null;
      severity: string;
      status: string | null;
    };
    const userInfo = e.user_id ? userCache.get(e.user_id) : null;
    return {
      id: e.id,
      action: e.action,
      category: e.category,
      description: generateDescription(
        {
          action: e.action,
          resource_type: e.resource_type,
          resource_name: e.resource_name,
          changed_fields: e.changed_fields,
          metadata: e.metadata,
          old_data: e.old_data,
          new_data: e.new_data,
        },
        resourceCache
      ),
      timestamp: e.created_at,
      user_id: e.user_id,
      user_name: userInfo?.name || null,
      user_email: userInfo?.email || null,
      resource_type: e.resource_type,
      resource_name: e.resource_name,
      changed_fields: e.changed_fields,
      old_data: e.old_data,
      new_data: e.new_data,
      metadata: e.metadata,
      severity: e.severity,
      status: e.status,
    };
  });
}

/**
 * Hook to fetch project activity logs
 */
export function useProjectActivityLog({
  projectId,
  limit = 50,
}: UseProjectActivityLogOptions): UseProjectActivityLogResult {
  const [activities, setActivities] = useState<ProjectActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Cache for user info to avoid repeated lookups
  const userCacheRef = useRef<Map<string, { name: string | null; email: string | null }>>(new Map());

  // Cache for resource names to avoid repeated lookups
  const resourceCacheRef = useRef<ResourceNameCache>({
    projects: new Map(),
    documents: new Map(),
    subcontractors: new Map(),
    tasks: new Map(),
    organizations: new Map(),
  });

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch function that can be called from effect or callbacks
  const doFetch = useCallback(async (isLoadMore: boolean) => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!isLoadMore) {
      setLoading(true);
      setOffset(0);
    }
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const { data, hasMore: hasMoreResults } = await fetchAuditLogs(projectId, limit, currentOffset);

      // Extract all resource IDs that need resolution
      const allResourceIds = data.reduce(
        (acc, entry: unknown) => {
          const e = entry as {
            resource_name: string | null;
            resource_type: string | null;
            metadata: Record<string, unknown> | null;
            old_data: Record<string, unknown> | null;
            new_data: Record<string, unknown> | null;
          };
          const ids = extractResourceIds({
            resource_name: e.resource_name,
            resource_type: e.resource_type,
            metadata: e.metadata,
            old_data: e.old_data,
            new_data: e.new_data,
          });
          return {
            projectIds: [...acc.projectIds, ...ids.projectIds],
            documentIds: [...acc.documentIds, ...ids.documentIds],
            subcontractorIds: [...acc.subcontractorIds, ...ids.subcontractorIds],
            taskIds: [...acc.taskIds, ...ids.taskIds],
            organizationIds: [...acc.organizationIds, ...ids.organizationIds],
          };
        },
        {
          projectIds: [] as string[],
          documentIds: [] as string[],
          subcontractorIds: [] as string[],
          taskIds: [] as string[],
          organizationIds: [] as string[],
        }
      );

      // Fetch user info for all entries
      const userIds = data
        .map((entry: unknown) => (entry as { user_id: string | null }).user_id)
        .filter((id): id is string => !!id);
      await fetchUsersInfo(userIds, userCacheRef.current);

      // Fetch resource names for all entries
      await fetchResourceNames(allResourceIds, resourceCacheRef.current);

      // Transform to display format
      const entries = transformToEntries(data, userCacheRef.current, resourceCacheRef.current);

      if (isLoadMore) {
        setActivities((prev) => [...prev, ...entries]);
      } else {
        setActivities(entries);
      }
      setHasMore(hasMoreResults);
      setOffset(currentOffset + entries.length);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[useProjectActivityLog] Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activity log');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, limit, offset]);

  // Initial fetch when projectId changes
  useEffect(() => {
    // Inline fetch to avoid dependency issues with doFetch
    const fetchInitial = async () => {
      if (!projectId) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setOffset(0);
      setError(null);

      try {
        const { data, hasMore: hasMoreResults } = await fetchAuditLogs(projectId, limit, 0);

        // Extract all resource IDs that need resolution
        const allResourceIds = data.reduce(
          (acc, entry: unknown) => {
            const e = entry as {
              resource_name: string | null;
              resource_type: string | null;
              metadata: Record<string, unknown> | null;
              old_data: Record<string, unknown> | null;
              new_data: Record<string, unknown> | null;
            };
            const ids = extractResourceIds({
              resource_name: e.resource_name,
              resource_type: e.resource_type,
              metadata: e.metadata,
              old_data: e.old_data,
              new_data: e.new_data,
            });
            return {
              projectIds: [...acc.projectIds, ...ids.projectIds],
              documentIds: [...acc.documentIds, ...ids.documentIds],
              subcontractorIds: [...acc.subcontractorIds, ...ids.subcontractorIds],
              taskIds: [...acc.taskIds, ...ids.taskIds],
              organizationIds: [...acc.organizationIds, ...ids.organizationIds],
            };
          },
          {
            projectIds: [] as string[],
            documentIds: [] as string[],
            subcontractorIds: [] as string[],
            taskIds: [] as string[],
            organizationIds: [] as string[],
          }
        );

        // Fetch user info for all entries
        const userIds = data
          .map((entry: unknown) => (entry as { user_id: string | null }).user_id)
          .filter((id): id is string => !!id);
        await fetchUsersInfo(userIds, userCacheRef.current);

        // Fetch resource names for all entries
        await fetchResourceNames(allResourceIds, resourceCacheRef.current);

        // Transform to display format
        const entries = transformToEntries(data, userCacheRef.current, resourceCacheRef.current);

        setActivities(entries);
        setHasMore(hasMoreResults);
        setOffset(entries.length);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[useProjectActivityLog] Error fetching activities:', err);
          setError(err instanceof Error ? err.message : 'Failed to load activity log');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      doFetch(true);
    }
  }, [loading, hasMore, doFetch]);

  const refresh = useCallback(() => {
    doFetch(false);
  }, [doFetch]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

export default useProjectActivityLog;
