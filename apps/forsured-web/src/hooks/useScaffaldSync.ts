// src/hooks/useScaffaldSync.ts
// Phase 6: Scaffald Integration - Sync Hook
//
// React hook for managing Scaffald sync state and operations.
// Integrates with the scaffaldSync service for real database operations.

import { useState, useEffect, useCallback } from 'react';
import {
  syncCompany,
  importProjects,
  disconnectCompany,
  getSyncHistory,
  getConnectionStatus,
  performFullSync,
  type SyncLogEntry,
} from '../services/scaffaldSync';

export interface ScaffaldSyncState {
  companySyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  projectSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastCompanySync: string | null;
  lastProjectSync: string | null;
  companySyncError: string | null;
  projectSyncError: string | null;
  isSyncing: boolean;
  isConnected: boolean;
  scaffaldCompanyId: string | null;
  syncHistory: SyncLogEntry[];
  isLoadingHistory: boolean;
}

const initialState: ScaffaldSyncState = {
  companySyncStatus: 'idle',
  projectSyncStatus: 'idle',
  lastCompanySync: null,
  lastProjectSync: null,
  companySyncError: null,
  projectSyncError: null,
  isSyncing: false,
  isConnected: false,
  scaffaldCompanyId: null,
  syncHistory: [],
  isLoadingHistory: false,
};

export function useScaffaldSync(forsuredCompanyId: string | null) {
  const [syncState, setSyncState] = useState<ScaffaldSyncState>(initialState);

  // Load connection status on mount
  useEffect(() => {
    if (!forsuredCompanyId) return;

    const loadConnectionStatus = async () => {
      try {
        const status = await getConnectionStatus(forsuredCompanyId);
        setSyncState((prev) => ({
          ...prev,
          isConnected: status.connected,
          scaffaldCompanyId: status.scaffaldCompanyId || null,
          lastCompanySync: status.lastSyncedAt || null,
        }));

        // If connected, also load sync history
        if (status.connected) {
          loadSyncHistory();
        }
      } catch (error) {
        console.error('[useScaffaldSync] Error loading connection status:', error);
      }
    };

    loadConnectionStatus();
  }, [forsuredCompanyId]);

  // Load sync history
  const loadSyncHistory = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, isLoadingHistory: true }));
    try {
      const history = await getSyncHistory(50);
      setSyncState((prev) => ({
        ...prev,
        syncHistory: history,
        isLoadingHistory: false,
      }));
    } catch (error) {
      console.error('[useScaffaldSync] Error loading sync history:', error);
      setSyncState((prev) => ({ ...prev, isLoadingHistory: false }));
    }
  }, []);

  // Perform company sync
  const performCompanySync = useCallback(
    async (scaffaldCompanyId: string) => {
      if (!forsuredCompanyId) return;

      setSyncState((prev) => ({
        ...prev,
        companySyncStatus: 'syncing',
        isSyncing: true,
        companySyncError: null,
      }));

      try {
        const result = await syncCompany(scaffaldCompanyId);

        if (result.status === 'error') {
          setSyncState((prev) => ({
            ...prev,
            companySyncStatus: 'error',
            companySyncError: result.error || 'Sync failed',
            isSyncing: false,
          }));
          return;
        }

        setSyncState((prev) => ({
          ...prev,
          companySyncStatus: 'synced',
          lastCompanySync: new Date().toISOString(),
          isConnected: true,
          scaffaldCompanyId,
        }));

        // Reload sync history after successful sync
        loadSyncHistory();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSyncState((prev) => ({
          ...prev,
          companySyncStatus: 'error',
          companySyncError: errorMessage,
        }));
      } finally {
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    },
    [forsuredCompanyId, loadSyncHistory]
  );

  // Perform project import
  const performProjectImport = useCallback(
    async (scaffaldCompanyId: string) => {
      if (!forsuredCompanyId) return;

      setSyncState((prev) => ({
        ...prev,
        projectSyncStatus: 'syncing',
        isSyncing: true,
        projectSyncError: null,
      }));

      try {
        const result = await importProjects(scaffaldCompanyId);

        setSyncState((prev) => ({
          ...prev,
          projectSyncStatus: 'synced',
          lastProjectSync: new Date().toISOString(),
        }));

        // Reload sync history after successful import
        loadSyncHistory();

        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSyncState((prev) => ({
          ...prev,
          projectSyncStatus: 'error',
          projectSyncError: errorMessage,
        }));
      } finally {
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    },
    [forsuredCompanyId, loadSyncHistory]
  );

  // Perform full sync (company + projects)
  const performSync = useCallback(
    async (scaffaldCompanyId: string) => {
      if (!forsuredCompanyId) return;

      setSyncState((prev) => ({
        ...prev,
        companySyncStatus: 'syncing',
        projectSyncStatus: 'syncing',
        isSyncing: true,
        companySyncError: null,
        projectSyncError: null,
      }));

      try {
        const { companyResult, projectsResult } = await performFullSync(scaffaldCompanyId);

        setSyncState((prev) => ({
          ...prev,
          companySyncStatus: companyResult.status === 'error' ? 'error' : 'synced',
          projectSyncStatus: 'synced',
          lastCompanySync: new Date().toISOString(),
          lastProjectSync: new Date().toISOString(),
          companySyncError: companyResult.error || null,
          isConnected: companyResult.status !== 'error',
          scaffaldCompanyId,
        }));

        // Reload sync history after successful sync
        loadSyncHistory();

        return { companyResult, projectsResult };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSyncState((prev) => ({
          ...prev,
          companySyncStatus: 'error',
          projectSyncStatus: 'error',
          companySyncError: errorMessage,
          projectSyncError: errorMessage,
        }));
      } finally {
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    },
    [forsuredCompanyId, loadSyncHistory]
  );

  // Disconnect from Scaffald
  const disconnectCurrentCompany = useCallback(async () => {
    if (!forsuredCompanyId) return;

    setSyncState((prev) => ({
      ...prev,
      isSyncing: true,
      companySyncError: null,
    }));

    try {
      await disconnectCompany(forsuredCompanyId);

      // Reset state after disconnection
      setSyncState({
        ...initialState,
        isConnected: false,
        scaffaldCompanyId: null,
      });

      // Reload sync history to show disconnection
      loadSyncHistory();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSyncState((prev) => ({
        ...prev,
        companySyncError: errorMessage,
        companySyncStatus: 'error',
      }));
    } finally {
      setSyncState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [forsuredCompanyId, loadSyncHistory]);

  // Connect to a Scaffald company (initial connection)
  const connectCompany = useCallback(
    async (scaffaldCompanyId: string) => {
      // Perform initial sync when connecting
      await performSync(scaffaldCompanyId);
    },
    [performSync]
  );

  return {
    ...syncState,
    performCompanySync,
    performProjectImport,
    performSync,
    disconnectCurrentCompany,
    connectCompany,
    loadSyncHistory,
  };
}
