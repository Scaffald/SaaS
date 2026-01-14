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
 * Generate a human-readable description for an audit log entry
 */
function generateDescription(entry: {
  action: string;
  resource_type: string | null;
  resource_name: string | null;
  changed_fields: string[] | null;
  metadata: Record<string, unknown> | null;
}): string {
  const { action, resource_type, resource_name, changed_fields, metadata } = entry;

  // Handle specific actions
  switch (action) {
    case 'create':
      return resource_name
        ? `Created ${resource_type || 'item'}: ${resource_name}`
        : `Created ${resource_type || 'item'}`;
    case 'comments_insert':
      return 'Added a note';
    case 'comments_update':
      return 'Edited a note';
    case 'comments_delete':
      return 'Deleted a note';
    case 'projects_insert':
      return 'Project created';
    case 'projects_update':
      if (changed_fields && changed_fields.length > 0) {
        const fields = changed_fields.slice(0, 3).join(', ');
        const more = changed_fields.length > 3 ? ` (+${changed_fields.length - 3} more)` : '';
        return `Updated project: ${fields}${more}`;
      }
      return 'Updated project';
    case 'projects_delete':
      return 'Project deleted';
    case 'update':
      if (changed_fields && changed_fields.length > 0) {
        const fields = changed_fields.slice(0, 3).join(', ');
        const more = changed_fields.length > 3 ? ` (+${changed_fields.length - 3} more)` : '';
        return `Updated ${fields}${more}`;
      }
      return resource_name
        ? `Updated ${resource_type || 'item'}: ${resource_name}`
        : `Updated ${resource_type || 'item'}`;
    case 'delete':
    case 'soft_delete':
      return resource_name
        ? `Deleted ${resource_type || 'item'}: ${resource_name}`
        : `Deleted ${resource_type || 'item'}`;
    case 'view_project':
      return 'Viewed project';
    case 'export_data':
      return `Exported ${resource_type || 'data'}`;
    case 'document_approved':
      return resource_name ? `Approved document: ${resource_name}` : 'Approved document';
    case 'document_rejected':
      return resource_name ? `Rejected document: ${resource_name}` : 'Rejected document';
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
      return resource_name
        ? `${readableAction}: ${resource_name}`
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
  userCache: Map<string, { name: string | null; email: string | null }>
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
      description: generateDescription({
        action: e.action,
        resource_type: e.resource_type,
        resource_name: e.resource_name,
        changed_fields: e.changed_fields,
        metadata: e.metadata,
      }),
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

      // Fetch user info for all entries
      const userIds = data
        .map((entry: unknown) => (entry as { user_id: string | null }).user_id)
        .filter((id): id is string => !!id);
      await fetchUsersInfo(userIds, userCacheRef.current);

      // Transform to display format
      const entries = transformToEntries(data, userCacheRef.current);

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

        // Fetch user info for all entries
        const userIds = data
          .map((entry: unknown) => (entry as { user_id: string | null }).user_id)
          .filter((id): id is string => !!id);
        await fetchUsersInfo(userIds, userCacheRef.current);

        // Transform to display format
        const entries = transformToEntries(data, userCacheRef.current);

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
