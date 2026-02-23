import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNetInfo } from '@react-native-community/netinfo';
import { NetInfoStateType } from '@react-native-community/netinfo';

import { useWorkLogSync } from '../useWorkLogSync';
import * as workLogSdkHooks from '@scf/core/utils/work-logs-sdk-hooks';
import * as offlineStorage from '../../utils/offline-storage';
import type { OfflineWorkLog } from '../../types/offline';
import type { CreateWorkLogInput } from '@scf/schemas';

const createWorkLogInput = (overrides: Partial<CreateWorkLogInput>): CreateWorkLogInput => ({
  projectId: 'project-1',
  entryType: 'daily',
  logDate: '2025-01-10',
  timeEntries: [{ start: '08:00', end: '12:00' }],
  workDescription: 'Test',
  tasksCompleted: [],
  skillsUsed: [],
  visibility: 'private',
  showOnProfile: false,
  showDateRangeOnProfile: false,
  ...overrides,
});

vi.mock('@scf/core/utils/work-logs-sdk-hooks', () => ({
  useCreateWorkLogMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateWorkLogMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUploadWorkLogPhotoMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@react-native-community/netinfo', () => ({
  useNetInfo: vi.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: NetInfoStateType.wifi,
  })),
  NetInfoStateType: {
    wifi: 'wifi',
    cellular: 'cellular',
    ethernet: 'ethernet',
    unknown: 'unknown',
  },
}));

vi.mock('../../utils/offline-storage', () => ({
  loadSyncSettings: vi.fn(),
  saveSyncSettings: vi.fn(),
  DEFAULT_SYNC_SETTINGS: {
    autoSync: true,
    syncOverWifiOnly: true,
    maxRetries: 3,
    lastSyncedAt: null,
  },
}));

vi.mock('expo-file-system/legacy', () => ({
  default: {
    documentDirectory: '/test/documents',
    readAsStringAsync: vi.fn().mockResolvedValue('base64data'),
    EncodingType: {
      Base64: 'base64',
    },
  },
}));

describe('useWorkLogSync', () => {
  const mockMarkForSync = vi.fn();
  const mockMutateOffline = vi.fn();
  const mockRemoveOffline = vi.fn();
  const mockCreateMutation = vi.fn();
  const mockUpdateMutation = vi.fn();
  const mockUploadPhotoMutation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offlineStorage.loadSyncSettings).mockResolvedValue({
      autoSync: true,
      syncOverWifiOnly: true,
      maxRetries: 3,
      lastSyncedAt: null,
    });
    vi.mocked(workLogSdkHooks.useCreateWorkLogMutation).mockReturnValue({
      mutateAsync: mockCreateMutation,
      isPending: false,
    } as never);
    vi.mocked(workLogSdkHooks.useUpdateWorkLogMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as never);
    vi.mocked(workLogSdkHooks.useUploadWorkLogPhotoMutation).mockReturnValue({
      mutateAsync: mockUploadPhotoMutation,
      isPending: false,
    } as never);
  });

  it('loads sync settings on mount', async () => {
    const offlineLogs: OfflineWorkLog[] = [];

    renderHook(() =>
      useWorkLogSync({
        offlineWorkLogs: offlineLogs,
        markWorkLogForSync: mockMarkForSync,
        mutateOfflineWorkLog: mockMutateOffline,
        removeOfflineWorkLog: mockRemoveOffline,
      }),
    );

    await waitFor(() => {
      expect(offlineStorage.loadSyncSettings).toHaveBeenCalled();
    });
  });

  it('calculates pending sync count', () => {
    const offlineLogs: OfflineWorkLog[] = [
      {
        id: 'log-1',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: createWorkLogInput({ workDescription: 'Test' }),
        },
        syncStatus: 'pending',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
      {
        id: 'log-2',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: createWorkLogInput({ logDate: '2025-01-11', workDescription: 'Test 2' }),
        },
        syncStatus: 'queued',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
      {
        id: 'log-3',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: createWorkLogInput({ logDate: '2025-01-12', workDescription: 'Test 3' }),
        },
        syncStatus: 'synced',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
    ];

    const { result } = renderHook(() =>
      useWorkLogSync({
        offlineWorkLogs: offlineLogs,
        markWorkLogForSync: mockMarkForSync,
        mutateOfflineWorkLog: mockMutateOffline,
        removeOfflineWorkLog: mockRemoveOffline,
      }),
    );

    expect(result.current.pendingSyncCount).toBe(2);
  });

  it('queues work log for sync', async () => {
    const offlineLogs: OfflineWorkLog[] = [];

    const { result } = renderHook(() =>
      useWorkLogSync({
        offlineWorkLogs: offlineLogs,
        markWorkLogForSync: mockMarkForSync,
        mutateOfflineWorkLog: mockMutateOffline,
        removeOfflineWorkLog: mockRemoveOffline,
      }),
    );

    await act(async () => {
      await result.current.queueWorkLogForSync('log-1');
    });

    expect(mockMarkForSync).toHaveBeenCalledWith('log-1', 'queued');
  });

  it('updates sync settings', async () => {
    const offlineLogs: OfflineWorkLog[] = [];

    const { result } = renderHook(() =>
      useWorkLogSync({
        offlineWorkLogs: offlineLogs,
        markWorkLogForSync: mockMarkForSync,
        mutateOfflineWorkLog: mockMutateOffline,
        removeOfflineWorkLog: mockRemoveOffline,
      }),
    );

    await waitFor(() => {
      expect(result.current.settingsLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updateSyncSettings({ autoSync: false });
    });

    expect(offlineStorage.saveSyncSettings).toHaveBeenCalled();
  });

  it('respects Wi-Fi only sync preference', () => {
    vi.mocked(useNetInfo).mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      type: NetInfoStateType.cellular,
    } as never);

    vi.mocked(offlineStorage.loadSyncSettings).mockResolvedValue({
      autoSync: true,
      syncOverWifiOnly: true,
      maxRetries: 3,
      lastSyncedAt: null,
    });

    const offlineLogs: OfflineWorkLog[] = [
      {
        id: 'log-1',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T00:00:00Z',
        payload: {
          kind: 'create',
          input: createWorkLogInput({ workDescription: 'Test' }),
        },
        syncStatus: 'queued',
        photos: [],
        retryCount: 0,
        nextRetryAt: null,
      },
    ];

    const { result } = renderHook(() =>
      useWorkLogSync({
        offlineWorkLogs: offlineLogs,
        markWorkLogForSync: mockMarkForSync,
        mutateOfflineWorkLog: mockMutateOffline,
        removeOfflineWorkLog: mockRemoveOffline,
      }),
    );

    expect(result.current.pendingSyncCount).toBe(1);
  });
});

