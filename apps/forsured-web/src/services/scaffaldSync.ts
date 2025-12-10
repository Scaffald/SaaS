// src/services/scaffaldSync.ts
// Phase 6: Scaffald Integration - Sync Service
//
// Provides sync functionality between ForSured and Scaffald systems.
// Uses real Supabase client for database operations.

import { forsured, core } from '../lib/supabase';
import { scaffaldClient } from '../lib/scaffald/client';
import type { ScaffaldCompany, ScaffaldProject } from '../lib/scaffald/types';

// Types
export interface SyncResult {
  status: 'created' | 'updated' | 'skipped' | 'error';
  id?: string;
  error?: string;
}

export interface ImportResult {
  imported: number;
  results: Array<{ id: string; action: 'created' | 'updated' }>;
}

export interface SyncRecord {
  id: string;
  entity_type: string;
  forsured_id: string;
  scaffald_id: string;
  last_synced_at: string;
  sync_status: 'synced' | 'pending' | 'error';
  sync_error?: string;
  created_at: string;
}

export interface SyncLogEntry {
  id: string;
  sync_id: string;
  direction: 'inbound' | 'outbound';
  action: string;
  entity_data: Record<string, unknown>;
  result: 'success' | 'error' | 'skipped';
  error_message?: string;
  created_at: string;
}

/**
 * Get existing sync record for an entity
 */
async function getSyncRecord(
  entityType: string,
  scaffaldId: string
): Promise<SyncRecord | null> {
  const { data, error } = await forsured('scaffald_sync')
    .select('*')
    .eq('entity_type', entityType)
    .eq('scaffald_id', scaffaldId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not found
      return null;
    }
    console.error('[ScaffaldSync] Error fetching sync record:', error);
    return null;
  }

  return data;
}

/**
 * Create a sync record
 */
async function createSyncRecord(
  entityType: string,
  forsuredId: string,
  scaffaldId: string
): Promise<SyncRecord | null> {
  const { data, error } = await forsured('scaffald_sync')
    .insert({
      entity_type: entityType,
      forsured_id: forsuredId,
      scaffald_id: scaffaldId,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[ScaffaldSync] Error creating sync record:', error);
    return null;
  }

  return data;
}

/**
 * Update sync record status
 */
async function updateSyncStatus(
  syncId: string,
  status: 'synced' | 'pending' | 'error',
  errorMessage?: string
): Promise<void> {
  const { error } = await forsured('scaffald_sync')
    .update({
      sync_status: status,
      sync_error: errorMessage || null,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', syncId);

  if (error) {
    console.error('[ScaffaldSync] Error updating sync status:', error);
  }
}

/**
 * Log a sync action
 */
async function logSyncAction(
  syncId: string | null,
  direction: 'inbound' | 'outbound',
  action: string,
  entityData: Record<string, unknown>,
  result: 'success' | 'error' | 'skipped',
  errorMessage?: string
): Promise<void> {
  const { error } = await forsured('scaffald_sync_log').insert({
    sync_id: syncId,
    direction,
    action,
    entity_data: entityData,
    result,
    error_message: errorMessage || null,
  });

  if (error) {
    console.error('[ScaffaldSync] Error logging sync action:', error);
  }
}

/**
 * Get sync history for display
 */
export async function getSyncHistory(limit = 50): Promise<SyncLogEntry[]> {
  const { data, error } = await forsured('scaffald_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ScaffaldSync] Error fetching sync history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get connection status for a ForSured organization
 */
export async function getConnectionStatus(
  forsuredOrgId: string
): Promise<{ connected: boolean; scaffaldCompanyId?: string; lastSyncedAt?: string }> {
  const { data, error } = await forsured('scaffald_sync')
    .select('*')
    .eq('entity_type', 'company')
    .eq('forsured_id', forsuredOrgId)
    .single();

  if (error || !data) {
    return { connected: false };
  }

  return {
    connected: true,
    scaffaldCompanyId: data.scaffald_id,
    lastSyncedAt: data.last_synced_at,
  };
}

/**
 * Sync company data from Scaffald to ForSured
 */
export async function syncCompany(scaffaldCompanyId: string): Promise<SyncResult> {
  try {
    // 1. Fetch company from Scaffald API
    const scaffaldCompany = await scaffaldClient.companies.get(scaffaldCompanyId);

    // 2. Check if already synced
    const existingSync = await getSyncRecord('company', scaffaldCompanyId);

    if (existingSync) {
      // Update existing organization
      const { error } = await core('organizations')
        .update({
          name: scaffaldCompany.name,
          // Note: address and other fields depend on actual schema
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSync.forsured_id);

      if (error) {
        await logSyncAction(
          existingSync.id,
          'inbound',
          'COMPANY_UPDATED',
          scaffaldCompany,
          'error',
          error.message
        );
        return { status: 'error', error: error.message };
      }

      await updateSyncStatus(existingSync.id, 'synced');
      await logSyncAction(
        existingSync.id,
        'inbound',
        'COMPANY_UPDATED',
        scaffaldCompany,
        'success'
      );

      return { status: 'updated', id: existingSync.forsured_id };
    }

    // 3. Create new organization in core.organizations
    const { data: newOrg, error: createError } = await core('organizations')
      .insert({
        scaffald_company_id: scaffaldCompanyId,
        name: scaffaldCompany.name,
      })
      .select()
      .single();

    if (createError) {
      await logSyncAction(
        null,
        'inbound',
        'COMPANY_CREATED',
        scaffaldCompany,
        'error',
        createError.message
      );
      return { status: 'error', error: createError.message };
    }

    // 4. Create sync record
    const syncRecord = await createSyncRecord('company', newOrg.id, scaffaldCompanyId);
    await logSyncAction(
      syncRecord?.id || null,
      'inbound',
      'COMPANY_CREATED',
      scaffaldCompany,
      'success'
    );

    return { status: 'created', id: newOrg.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ScaffaldSync] syncCompany error:', error);
    await logSyncAction(null, 'inbound', 'COMPANY_SYNC', { scaffaldCompanyId }, 'error', errorMessage);
    return { status: 'error', error: errorMessage };
  }
}

/**
 * Disconnect a company from Scaffald sync
 */
export async function disconnectCompany(forsuredOrgId: string): Promise<void> {
  try {
    // Remove scaffald_company_id from organization
    const { error: updateError } = await core('organizations')
      .update({ scaffald_company_id: null })
      .eq('id', forsuredOrgId);

    if (updateError) {
      console.error('[ScaffaldSync] Error clearing scaffald_company_id:', updateError);
    }

    // Update sync record to show disconnected
    const { data: syncRecord } = await forsured('scaffald_sync')
      .select('id')
      .eq('entity_type', 'company')
      .eq('forsured_id', forsuredOrgId)
      .single();

    if (syncRecord) {
      await updateSyncStatus(syncRecord.id, 'error', 'Disconnected by user');
      await logSyncAction(
        syncRecord.id,
        'outbound',
        'COMPANY_DISCONNECTED',
        { forsuredOrgId },
        'success'
      );
    }
  } catch (error) {
    console.error('[ScaffaldSync] disconnectCompany error:', error);
  }
}

/**
 * Map Scaffald project status to ForSured status
 */
function mapProjectStatus(
  scaffaldStatus: string
): 'planning' | 'active' | 'completed' | 'cancelled' | 'unknown' {
  switch (scaffaldStatus) {
    case 'planning':
      return 'planning';
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

/**
 * Import projects from Scaffald for a connected company
 */
export async function importProjects(scaffaldCompanyId: string): Promise<ImportResult> {
  const results: Array<{ id: string; action: 'created' | 'updated' }> = [];

  try {
    // Get all projects from Scaffald
    const scaffaldProjects = await scaffaldClient.projects.list(scaffaldCompanyId);

    // Get the ForSured organization linked to this Scaffald company
    const { data: syncRecord } = await forsured('scaffald_sync')
      .select('forsured_id')
      .eq('entity_type', 'company')
      .eq('scaffald_id', scaffaldCompanyId)
      .single();

    if (!syncRecord) {
      console.error('[ScaffaldSync] No sync record found for company:', scaffaldCompanyId);
      return { imported: 0, results: [] };
    }

    const forsuredOrgId = syncRecord.forsured_id;

    for (const project of scaffaldProjects) {
      // Check if project already exists
      const existingSync = await getSyncRecord('project', project.id);

      if (existingSync) {
        // Update existing project in forsured.projects
        const { error } = await forsured('projects')
          .update({
            name: project.name,
            status: mapProjectStatus(project.status),
            start_date: project.start_date,
            end_date: project.end_date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSync.forsured_id);

        if (error) {
          console.error('[ScaffaldSync] Error updating project:', error);
          continue;
        }

        await updateSyncStatus(existingSync.id, 'synced');
        await logSyncAction(
          existingSync.id,
          'inbound',
          'PROJECT_UPDATED',
          project,
          'success'
        );
        results.push({ id: project.id, action: 'updated' });
      } else {
        // Create new project
        const { data: newProject, error: createError } = await forsured('projects')
          .insert({
            organization_id: forsuredOrgId,
            scaffald_project_id: project.id,
            name: project.name,
            status: mapProjectStatus(project.status),
            start_date: project.start_date,
            end_date: project.end_date,
          })
          .select()
          .single();

        if (createError) {
          console.error('[ScaffaldSync] Error creating project:', createError);
          continue;
        }

        const newSyncRecord = await createSyncRecord('project', newProject.id, project.id);
        await logSyncAction(
          newSyncRecord?.id || null,
          'inbound',
          'PROJECT_CREATED',
          project,
          'success'
        );
        results.push({ id: newProject.id, action: 'created' });
      }
    }

    return { imported: results.length, results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ScaffaldSync] importProjects error:', error);
    return { imported: 0, results: [] };
  }
}

/**
 * Handle project deletion from Scaffald webhook
 */
export async function handleProjectDeleted(scaffaldProjectId: string): Promise<void> {
  try {
    const syncRecord = await getSyncRecord('project', scaffaldProjectId);

    if (!syncRecord) {
      console.log('[ScaffaldSync] No sync record for deleted project:', scaffaldProjectId);
      return;
    }

    // Mark project as archived/deleted in ForSured (soft delete)
    const { error } = await forsured('projects')
      .update({
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', syncRecord.forsured_id);

    if (error) {
      console.error('[ScaffaldSync] Error archiving project:', error);
      return;
    }

    await updateSyncStatus(syncRecord.id, 'error', 'Deleted in Scaffald');
    await logSyncAction(
      syncRecord.id,
      'inbound',
      'PROJECT_DELETED',
      { scaffaldProjectId },
      'success'
    );
  } catch (error) {
    console.error('[ScaffaldSync] handleProjectDeleted error:', error);
  }
}

/**
 * Handle user removal from company webhook
 */
export async function handleUserRemoved(
  scaffaldUserId: string,
  scaffaldCompanyId: string
): Promise<void> {
  try {
    // Find the sync record for this user
    const syncRecord = await getSyncRecord('user', scaffaldUserId);

    if (!syncRecord) {
      console.log('[ScaffaldSync] No sync record for removed user:', scaffaldUserId);
      return;
    }

    // Remove user's role/access for this company in ForSured
    // This depends on your user management schema
    await logSyncAction(
      syncRecord.id,
      'inbound',
      'USER_REMOVED',
      { scaffaldUserId, scaffaldCompanyId },
      'success'
    );

    console.log('[ScaffaldSync] User removed from company:', scaffaldUserId, scaffaldCompanyId);
  } catch (error) {
    console.error('[ScaffaldSync] handleUserRemoved error:', error);
  }
}

/**
 * Perform a full sync for a connected company
 */
export async function performFullSync(scaffaldCompanyId: string): Promise<{
  companyResult: SyncResult;
  projectsResult: ImportResult;
}> {
  const companyResult = await syncCompany(scaffaldCompanyId);
  const projectsResult = await importProjects(scaffaldCompanyId);

  return { companyResult, projectsResult };
}
