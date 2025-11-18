import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';

import { useOfflineWorkLogs } from '../useOfflineWorkLogs';
import * as offlineStorage from '../../utils/offline-storage';
import type { OfflineWorkLog } from '../../types/offline';

vi.mock('../../utils/offline-storage');
vi.mock('expo-file-system/legacy', () => ({
  default: {
    documentDirectory: '/test/documents',
    cacheDirectory: '/test/cache',
    getInfoAsync: vi.fn().mockResolvedValue({ exists: true }),
    makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid'),
}));

describe('useOfflineWorkLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue([]);
    vi.mocked(offlineStorage.saveOfflineWorkLogs).mockResolvedValue(undefined);
  });

  it('loads offline work logs on mount', async () => {
    const mockLogs: OfflineWorkLog[] = [
      {
        id: 'log-1',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: {
            projectId: 'project-1',
            entryType: 'daily',
            logDate: '2025-01-10',
            timeEntries: [{ start: '08:00', end: '12:00' }],
            workDescription: 'Test work',
          },
        },
        syncStatus: 'pending',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
    ];

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.offlineWorkLogs).toEqual(mockLogs);
    expect(offlineStorage.loadOfflineWorkLogs).toHaveBeenCalled();
  });

  it('queues a new work log for offline', async () => {
    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.queueWorkLog({
        payload: {
          kind: 'create',
          input: {
            projectId: 'project-1',
            entryType: 'daily',
            logDate: '2025-01-10',
            timeEntries: [{ start: '08:00', end: '12:00' }],
            workDescription: 'New work log',
          },
        },
      });
    });

    expect(result.current.offlineWorkLogs.length).toBe(1);
    expect(result.current.offlineWorkLogs[0]?.payload.input.workDescription).toBe(
      'New work log',
    );
    expect(offlineStorage.saveOfflineWorkLogs).toHaveBeenCalled();
  });

  it('mutates an existing offline work log', async () => {
    const existingLog: OfflineWorkLog = {
      id: 'log-1',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      payload: {
        kind: 'create',
        input: {
          projectId: 'project-1',
          entryType: 'daily',
          logDate: '2025-01-10',
          timeEntries: [{ start: '08:00', end: '12:00' }],
          workDescription: 'Original',
        },
      },
      syncStatus: 'pending',
      photos: [],
      retryCount: 0,
      nextRetryAt: null,
    };

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue([existingLog]);

    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.mutateOfflineWorkLog('log-1', (current) => ({
        ...current,
        payload: {
          ...current.payload,
          input: {
            ...current.payload.input,
            workDescription: 'Updated',
          },
        },
      }));
    });

    expect(result.current.offlineWorkLogs[0]?.payload.input.workDescription).toBe(
      'Updated',
    );
    expect(offlineStorage.saveOfflineWorkLogs).toHaveBeenCalled();
  });

  it('removes an offline work log', async () => {
    const existingLog: OfflineWorkLog = {
      id: 'log-1',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      payload: {
        kind: 'create',
        input: {
          projectId: 'project-1',
          entryType: 'daily',
          logDate: '2025-01-10',
          timeEntries: [{ start: '08:00', end: '12:00' }],
          workDescription: 'To be removed',
        },
      },
      syncStatus: 'pending',
      photos: [],
      retryCount: 0,
      nextRetryAt: null,
    };

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue([existingLog]);

    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeOfflineWorkLog('log-1');
    });

    expect(result.current.offlineWorkLogs.length).toBe(0);
    expect(offlineStorage.saveOfflineWorkLogs).toHaveBeenCalled();
  });

  it('marks work log for sync', async () => {
    const existingLog: OfflineWorkLog = {
      id: 'log-1',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      payload: {
        kind: 'create',
        input: {
          projectId: 'project-1',
          entryType: 'daily',
          logDate: '2025-01-10',
          timeEntries: [{ start: '08:00', end: '12:00' }],
          workDescription: 'Test',
        },
      },
      syncStatus: 'pending',
      photos: [],
      retryCount: 0,
      nextRetryAt: null,
    };

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue([existingLog]);

    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markWorkLogForSync('log-1', 'queued');
    });

    expect(result.current.offlineWorkLogs[0]?.syncStatus).toBe('queued');
    expect(offlineStorage.saveOfflineWorkLogs).toHaveBeenCalled();
  });

  it('refreshes offline work logs', async () => {
    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValueOnce([
      {
        id: 'log-1',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: {
            projectId: 'project-1',
            entryType: 'daily',
            logDate: '2025-01-10',
            timeEntries: [{ start: '08:00', end: '12:00' }],
            workDescription: 'Refreshed',
          },
        },
        syncStatus: 'pending',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
    ]);

    await act(async () => {
      await result.current.refreshOfflineWorkLogs();
    });

    expect(result.current.offlineWorkLogs.length).toBe(1);
    expect(offlineStorage.loadOfflineWorkLogs).toHaveBeenCalledTimes(2);
  });

  it('resets offline work logs', async () => {
    const existingLog: OfflineWorkLog = {
      id: 'log-1',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      payload: {
        kind: 'create',
        input: {
          projectId: 'project-1',
          entryType: 'daily',
          logDate: '2025-01-10',
          timeEntries: [{ start: '08:00', end: '12:00' }],
          workDescription: 'Test',
        },
      },
      syncStatus: 'pending',
      photos: [],
      retryCount: 0,
      nextRetryAt: null,
    };

    vi.mocked(offlineStorage.loadOfflineWorkLogs).mockResolvedValue([existingLog]);
    vi.mocked(offlineStorage.clearOfflineWorkLogs).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineWorkLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resetOfflineWorkLogs();
    });

    expect(result.current.offlineWorkLogs.length).toBe(0);
    expect(offlineStorage.clearOfflineWorkLogs).toHaveBeenCalled();
  });
});

